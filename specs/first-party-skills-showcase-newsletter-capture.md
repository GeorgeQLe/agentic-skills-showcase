# First-Party G Skillpacks Newsletter Capture

## Overview

Extend the existing G Skillpacks website from a mostly static proof surface into a minimal first-party capture app for newsletter interest.

The current site already exists under `docs/skills-showcase/` with static routes, shared styling, generated skill/proof data, and a newsletter form shell on `/follow/`. The implementation should preserve that visual/content system and refactor only as needed to support first-party persistence, admin access, and clean Vercel deployment.

Because the current showcase is not a Next.js project, the preferred implementation path is to migrate the showcase into a minimal Next.js app surface rather than bolt tRPC and TanStack Query awkwardly onto plain static HTML. The refactor must be conservative: reuse the current page inventory, content hierarchy, blueprint visual system, generated data contracts, and follow-page capture intent.

## Goals

- Capture newsletter-interest emails through a first-party form on the G Skillpacks follow page.
- Store subscriber records in Neon Postgres.
- Use tRPC for typed capture/admin contracts.
- Use TanStack Query for public mutation state and admin list/export state.
- Add an admin page that can list, search, copy, and export subscriber emails.
- Protect admin access with a single shared admin secret configured through Vercel environment variables.
- Preserve the existing showcase design, routes, generated catalog/proof data, and proof-first positioning.
- Keep V1 focused on capture and export, not newsletter sending.

## Non-Goals

- Building a full newsletter platform.
- Sending newsletter emails from the showcase app.
- Adding a full auth provider or user accounts.
- Adding visitor-tracking analytics.
- Storing raw IP addresses or raw user-agent strings in V1.
- Replacing the G Skillpacks visual design or information architecture.
- Replacing generated skill/proof data with database-backed catalog data.
- Creating or modifying GitHub Actions workflows.

## Detailed Design

### Existing Site Baseline

The current website is a static multi-page site:

```text
docs/skills-showcase/
├── index.html
├── workflows/index.html
├── packs/index.html
├── catalog/index.html
├── inspect/index.html
├── follow/index.html
├── styles.css
├── app.js
└── assets/
    ├── skills-data.js
    └── github-proof-data.js
```

The current newsletter form already has email input, submit button, provider-missing, pending, success, error, and invalid-email states. Its current limitation is that it requires a static/provider endpoint and does not persist first-party subscriber data.

### Application Refactor

Because the repo has no root website framework and the user approved pushing a refactor when the site is not already Next.js, implementation should create a minimal Next.js app for the showcase.

Recommended app placement:

```text
apps/skills-showcase/
├── app/
│   ├── page.tsx
│   ├── workflows/page.tsx
│   ├── packs/page.tsx
│   ├── catalog/page.tsx
│   ├── inspect/page.tsx
│   ├── follow/page.tsx
│   ├── admin/newsletter/page.tsx
│   └── api/trpc/[trpc]/route.ts
├── src/
│   ├── db/
│   ├── trpc/
│   ├── newsletter/
│   └── showcase/
├── public/
│   └── assets/
├── package.json
├── next.config.mjs
└── tsconfig.json
```

The existing static site files should be ported, not redesigned. The static route equivalents remain:

- `/`
- `/workflows`
- `/packs`
- `/catalog`
- `/inspect`
- `/follow`
- `/admin/newsletter`

Generated showcase assets should remain committed and deployable. The existing generator scripts may keep writing to `docs/skills-showcase/assets/` initially, but the implementation should either update them to also write to `apps/skills-showcase/public/assets/`, or move the canonical output path and update validation accordingly.

The migration must avoid breaking the stale-data validation contract for `SKILL.md` changes.

### Newsletter Capture Flow

Public flow:

1. Visitor opens `/follow`.
2. Visitor enters an email address.
3. Client calls `newsletter.subscribe` through tRPC.
4. Server validates the payload.
5. Server inserts or updates a Neon subscriber row.
6. UI shows success without exposing internal database behavior.

Duplicate email behavior should be idempotent. A repeat signup should return success and update `updated_at`, `source_page`, and `consent_text_version` if appropriate.

Recommended public copy promise:

`Get workflow drops, benchmark results, and agentic engineering notes.`

This keeps the consent promise aligned with the showcase proof surface.

### Admin Flow

Admin route:

```text
/admin/newsletter
```

V1 authentication:

- Admin enters a shared admin secret.
- The secret is compared server-side against `NEWSLETTER_ADMIN_SECRET`.
- Successful access establishes either an HTTP-only session cookie or short-lived server-validated token.
- The secret must never be bundled into client-side assets.

Admin capabilities:

- View total subscriber count.
- Search/filter subscribers by email and status.
- See email, status, source page, created date, updated date, and consent text version.
- Copy all active subscriber emails as a comma-separated or newline-separated list.
- Download active subscribers as CSV.

Admin V1 does not need edit/delete controls unless implementation discovers a low-cost need. Suppression/status changes can be a follow-up.

### tRPC Contracts

Recommended router:

```ts
newsletter.subscribe(input): SubscribeResult
newsletter.adminLogin(input): AdminLoginResult
newsletter.listSubscribers(input): SubscriberListResult
newsletter.exportSubscribers(input): CsvExportResult
```

`subscribe` input:

```ts
{
  email: string;
  sourcePage: string;
  consentTextVersion: string;
}
```

`subscribe` output:

```ts
{
  ok: true;
  status: "subscribed" | "already_subscribed";
}
```

Admin list input:

```ts
{
  query?: string;
  status?: "active" | "unsubscribed" | "bounced" | "all";
  limit?: number;
  cursor?: string;
}
```

Admin list output:

```ts
{
  subscribers: Subscriber[];
  nextCursor: string | null;
  totalActive: number;
}
```

### TanStack Query Usage

Use TanStack Query where it adds clear value:

- public subscribe mutation state on `/follow`;
- admin login mutation;
- subscriber list query with search/status filters;
- export/copy action state.

Do not use TanStack Query to replace static generated catalog rendering unless the implementation naturally ports those components and the data remains static.

## Data Model

Recommended Neon table:

```sql
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active',
  source_page text not null,
  consent_text_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index newsletter_subscribers_status_idx
  on newsletter_subscribers (status);

create index newsletter_subscribers_created_at_idx
  on newsletter_subscribers (created_at desc);
```

Allowed `status` values for V1:

- `active`
- `unsubscribed`
- `bounced`

V1 may only create `active` records. Other statuses are included so exported data can evolve without a disruptive schema change.

Do not store raw IP address, raw user-agent, Discord handle, or behavioral analytics in V1. If abuse protection later requires request fingerprinting, use a separate privacy review before adding any derived request metadata.

## Security And Privacy

- `DATABASE_URL` and `NEWSLETTER_ADMIN_SECRET` must be Vercel environment variables.
- Admin access must be server-validated.
- The admin secret must never appear in static assets, generated data, client logs, or repository files.
- Subscriber data must never be included in generated public assets.
- Public subscribe endpoint must validate email format server-side.
- Public subscribe endpoint should apply lightweight abuse controls where feasible, such as basic per-request throttling or duplicate-idempotent writes.
- CSV export must require admin authentication.
- Admin UI should not expose database connection details.
- Error messages shown to public visitors should be generic.
- Server logs should not intentionally log submitted email addresses.

## Edge Cases

- Visitor submits invalid email.
- Visitor submits the same email multiple times.
- Neon connection fails.
- Database table is missing or migration has not run.
- Admin secret is missing in Vercel env.
- Admin enters the wrong secret.
- Admin session expires during use.
- Subscriber list is empty.
- CSV export is requested with no active subscribers.
- Generated showcase data is missing after the Next.js migration.
- Vercel route configuration changes direct reload behavior.
- Existing static asset paths break after moving assets into app/public.
- User opens the old `docs/skills-showcase/` path after the canonical app moves.

## Test Plan

### Static Showcase Preservation

- Verify the migrated routes render: `/`, `/workflows`, `/packs`, `/catalog`, `/inspect`, `/follow`.
- Verify the existing Swiss grid/blueprint visual system remains recognizable.
- Verify generated skill catalog and GitHub proof data still load.
- Run the showcase data generator and validator after any output path change.
- Verify direct reload works for every route on the Vercel deployment.

### Newsletter Capture

- Submit a valid email and verify a Neon row is created.
- Submit the same email again and verify the operation is idempotent.
- Submit invalid emails and verify no row is created.
- Simulate database failure and verify the public UI shows a generic error.
- Confirm submitted emails are not written to generated assets or committed files.

### Admin

- Verify `/admin/newsletter` blocks unauthenticated access.
- Verify the configured admin secret grants access.
- Verify the wrong secret fails without exposing internals.
- Verify subscriber search and status filters.
- Verify copy-all active emails.
- Verify CSV download includes expected headers and active subscriber rows.
- Verify admin export cannot be accessed without authentication.

### Repository Validation

- Run `git diff --check`.
- Run existing skill/reference validation scripts when implementation changes generated showcase data paths or workflow instructions.
- Run the app's lint/typecheck/test commands once the Next.js app package exists.
- Do not add GitHub Actions.

## Acceptance Criteria

- Existing showcase pages are preserved as a minimal app-enabled site rather than rebuilt from scratch.
- If the implementation confirms the current site is not Next.js, it migrates the showcase into a minimal Next.js app surface.
- Newsletter form on `/follow` submits through a first-party tRPC mutation.
- Neon stores subscriber emails and required metadata.
- Duplicate signup behavior is idempotent.
- Admin page is protected by a Vercel-configured shared secret.
- Admin page can list, search, copy, and export active subscriber emails.
- No raw IP address or raw user-agent is stored in V1.
- No newsletter email sending is implemented in V1.
- Existing generated skill/proof data contracts remain valid after the refactor.
- No GitHub Actions are created or modified.

## Open Questions

- Production domain is `gskillpacks.com`.
- Should the old `docs/skills-showcase/` static path remain as a redirect/stub after migration, or be replaced by documentation pointing to the app?
- Which migration tool or ORM should manage Neon schema changes, if any, during implementation?
- Should admin status management, such as marking unsubscribed, be added in V1 or deferred?

## Assumptions & Risks

- Corrected: `[from codebase]` The G Skillpacks website already exists under `docs/skills-showcase/`. Risk if wrong: implementation could waste time rebuilding proven static surfaces instead of porting them.
- Corrected: `[from user]` Because the existing site is not Next.js, the user wants the implementation to push the refactor toward a Next.js app. Risk if wrong: a Next migration adds dependency and deployment surface that a smaller endpoint-only solution might avoid.
- Confirmed: `[from user]` First-party capture should use Neon, tRPC, and TanStack Query. Risk if wrong: simpler Vercel Function or managed-provider approaches would be less complex.
- Confirmed: `[from user]` Admin export exists so the user can email subscribers from another newsletter app or email client. Risk if wrong: V1 may underbuild newsletter operations such as templates, unsubscribe links, and delivery compliance.
- Confirmed: `[from spec]` The current showcase is proof-first and should preserve the existing catalog/workflow/proof surfaces. Risk if wrong: capture work could overshadow the library showcase.
- Confirmed: `[from research]` The project values inspectable, explicit, no-surprise telemetry. Risk if wrong: storing subscriber data could erode trust unless copy, consent, and admin access are clear.
- Confirmed: `[inferred]` A single shared admin secret is sufficient for one-person V1 administration. Risk if wrong: weak access control would be inadequate for a team or shared admin surface.
- Confirmed: `[inferred]` Subscriber rows should avoid raw IP/user-agent storage in V1. Risk if wrong: abuse mitigation may be weaker until rate limiting or privacy-reviewed metadata is added.
