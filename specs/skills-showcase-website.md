# Skills Showcase Website

## Overview

Build a Vercel-deployable static website for `agentic-skills` that promotes George "G" Le as an agentic engineering expert and makes the workflow library understandable through generated skill coverage, curated workflow walkthroughs, and browser-native animations.

The site is both a marketing surface and a proof surface. It should show that G has built a repeatable agentic engineering operating system for Claude Code and Codex, and it should connect that system to the broader LexCorp build-in-public story. The primary CTA is to follow G's work, with secondary links to LexCorp, YouTube, X/Twitter, Discord, and the skill catalog.

V1 remains static and local-first:

- No database.
- No video assets.
- No Remotion production.
- No runtime API.
- No telemetry.
- No dependency install or shared lockfile mutation unless later implementation explicitly chooses a frontend package.

The site should be deployable on Vercel as static files and should work locally by opening the HTML entrypoint or serving the directory with a simple static server.

## Goals

- Promote George "G" Le as an expert in agentic engineering, with `agentic-skills` as concrete proof.
- Promote the LexCorp/War Room distribution story: the skills are the agentic engineering system behind a live multi-product portfolio.
- Provide a generated catalog entry for every source `SKILL.md` in `global/` and `packs/`.
- Provide curated, animated walkthroughs for the most important workflows:
  - install + first successful cycle
  - pack selection
  - plan -> run -> ship
  - spec -> roadmap -> implementation
  - research chains
  - hybrid Claude/Codex handoff
  - skill authoring
  - validation/troubleshooting
- Use browser-native animations to illustrate how skills work: terminal playback, state machines, pack maps, step timelines, and handoff diagrams.
- Use a Swiss grid and blueprint visual motif: precise layout, measured annotations, subtle construction lines, technical confidence, and strong scanability.
- Keep skill metadata generated from source files so catalog coverage stays current as the skill library changes.
- Add an explicit maintenance contract: when agents change skills, they must regenerate site data and review whether curated copy or animations need updates.
- Provide a hard validation gate for stale generated website metadata after `SKILL.md` changes.

## Non-Goals

- Building a dynamic app with Neon, Supabase, or any other database in V1.
- Hosting or serving video content.
- Using Remotion in V1.
- Adding newsletter signup infrastructure, analytics, auth, admin UI, comments, or community membership flows.
- Creating a hosted skill execution sandbox in the browser.
- Running Claude Code, Codex, or local shell commands from the public website.
- Replacing README, `docs/skills-reference.md`, or `docs/packs.md`.
- Claiming enterprise governance, behavioral CI, or broad community proof that the repository does not yet have.
- Creating or modifying GitHub Actions workflows.

## Detailed Design

### Site Location

Recommended V1 layout:

```text
docs/skills-showcase/
├── index.html
├── styles.css
├── app.js
└── assets/
    └── skills-data.js
scripts/
├── generate-skills-showcase-data.mjs
└── validate-skills-showcase-data.sh
```

`docs/skills-showcase/` keeps the website near the public docs without introducing a root frontend app. Vercel can deploy this directory as a static project. If Vercel is configured from the repository root, the implementation may add minimal Vercel configuration, but V1 should not require a root `package.json`.

### Information Architecture

The first screen should feel like a working technical showcase, not a passive landing page. Recommended sections:

1. **Hero / Command Blueprint**
   - Headline: George "G" Le and agentic engineering.
   - Subhead: `agentic-skills` turns raw Claude Code and Codex sessions into repeatable plan -> run -> ship workflows.
   - Primary CTA: Follow G's work.
   - Secondary CTAs: Explore skills, visit LexCorp.
   - Animated blueprint panel showing a request moving through plan, run, validation, ship, and history.

2. **Workflow Lab**
   - Curated animated walkthroughs for the eight V1 workflows.
   - Each walkthrough includes:
     - What triggers the workflow.
     - Which skills participate.
     - What artifacts change.
     - What the user gets at the end.
     - Failure or recovery path when relevant.

3. **Pack Map**
   - Visual map of global skills, domain packs, overlays, and compatibility aliases.
   - Must distinguish global core, business packs, devtool, game, creator/media, monorepo, code-quality, Remotion, project-fleet, alignment-loop, and kanban packs.
   - Show that packs keep context clean by installing only the workflows a project needs.

4. **Skill Catalog**
   - Generated from `SKILL.md` frontmatter and paths.
   - Filters: platform, pack, type, workflow stage, command prefix, and search.
   - Entries include skill name, description, invocation syntax, pack/global placement, source path, type, version, and argument hint.
   - Claude-only or Codex-only asymmetries must be labeled clearly.

5. **Proof Surface**
   - Link to `tasks/history.md` as the dogfood changelog.
   - Link to devtool research artifacts as examples of skills producing serious work.
   - Link to validation scripts: `skill-deps.sh`, `skill-versions.sh`, `skill-next-step-routing.sh`, and future showcase validation.
   - Explain honest boundaries: metadata/reference validation exists; full behavioral CI is not claimed.

6. **About G / LexCorp**
   - Position G as a builder of agentic engineering systems.
   - Connect the skills library to LexCorp's build-in-public War Room.
   - CTAs:
     - LexCorp: `https://leexperimental.com`
     - YouTube: `https://www.youtube.com/@georgele`
     - X/Twitter: `https://x.com/gkingofboston`
     - Discord: `https://discord.gg/TC6STUc5rT`

### Visual System

Use a Swiss grid and blueprint motif:

- Tight, rational grid with visible alignment discipline.
- Blueprint blue accents, drafting lines, labeled axes, small coordinates, and measured callouts.
- Use dark or light foundation based on readability; avoid one-note blue dominance by balancing neutral backgrounds, blueprint accents, green status signals, amber warnings, and red failure states.
- Avoid decorative blobs, orbs, and generic gradient hero art.
- Use motion to explain process, not as ambient decoration.
- Keep typography precise and readable; no viewport-scaled font sizes.
- Cards should be restrained and used for repeated skill/workflow items, not nested section containers.

The page should feel like a technical command center crossed with a productized field manual. It can be market-facing, but the marketing claim must be backed by visible workflow evidence.

### Animation System

Animations should be implemented with browser-native HTML/CSS/JavaScript. No video, canvas dependency, or external animation service is required for V1.

Recommended animation primitives:

- **Terminal playback:** simulated command prompt, agent update, validation output, commit summary.
- **State machine:** request -> plan -> approval -> execution -> validation -> history -> commit -> next plan.
- **Pack router map:** user selects project type, active packs highlight, unrelated packs dim.
- **Hybrid handoff timeline:** Claude planning, approval packet, Codex execution, result integration.
- **Spec-to-roadmap trace:** feature idea becomes assumptions manifest, interview log, spec, roadmap phase, todo step.
- **Validation gate:** `SKILL.md` changes trigger generated data refresh and stale-data check.

Accessibility requirements:

- Honor `prefers-reduced-motion`.
- Animations must have static fallback states.
- Key information must be present as text, not only motion.
- Controls must be keyboard reachable.

### Generated Skill Data

`scripts/generate-skills-showcase-data.mjs` should parse source files with no third-party dependencies in V1.

Inputs:

- `global/*/*/SKILL.md`
- `packs/*/{claude,codex}/*/SKILL.md`
- `packs/*/PACK.md` when present
- Optional supporting docs for curated workflow labels:
  - `docs/pack-workflow-matrix.md`
  - `docs/skills-reference.md`

Generated output:

```text
docs/skills-showcase/assets/skills-data.js
```

Recommended record shape:

```js
window.SKILLS_SHOWCASE_DATA = {
  generatedAt: "2026-05-06T00:00:00.000Z",
  sourceFingerprint: "...",
  skills: [
    {
      id: "global-codex-spec-interview",
      name: "spec-interview",
      title: "Spec Interview",
      description: "Interview to validate and complete a specification",
      type: "planning",
      version: "1.0.0",
      argumentHint: "[--ideas]",
      platform: "codex",
      command: "$spec-interview",
      scope: "global",
      pack: null,
      path: "global/codex/spec-interview/SKILL.md",
      mirrorKey: "spec-interview",
      tags: ["planning", "spec", "interview"]
    }
  ],
  packs: [
    {
      name: "devtool",
      description: "...",
      platforms: ["claude", "codex"],
      skillCount: 16
    }
  ],
  workflows: []
};
```

The generator should derive:

- `name`, `description`, `type`, `version`, and `argumentHint` from YAML frontmatter.
- `platform` from path segment.
- `scope` and `pack` from path.
- `command` as `/name` for Claude and `$name` for Codex.
- `mirrorKey` for grouping same-name Claude/Codex pairs.
- a deterministic `sourceFingerprint` from source file paths and contents.

The file should be committed so Vercel can serve the site without running a build step.

### Curated Workflow Data

Generated data is enough for the catalog, but curated workflows should be hand-authored in `app.js` or a small static data block until they justify a separate file.

V1 curated workflows:

1. **First Successful Cycle**
   - Install globals, enable a pack, restart CLI, check pack status, run `$roadmap` or `$run`, inspect `tasks/history.md`.

2. **Pack Selection**
   - Show global core vs project-local packs; explain context hygiene.

3. **Plan -> Run -> Ship**
   - Show task docs, validation, history, commit, push, and next-step routing.

4. **Spec -> Roadmap -> Implementation**
   - Show assumptions manifest, interview, spec, roadmap, todo, implementation step.

5. **Research Chains**
   - Show devtool, business, creator, and game research chains as artifact-producing workflows.

6. **Hybrid Claude/Codex Handoff**
   - Show Claude planning, approval packet, Codex execution, and integration.

7. **Skill Authoring**
   - Show creating/updating repo-managed skills, mirroring Claude/Codex, validation, install refresh, and website metadata refresh.

8. **Validation / Troubleshooting**
   - Show broken reference audit, version audit, routing audit, and showcase-data staleness check.

### Website Update Contract For Skill Changes

Skill changes must prompt agents to update the website when relevant.

The implementation should add this contract in three layers:

1. **Hard generated-data validation**
   - `scripts/validate-skills-showcase-data.sh` regenerates data to a temporary file and compares it with `docs/skills-showcase/assets/skills-data.js`.
   - It exits non-zero when `SKILL.md` or pack metadata changed and generated site data is stale.
   - It should be added to the standard validation list for skill-changing workflows.

2. **Agent workflow prompts**
   - Update repo-managed skill mutation workflows such as `create-agentic-skill` and `targeted-skill-builder` to include:
     - regenerate showcase data after skill creation, deletion, rename, frontmatter change, pack move, or argument change;
     - review curated workflow/site copy when the behavior or recommended usage changed;
     - report whether no curated site copy needed changes and why.
   - Update shipping/quality-gate guidance so diffs touching `SKILL.md` include a "Showcase impact" line in the ship manifest.

3. **Hygiene/audit support**
   - Extend `hygiene` or add a focused audit later to report generated-data staleness, missing catalog fields, and curated workflow references to deleted or renamed skills.

The important distinction:

- Hard gate: generated metadata must be current.
- Review gate: curated marketing/workflow copy must be considered, but not every skill text edit requires manual site copy changes.

### Deployment Model

V1 deploys to Vercel as static files.

Recommended project setup:

- Vercel project root: `docs/skills-showcase`
- Build command: none
- Output directory: `.`

If deploying from the repository root is preferable, implementation may add the smallest required Vercel config, but should avoid introducing root dependency management unless necessary.

### External Links

Initial link targets:

- LexCorp: `https://leexperimental.com`
- YouTube: `https://www.youtube.com/@georgele`
- X/Twitter: `https://x.com/gkingofboston`
- Discord: `https://discord.gg/TC6STUc5rT`

Links should be centralized in one small configuration object inside `app.js` or generated site data so they can be updated without hunting through markup.

### Data Model

Persistent source of truth:

- `SKILL.md` files for skill metadata.
- `PACK.md` files and pack paths for pack grouping.
- Curated workflow data in the site source.
- Existing docs/research/task files as linked proof artifacts.

Ephemeral runtime state:

- Current search query.
- Active filters.
- Selected workflow.
- Animation step index.
- Reduced-motion mode.

No user data persists in V1.

### API And Contract Surface

No runtime API exists in V1.

Browser contract:

- `window.SKILLS_SHOWCASE_DATA` must be loaded before `app.js` initializes catalog and workflow views.
- If data is missing or malformed, the site must render a visible fallback message instead of a blank page.

Script contract:

- `node scripts/generate-skills-showcase-data.mjs` writes `docs/skills-showcase/assets/skills-data.js`.
- `scripts/validate-skills-showcase-data.sh` exits zero when generated data is current and non-zero when stale.
- Both scripts must run from any working directory by resolving the repository root from their own path.

### Security And Privacy

- No telemetry in V1.
- No forms collecting email, Discord handles, or other personal data.
- Outbound links must be normal links; no third-party embed scripts are required.
- The site must not expose local absolute paths.
- The generated data must use repository-relative paths only.
- Do not include secrets, private repository data, local environment variables, or private session transcripts.

### Performance

- Static assets only.
- Catalog should remain responsive with 300+ skill records.
- Search/filter should avoid heavy DOM re-rendering on every keystroke when possible.
- CSS animations should be lightweight and disabled or simplified for reduced motion.

## Edge Cases

- A `SKILL.md` lacks frontmatter or required fields.
- Duplicate skill names exist across platforms or packs.
- Claude-only skills, such as `delegate`, have no Codex mirror.
- Compatibility alias packs, such as `business-app` and `creator-media`, do not map one-to-one to a single skill list.
- Skill descriptions are too long for cards.
- `argument-hint` includes characters that need HTML escaping.
- User opens `index.html` directly and browser module loading or fetch rules differ from a static server.
- JavaScript fails to load; the page should still show core brand/CTA content and a failure note.
- `prefers-reduced-motion` is enabled.
- Search returns no skills.
- Discord invite expires.
- A skill behavior changes without frontmatter changes, so generated metadata remains current but curated workflow copy may still be stale.
- Vercel is configured from the repository root rather than `docs/skills-showcase`.

## Test Plan

### Data Generation

- Run `node scripts/generate-skills-showcase-data.mjs`.
- Run `scripts/validate-skills-showcase-data.sh`.
- Confirm generated data includes every `SKILL.md` from `global/` and `packs/`.
- Confirm generated records use repository-relative paths only.
- Confirm duplicate skill names group correctly by platform and pack.

### Existing Repository Validation

- Run `./scripts/skill-deps.sh --broken`.
- Run `./scripts/skill-versions.sh --missing`.
- Run `./scripts/skill-next-step-routing.sh --missing`.
- Run `./scripts/skill-pack-routing-audit.sh`.
- Run configured tests in `tests/` when implementation touches scripts or validation behavior.
- Run `git diff --check`.

### Frontend Validation

- Open the static site locally.
- Verify desktop and mobile layouts.
- Verify search and filters.
- Verify every curated workflow can be selected and animated.
- Verify reduced-motion mode is respected.
- Verify links to LexCorp, YouTube, X/Twitter, and Discord.
- Verify no section has overlapping text or layout shifts that break controls.
- Verify catalog remains usable with the full generated skill set.

### Vercel Validation

- Deploy from `docs/skills-showcase` or the chosen Vercel configuration.
- Verify static asset paths load on the deployed URL.
- Verify direct reload works on the deployed root.
- Verify no runtime API/database environment variables are required.

## Acceptance Criteria

- `docs/skills-showcase/index.html`, `styles.css`, `app.js`, and `assets/skills-data.js` exist.
- The site presents George "G" Le as the builder/expert and positions `agentic-skills` as proof of agentic engineering expertise.
- The primary CTA is "Follow G's work" or equivalent, with secondary links to LexCorp, YouTube, X/Twitter, Discord, and skill exploration.
- The visual design uses a Swiss grid and blueprint motif without generic decorative gradients or blob backgrounds.
- The site includes browser-native workflow animations for the V1 curated workflows.
- The generated catalog includes every tracked `SKILL.md` under `global/` and `packs/`.
- Catalog records include command syntax, platform, scope/pack, type, description, version, argument hint, and source path.
- Search and filtering work across the generated catalog.
- `scripts/generate-skills-showcase-data.mjs` and `scripts/validate-skills-showcase-data.sh` exist and work without third-party dependencies.
- Validation fails when generated site data is stale after a `SKILL.md` metadata/source change.
- Skill-changing agent workflows are updated to regenerate site data and review curated site copy when relevant.
- V1 does not require a database, video storage, telemetry, auth, or runtime API.
- Vercel deployment can serve the static site.

## Open Questions

- What final domain or subdomain should Vercel use for the showcase?
- Should the site link to a public GitHub repository URL if or when `agentic-skills` is public?
- Should V2 add an email capture or newsletter signup once distribution infrastructure is chosen?
- Should the Discord invite be treated as permanent, or should the site link through a stable redirect controlled by LexCorp?
- Should future versions embed live LexCorp War Room metrics, or keep the showcase purely static and proof-oriented?

## Assumptions & Risks

- Confirmed: `[from spec]` The site should provide details and showcase each skill in action. Risk if wrong: the catalog/workflow split may over-serve discovery and under-serve another goal.
- Confirmed: `[from research]` The highest-leverage docs gap is navigation, examples, proof, and first-success flow. Risk if wrong: the site may duplicate existing docs instead of solving the actual adoption blocker.
- Confirmed: `[inferred]` Use generated summaries for every skill and curated examples for key workflows. Risk if wrong: full manual examples for every skill would be expensive to maintain and likely drift.
- Confirmed: `[inferred]` Build static V1 for Vercel with no backend. Risk if wrong: later dynamic features may require migration, but static V1 minimizes initial complexity.
- Corrected: `[inferred]` Initial direction considered optional video/Remotion. User chose no video and browser-native dynamic animations. Risk if wrong later: animation source remains frontend code, not reusable video content.
- Confirmed: `[from codebase]` There is no existing frontend scaffold in this repo. Risk if wrong: implementation may miss an external preferred site scaffold.
- Confirmed: `[from codebase]` Source skill data lives in `SKILL.md` frontmatter and paths. Risk if wrong: generated catalog may miss behavior details that only appear deep in the body.
- Confirmed: `[from codebase]` Existing validation scripts are the right pattern for stale-data checks. Risk if wrong: adding another validation script may be ignored unless workflow skills reference it.
- Confirmed: `[from research]` LexCorp is a build-in-public War Room and portfolio brand. Risk if wrong: cross-linking the showcase to LexCorp may confuse users who only want the skill library.
- Confirmed: `[from spec]` Brand should promote George "G" Le, then use G in shorter UI copy. Risk if wrong: personal brand copy may feel too founder-led or not founder-led enough.
- Confirmed: `[from spec]` The primary CTA is following G's work and building distribution for LexCorp. Risk if wrong: CTA placement may optimize audience growth over direct consulting or product conversion.
- Confirmed: `[from spec]` Use LexCorp, YouTube, X/Twitter, and Discord links. Risk if wrong: link rot, especially Discord invite expiry, can create a poor first impression.
- Confirmed: `[from spec]` Use Swiss grid and blueprint theming. Risk if wrong: visual system may feel too architectural and not enough like a live agent workflow.
- Confirmed: `[inferred]` Hard gate only generated metadata staleness; curated workflow copy is a review gate. Risk if wrong: behavior-only skill changes can still leave curated examples stale if agents make a bad judgment call.
