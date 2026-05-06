# Skills Showcase Website - Interview Log

**Date:** 2026-05-06
**Interviewer:** Codex (`$spec-interview`)
**Topic:** Skills showcase website for `agentic-skills`

## Source Evidence

- User prompt: create a frontend website that details and showcases each skill in action and walks users through ideal workflows.
- `research/devtool-user-map.md`: target users are shell-comfortable AI coding power users, small teams, DX leads, and hybrid-mode orchestrators.
- `research/devtool-dx-journey.md`: first success is usually install -> pack enablement -> restart -> `$run` or research artifact creation.
- `research/devtool-adoption.md`: adoption gap includes no "see it in 30 seconds" asset, examples are scattered, and `tasks/history.md` is the lived example gallery.
- `research/devtool-docs-audit.md`: highest-leverage docs work is first-success quickstart, curated examples, troubleshooting, and proof surfacing.
- `research/devtool-positioning.md`: credible trust claims are local-first, inspectable, no telemetry, self-dogfooded, and explicit validation.
- `/Users/georgele/projects/apps/lexcorp-war-room/README.md`: LexCorp is a public build-in-public War Room at `https://leexperimental.com`.
- `/Users/georgele/projects/apps/lexcorp-war-room/specs/lexcorp-build-in-public.md`: G's personal brand and LexCorp are intertwined; the audience follows the founder and the company.

## Assumptions Manifest

Presented before probing.

### Source Context

- `[from spec]` The goal is a frontend website that explains each skill, shows it in action, and walks users through ideal skill workflows.
- `[from research]` Target users are AI-coding power users, small teams, DX leads, and multi-repo operators who already use Claude Code and/or Codex.
- `[from research]` Existing docs are accurate but scattered; the known gap is navigation, examples, proof, and first-success flow.

### Implementation Goal

- `[inferred]` The site should be an interactive skill catalog plus workflow guide, not only a static reference page.
- `[inferred]` "Showcase in action" means example scenarios, command flows, expected artifacts, and before/after workflow narratives, not live execution of skills in the browser.

### Technical Foundation

- `[from codebase]` There is no root frontend framework, no root `package.json`, and no existing docs site.
- `[from codebase]` Skills are stored as Markdown with YAML frontmatter under `global/` and `packs/`.
- `[inferred]` Use a static site with plain HTML/CSS/JS and generated JSON data unless the user wants a framework.

### Integration Risk

- `[from codebase]` This should coexist with README/docs/research, not replace them.
- `[inferred]` Wrong information architecture could create another docs surface that drifts, so generated skill metadata should come from source `SKILL.md` files wherever possible.

### Data Model

- `[from codebase]` Persisted source data is `SKILL.md` frontmatter/body plus `PACK.md`, README/docs, and workflow matrix docs.
- `[inferred]` Site data should include skill name, platform, pack, type, description, invocation syntax, arguments, workflow stage, related skills, and curated examples.

### API And Contract Surface

- `[inferred]` No runtime API is needed for V1.
- `[inferred]` Add a script such as `scripts/generate-skills-site-data.*` only if reproducible data extraction is needed.
- `[inferred]` Site routes/sections should include catalog, packs, workflows, first successful cycle, troubleshooting, and proof/dogfood examples.

### Operational Requirements

- `[from research]` Must be local-first, inspectable, no telemetry, no hosted dependency required.
- `[from codebase]` Validation should respect existing rules: no GitHub Actions, no unnecessary lockfile churn, local scripts/tests only.
- `[inferred]` Accessibility, mobile layout, fast search/filter, and stale-data prevention are required for the site to be useful.

**User review:** Confirmed the manifest and added a requirement: any changes to skills should prompt agents to update the website as relevant.

## Turn 1: Site Architecture, Examples, And Update Contract

**Questions:**

1. Should V1 be local-only docs site or reserve a Vercel/static hosting deployment path later?
2. For "showcase each skill in action," should V1 use curated examples for key workflows plus generated summaries for every skill?
3. Should website update prompt be a hard validation gate for every `SKILL.md` diff, or a warning/review gate that requires agents to decide whether behavior changed?

**Recommendation presented:**

- Static site under docs, Vercel-compatible.
- Generated coverage for every skill, curated examples for major workflows.
- Warning/review gate for curated copy, hard gate only for stale generated metadata.

**User answers:**

1. "I'll deploy it on vercel."
2. "Ok I agree with your recommendations."
3. "Ok I agree with your recommendation."

**Decision:**

V1 targets static Vercel deployment. Catalog metadata is generated for every skill. Curated examples cover major workflows. Generated metadata staleness is a hard gate; curated site copy is a review gate.

## Turn 2: Brand Direction, Workflow Coverage, Generated Data

**Questions:**

1. Branding/tone: public-facing devtool docs/product feel, polished but technical, local-first, honest about constraints?
2. Curated workflow coverage: install + first successful cycle, pack selection, plan -> run -> ship, spec -> roadmap -> implementation, research chains, hybrid handoff, skill authoring, validation/troubleshooting?
3. Generated site data: commit generated `docs/skills-showcase/assets/skills-data.js` so Vercel can deploy static files without running repo scripts?

**User answers:**

1. Marketing in the sense of promoting the skills/workflow and promoting George "G" Le as an expert in agentic engineering.
2. Workflow list looked OK, with a suggestion to consider leveraging Remotion.
3. Generated data sounded good, but user asked whether a simple Neon DB should be used and whether Neon can handle video.

**Evidence gathered:**

- Official Neon docs position Neon as serverless Postgres, not media/object hosting.
- Vercel Blob is a better fit for media if video is ever needed.
- Remotion can produce programmatic videos, but that adds media production and hosting scope.

**Decision:**

Use marketing positioning for G and the workflow. Do not use Neon for video. Keep database out of V1 unless a later dynamic feature requires it.

## Turn 3: Video, Remotion, And Animation Direction

**Question/decision prompt:**

Should V1 include Remotion project/source as implementation scope, or only design website video slots and leave actual Remotion production as a follow-up?

**User answer:**

"Let's avoid video then, perhaps we can do some dynamic animations with the frontend to illustrate the skills working."

**Decision:**

No video, no Remotion, no media storage in V1. Use browser-native dynamic animations to illustrate workflows.

## Turn 4: CTA And Personal Brand

**Questions:**

1. What primary CTA should the site drive toward?
2. Should the personal brand lead as George "G" Le, G Le, or another display name?
3. Should implementation include a lightweight contact surface in V1, such as mailto/social links, or just CTA placeholders?

**User answers:**

1. "Follow my work? I want to grow my following and build distribution for Lexcorp (see the warroom repo)."
2. "George "G" Le, then G after is fine."
3. "Link to Lexcorp, my Youtube @georgele, maybe Twitter @gkingofboston ? Discord?"

**Evidence gathered:**

- `lexcorp-war-room` README describes LexCorp as the public-facing portfolio War Room at `https://leexperimental.com`.
- LexCorp build-in-public spec says G's personal brand and LexCorp are deeply intertwined.

**Decision:**

Primary CTA is "Follow G's work." The site links to LexCorp, YouTube, X/Twitter, and Discord.

## Turn 5: Coverage Checkpoint

**Structured summary presented:**

- Static Vercel site, no DB, no video, no Remotion.
- Browser-native workflow animations: terminal playback, plan/run/ship state machine, pack routing maps, hybrid handoff timeline.
- Brand leads with George "G" Le, then uses G in shorter UI copy.
- Marketing goal is distribution growth for G and LexCorp, not just docs.
- CTA stack: follow G's work, visit LexCorp, YouTube `@georgele`, X/Twitter `@gkingofboston`, optional Discord.
- Generated catalog for every skill; curated animated walkthroughs for key workflows.
- Skill changes must prompt website updates when behavior changes; stale generated metadata should be a hard validation failure.

**Questions:**

1. Does this cover the core product/brand direction, or is there any constraint to revisit before writing the spec?
2. Do you have a public Discord invite URL now, or should V1 include a placeholder/omit Discord until the community channel exists?

**User answers:**

1. "I think so, perhaps we can use swiss grid, blueprints as a theming motif for the site."
2. `https://discord.gg/TC6STUc5rT`

**Decision:**

Spec includes Swiss grid and blueprint motif and the supplied Discord invite.

## Coverage Summary

### Implementation Goals

Decision: Build a static Vercel site that markets G's agentic engineering expertise and makes the skills library easier to understand through generated catalog data and animated workflow walkthroughs.

Reasoning: Local research shows the docs are correct but scattered; adoption needs proof, examples, and first-success guidance.

### Architecture

Decision: Static files under `docs/skills-showcase/`, generated skill metadata committed as `assets/skills-data.js`, no backend.

Reasoning: The repo has no frontend scaffold or root package; static output minimizes friction and preserves the local-first posture.

### Data Model

Decision: Source of truth is `SKILL.md` frontmatter/path data plus curated static workflow data. No user data persists.

Reasoning: Generated metadata avoids catalog drift and Vercel can serve committed static data without a build system.

### APIs And Contracts

Decision: No runtime API. Add generator and validator scripts. Browser reads `window.SKILLS_SHOWCASE_DATA`.

Reasoning: Runtime APIs and databases do not add value to V1.

### Website Update Contract

Decision: Hard gate stale generated metadata; review gate curated copy/animation updates.

Reasoning: Every skill metadata change should be reflected automatically, but behavior-only changes need agent judgment rather than a noisy universal blocker.

### UX And Visual Direction

Decision: Swiss grid and blueprint theme with browser-native workflow animations.

Reasoning: This supports an expert technical brand and avoids the complexity of video/Remotion/media hosting.

### CTA And Brand

Decision: Lead with George "G" Le and "Follow G's work"; link to LexCorp, YouTube, X/Twitter, and Discord.

Reasoning: User's goal is audience growth and distribution for LexCorp, not only docs usage.

### Operations

Decision: Vercel static deployment, no GitHub Actions, no telemetry, no database, no videos.

Reasoning: Keeps V1 simple, inspectable, cheap to deploy, and aligned with repo constraints.

## Significant Deviations From Initial Draft

1. **Brand moved from docs utility to personal distribution surface.**
   - Initial framing was a devtool docs/showcase site.
   - Final direction promotes George "G" Le as an agentic engineering expert and links the skills to LexCorp.

2. **Video/Remotion was considered and then removed.**
   - Remotion was suggested as a possible way to showcase workflows.
   - User chose no video and browser-native dynamic animations instead.

3. **Database was considered and rejected for V1.**
   - Neon was discussed in the context of dynamic content and video.
   - Final direction keeps V1 static, with Neon only a possible future metadata store if dynamic features emerge.

4. **Maintenance contract became a first-class requirement.**
   - User explicitly required skill changes to prompt website updates when relevant.
   - Spec now includes generated-data validation and agent workflow prompts.

5. **Visual motif became specific.**
   - Initial visual direction was technical and polished.
   - Final spec requires Swiss grid and blueprint motifs.

## Corrected Or Confirmed Assumptions

| Assumption | Status |
| --- | --- |
| `[inferred]` Static generated showcase site | Confirmed, with Vercel deployment |
| `[inferred]` No runtime API for V1 | Confirmed |
| `[inferred]` Generated summaries for every skill plus curated examples | Confirmed |
| `[inferred]` Warning/review gate for curated copy | Confirmed |
| `[inferred]` Hard gate for stale generated metadata | Confirmed |
| `[inferred]` Video/Remotion could be useful | Corrected: no video/Remotion in V1 |
| `[inferred]` Neutral devtool docs/product tone | Corrected: explicitly marketing G's expertise and workflow |
| `[from codebase]` No existing frontend scaffold | Confirmed |
| `[from research]` Examples/proof are the adoption gap | Confirmed |
| `[from spec]` Link to Discord if available | Confirmed with invite URL |
