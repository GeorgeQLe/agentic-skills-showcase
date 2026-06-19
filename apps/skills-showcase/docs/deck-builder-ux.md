# Deck-Builder Experience Design

**Status:** Decided with user (2026-06-10)
**Upstream brief:** `alignment/idea-scope-brief-skills-showcase.html` (amended confirmed, five-deck model)
**Scope:** UX design for the gskillpacks.com deck-builder rebuild. Implementation phasing at the end. Visual styling stays in the established dark prototype theme (`app/prototype/prototype.css`).

## Locked design decisions

These four forks were resolved interactively with the user; revisit only with a new user decision.

| Decision | Choice | Rejected alternatives |
| --- | --- | --- |
| Entry flow | **Deck-first** — land on the five canonical deck blueprints; picking one highlights the packs that contain its cards | Pack-first shelf; hybrid hero choice |
| Site structure | **Canvas + real URLs** — one persistent game table, with deck and card views as Next.js intercepting routes rendered as overlays | Pure client-state canvas; traditional page-per-route |
| Add gesture | **Tap-to-add + fly animation** — tapping a card in the fan flies it into its deck slot, reusing the PackOpener collapse-to-target motion | Drag-and-drop to slots; prefill-and-customize |
| Slot model | **Phase-labeled slots** — slots grouped by workflow phase with ghost outlines of suggested cards; the deck teaches the pipeline as you build | Freeform tray; core + flex split |

## Design principles

1. **The deck is the pipeline.** Every layout choice should reinforce that a deck is an ordered workflow, not a pile of cards. Phase columns read left-to-right as the order you run the skills.
2. **Browsing always converges on output.** Whatever the user does, the visible goal is an unlocked `npx skillpacks install-deck` command. No dead-end browsing states.
3. **Promote, don't rewrite.** Every animation in this design maps to an existing `/prototype` primitive (SealedPack tear, fan-out, collapse-to-target, BottomSheet, card flip). New motion is composition, not new primitives — consistent with the brief's non-goal.
4. **Dual branding everywhere a term appears.** Card-game voice leads; technical term follows in parenthetical or tooltip, per the brief's branding map (Deck/Archetype/Pack/Card/Tear-open ↔ workflow/tempo class/pack/skill/install).

## Experience walkthrough

### 1. The Table (`/`)

The landing page is a single dark game table with two zones:

```text
┌─ GSKILLPACKS ────────────────── Build your workflow deck ─┐
│                                                            │
│  DECKS (pick a blueprint)                                  │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐                  │
│  │ VARD    │ │ ORD     │ │ Game AFPS    │                  │
│  │ Viral+RD│ │ OSS+RD  │ │ Game+AFPS    │                  │
│  │ ▸ 3 cards│ │ ▸ 3 cards│ │ ▸ 11 cards  │                  │
│  └─────────┘ └─────────┘ └──────────────┘                  │
│  ┌──────────────┐ ┌──────────────┐  [Custom deck +]        │
│  │ Business AFPS│ │ Devtool AFPS │                          │
│  │ ▸ 35 cards   │ │ ▸ 8 cards    │                          │
│  └──────────────┘ └──────────────┘                          │
│                                                            │
│  THE SHELF (boosters / packs)                              │
│  ▓vard▓ ▓ord▓ ▓business-discovery▓ ▓devtool▓ ▓game▓ …     │
│  grouped by set, horizontally scrollable                   │
└────────────────────────────────────────────────────────────┘
```

- **Deck blueprints** are oversized card-backs, one per canonical deck, showing name, archetype badge (RD amber / AFPS indigo), domain icon, card count, and a one-line promise ("idea to shipped in days" / "deliberate pipeline over weeks").
- Hovering/focusing a blueprint **glows the shelf packs** that feed it (e.g. Devtool AFPS glows the `devtool` booster; Business AFPS glows `business-discovery`, `customer-lifecycle`, `business-growth`, `business-ops`).
- The two RD decks visually point at their graduation targets with a faint arrow ("VARD ──traction──▸ Business AFPS"), surfacing the graduation path from `docs/decks.md` as table furniture, not prose.
- The shelf is browsable on its own — tearing a pack from the table (without a deck selected) opens the fan in inspect-only mode; every card's back carries an "add to deck" affordance that, when no deck is active, prompts deck selection. Deck-first is the *default path*, not a wall.
- `[Custom deck +]` creates an unnamed deck with empty freeform phases (see Custom decks below).

### 2. The Builder (`/deck/[slug]`)

Tapping a blueprint expands it (shared `layoutId` morph) into the builder overlay. The table stays mounted underneath; the URL becomes shareable.

```text
URL: gskillpacks.com/deck/devtool-afps
┌─ Devtool AFPS ──── deliberate · developer ── 1/8 collected ─┐
│                                                              │
│  ┌ Position ──┬ Adopt ─────┬ Journey ───┬ Docs ──┬ Monetize ┐│
│  │ ┌──┐ ┌╌╌┐  │ ┌╌╌┐       │ ┌╌╌┐ ┌╌╌┐  │ ┌╌╌┐   │ ┌╌╌┐     ││
│  │ │♦ │ ┊ ?┊  │ ┊ ?┊       │ ┊ ?┊ ┊ ?┊  │ ┊ ?┊   │ ┊ ?┊     ││
│  │ └──┘ └╌╌┘  │ └╌╌┘       │ └╌╌┘ └╌╌┘  │ └╌╌┘   │ └╌╌┘     ││
│  └────────────┴────────────┴────────────┴────────┴──────────┘│
│   ghost slot = suggested card (tap → its pack glows below)   │
│                                                              │
│  OVERLAYS (optional)  ┌╌╌┐ ┌╌╌┐ ┌╌╌┐  e.g. code-review, gitops│
│                                                              │
│  ▓devtool▓ ← glowing   ░code-review░ ░gitops░ …              │
│                                                              │
│  [ npx skillpacks install-deck devtool-afps ]  🔒 fill core   │
└──────────────────────────────────────────────────────────────┘
```

- **Phase columns come from the deck's canonical chain**, not a generic template:
  - **VARD / ORD (rapid):** three slots — Scan → Align → Ship (`vard-scan`/`vard-align`/`vard-ship`, `ord-scan`/`ord-align`/`ord-ship`).
  - **Devtool AFPS:** Position → Adopt → Journey → Docs → Monetize, holding the 8 `devtool` skills.
  - **Game AFPS:** Align (audience, fantasy, genre-map, comparables) → Validate (core-loop, prototype-test, playtest-metrics) → Launch (store-page-test, launch, roadmap) + `game-workflow`.
  - **Business AFPS:** four phase columns that ARE the pack chain — Discover (business-discovery, 7) → Lifecycle (customer-lifecycle, 7) → Grow (business-growth, 8) → Operate (business-ops, 13). At this size, each column shows a stacked pack-slot with a card counter rather than 13 individual ghosts; expanding a column fans its ghosts.
- **Ghost slots** show the suggested card's name, `/command` (mono, technical parenthetical), and type color at low opacity. Tapping a ghost glows the shelf pack that contains it and scrolls it into view.
- **Add-all for big phases:** when a fan is open and the active deck wants ≥4 cards from that pack, the drawer header shows "Collect all N for this deck" — cards fly to their slots in a stagger. Preserves the ritual without 13 taps for `business-ops`.
- **Overlay row:** a freeform optional row below the phases accepting any card (overlay packs like `code-review`, `gitops`, `monorepo` from the pack hierarchy). Overlays never block the CLI unlock; they append extra `install <pack>` lines to the output.
- **Swapping:** a filled slot can be tapped to flip/inspect, with a "remove" on the back. Phase slots accept only their suggested card by default; replacing a suggestion with an arbitrary card converts the deck to a custom variant (name becomes editable, CLI output switches to explicit pack list).

### 3. Opening a pack (inside the builder)

Unchanged from the proven `/prototype` flow: tap or drag-tear the glowing `SealedPack` → card 0 rises to apex → morphs into the `BottomSheet` drawer → remaining cards fan out with staggered springs. Two additions:

- Cards already collected into the active deck render in the fan with a dimmed "in deck ♦" corner badge.
- Cards the active deck *wants* get a subtle slot-colored rim so the eye finds them in a big fan.

### 4. Tap-to-add card flight

Tapping an uncollected card in the fan flies it from the fan to its slot using the existing collapse-to-target motion (shared `layoutId`, spring, slight scale-down to slot size). The slot pulses once on receipt and the deck counter ticks. Tapping a card's **info icon** (or second-tap on a collected card) flips it to the stats back instead — flip and fly are distinct affordances so inspection never accidentally collects.

### 5. Card detail (`/card/[id]`)

Every card has a real URL. From the fan or a filled slot, "expand" opens the card as an intercepted-route modal: enlarged card with full back-face stats (description, platform, scope, version, tags, benchmark grade with per-agent pass rates) plus "part of deck(s): …" chips linking to builders. On direct load (shared link, search engine), the same route renders as a standalone page over the table — this replaces the old `/catalog` detail role and is the SEO surface for the generated inventory: 373 platform entries de-duplicated into 190 unique mirrored skill cards.

### 6. Deck completion and output

When the last core slot fills, the deck **completes**: slots briefly gather into a stacked deck (collapse-to-target again), the stack flips (card-flip primitive, scaled up), and its back is the output panel:

```text
┌──────────── DECK COMPLETE ── Devtool AFPS ───────────┐
│  ▓▓ deck stack ▓▓                                     │
│                                                       │
│  npx skillpacks install-deck devtool-afps     [copy]  │
│  + npx skillpacks install code-review   (overlay)     │
│                                                       │
│  [⬇ project.json]      [share deck]   [keep editing]  │
└───────────────────────────────────────────────────────┘
```

- Canonical, unmodified decks emit the one-line `install-deck` command. Customized decks emit the explicit pack/skill list. Overlays append install lines.
- `project.json` download mirrors the `.agents/project.json` shape (`enabled_packs` + deck metadata) per `docs/skillpacks-npm-distribution.md`.
- The CLI button is visible from the first moment in locked state ("🔒 2 more to unlock") so the destination is never a surprise.

## Route map

| Route | Renders | Notes |
| --- | --- | --- |
| `/` | The Table (blueprints + shelf) | Only full page; everything else overlays it |
| `/deck/[slug]` | Builder overlay (intercepting route); standalone over table on hard load | Slugs: `vard`, `ord`, `business-afps`, `devtool-afps`, `game-afps`, `custom-…` |
| `/card/[id]` | Card detail modal (intercepting); standalone page on hard load | SEO surface per skill; id = skill id |
| `/follow`, `/admin/newsletter` | Kept as-is | Newsletter backend unaffected |
| Old informational routes | Archived per brief | Redirect `/catalog` → `/`, `/packs` → `/` |

Pack opening is client state inside the active view, not a route — a torn pack is a transient gesture, not a shareable location.

## State and persistence

- **No accounts, no server inventory** (brief non-goal). Deck progress persists in `localStorage` keyed by deck slug: collected card ids, overlay ids, custom-deck names. Opened-pack state stays session-only — packs reseal on reload, which keeps the tear ritual repeatable and the inventory honest (you're not "owning" cards, you're composing a config).
- **Share deck** encodes the deck contents into a compact URL param (`/deck/custom?c=…`) so a customized deck is shareable without a backend. Canonical decks share by slug alone.

## Mobile adaptations

- Blueprints become a swipeable card row; the shelf stacks below.
- Phase columns become a horizontally scrollable slot strip with the phase labels as sticky headers; the active phase snaps.
- Tear-to-open keeps tap-to-open as the primary affordance (already supported by `SealedPack`); drag-tear remains a delight for those who find it.
- Tap-to-add was chosen specifically because it is gesture-identical on mobile; no drag fallback layer needed.
- The fan drawer is already a `BottomSheet`; on mobile the slot strip stays pinned above it so the flight target is visible during card flight.

## Animation contract (mapping to existing primitives)

| Moment | Primitive reused | New composition |
| --- | --- | --- |
| Blueprint → builder | shared `layoutId` morph (pack→sheet pattern) | blueprint is the morph source |
| Pack tear → fan | SealedPack + PackOpener state machine, unchanged | glow rim on wanted cards |
| Card → slot flight | collapse-to-target from PackOpener close | target is slot, not stack |
| Slot receipt | — | single pulse, counter tick |
| Inspect | SkillCard 3D flip / intercepted modal | enlarged variant |
| Deck completion | collapse-to-target + card flip, scaled up | stack-then-flip into output panel |

The debug harness (`src/components/debug/`) extends to the new transitions; hidden in production as today.

## Dual branding application

Per the brief's map, scoped to the showcase only: UI labels lead with game terms — "Tear open" (install), "Collect" (add), "Deck" (workflow), "Booster" (pack) — each with the technical term in a parenthetical on first use per view and in tooltips everywhere. Ghost slots always show the real `/command` in mono so a developer can map any card to its skill without leaving the builder.

## Out of scope / open for later phases

- **Data pipeline reshaping** — `generate-skills-showcase-data.mjs` needs deck definitions (chains, phase groupings, slot suggestions) added to its output; shape TBD at implementation.
- **shadcn registry browser tie-in** — still an open unknown from the brief; nothing in this design blocks either answer.
- **Onboarding** — assumed unnecessary per brief; revisit if testing shows the metaphor needs a hint layer.
- **Rarity/foil tiers** — benchmark grade (A/B/C) remains the only scarcity signal; no artificial rarity (non-goal).

## Implementation phasing (suggested)

1. **Table + builder skeleton** — routes, blueprints, phase-slot layout from deck data, static (no pack opening yet). _(done)_
2. **Promote pack opening** — wire `/prototype` primitives into the builder context, wanted-card rims, in-deck badges.
   - _Thin first cut shipped (2026-06-19):_ `BuilderPackFlow` composes `SealedPack` (deck-as-pack) → `BottomSheet` → `PackOpener` inside the builder; the torn-pack fan is the card-flight source feeding `flyCard`/`flyAll`; in-deck badges + dim on collected fan cards. Required: scoped Tailwind for `/deck` (`app/deck/{layout.tsx,deck.css}`), body-portaled `BottomSheet`, shared-morph disabled in-builder, non-uniform flight clone scale, slot scroll-above-sheet, collect-all moved into the fan.
   - _Wanted-card rims shipped (2026-06-19):_ `BuilderPanel` computes `wantedIds` (for each still-empty phase column, the first uncollected card mapping to it; tracks `settledIds` + `collected`) and passes it through `BuilderPackFlow` → `PackOpener`. The fan card glows a teal rim (`.deck-fan-card.is-wanted`, gated on `!isCollected`) so the open fan teaches which card to grab next per phase; the rim clears the frame a card is tapped and the next card in that column lights only once a slot fills. `/prototype` unaffected (prop defaults undefined). Covered by `DeckTableShell.test.tsx` + `e2e/deck-table-shell.spec.ts`.
   - _Deferred to follow-on:_ overlay row, custom-deck freeform phases, multi-`SealedPack`-per-deck grouping, refactoring `/prototype` to consume `BuilderPackFlow`.
3. **Collect loop** — tap-to-add flight, add-all, overlay row, localStorage persistence, locked/unlocked CLI panel.
   - _Tap-to-add flight, add-all, localStorage persistence shipped (2026-06-19)_ in the Phase-2 thin cut (see Phase 2 above).
   - _In-deck overlay row shipped (2026-06-19):_ `BuilderPanel` renders a persistent, always-visible `.deck-overlay-row` (new staggered content wrapper `custom={2}`, between the slot columns and the pack flow; pack flow bumped to `custom={3}`) showing the settled cards as compact teal chips — the at-a-glance "here's your deck so far" readout, visible whether or not the pack fan is torn open. Driven off `settledIds` (slot truth, not the optimistic commit) via `settledSkills` in stable deck order; reuses `pulsingIds` for a one-shot land pulse shared with the slot cards. Empty state until the first card settles. Additive; `/prototype` unaffected. Covered by `DeckTableShell.test.tsx` + `e2e/deck-table-shell.spec.ts`.
   - _Locked/unlocked CLI panel shipped (2026-06-19):_ `BuilderPanel` renders a persistent, always-visible `.deck-cli-panel` (new staggered content wrapper `custom={4}`, below the pack flow) via the new `BuilderCliPanel` component — the install-command destination that is visible from the first frame so the output is never a surprise (§2 "🔒 fill core", §6, design principle "browsing always converges on output"). Locked/unlocked is derived purely from `settledCount` vs the deck card requirement (all `deck.skills` settled = unlocked; a core/overlay split can refine it later) — no new collection state. Locked shows the dimmed command + a "🔒 N more to unlock" hint; unlocked reveals the command + a best-effort `navigator.clipboard` copy button with a transient "Copied ✓" state. Command text is `npx skillpacks install-deck <slug>`. Additive; `/prototype` unaffected. Covered by `DeckTableShell.test.tsx` + `e2e/deck-table-shell.spec.ts`. **Phase 3 visible items complete.**
4. **Completion + output** — deck-complete sequence, CLI/`project.json`/share emission, custom-deck variant rules.
5. **Card detail routes + redirects + archive** of old informational pages.
