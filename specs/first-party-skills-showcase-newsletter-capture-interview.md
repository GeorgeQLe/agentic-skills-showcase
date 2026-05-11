# First-Party Skills Showcase Newsletter Capture - Interview Log

**Date:** 2026-05-11
**Interviewer:** Codex (`$spec-interview`)
**Topic:** First-party newsletter capture for the Skills Showcase website

## Source Evidence

- User prompt: `$spec-interview first-party Skills Showcase newsletter capture`.
- `specs/skills-showcase-website.md`: current showcase spec says newsletter/email capture is in scope only through static/provider-backed integration, with no first-party backend or database in V1.
- `specs/ui-skills-showcase-website.md`: current UI spec defines `/follow/`, newsletter states, provider-missing fallback, and no auth/admin/custom backend.
- `docs/skills-showcase/follow/index.html`: existing static follow page has a newsletter form with `data-newsletter-form` and an empty `data-provider-endpoint`.
- `docs/skills-showcase/app.js`: existing JS validates email, posts to configured provider endpoint, and otherwise shows provider-missing state.
- `research/devtool-user-map.md`, `research/devtool-dx-journey.md`, and `research/devtool-integration-map.md`: project posture is local-first, inspectable, explicit about constraints, and sensitive to unnecessary operational complexity.

## Assumptions Checkpoint

Presented before probing:

- `[from spec]` The current Skills Showcase V1 intentionally avoided a custom newsletter backend: it supports static/provider-backed capture with provider-missing, pending, success, error, and invalid-email states.
- `[from codebase]` The implemented follow page already has a newsletter form and JS submission path, but it depends on `data-provider-endpoint`; without that endpoint, it degrades to a non-collecting state.
- `[inferred]` "First-party newsletter capture" means replacing the static/provider-only dependency with a repo-owned submission endpoint, likely on Vercel, while still avoiding a full frontend framework unless necessary.
- `[from codebase]` The site currently lives under `docs/skills-showcase/` as static HTML/CSS/JS with no root frontend package, so the lowest-impact implementation is probably a small `api/newsletter` Vercel Function plus static-form wiring.
- `[from research]` The repo's trust posture emphasizes local-first, inspectable, no surprise telemetry. Newsletter capture must be explicit, consent-based, and narrowly scoped to email collection.
- `[from Vercel docs]` Vercel Functions can add server-side behavior without managing servers, and environment variables are the right place for provider/database/API secrets. Vercel Storage/Marketplace can provide data stores, but adding durable first-party storage is a real scope increase.

User corrections and confirmations:

- Corrected: first-party capture may add Neon DB, tRPC, and TanStack Query.
- Corrected: add an admin page to retrieve emails for use in another newsletter app or email client.
- Corrected: the existing website should be treated as the starting point, not ignored.
- Corrected: because the existing website is not already a Next.js project, the implementation should push the refactor toward Next.js.

## Question 1: Meaning Of First-Party

**Question:** For "first-party," do you mean first-party user experience only (`/api/newsletter` hides the provider), or first-party data ownership where the repository/Vercel project stores the canonical subscriber list?

**Recommendation presented:** First-party API capture with pluggable delivery/storage, not a full database product, unless owning the subscriber ledger is important.

**User response:** User is fine adding Neon DB, tRPC, and TanStack Query to support email capture.

**Decision:** First-party data ownership is in scope. Neon is the subscriber source of truth.

## Question 2: Launch Sink

**Question:** What should the first launch sink be: managed email provider API, webhook/private notification, or durable database/table?

**Recommendation presented:** Provider behind first-party API for lower operational burden.

**User response:** User prefers Neon DB and an admin page that can grab emails.

**Decision:** Durable Neon table is the V1 sink. Newsletter sending remains outside the app.

## Question 3: Newsletter Promise

**Question:** What is the newsletter promise at capture time?

**Recommendation presented:** "workflow drops, benchmark results, and agentic engineering notes."

**User response:** User agreed with recommendations.

**Decision:** Use a narrow promise aligned to the showcase proof surface.

## Question 4: Admin Authentication

**Question:** Should V1 use a single shared admin secret/password configured in Vercel env, or require a proper auth provider?

**Recommendation presented:** Single admin secret for V1.

**User response:** User agreed.

**Decision:** Use `NEWSLETTER_ADMIN_SECRET` or equivalent Vercel env var. No full auth provider in V1.

## Question 5: Subscriber Fields

**Question:** Besides `email`, should the app store `created_at`, `source_page`, `consent_text_version`, `user_agent`, and `ip_hash`?

**Recommendation presented:** Store `email`, `created_at`, `source_page`, `consent_text_version`, `status`, and timestamps. Avoid raw IP/user-agent unless clearly needed.

**User response:** User agreed.

**Decision:** Store only email and consent/source/status metadata in V1. No raw IP or user-agent.

## Question 6: Admin Export Format

**Question:** Should the admin page show copyable emails, CSV download, or both?

**Recommendation presented:** Both.

**User response:** User agreed.

**Decision:** Admin page includes searchable table, copy emails, and CSV download.

## Question 7: Framework Direction

**Question:** Should the implementation migrate the showcase to a framework app, likely minimal Next.js, to make tRPC/TanStack Query natural on Vercel, or preserve static pages and add a lighter custom API layer?

**Recommendation presented:** Minimal Next.js app for the showcase only if committed to tRPC + TanStack Query; port existing pages with minimal visual change rather than redesigning.

**User response:** User asked whether there is already a website to work off.

**Clarification:** The existing website is `docs/skills-showcase/`, a static multi-page site with shared CSS/JS, generated catalog/proof data, and follow form shell.

**Decision:** Preserve the existing website as source material and progressively app-enable what capture/admin needs.

## Question 8: Non-Next Existing Site

**Question/clarification:** User agreed with preserving the current site, unless it is not a Next.js project, in which case the implementation should push the refactor.

**Evidence:** Repository has no root `package.json`, no `next.config.*`, and no app package for the showcase. Only `tests/package.json` exists. The current showcase is plain static HTML/CSS/JS.

**Decision:** Spec should prefer migrating the showcase into a minimal Next.js app surface while preserving the current visual/content system.

## Coverage Checkpoint

Presented before writing the spec:

- Goal: replace the current provider-missing/static-provider newsletter form with first-party email capture for the Skills Showcase.
- Architecture: extend the mostly static showcase into a small Vercel-deployed app surface with Neon persistence, tRPC contracts, and TanStack Query for mutation/admin state.
- Public capture: `/follow/` keeps the same visual role, but submits to a first-party `subscribe` mutation. It validates email, records consent, handles duplicate signups idempotently, and shows success/error states.
- Data model: Neon stores `email`, `created_at`, `updated_at`, `source_page`, `consent_text_version`, `status`, and optional admin notes later. No raw IP/user-agent storage in V1.
- Admin: add an admin route/page protected by a single Vercel env secret. It lists subscribers and supports search, copy-all emails, and CSV download.
- Security/privacy: no public subscriber list, no secrets in generated assets, no raw behavioral analytics, no GitHub Actions, no email-sending system in V1.
- Non-goal: this does not become a full newsletter platform. User will export/copy emails into another newsletter app or email client.

Follow-up correction:

- The spec should explicitly account for the existing static website and choose a Next.js refactor because the current implementation is not Next.js.

## Closing Summary

Significant deviations from the initial draft:

- The original showcase spec deliberately excluded a first-party API, database, auth, admin UI, and custom newsletter backend. The new direction adds all of these narrowly for newsletter capture.
- The first-pass assumption favored the smallest Vercel Function/static-form bridge. User clarified that Neon DB, tRPC, and TanStack Query are acceptable and desired for this extension.
- The original follow form was provider-backed and non-collecting without configuration. The new spec makes Neon persistence the canonical V1 behavior.
- The architecture now prefers a minimal Next.js migration because the existing site is plain static and tRPC/TanStack Query are a poor fit for ad hoc static HTML.
- Newsletter sending remains explicitly out of scope; admin export exists so the user can use a separate newsletter app or email client.
