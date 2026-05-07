# UI Interview Log: Skills Showcase Website

**Date:** 2026-05-07
**Interviewer:** Codex (`$ui-interview`)
**Topic:** UI specification for the `agentic-skills` showcase website

## Source Evidence

- `specs/skills-showcase-website.md`
- `specs/skills-showcase-website-interview.md`
- `research/devtool-user-map.md`
- `research/devtool-dx-journey.md`
- `research/devtool-adoption.md`
- `research/devtool-docs-audit.md`
- `research/devtool-positioning.md`
- GitHub repository visibility check for `GeorgeQLe/agentic-skills`

## UI Assumptions Manifest

Presented before probing.

### Product And User Context

- `[from spec]` The site markets George "G" Le as an agentic engineering expert and uses `agentic-skills` as the proof surface.
- `[from spec]` The audience is builders, AI-coding power users, small teams, DX leads, and people who may follow G/LexCorp.
- `[from research]` The adoption gap is not missing truth; it is scattered examples, weak first-success guidance, and buried proof artifacts.

### Pages, Routes, Entry Points

- `[from spec]` V1 is a static Vercel site under `docs/skills-showcase/`.
- `[inferred]` V1 should be one primary page with anchor sections instead of multiple static routes, because static deployment and no router keeps implementation simple.
- `[inferred]` The entry point is `/` or `/index.html`; sections are addressable anchors: hero, workflows, packs, catalog, proof, about.

### Primary Tasks

- `[from spec]` Primary task: follow G's work.
- `[from spec]` Secondary tasks: explore workflows, browse skills, understand packs, visit LexCorp, YouTube, X/Twitter, Discord.
- `[inferred]` A first-time visitor should understand "what this is" within the first viewport, then see an animated proof of the workflow before hitting the full catalog.

### Navigation Model

- `[inferred]` Desktop uses a slim sticky top nav with anchor links and a persistent primary CTA.
- `[inferred]` Mobile uses a compact header with a menu button or horizontally scrollable section nav.
- `[from spec]` No account controls, notifications, auth, or app settings exist in V1.

### Information Hierarchy

- `[from spec]` Hierarchy should be: G/expertise -> workflow proof -> packs/workflows -> generated catalog -> proof artifacts -> links/community.
- `[inferred]` Catalog should not lead the page; it is too dense for first impression.

### Layout Grid And Density

- `[from spec]` Use Swiss grid and blueprint motif.
- `[inferred]` Use a 12-column desktop grid, 8-column tablet grid, 4-column mobile grid, with visible blueprint guide lines used sparingly.
- `[inferred]` Density should be technical and scan-friendly, not airy SaaS landing-page style.

### Component Inventory

- `[from spec]` Components: hero command blueprint, workflow tabs/cards, animated terminal/state machine, pack map, search/filter catalog, skill cards/rows, proof links, social/CTA footer.
- `[inferred]` Catalog should use compact list rows by default, with an optional detail drawer or expandable row for source path/version/argument hint.

### Button And Link Semantics

- `[from spec]` Primary CTA: "Follow G's Work."
- `[from spec]` External links: LexCorp, YouTube, X/Twitter, Discord.
- `[inferred]` "Explore Skills" scrolls to catalog; "See Workflow" scrolls to Workflow Lab; source-path links are internal repo-relative text for now unless a public GitHub URL is later set.

### Forms, Validation, Errors

- `[from spec]` No forms in V1.
- `[inferred]` Search/filter inputs need empty-state messaging but no form submission or validation.

### States

- `[from spec]` Missing/malformed generated data must show a visible fallback instead of blank page.
- `[inferred]` Need states for catalog empty results, loading/initializing, selected filter, selected workflow, animation paused, reduced motion, external-link hover/focus, and disabled unavailable actions.

### Responsive Behavior

- `[inferred]` Desktop: split hero with copy/CTA left and animated blueprint right.
- `[inferred]` Tablet: hero stacks copy above animation; workflow controls remain visible.
- `[inferred]` Mobile: one-column, animations simplify, catalog filters collapse into a drawer or stacked controls.

### Accessibility

- `[from spec]` Honor `prefers-reduced-motion`; animations need static fallback.
- `[inferred]` All interactive controls need keyboard focus states, labels, and 44px-ish touch targets on mobile.
- `[inferred]` Blueprint grid lines must not reduce text contrast.

### Visual Language

- `[from spec]` Swiss grid + blueprint motif; no blobs, generic gradients, or video.
- `[inferred]` Palette should be neutral base, blueprint blue accents, green success, amber warning, red failure, with restrained use so it does not become one-note blue.
- `[inferred]` Typography should feel precise: grotesk/sans for UI, monospace for commands and terminal playback.

### Implementation Constraints

- `[from codebase]` No existing frontend scaffold or package manager at root.
- `[from spec]` Static HTML/CSS/JS, generated `skills-data.js`, no backend, no telemetry.
- `[from spec]` Implementation must add generated-data validation and website-update prompts for skill changes.

**User response:** "Yes looks good to me." Manifest approved.

## Turn 1: Global Shell And Hero

**Recommendations presented:**

1. Compact sticky header:
   - Left: `G / agentic-skills`
   - Center: `Workflows`, `Packs`, `Catalog`, `Proof`
   - Right: `LexCorp`, `Follow`
   - Mobile: logo + menu icon button with full-width drawer.
2. Dense two-zone command blueprint hero:
   - Left 5 columns: title, short proof claim, CTA row, social links.
   - Right 7 columns: animated workflow blueprint showing `prompt -> spec -> roadmap -> run -> ship`.
   - Bottom strip: factual stats such as `312 skill files`, `global + packs`, `Claude / Codex`, `static generated catalog`.
3. Primary CTA label initially recommended as `Follow G's Work`, opening a compact link menu.

**Questions:**

1. Should hero headline lead with G or the workflow?
2. Should `Follow G's Work` open a menu or scroll to About/Follow?
3. Should hero stats be current repo facts only or allow sharper marketing labels?

**Recommendation:**

- Lead with G: `George "G" Le builds agentic engineering systems.`
- Menu on desktop, scroll-to-follow on mobile.
- Use current facts only.

**User response:** "I agree with your recommendations."

**Decision:**

Header and hero structure accepted. Later CTA discussion changed the primary hero CTA to `Explore the Library`.

## Turn 2: Workflow Lab And Pack Map

**Recommendations presented:**

1. Workflow Lab desktop two-column layout:
   - Left vertical workflow selector with 8 workflows.
   - Right animated blueprint panel.
   - Supporting lists: "What changes" and "When to use this."
2. Workflow animation controls:
   - Play/Pause
   - Step back / Step forward
   - Restart
   - Progress rail with 4-7 labeled steps.
3. Pack Map layered blueprint diagram:
   - Global core
   - Domain packs
   - Overlays: `code-quality`, `monorepo`, kanban variants
   - Output artifacts: `research/`, `specs/`, `tasks/`, commits

**Questions:**

1. Should Workflow Lab copy be instructional or proof-oriented?
2. Should Pack Map show all packs at once or start with a choose-project-type control?
3. Should workflow animations use realistic command text or abstract labels?

**Recommendations:**

- Proof-oriented headings with instructional detail underneath.
- Show all packs initially, with a project-type segmented control for highlighting.
- Show both command first and plain-language label second.

**User response:** "I agree with your recommendations."

**Decision:**

Workflow Lab and Pack Map accepted with proof-led copy, all-pack default, project-type highlighting, and command-first labels.

## Turn 3: Catalog, Receipts, And Follow Section

**Recommendations presented:**

1. Catalog should use a compact searchable table/list:
   - Search input.
   - Filters for platform, scope/pack, type, workflow.
   - Rows with command, name, description, badges, expand icon.
   - Expanded details: source path, version, argument hint, mirror/platform details, related workflow chips.
2. Catalog states:
   - Data missing.
   - No results.
   - Filter active.
   - Long descriptions.
   - Claude-only/Codex-only asymmetry badge.
3. Proof surface as "Inspect the system" section with link tiles:
   - `tasks/history.md`
   - devtool research chain
   - validation scripts
   - skills reference
   - showcase data freshness contract
4. Follow/About section:
   - Heading: `Follow G building the agentic engineering stack behind LexCorp`
   - Links to LexCorp, YouTube, X/Twitter, Discord
   - Short bio paragraph
   - No contact form

**Questions:**

1. Should catalog row primary label be command or human name?
2. Should proof links open repo-relative paths or assume a future public GitHub base URL?
3. Should Follow section include a direct hire/consulting CTA?

**Recommendations:**

- Command first.
- Use configurable `repoBaseUrl`; if absent, render paths as code labels.
- No consulting CTA in V1.

**User response:**

- Agreed with command-first.
- Asked what proof links are.
- Clarified goal: top-of-funnel for LexCorp, personal brand as agentic engineer, and Discord communities.

**Clarification provided:**

Proof links are "receipts" visitors can inspect: `tasks/history.md`, `research/devtool-*.md`, `specs/skills-showcase-website.md`, validation scripts. Recommended public section label: `Receipts` or `Inspect the System`.

**Decision:**

Use `Inspect the System` / receipt language. Funnel becomes three-lane:

- LexCorp: `Enter the War Room`
- Personal brand: `Follow G's Work`
- Community: `Join the Discord`

## Turn 4: Public Repository And Open-Source Language

**Questions:**

1. Is `agentic-skills` public, or will it become public before launch?
2. Is the Discord link for one main community or multiple communities?

**User response:**

User believed the repo should be public and asked to check GitHub. User confirmed one Discord link.

**Evidence gathered:**

`gh api repos/GeorgeQLe/agentic-skills` showed:

```json
{
  "html_url": "https://github.com/GeorgeQLe/agentic-skills",
  "name": "agentic-skills",
  "private": true,
  "visibility": "private"
}
```

User then said: "Let's make it public and use that open-source workflow language."

**Action taken:**

Ran GitHub API update to make the repository public. Verified after update:

```json
{
  "html_url": "https://github.com/GeorgeQLe/agentic-skills",
  "name": "agentic-skills",
  "private": false,
  "visibility": "public"
}
```

**Decision:**

Use open-source workflow language in V1. Receipt links and catalog source paths should be clickable GitHub links. Discord uses one CTA: `https://discord.gg/TC6STUc5rT`.

## Turn 5: CTA Model

**Recommendations presented:**

1. Hero primary CTA: `Follow G's Work`.
2. Footer order: `G`, `LexCorp`, `Open Source`.
3. Add GitHub alongside YouTube, X/Twitter, Discord, and LexCorp.

**User response:**

User agreed except questioned primary CTA: "feels like it should be explore the library as primary and follow as secondary."

**Revised recommendation:**

User instinct was better:

- Hero primary: `Explore the Library`
- Hero secondary: `Follow G's Work`
- Header persistent CTA: compact `Follow`
- Catalog CTA: `Browse All Skills`
- Closing CTA: `Follow G`, `Enter LexCorp`, `Join Discord`

**Questions:**

1. Primary CTA destination should be Workflow Lab first, with a nearby Browse Catalog link?
2. Page order should be `Hero -> Workflow Lab -> Pack Map -> Catalog -> Receipts -> Follow/About -> Footer`?
3. Hero copy:
   - H1: `George "G" Le builds open-source agentic engineering systems.`
   - Support: `Explore the workflow library behind repeatable Claude Code and Codex planning, execution, validation, and shipping.`

**User response:** "Ok I agree."

**Decision:**

Primary CTA and page order accepted.

## Turn 6: Responsive, Controls, States, And Copy

**Recommendations presented:**

1. Responsive behavior:
   - Desktop >=1200px: 1280px max width, 12-column grid, sticky header.
   - Tablet 768-1199px: 8-column grid, hero stacks if needed, filters wrap.
   - Mobile <768px: 4-column grid, header menu, simplified animations, filters drawer/stack.
2. Controls:
   - Icon buttons for animation controls.
   - Segmented controls for platform/project type.
   - Chips/checkboxes for pack/type filters.
   - Expandable rows for catalog details.
   - No destructive actions.
3. Visual states:
   - Green success.
   - Amber warning.
   - Red error.
   - Blueprint-blue selected.
   - High-contrast focus.
   - Reduced-motion static/stepper state.
4. Key copy:
   - H1: `George "G" Le builds open-source agentic engineering systems.`
   - Support: `Explore the workflow library behind repeatable Claude Code and Codex planning, execution, validation, and shipping.`
   - Primary CTA: `Explore the Library`
   - Secondary CTA: `Follow G's Work`
   - Receipts title: `Inspect the System`
   - Follow title: `Follow G building the agentic engineering stack behind LexCorp`

**Coverage checkpoint presented:**

- Global shell: covered.
- Single-page route/anchors: covered.
- Hero: covered.
- Workflow Lab: covered.
- Pack Map: covered.
- Catalog: covered.
- Inspect/Receipts: covered.
- Follow/About/Footer: covered.
- Controls, states, responsive, accessibility: covered.
- Known open risks: final domain/subdomain, exact Vercel config, whether Discord invite remains durable.

**User response:** "All looks good to me."

**Decision:**

UI details complete. Proceed to write UI spec and interview log.

## Notable Changes From Initial Draft

1. **CTA priority changed.**
   - Initial spec named `Follow G's Work` as primary.
   - UI interview changed hero primary CTA to `Explore the Library` because proof should precede funnel conversion.

2. **Repo visibility changed.**
   - The repository was private when checked.
   - User requested making it public; it was made public and verified.
   - UI can now use open-source language and GitHub receipt links.

3. **Proof links were reframed as receipts.**
   - User asked what proof links meant.
   - UI spec uses `Inspect the System` as the section title and "receipts" as explanatory language.

4. **Footer/funnel model clarified.**
   - Funnel is not only personal following.
   - It has three lanes: open-source library, LexCorp, and Discord community.

5. **Catalog row priority settled.**
   - Command-first rows reflect tool usage better than human-title-first cards.

## Final Decisions

- Single-page anchor site.
- Swiss grid + blueprint motif.
- Technical, compact, proof-led density.
- Hero leads with George "G" Le and open-source agentic engineering systems.
- Primary CTA: `Explore the Library`.
- Secondary CTA: `Follow G's Work`.
- Page order: Hero -> Workflow Lab -> Pack Map -> Catalog -> Inspect -> Follow/About -> Footer.
- Workflow Lab before catalog.
- Pack Map shows all packs with project-type highlighting.
- Catalog uses compact expandable command-first rows.
- Receipts link to GitHub artifacts because the repo is public.
- Footer/follow section supports G's personal brand, LexCorp, open-source repo, and one Discord community.
- No forms, auth, telemetry, video, Remotion, database, or runtime API in V1.
