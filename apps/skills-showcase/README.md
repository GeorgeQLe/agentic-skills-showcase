# Skills Showcase (Next.js)

Interactive showcase for agentic skills — catalog, workflows, packs, and GitHub proof data.

## Local Development

```bash
pnpm --dir apps/skills-showcase dev
```

## Build

```bash
pnpm --dir apps/skills-showcase build
```

Produces a static export to `apps/skills-showcase/out/` with 6 routes.

## Data Freshness

Generated data lives in `public/assets/` (`skills-data.js` and `github-proof-data.js`). These files are committed and loaded at build time via `<Script strategy="beforeInteractive">`.

To regenerate and validate from the repository root:

```bash
node scripts/generate-skills-showcase-data.mjs
node scripts/generate-skills-showcase-github-data.mjs
scripts/validate-skills-showcase-data.sh
```

Generator scripts dual-write to both `docs/skills-showcase/assets/` and `apps/skills-showcase/public/assets/`. The validator fingerprints all four assets.

## Relationship to `docs/skills-showcase/`

The static site HTML/CSS/JS files were removed in Step 37.6. `docs/skills-showcase/assets/` is kept for dual-write. This Next.js app is the sole showcase surface.
