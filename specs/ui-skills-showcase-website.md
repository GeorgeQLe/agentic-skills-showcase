# UI Spec: G Skillpacks Website

## Scope And Source Evidence

This UI specification defines the V1 interface for **G Skillpacks** at `gskillpacks.com`: a Vercel-deployable, multi-page site that promotes George "G" Le as an agentic engineering expert and helps visitors understand the `agentic-skills` open-source workflow library through animated workflow explanations, a pack map, a generated skill catalog, newsletter/email capture, GitHub/open-source proof data, and inspectable proof artifacts.

## Brand And Domain

- Public brand: **G Skillpacks**.
- Domain: `gskillpacks.com`.
- Brand promise: pack, test, and organize agentic skills.
- Use **G Skillpacks** in the global header, metadata, footer, hero, and primary route framing.
- Use `agentic-skills` only for the underlying open-source library/repository.
- Preserve skill packs consistency through the layout vocabulary: packs, routes, coordinates, nodes, pack map, catalog, proof surfaces, and inspection paths.

Source evidence:

- `specs/skills-showcase-website.md` defines the product scope, static architecture, Swiss grid/blueprint motif, generated catalog, curated workflow set, CTA goals, and maintenance contract.
- `specs/skills-showcase-website-interview.md` records the product decisions behind Vercel static deployment, no database/video/Remotion, browser-native animations, LexCorp/personal-brand positioning, and public link targets.
- `research/devtool-user-map.md`, `research/devtool-dx-journey.md`, `research/devtool-adoption.md`, `research/devtool-docs-audit.md`, and `research/devtool-positioning.md` show the adoption gap: examples and proof exist, but they are scattered.
- GitHub repository visibility was verified and changed during this UI interview: `https://github.com/GeorgeQLe/agentic-skills` is public, so the UI can use open-source language and GitHub artifact links.

## UI Assumptions Manifest

### Product And User Context

- Confirmed: `[from spec]` The site markets George "G" Le as an agentic engineering expert and uses `agentic-skills` as the proof surface.
- Confirmed: `[from spec]` The audience is builders, AI-coding power users, small teams, DX leads, and people who may follow G/LexCorp.
- Confirmed: `[from research]` The adoption gap is not missing truth; it is scattered examples, weak first-success guidance, and buried proof artifacts.
- Corrected: `[inferred]` The site should be a generic docs surface. It should instead be a top-of-funnel surface for the open-source library, G's personal brand, LexCorp, and the Discord community.

### Pages, Routes, And Entry Points

- Confirmed: `[from spec]` V1 is a static Vercel site under `docs/skills-showcase/`.
- Corrected: `[from roadmap clarification]` V1 should use multi-page static routes for the main product surfaces, not only anchor sections.
- Confirmed: `[from roadmap clarification]` Entry points are `/`, `/workflows/`, `/packs/`, `/catalog/`, `/inspect/`, and `/follow/`, with anchors allowed inside those pages for subsection jumps.

### Primary Tasks Per Page

- Corrected: `[from spec]` The original primary task was "Follow G's work." User decided the primary hero CTA should instead prove value first: "Explore the Library."
- Confirmed: `[from spec]` Secondary tasks are following G, entering LexCorp, joining Discord, browsing skills, inspecting proof artifacts, and visiting GitHub.
- Confirmed: `[inferred]` A first-time visitor should understand what this is within the first viewport, then see workflow proof before the dense catalog.

### Navigation Model

- Corrected: `[from roadmap clarification]` Desktop uses a slim sticky top nav with route links and a persistent follow-oriented secondary CTA.
- Confirmed: `[inferred]` Mobile uses a compact header with an icon menu button and a full-width menu drawer.
- Confirmed: `[from spec]` No account controls, notifications, auth, or settings exist in V1.

### Information Hierarchy

- Confirmed: `[from spec]` Hierarchy is G/expertise -> workflow proof -> packs/workflows -> generated catalog -> proof artifacts -> follow/community.
- Confirmed: `[inferred]` Catalog does not lead the page because it is too dense for first impression.

### Layout Grid And Spatial Density

- Confirmed: `[from spec]` Use a Swiss grid and blueprint motif.
- Confirmed: `[inferred]` Use a 12-column desktop grid, 8-column tablet grid, and 4-column mobile grid.
- Confirmed: `[inferred]` Density should be technical and scan-friendly, not airy SaaS landing-page style.

### Component Inventory

- Confirmed: `[from spec]` Components include sticky header, hero command blueprint, workflow selector, animated workflow panel, pack map, search/filter catalog, expandable skill rows, inspectable proof links, follow section, and footer.
- Confirmed: `[inferred]` Catalog uses compact expandable rows by default instead of large skill cards.

### Button And Link Semantics

- Corrected: `[from spec]` Primary hero CTA is `Explore the Library`, not `Follow G's Work`.
- Confirmed: `[from spec]` Secondary funnel links include LexCorp, YouTube, X/Twitter, Discord, GitHub, and follow/social actions.
- Confirmed: `[inferred]` GitHub links are enabled because the repository is now public.

### Forms, Validation, And Error Display

- Corrected: `[from roadmap clarification]` V1 includes newsletter/email capture through a static/provider-backed form integration.
- Confirmed: `[inferred]` Search/filter inputs need empty-state messaging but no form submission.
- Confirmed: `[inferred]` Newsletter capture needs success, error, pending, and provider-missing states without storing personal data in the repository or a first-party database.

### Empty, Loading, Disabled, Success, Warning, And Failure States

- Confirmed: `[from spec]` Missing/malformed generated data shows a visible fallback instead of a blank page.
- Confirmed: `[inferred]` Required states include no-results, selected filters, selected workflow, animation paused, reduced motion, external-link hover/focus, disabled controls, warning, and error states.

### Responsive Behavior

- Confirmed: `[inferred]` Desktop uses a split hero with copy left and animated blueprint right.
- Confirmed: `[inferred]` Tablet stacks hero copy above animation when needed.
- Confirmed: `[inferred]` Mobile is one-column, simplifies animations to stepper/static states, and collapses filters.

### Accessibility

- Confirmed: `[from spec]` Honor `prefers-reduced-motion`; animations need static fallback.
- Confirmed: `[inferred]` Interactive controls need keyboard focus states, labels, and 44px minimum touch targets on mobile.
- Confirmed: `[inferred]` Blueprint lines must never reduce text contrast.

### Visual Language, Typography, Color, Iconography, And Assets

- Confirmed: `[from spec]` Swiss grid + blueprint motif; no blobs, generic gradients, video, or Remotion assets.
- Confirmed: `[inferred]` Palette uses neutral base, blueprint blue accents, green success, amber warning, and red failure.
- Confirmed: `[inferred]` Use precise sans-serif typography and monospace for commands/terminal playback.

### Implementation Constraints

- Confirmed: `[from codebase]` No existing frontend scaffold or package manager at the root.
- Corrected: `[from roadmap clarification]` Static HTML/CSS/JS, generated `skills-data.js`, generated GitHub/open-source proof data, no first-party backend, no visitor-tracking analytics, and no live LexCorp metrics.
- Confirmed: `[from spec]` Implementation must add generated-data validation and website-update prompts for skill changes.

## Page Inventory And Route Map

V1 is a multi-page static site. Each page should be directly reloadable on Vercel and locally through a simple static server. The homepage can include preview bands for the other routes, but the full experiences live on their own static pages.

| Route / Anchor | Purpose | Entry Points |
| --- | --- | --- |
| `/` or `/index.html` | Homepage with hero, product overview, top workflows, proof preview, and funnel preview | Direct Vercel root, GitHub README links, LexCorp links |
| `/workflows/` | Workflow Lab with selected animated walkthroughs | Hero primary CTA, header nav, homepage preview |
| `/packs/` | Pack Map and project-type highlighter | Header nav, Workflow Lab cross-links |
| `/catalog/` | Searchable generated skill catalog | Header nav, Pack Map selected pack, catalog CTA |
| `/inspect/` | Receipts, validation, GitHub/open-source proof data, and honest boundaries | Header nav, proof links in hero and workflows |
| `/follow/` | Three-lane funnel: G, LexCorp, Discord, newsletter/email capture | Header Follow CTA, hero secondary CTA, footer |

No modals are required except the mobile nav drawer and optional desktop follow-link popover. No separate detail pages exist in V1.

## Global Shell And Navigation Rules

### Desktop Header

Height: 56px to 64px.

Layout:

- Left, fixed-width identity group:
  - Text label: `G Skillpacks`
  - Optional small domain mark: `gskillpacks.com`
- Center nav links:
  - `Workflows` -> `/workflows/`
  - `Packs` -> `/packs/`
  - `Catalog` -> `/catalog/`
  - `Inspect` -> `/inspect/`
- Right action links:
  - `LexCorp` -> `https://leexperimental.com`
  - `Follow` -> `/follow/` or opens compact follow popover with the same links

Behavior:

- Header is sticky at the top with a subtle bottom blueprint rule.
- Active section link receives a blueprint-blue underline or outlined marker when section detection is implemented. If not implemented in V1, omit active state rather than faking it.
- External links open in the same tab unless implementation chooses new-tab behavior consistently with `rel="noopener noreferrer"`.

### Mobile Header

Height: 56px.

Layout:

- Left: `G Skillpacks`
- Right: icon button with `aria-label="Open navigation"`

Menu drawer:

- Full-width panel under the header.
- Contains the same route links and funnel links.
- Each item is at least 44px high.
- Closing behavior:
  - Tap outside closes.
  - Escape closes.
  - Selecting a link closes after navigation.
- Focus returns to the menu button after close.

### Footer

Three columns on desktop, stacked on mobile:

1. **G**
   - YouTube
   - X/Twitter
   - GitHub
   - Discord
2. **LexCorp**
   - Enter the War Room
   - Build-in-public positioning line
3. **Open Source**
   - Repository
   - Skills catalog route
   - Inspect the System route

Footer should also include a short note: `Open-source workflow library for Claude Code and Codex.`

## Detailed Page-By-Page Anatomy

### Hero / Command Blueprint

Anchor: top of page.

Desktop layout:

- 12-column grid.
- Left 5 columns: copy and CTAs.
- Right 7 columns: animated command blueprint panel.
- Bottom full-width stats strip.

Left content:

- Eyebrow: `OPEN-SOURCE AGENTIC ENGINEERING`
- H1: `George "G" Le builds open-source agentic engineering systems.`
- Supporting copy: `Explore the workflow library behind repeatable Claude Code and Codex planning, execution, validation, and shipping.`
- CTA row:
  - Primary button: `Explore the Library` -> `/workflows/`
  - Secondary button/link: `Follow G's Work` -> `/follow/` or desktop follow popover
- Secondary inline links:
  - `GitHub`
  - `LexCorp`
  - `YouTube`
  - `Discord`

Right blueprint panel:

- Title line: `prompt -> spec -> roadmap -> run -> ship`
- Animated state machine with 5 nodes:
  - `Prompt`
  - `Spec`
  - `Roadmap`
  - `Run`
  - `Ship`
- Each node has a short command or artifact label:
  - `$spec-interview`
  - `specs/*.md`
  - `tasks/*.md`
  - `$run`
  - `history + commit`
- Animation should loop slowly only when reduced motion is not enabled.
- Reduced-motion fallback shows all nodes in completed order.

Stats strip:

- Dynamic skill count from `skills-data.js` via `data-skill-count` (labeled as "source skills")
- `global + packs` (labeled as "skill scopes")
- `Claude Code + Codex` (labeled as "agent surfaces")
- `generated static catalog`

Stats are populated dynamically from generated data. The skill count updates automatically when `skills-data.js` is regenerated.

### Workflow Lab

Route: `/workflows/`.

Purpose: demonstrate how the library works before visitors hit the catalog.

Desktop layout:

- Section header full width:
  - Eyebrow: `WORKFLOW LAB`
  - H2: `Watch the system move from intent to shipped work.`
  - Short copy: proof-oriented heading, instructional support text.
- Content grid:
  - Left 4 columns: workflow selector.
  - Right 8 columns: animation panel and artifact notes.

Workflow selector:

- Vertical list or compact cards, one per workflow:
  - `First Successful Cycle`
  - `Pack Selection`
  - `Plan -> Run -> Ship`
  - `Spec -> Roadmap -> Implementation`
  - `Research Chains`
  - `Hybrid Handoff`
  - `Skill Authoring`
  - `Validation / Troubleshooting`
- Each selector item includes:
  - command-first label when relevant, e.g. `$run`
  - plain-language subtitle
  - small badge: `setup`, `planning`, `shipping`, `research`, `hybrid`, `authoring`, or `validation`

Animation panel:

- Header contains selected workflow title and a one-sentence proof claim.
- Body shows one of the animation primitives:
  - terminal playback
  - state machine
  - artifact timeline
  - handoff diagram
  - validation gate
- Controls:
  - icon button `Previous step`
  - icon button `Play animation` / `Pause animation`
  - icon button `Next step`
  - icon button `Restart workflow`
  - progress rail with 4-7 labeled steps
- Below animation:
  - `When to use this`
  - `What changes`
  - `What you get`
  - `Failure/recovery path` when relevant

Mobile layout:

- Section header.
- Workflow selector becomes horizontal scroll list or stacked segmented tabs.
- Animation panel becomes one-column.
- Controls remain visible below the animation.

### Pack Map

Route: `/packs/`.

Purpose: make global vs pack-local context hygiene understandable.

Desktop layout:

- Header:
  - Eyebrow: `PACK MAP`
  - H2: `Install the workflow language your project actually needs.`
- Control row:
  - Segmented control: `All`, `Business`, `Devtool`, `Game`, `Creator`, `Monorepo`, `Kanban`
  - Optional compact checkbox: `Show overlays`
- Diagram:
  - Top band: `Global Core`
  - Middle band: domain packs
  - Side band or overlay layer: `code-quality`, `monorepo`, kanban packs
  - Bottom band: output artifacts: `research/`, `specs/`, `tasks/`, commits

Behavior:

- Initial state shows all packs.
- Selecting a project type highlights relevant packs and dims unrelated packs.
- Selecting a pack updates a side/detail panel:
  - pack name
  - what it is for
  - install command
  - key skills
  - catalog link filtered to that pack

Pack detail panel controls:

- `View skills` -> `/catalog/` with pack filter applied through query string or hash state when implemented.
- `Copy install command` is optional. If implemented, use a small icon button with `aria-label="Copy install command"` and a transient `Copied` success state.

### Skill Catalog

Route: `/catalog/`.

Purpose: complete generated reference for every skill.

Layout:

- Header:
  - Eyebrow: `CATALOG`
  - H1: `Every source skill gets an inspectable row.`
  - Short copy: `Search the committed static catalog generated from every source skill. Counts, commands, platform labels, and source paths come from skills-data.js.`
- Search/filter toolbar.
- Results summary.
- Compact expandable list.

Search:

- Input label: `Search skills, packs, workflows`
- Placeholder: `Search $run, devtool, shipping, research...`
- Clear button appears when query is non-empty.

Filters:

- Platform segmented control:
  - `All`
  - `Claude`
  - `Codex`
- Scope/pack control:
  - desktop: dropdown or multi-select chips
  - mobile: collapsible filters drawer
- Type control:
  - chips for `planning`, `analysis`, `execution`, `shipping`, `research`, `review`, `debugging`, `ops`
- Checkbox:
  - `Show asymmetries only` for Claude-only/Codex-only entries

Results:

- Row primary label is command first, e.g. `$run`, `/run`.
- Row columns:
  - command
  - human title/name
  - description
  - badges: platform, pack/scope, type, version
  - expand icon
- Expanded content:
  - source path link to GitHub
  - version
  - argument hint
  - mirror/platform status
  - related workflow chips when known
  - pack install command when pack-local

States:

- Data missing: warning/error panel titled `Generated catalog data unavailable`.
- No results: `No skills match these filters.`
- Active filters: show `Clear filters`.
- Long description: clamp to two lines in collapsed row.
- Claude-only/Codex-only: show visible asymmetry badge.

### Inspect The System

Route: `/inspect/`.

Purpose: give visitors receipts they can inspect now that the repo is public.

Header:

- Eyebrow: `Proof Surface`
- H1: `Receipts first, claims second.`
- Supporting copy: proof-oriented description of public repository artifacts.

Receipt tiles:

1. `Dogfood history`
   - Destination: `https://github.com/GeorgeQLe/agentic-skills/blob/master/tasks/history.md`
   - Explanation: shows shipped work and validation records.
2. `Devtool research chain`
   - Destination: GitHub link to `research/devtool-dx-journey.md` or research directory.
   - Explanation: shows skills producing serious research artifacts.
3. `Showcase spec`
   - Destination: `specs/skills-showcase-website.md`
   - Explanation: shows the specification process behind this site.
4. `UI spec`
   - Destination: this UI spec once committed.
   - Explanation: shows interface decisions before implementation.
5. `Validation scripts`
   - Destination: scripts directory or specific validation script links.
   - Explanation: shows reference/version/routing checks.
6. `Skill catalog source`
   - Destination: `global/` and `packs/` directories.
   - Explanation: shows skills are Markdown contracts, not hidden automation.

Tile anatomy:

- Small label.
- Title.
- One-sentence proof explanation.
- Link text: `Open receipt`.

### Follow / About

Route: `/follow/`.

Purpose: convert proven interest into distribution.

Layout:

- Large section heading: `Track the operating system behind the builds.`
- Short bio paragraph:
  - G builds open-source workflow systems for AI coding agents and uses them to operate LexCorp's build-in-public product portfolio.
- Three-lane funnel:
  1. `Explore the open-source library`
     - GitHub link.
  2. `Enter the LexCorp War Room`
     - LexCorp link.
  3. `Join the community`
     - Discord link.
- Social row:
  - YouTube
  - X/Twitter
  - GitHub
  - Discord

Newsletter/email capture:

- Compact form headline: `Get the next workflow drop.`
- Field label: `Email`
- Submit label: `Join the list`
- States: provider missing, pending, success, error, invalid email.
- Provider-missing state should not collect input; it should route users to YouTube, X/Twitter, and Discord instead.

## Component Inventory And Reuse Guidance

| Component | Used In | Notes |
| --- | --- | --- |
| `SiteHeader` | Global | Sticky desktop header, mobile drawer trigger |
| `MobileNavDrawer` | Global mobile | Focus-managed drawer with route/external links |
| `BlueprintPanel` | Hero, workflows | Bordered technical panel with grid/drafting lines |
| `CTAButton` | Hero, follow, cards | Primary, secondary, tertiary variants |
| `IconButton` | Animations, copy commands, drawer close | Must have `aria-label` |
| `WorkflowSelector` | Workflow Lab | Vertical desktop, horizontal/mobile variant |
| `WorkflowAnimation` | Workflow Lab | State-machine/terminal/timeline variants |
| `ProgressRail` | Workflow Lab | Labeled steps, current state |
| `PackMap` | Pack section | Layered diagram with selectable packs |
| `SegmentedControl` | Pack type, platform filters | Familiar control for mutually exclusive modes |
| `FilterChip` | Catalog filters | Multi-select state, removable |
| `SearchInput` | Catalog | Labeled input with clear button |
| `SkillRow` | Catalog | Expandable compact row |
| `Badge` | Catalog, workflows | Platform/type/status/version |
| `ReceiptTile` | Inspect section | Links to GitHub proof artifacts |
| `FollowCard` | Follow section | Three-lane funnel cards |
| `NewsletterForm` | Follow section | Static/provider-backed email capture with non-collecting fallback |

Avoid nested cards. Section backgrounds should be unframed bands or blueprint regions; cards are only for repeated items such as workflow choices, catalog rows, receipt tiles, and follow cards.

## Control Inventory

| Control | Label | Location | Action | Disabled Rules | Confirmation |
| --- | --- | --- | --- | --- | --- |
| Primary CTA | `Explore the Library` | Hero | Navigate to `/workflows/` | Never disabled | None |
| Secondary CTA | `Follow G's Work` | Hero | Navigate to `/follow/` or open follow popover | Never disabled | None |
| Header nav links | `Workflows`, `Packs`, `Catalog`, `Inspect` | Header | Navigate to static routes | Never disabled | None |
| External link | `LexCorp` | Header/footer/follow | Open LexCorp URL | Never disabled | None |
| Menu icon button | `Open navigation` | Mobile header | Opens drawer | Disabled only when drawer is already open | None |
| Drawer close icon | `Close navigation` | Mobile drawer | Closes drawer | Never disabled | None |
| Workflow selector item | Workflow title | Workflow Lab | Selects workflow | Never disabled | None |
| Animation previous | `Previous step` | Workflow panel | Moves one step back | Disabled on first step | None |
| Animation play/pause | `Play animation` / `Pause animation` | Workflow panel | Toggles autoplay | Disabled when reduced motion forces manual mode; show explanation | None |
| Animation next | `Next step` | Workflow panel | Moves one step forward | Disabled on final step | None |
| Animation restart | `Restart workflow` | Workflow panel | Resets to first step | Disabled on first step only if implementation prefers | None |
| Project type segmented control | `All`, `Business`, `Devtool`, `Game`, `Creator`, `Monorepo`, `Kanban` | Pack Map | Highlights pack group | Never disabled | None |
| Pack item | Pack name | Pack Map | Selects pack and updates detail panel | Disabled only if data missing | None |
| View skills | `View skills` | Pack detail panel | Navigates to catalog and applies pack filter | Disabled when pack has no catalog records | None |
| Copy install command | icon button | Pack detail panel | Copies command to clipboard | Disabled if Clipboard API unavailable; fallback selects text | None |
| Search input | `Search skills, packs, workflows` | Catalog | Filters results | Disabled when generated data missing | None |
| Clear search | `Clear search` | Catalog | Clears query | Visible only when query exists | None |
| Platform segmented control | `All`, `Claude`, `Codex` | Catalog | Filters results | Disabled when data missing | None |
| Pack/type filter chips | Pack/type labels | Catalog | Toggles filter | Disabled when data missing | None |
| Show asymmetries only | Checkbox label | Catalog | Filters to one-platform entries | Disabled when data missing | None |
| Clear filters | `Clear filters` | Catalog | Resets filters | Visible only when filters active | None |
| Expand row | `Show details for <skill>` | Catalog row | Expands row | Disabled when row has no extra details; normally never | None |
| Receipt link | `Open receipt` | Inspect tiles | Opens GitHub artifact | Never disabled; if URL missing, render as path label | None |
| Newsletter email | `Email` | Follow page | Captures email for configured provider only | Disabled when provider endpoint is missing | None |
| Newsletter submit | `Join the list` | Follow page | Submits provider-backed form | Disabled while pending, invalid, or provider missing | None |
| Funnel links | `Explore the open-source library`, `Enter the LexCorp War Room`, `Join the community` | Follow section | Open external destinations | Never disabled | None |

## Link Inventory

| Label | Destination | Type | Notes |
| --- | --- | --- | --- |
| GitHub / Repository | `https://github.com/GeorgeQLe/agentic-skills` | External | Primary open-source proof destination |
| LexCorp | `https://leexperimental.com` | External | Top-of-funnel for LexCorp |
| YouTube | `https://www.youtube.com/@georgele` | External | Personal distribution channel |
| X/Twitter | `https://x.com/gkingofboston` | External | Personal distribution channel |
| Discord | `https://discord.gg/TC6STUc5rT` | External | Single community CTA in V1 |
| Dogfood history | GitHub blob for `tasks/history.md` | External | Receipt tile |
| Devtool research | GitHub blob/tree for `research/devtool-*` | External | Receipt tile |
| Skills reference | GitHub blob for `docs/skills-reference.md` | External | Receipt tile or footer |
| Validation scripts | GitHub tree/blob under `scripts/` | External | Receipt tile |
| Catalog source path | GitHub blob for each `SKILL.md` | External | Generated per skill from `repoBaseUrl` |
| Static routes | `/workflows/`, `/packs/`, `/catalog/`, `/inspect/`, `/follow/` | Internal | Header/CTA navigation |

External links should use accessible names that include the destination concept, not just "here."

## Layout, Spacing, Sizing, And Responsive Rules

### Global Metrics

- Desktop content max width: approximately 1280px.
- Wide desktop may extend blueprint guide lines to the viewport while keeping content constrained.
- Section vertical padding:
  - Desktop: 80px to 112px.
  - Tablet: 64px to 80px.
  - Mobile: 48px to 64px.
- Grid gap:
  - Desktop: 24px.
  - Tablet: 20px.
  - Mobile: 16px.
- Cards/tiles border radius: 6px to 8px.
- Buttons:
  - Desktop height: 40px to 44px.
  - Mobile touch target: at least 44px.
- Catalog rows:
  - Collapsed desktop row min height: 64px.
  - Mobile row may stack badges below description.

### Breakpoints

- Mobile: below 768px, 4-column grid.
- Tablet: 768px-1199px, 8-column grid.
- Desktop: 1200px and above, 12-column grid.

### Desktop Rules

- Header remains sticky.
- Hero is split 5/7 columns.
- Workflow Lab is split 4/8 columns.
- Pack Map uses diagram + side detail panel.
- Catalog toolbar stays in one row when possible.
- Follow section uses three cards in one row.

### Tablet Rules

- Hero copy may span full width above blueprint animation.
- Workflow selector can remain side-by-side if space allows; otherwise move above animation.
- Catalog filters wrap into two rows.
- Receipt tiles use two columns.

### Mobile Rules

- One-column sections.
- Header uses drawer.
- Hero animation simplifies to a static completed workflow or stepper.
- Workflow selector becomes horizontal scroll list or stacked selector.
- Catalog filters collapse into a visible filter stack or drawer; avoid tiny dropdown-only controls.
- Pack Map becomes a vertical layered list rather than a dense diagram.
- Follow funnel cards stack.

No text may overlap blueprint lines, controls, or adjacent content at any breakpoint.

## Visual Style Direction And Asset Requirements

### Palette

Use a restrained technical palette:

- Neutral base: near-white or near-black depending final theme.
- Blueprint blue: primary accent for selected states and section lines.
- Green: completed/success workflow states.
- Amber: warning/stale/fallback states.
- Red: error/failure states.
- Muted gray: secondary metadata, grid lines, separators.

Avoid a one-note blue page. Blue should function as blueprint accent, not the only color family.

### Typography

- Primary sans-serif: precise grotesk/system sans.
- Monospace: commands, terminal playback, source paths, stats.
- H1 should be large but not oversized hero-marketing style.
- Catalog and workflow details should use compact, readable type.
- No negative letter spacing.
- No viewport-width font scaling.

### Iconography

Use familiar icons where a library is available during implementation; otherwise use accessible text/icon glyphs carefully:

- Play / pause
- Previous / next
- Restart
- Search
- Filter
- External link
- Copy
- Menu / close
- Expand / collapse

Icons must have visible labels or tooltips where meaning is not obvious and `aria-label` in all cases.

### Assets

No raster/video assets are required in V1.

All workflow illustrations should be built with HTML/CSS/JS: panels, lines, nodes, labels, and lightweight motion.

## Interaction States And Accessibility Requirements

### States

- Hover: subtle border/line color shift; do not shift layout.
- Focus: visible high-contrast outline at least 2px.
- Active/selected: blueprint-blue outline plus text/badge state, not color-only.
- Disabled: reduced opacity plus explanation where useful.
- Loading/initializing: show skeleton-like blueprint lines or text status only if data parsing is asynchronous.
- Missing data: red/amber warning panel with actionable text.
- No results: calm empty state with reset action.
- Success: green status and short text such as `Copied`.
- Warning: amber panel for stale/fallback.
- Error: red panel for data failure.

### Animation Accessibility

- Honor `prefers-reduced-motion`.
- Disable autoplay when reduced motion is on.
- Provide manual step controls for every animated workflow.
- Animation controls must be reachable by keyboard in logical order.
- Progress rail labels must be readable by screen readers.

### Screen Reader Requirements

- Header nav has `nav` landmark.
- Main content has `main` landmark.
- Each major section has a unique H2.
- Catalog result count is announced through an `aria-live="polite"` region if practical.
- Expandable rows use `aria-expanded`.
- Mobile drawer announces open/closed state and traps focus while open.

### Contrast

- Text contrast must meet WCAG AA.
- Blueprint lines are decorative and should be low contrast behind content or placed outside text regions.
- Do not rely on color alone for status.

## Implementation Notes

- Build with static HTML/CSS/JS under `docs/skills-showcase/`.
- Load `assets/skills-data.js` before `app.js`.
- Load `assets/github-proof-data.js` where available; proof UI must degrade to static links when public metric generation is unavailable.
- Store external links and `repoBaseUrl` in one config object.
- Generate GitHub blob links from repository-relative paths:
  - Base: `https://github.com/GeorgeQLe/agentic-skills/blob/master/`
  - Path: encoded generated source path.
- Avoid root dependency changes unless implementation later chooses a frontend framework.
- Use generated data defensively. If `window.SKILLS_SHOWCASE_DATA` is missing or malformed, show the missing-data panel and keep static brand/CTA sections usable.
- If Clipboard API is unavailable, copy controls should degrade gracefully or not render.
- Consider `localStorage` only for harmless UI preferences such as reduced motion override or last selected workflow; V1 does not require persistence.
- Add newsletter/email capture as a static/provider-backed form with provider-missing, pending, success, and error states.
- Do not add visitor-tracking analytics, auth, first-party API routes, or live LexCorp metrics.
- Do not create or modify GitHub Actions workflows.

## Open Questions

- Final production domain for the Vercel deployment is `gskillpacks.com`.
- Newsletter/email provider and endpoint for the launch form.
- Whether to route Discord through a durable LexCorp redirect later.
- Whether future V2 should add a separate LexCorp proof surface or keep LexCorp as a narrative/funnel destination.

## Risks

- If the generated catalog data drifts, the public catalog can misrepresent the source skill library.
- If curated workflows are not reviewed after behavior-changing skill edits, workflow animations may become stale even when metadata validation passes.
- If the blueprint motif becomes too decorative, it can reduce readability or make the site feel less credible.
- If the page over-optimizes for following before proof, conversion quality may drop. This is mitigated by making `Explore the Library` primary.
- If the Discord invite expires, the community CTA breaks. A durable redirect would mitigate this later.
- If the newsletter endpoint is not configured before launch, the form must clearly degrade to a non-collecting follow/community CTA.
- If GitHub public metrics cannot refresh because of rate limits or missing token, proof panels must show static receipts instead of stale-looking live claims.

## Explicit Non-Goals

- No database-backed UI.
- No video or Remotion.
- No auth, admin UI, custom newsletter backend, visitor-tracking analytics, or live LexCorp metrics.
- No hosted skill execution.
- No framework app router or runtime server; multi-page static routing is in scope.
- No GitHub Actions.
- No broad redesign of README or docs as part of the UI implementation.
