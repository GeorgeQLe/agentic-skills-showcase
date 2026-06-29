# gSkillPacks (Next.js)

Public site for `gskillpacks.com`: an interactive skill packs catalog for `agentic-skills` workflows, packs, and GitHub proof data.

## Brand

- Public brand: **gSkillPacks**
- Domain: `gskillpacks.com`
- Product meaning: the packs of skills, workflows, and proof surfaces for the `agentic-skills` library.
- Naming rule: use **gSkillPacks** in public UI and documentation. Use `agentic-skills` only when referring to the underlying open-source repository or package family.

## Local Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

Produces the gSkillPacks site build for the configured deployment target.

## Data Freshness

Imported data lives in `public/assets/` (`skills-data.js`, `github-proof-data.js`, and `skills-catalog/v1/*.json`). These files are committed and loaded at build time via `<Script strategy="beforeInteractive">`.

The source of truth is the versioned export contract in the public `agentic-skills` repository:

- `exports/skills-catalog/v1/catalog.json`
- `exports/skills-catalog/v1/proof.json`
- `exports/skills-catalog/v1/manifest.json`

To regenerate and validate from this repository root:

```bash
SKILLS_REPO_URL=https://github.com/GeorgeQLe/agentic-skills.git SKILLS_REPO_REF=<tag-or-sha> pnpm generate:data
SKILLS_REPO_URL=https://github.com/GeorgeQLe/agentic-skills.git SKILLS_REPO_REF=<tag-or-sha> pnpm validate:data
```

`SKILLS_REPO_URL` defaults to `https://github.com/GeorgeQLe/agentic-skills.git` and `SKILLS_REPO_REF` defaults to `master`. Release and deployment updates should pin a tag or commit SHA.

The importer lives at `scripts/import-skills-catalog.mjs`. It never reads the internal `agentic-skills` source tree directly; it only consumes `exports/skills-catalog/v1`.

## Deployment

Vercel should build this repository directly with:

```bash
pnpm generate:data
pnpm build
```

Set `SKILLS_REPO_REF` to the approved `agentic-skills` tag or commit SHA for production deploys.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string for newsletter storage. |
| `NEWSLETTER_ADMIN_SECRET` | Shared secret for the `/admin/newsletter` auth gate. |
| `SKILLS_REPO_URL` | Git URL for the public `agentic-skills` source export. |
| `SKILLS_REPO_REF` | Tag, branch, or commit SHA to import. Prefer tags or SHAs for deploys. |

## Database

Newsletter subscribers are stored in Neon PostgreSQL. Migration SQL lives at `src/db/migrate.sql`.

## Relationship to `agentic-skills`

`agentic-skills` owns skill and pack source plus the public catalog export. This repository owns the website, its generated public assets, and its deployment contract.
