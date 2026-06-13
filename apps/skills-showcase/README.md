# gSkillPacks (Next.js)

Public site for `gskillpacks.com`: an interactive skill packs catalog for `agentic-skills` workflows, packs, and GitHub proof data.

## Brand

- Public brand: **gSkillPacks**
- Domain: `gskillpacks.com`
- Product meaning: the packs of skills, workflows, and proof surfaces for the `agentic-skills` library.
- Naming rule: use **gSkillPacks** in public UI and documentation. Use `agentic-skills` only when referring to the underlying open-source repository or package family.

## Local Development

```bash
pnpm --dir apps/skills-showcase dev
```

## Build

```bash
pnpm --dir apps/skills-showcase build
```

Produces the gSkillPacks site build for the configured deployment target.

## Data Freshness

Generated data lives in `public/assets/` (`skills-data.js` and `github-proof-data.js`). These files are committed and loaded at build time via `<Script strategy="beforeInteractive">`.

To regenerate and validate from the repository root:

```bash
pnpm --dir apps/skills-showcase generate:data
pnpm --dir apps/skills-showcase validate:data
```

Generator scripts live under `apps/skills-showcase/scripts/` and dual-write to both `apps/skills-showcase/public/assets/` and the temporary static mirror at `docs/skills-showcase/assets/`. The validator fingerprints all four JS assets plus the website-owned benchmark matrix at `docs/benchmark-results-matrix.md`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string for newsletter storage. |
| `NEWSLETTER_ADMIN_SECRET` | Shared secret for the `/admin/newsletter` auth gate. |

## Database

Newsletter subscribers are stored in Neon PostgreSQL. Migration SQL lives at `src/db/migrate.sql`.

## Relationship to `docs/skills-showcase/`

The static site HTML/CSS/JS files were removed in Step 37.6. `docs/skills-showcase/assets/` is kept as a website-owned static mirror. This Next.js app is the sole gSkillPacks surface.
