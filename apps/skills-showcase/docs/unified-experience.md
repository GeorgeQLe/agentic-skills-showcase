# Unified Experience Design — Skills-Showcase as One TCG Journey

**Status:** Decided with user (2026-06-19)
**Supersedes:** `deck-builder-ux.md` (the deck-first design). That doc's locked "Entry flow = Deck-first" decision is formally reversed here in favor of **pack-opening-first**; the rest of its mechanics (phase slots, tap-to-add flight, completion output) survive and are folded into this spec.
**Upstream brief:** `alignment/idea-scope-brief-skills-showcase.html` (amended confirmed, five-deck model)
**Animation contract:** `docs/animation-plan-deck-builder.md` §A–§G
**Scope:** one authoritative spec for the full pack-opening → deck-building journey, plus the architecture reconciliation that makes it a single experience. Visual styling stays in the established dark prototype theme.

---

## Why this doc exists

The user asked to treat **pack-opening + deck-building as one cohesive experience** — a single flow covering every screen, action, animation, and UI element. Exploration revealed it doesn't feel like one experience because it currently *isn't* one. There are two disjoint, URL-only systems with three structural seams:

1. **Two pack-opening engines.** The `PackFlowPhase` state machine is copy-pasted verbatim into `app/prototype/page.tsx` (`PrototypeInner`) and `src/deck-builder/DeckTableShell.tsx` (`BuilderPackFlow`). Shared primitives, forked orchestration.
2. **Two deck models.** The running app has 7 invented `SETS` (Market Intel, Growth Engine…) with abstract `LAB-01..07` phases and **round-robin** slot assignment. The real product (`docs/decks.md` + the validated skillpacks manifest) is 5 canonical decks (VARD, ORD, Business/Devtool/Game AFPS) with **named workflow chains**. The builder never renders the real decks.
3. **No front door, no bridge.** Neither `/prototype` nor `/deck` is linked anywhere; the "Table" lives at `/prototype/deck-routing-spike`; `/card/[id]` doesn't exist; legacy `/catalog`, `/packs`, `/workflows`, `/benchmarks`, `/inspect` are orphaned marketing pages.

This spec defines the unified journey and the seam reconciliation. **This effort produces the design doc first**; build phases are scoped at the end.

---

## Locked decisions

These were resolved interactively with the user; revisit only with a new user decision.

| Decision | Choice | Notes |
| --- | --- | --- |
| **Taxonomy** | Card = skill · **Pack** (booster) = related skills · **Set** (expansion) = a domain's packs + starter decks · **Deck** = an ordered card sequence | Starter decks are canonical (AFPS/ORD/VARD); Custom decks are user-built |
| **Front door** | **Pack-opening-first.** `/` is a CTA landing, not the deck blueprint grid | Formally supersedes the "deck-first" decision in `deck-builder-ux.md` |
| **Pack handout** | A pre-CTA **domain picker** (default AFPS); the CTA hands you that domain's boosters | |
| **Carry-in** | Opened cards become **suggestions** (light the wanted slots); slots fill only via tap-to-add | The deliberate collect ritual is preserved — opening commits nothing |
| **Set model** | The **3 manifest-validated domains** — `business` (VARD + Business AFPS), `devtool` (ORD + Devtool AFPS), `game` (Game AFPS) | No new authoring; grows later |

### Design principles (carried forward, re-pointed)

1. **The deck is the pipeline.** Phase columns read left-to-right as the order you run the skills.
2. **Browsing always converges on output.** The visible goal is always an unlocked `npx skillpacks install-deck` command. No dead-end states.
3. **Promote, don't rewrite.** Every motion maps to an existing primitive (`SealedPack` tear, `PackOpener` fan, collapse-to-target, `BottomSheet`, `SkillCard` flip). New motion is composition. The **only new transition** is Landing→packs deal-in, composed from `PackOpener`'s fan-in entrance.
4. **Dual branding everywhere a term appears.** Card-game voice leads; technical term follows in parenthetical/tooltip (Deck/Set/Pack/Card/Tear-open ↔ workflow/expansion/pack/skill/install).

---

## Taxonomy → data carriers

| Term | Meaning | Source of truth |
| --- | --- | --- |
| **Card** | one skill (180×252 `SkillCard`, 3D flip to stats back, A/B/C grade) | `parseSkill()` in `scripts/catalog/index.mjs` — no change |
| **Pack** | related skills (a `packs/<pack>` dir) | `listPacks()` — no change |
| **Set** | a domain's packs + starter decks | **derived** from `deck.domain` in the manifest |
| **Deck** | ordered phase→card workflow (Starter / Custom) | **manifest `deckDefinitions`** + new `phases:` field |

**Key reuse:** the canonical decks already exist and are validated — `packages/skillpacks/dist/skillpacks-manifest.json` (built by `packages/skillpacks/scripts/build-skillpacks-manifest.mjs` from `deckDefinitions`, lines 39–90). It carries `name/title/domain/tempo/default_packs/full_packs/package_list` per deck and already corrects the `business-discovery`→`business-research` pack drift. We **extend** the manifest; we do not re-author decks in app TS.

The five canonical decks and their domains (from the manifest):

| Deck (slug) | Title | Domain | Tempo | full_packs |
| --- | --- | --- | --- | --- |
| `vard` | VARD | business | rapid | vard |
| `ord` | ORD | devtool | rapid | ord |
| `business-afps` | Business AFPS | business | deliberate | business-research, customer-lifecycle, business-growth, business-ops |
| `devtool-afps` | Devtool AFPS | devtool | deliberate | devtool |
| `game-afps` | Game AFPS | game | deliberate | game |

Grouped into **Sets** by `domain`: **business** = {VARD, Business AFPS}, **devtool** = {ORD, Devtool AFPS}, **game** = {Game AFPS}.

---

## The journey — every screen · state · action · animation · element

```
[/ Landing+CTA] --deal-in--> [Pack Receipt] --tear--> [Pack Opening fan] --inspect/flip-->
      |                                                       | (repeat per pack in the domain allotment)
      |                                                       v
      |                                              [Hand-off chooser]
      |                                         build custom  /  \  load starter (AFPS/ORD/VARD)
      |                                                        \  /
      |                                                  [Builder /deck/[slug]]  --> [Completion + output]
      +--direct link--> [/card/[id] standalone SEO]      +--direct link--> [/deck/[slug] hard-load]
```

### 1. Landing `/` (replaces marketing `app/page.tsx`)

- **Elements:** dark front door; dual-branded promise ("Open a pack. Build your workflow deck."); a **domain picker row** (business / devtool / game tiles, default AFPS-in-business); primary **CTA** "Open your starter packs" (sub-label: pack/skill counts for the picked domain); footer links kept.
- **States:** loading (`useSkillsData()` pending) · idle · domain hover (tile glow, CTA sub-label updates) · CTA pressed → Pack Receipt.
- **Animation (new):** CTA press **deals N sealed packs** onto the table using `PackOpener`'s fan-in entrance values (`opacity 0, scale 0.8, rotateZ`, staggered spring) applied to whole packs. N = the picked domain's pack allotment. Reduced motion: 120 ms crossfade, no stagger.
- **Mobile:** swipeable domain chips; sticky full-width CTA; packs deal into a vertical stack.

### 2. Pack Receipt (transient table state, not a route)

- **Elements:** the dealt `SealedPack`s (foil shimmer, tear arrow); "Tear along the line to open" hint; "Pack 1 of N" counter.
- **States:** all sealed · first-tear onboarding (first pack carries `autoOpenOnTear`) · one-opened-others-sealed (`SealedPack` `isOpened` branch).
- **Actions:** drag-tear past `THRESHOLD=120`, or tap (`handlePackClick` → card-0 rise → `proceedToOpen`).
- **Animation:** pure `SealedPack` — flap clip + curl + card rise → `onOpeningApex` → `onOpen`.

### 3. Pack Opening — the fan (the wonder moment)

- **Elements:** `BottomSheet` (portaled, scrim, drag-to-dismiss) → `PackOpener` fan of `SkillCard`s.
- **States:** the `PackFlowPhase` machine verbatim — `sealed → opening-apex → drawer-open` → inspect → `closing-collapse → closing-apex → sheet-exiting → card-settling`.
- **Actions:** tap card → 3D flip to stats back (**pre-deck mode: tap = flip**, no slot to fly to); expand affordance → `/card/[id]` modal; dismiss (scrim/drag, legal only in `drawer-open`); next pack advances the allotment counter.
- **Sequence:** each pack = one full `PackFlowPhase` cycle; after the last pack of the domain allotment closes, the **Hand-off chooser** surfaces. Opened-pack state is session-only (reseal on reload).
- **Mobile:** `BottomSheet` native; fan wraps to rows.

### 4. Hand-off chooser (the pivot: pack-opening → deck)

- **Elements:** two large choices — **"Build a deck"** (custom) and **"Load the {domain} Starter"** (the canonical deck whose packs you just opened) — plus a strip of other starter blueprints (the `deck-blueprint-${slug}` morph sources).
- **Carry-in (locked):** opening commits nothing. Entering the builder, the opened cards become the **wanted/suggested** set; the builder's `wantedIds` lights exactly those ghost slots. You still tear the deck-pack inside the builder and tap-to-add. "What carries in" is knowledge of which packs you hold, not pre-filled slots.
- **Starter prefill:** builder mounts with phase-slot **ghosts** labeled by the canonical chain, each showing the suggested card's name + `/command` at low opacity; slots empty. The starter gives you the order, labels, and wanted rims — not free cards.
- **Animation:** blueprint → builder `layoutId="deck-blueprint-${slug}"` morph (§A); URL → `/deck/[slug]` via `pushState`. Reduced motion: 120 ms crossfade, `layoutId` omitted.

### 5. Builder `/deck/[slug]` (today's `BuilderPanel`, now reached after pack-opening)

- **Elements (built):** header (`{settledCount}/{N} collected`, Back) · phase-slot columns (`data-phase-slot`, ghost/filled, `data-pulse`) · overlay row (`.deck-overlay-row` teal chips) · `BuilderPackFlow` (deck-as-pack `SealedPack` → `BottomSheet` → `PackOpener`, the flight source) · `BuilderCliPanel` (always-visible locked/unlocked `install-deck`) · two `FlightLayer` portals (card-flight + completion gather).
- **Actions:** tap fan card → `flyCard` (optimistic commit + dim + badge that frame; clone flies to its **real phase slot**; slot fills + pulses + counter ticks **on land**); `Collect all N` → `flyAll` (70 ms stagger); wanted rims teach next card; Back → `closeDeck` (flush in-flight, morph back).
- **Phase columns come from the deck's canonical chain** (not a generic template; see "Phase model" below).
- **Needs (gaps the build closes):** real phase→card mapping (kills round-robin); info-vs-collect tap split so inspect never collects; overlay `install <pack>` lines for overlays.
- **Reduced motion:** no clone — slot fades filled, no pulse (implemented). **Mobile:** horizontal slot strip, sticky phase labels, strip pinned above the sheet (`sheetCovered` scroll-into-view).

### 6. Card detail `/card/[id]` (NEW — SEO surface for ~190 unique cards)

- **Reached from:** fan expand → intercepting modal over context · filled slot expand → modal · **direct link/crawler** → standalone page.
- **Elements:** enlarged card, full back-face stats (description, platform, scope, version, tags, benchmark grade + per-agent pass rates) + "part of deck(s): …" chips → builders.
- **Animation:** `SkillCard` flip at larger scale; modal = `@modal` parallel-route overlay. Reduced motion: instant. Mobile: full-screen, swipe-down dismiss.

### 7. Completion + output (built — `DeckCompletionPanel`)

- **Trigger:** all `deck.skills` settled. **Sequence:** per-slot **gather** (`FlightClone` → `[data-completion-target]`) → on last land, **flip** (`rotateY`, scaled-up `SkillCard` idiom) → output back face.
- **Output:** `npx skillpacks install-deck <slug>` (copy) · ⬇ project.json (`buildDeckProjectJson` → `.agents/project.json` shape) · Share (`/deck/<slug>`) · Keep editing.
- **Starter vs custom:** starter → one-line `install-deck`; custom/modified → explicit `install <pack>` list + overlay lines + `?c=` share encoding (**deferred** today).

### 8. Persistence / return

- localStorage `deck:<slug>:collected` (+ custom name/phases). Opened packs reseal on reload. `/deck/[slug]` hard-load enters `builder-open`; Back still morphs (table underneath). Custom deck shareable via compact `?c=` param, no backend.

---

## Phase model (the canonical chains)

Phase columns come from each deck's canonical chain, authored once in the manifest (`phases:`), not a generic template:

- **VARD / ORD (rapid):** three slots — Scan → Align → Ship (`vard-scan`/`vard-align`/`vard-ship`, `ord-scan`/`ord-align`/`ord-ship`). 1:1 chain→card.
- **Devtool AFPS:** Position → Adopt → Journey → Docs → Monetize, holding the 8 `devtool` skills.
- **Game AFPS:** Align (audience, fantasy, genre-map, comparables) → Validate (core-loop, prototype-test, playtest-metrics) → Launch (store-page-test, launch, roadmap) + `game-workflow`.
- **Business AFPS:** four phase columns that ARE the pack chain — Discover (business-research, 7) → Lifecycle (customer-lifecycle, 7) → Grow (business-growth, 8) → Operate (business-ops, 13). At this size each column shows a stacked pack-slot with a card counter rather than 13 individual ghosts; expanding a column fans its ghosts. "Collect all N for this deck" preserves the ritual without 13 taps.

The chain prose in `docs/decks.md` stays the human doc; the manifest `phases` is machine truth.

---

## Architecture reconciliation

### Routing (recommended: hybrid)

- **`/` = the Table-as-landing:** CTA landing + domain picker is the front; the deck blueprint chooser becomes the **post-pack hand-off** surface (§4), not the `/` grid. Delete `app/prototype/deck-routing-spike/`.
- **`/deck/[slug]`: keep the `pushState` morph.** Its one-shell-mounted guarantee is CI-locked (`e2e/deck-table-shell.spec.ts` asserts a stable `deck-mount-id`). Next intercepting routes render the overlay in a **parallel slot** — a different subtree — which breaks the shared-`layoutId` morph reconciler. Don't migrate what works; `noindex` (interactive, not content).
- **`/card/[id]`: born as intercepting + standalone.** `app/card/[id]/page.tsx` (standalone, indexed) + `app/@modal/(.)card/[id]/page.tsx` (overlay) + `app/@modal/default.tsx` (null). This is the one place intercepting routes enter.

| Route | Renders | Notes |
| --- | --- | --- |
| `/` | Landing + domain picker + Pack Receipt + Pack Opening + Hand-off | Pack-first front door; the only content page |
| `/deck/[slug]` | Builder overlay via `pushState` morph; standalone over table on hard load | `noindex`; slugs: `vard`, `ord`, `business-afps`, `devtool-afps`, `game-afps`, `custom-…` |
| `/card/[id]` | Standalone (indexed) + `@modal` intercept overlay | SEO surface; ~190 mirrorKey-deduped cards |
| `/follow`, `/admin/newsletter`, `/api/trpc/*` | Kept as-is | Newsletter backend + TRPC unaffected |
| `/catalog`, `/packs`, `/workflows`, `/benchmarks`, `/inspect` | 308 → `/` | Content folds into Table, card backs, `/card/[id]` |

### Engine unification — extract `PackRitual`

New `src/components/PackRitual.tsx` owns the `PackFlowPhase` machine + the `SealedPack`+`BottomSheet`+`PackOpener` composition both forks duplicate. Props: `packId/packName/skills/previewSkill`, optional `onCollect/onCollectAll/collected/wantedIds` (absent → standalone inspect mode), `contentState`, `bridgeKey` (builder keeps `__deckPack`). `PrototypeInner` becomes a thin per-set consumer; `BuilderPackFlow` becomes a thin builder consumer. **Pure refactor, zero behavior change** — the existing green suite (`DeckTableShell.test.tsx`, `prototype-close-sequence.test.tsx`, e2e) is the proof gate; only imports/selectors change.

### Data model + generator

1. Add `phases:` to each `deckDefinitions` entry in `build-skillpacks-manifest.mjs` (`{ key, name, cards:[skillName…] }`); `validateManifest` asserts each card resolves to a skill in `full_packs`. Rapid decks (vard/ord) = 1:1 chain→card; AFPS decks = named macro-phases per the Phase model above.
2. `generate-skills-showcase-data.mjs` reads the manifest **from the git index**, emits `decks[]` (with `phases[].suggestedCardIds` resolved to deduped card ids) and `sets[]` (grouped on `deck.domain`), replacing `workflows: []`. Add the manifest path to `sourcePaths` for fingerprinting.
3. `src/deck-builder/decks.ts`: delete `SETS`/`SetDef`/`getSetSkills`/round-robin; `buildDecks` maps `data.decks` and attaches resolved `Skill` objects to `phase.suggestedCardIds`. `getDeckBySlug` signature unchanged. Extend `SkillsData` in `useSkillsData.ts` with `decks`/`sets`.
4. `/card/[id]` `generateStaticParams` enumerates the mirrorKey-deduped ~190 cards.

### Legacy migration + shell

- `/catalog`, `/packs`, `/workflows`, `/benchmarks`, `/inspect` → **308 redirect to `/`** (their content folds into the Table, card backs, and `/card/[id]`). Retire their `page.tsx` + `src/showcase/{catalog,workflows,benchmarks}.tsx` + tests in the same commits.
- **Keep untouched:** `/follow`, `/admin/newsletter`, `/api/trpc/*`, `TRPCProvider`.
- Rebuild `src/showcase/routes.ts` + `ShowcaseHeader.tsx` + `MobilePanel` around the game (brand → `/`, Cards → `/card` browse, Follow, LexCorp). Grep every `href` to removed routes first.
- **Tailwind to root:** move `@import "tailwindcss"` into `app/globals.css`; collapse the duplicated `deck.css`/`prototype.css` keyframes into one shared sheet. **Highest-regression step** — verify `/follow` + `/admin/newsletter` render unchanged under Tailwind preflight; land isolated.

---

## State and persistence

- **No accounts, no server inventory.** Deck progress persists in `localStorage` keyed by deck slug: collected card ids, overlay ids, custom-deck names/phases. Opened-pack state stays session-only — packs reseal on reload, keeping the tear ritual repeatable and the inventory honest (you compose a config, you don't own cards).
- **Share deck** encodes contents into a compact URL param (`/deck/custom?c=…`) so a customized deck is shareable without a backend. Canonical decks share by slug alone. (`?c=` encoding deferred.)

---

## Dual branding application

UI labels lead with game terms — "Tear open" (install), "Collect" (add), "Deck" (workflow), "Set" (expansion), "Booster" (pack) — each with the technical term in a parenthetical on first use per view and in tooltips everywhere. Ghost slots always show the real `/command` in mono so a developer can map any card to its skill without leaving the builder.

---

## Out of scope / open for later phases

- **Custom-deck output** — explicit pack-list emission, overlay `install <pack>` lines, `?c=` share encoding.
- **shadcn registry browser tie-in** — still an open unknown from the brief; nothing here blocks either answer.
- **Onboarding** — assumed unnecessary; revisit if testing shows the metaphor needs a hint layer.
- **Rarity/foil tiers** — benchmark grade (A/B/C) remains the only scarcity signal; no artificial rarity.

---

## Critical files

- `packages/skillpacks/scripts/build-skillpacks-manifest.mjs` — add `phases:` to `deckDefinitions` (canonical authoring + validation home).
- `apps/skills-showcase/scripts/generate-skills-showcase-data.mjs` — consume manifest, emit `decks[]`/`sets[]` (git-index rule).
- `apps/skills-showcase/src/deck-builder/decks.ts` — delete invented `SETS`/round-robin; real phase→card.
- `apps/skills-showcase/src/deck-builder/DeckTableShell.tsx` — consume `Phase[]`; custom-deck output; info-vs-collect split.
- `apps/skills-showcase/src/components/PackRitual.tsx` (new) — shared pack-flow engine.
- `apps/skills-showcase/app/page.tsx` — replace marketing with pack-first landing + domain picker + CTA.
- `apps/skills-showcase/app/card/[id]/page.tsx` + `app/@modal/(.)card/[id]/page.tsx` + `app/@modal/default.tsx` (new) — SEO card detail.
- `apps/skills-showcase/src/showcase/{routes.ts,ShowcaseHeader.tsx}` + `app/globals.css` — nav + Tailwind-to-root.

---

## Build phasing (after this doc is approved + written)

1. **Engine extraction (`PackRitual`)** — pure refactor; existing suite stays green. Lowest risk, do first. _Shipped (2026-06-19):_ `src/components/PackRitual.tsx` exports `usePackFlow()` (the `PackFlowPhase` machine + derived sheet flags + 800 ms settle fallback, debug marks via a stable `dbgRef`) and `<PackFlowSheet>` (the `BottomSheet`→`PackOpener` composition). `PrototypeInner` and `BuilderPackFlow` both shrink to thin consumers, each keeping only its own topology (N-pack shelf + debug harness vs single deck-as-pack + `__deckPack` bridge + card-flight wiring). Zero behavior change — Vitest 171/171 and Playwright 18/18 (morph double-vision, slot-before-land, stable `deck-mount-id`, pack-ritual tear) all green.
2. **Data model** — manifest `phases:` → generator `decks[]`/`sets[]` → `decks.ts` rewrite + test fixtures (rename `market-intel`→`vard`). Kills round-robin.
3. **`/card/[id]`** — intercepting + standalone pair + `@modal/default.tsx`. Additive.
4. **Promote Table to `/`** + new landing/CTA/domain-picker + Pack Receipt + Hand-off chooser; delete the routing spike. Structural pivot — land alone.
5. **Tailwind-to-root + CSS unify** — isolated; verify newsletter pages.
6. **Legacy archive + nav rebuild** — redirects + delete folded routes/tests + rebuild header.
7. **Deferred polish** — custom-deck output + overlay install lines; reduced-motion branches for `SealedPack`/`PackOpener` fan stagger.

## Verification

- **Per phase:** `npm test` (Vitest) + `npm run e2e` (Playwright) stay green; the morph/flight per-frame samplers (`doubleVision===0`, `slotBeforeLand===0`, stable `deck-mount-id`) must hold.
- **Data:** `npm run build:check` validates the committed `skills-data.js` against the git index; `validateManifest` asserts every phase card is a real skill.
- **Manual (`/run` or dev server):** walk the full journey — land `/` → pick domain → CTA → tear N packs → inspect/flip → hand-off → load AFPS starter → collect to completion → copy `install-deck` → open a `/card/[id]` direct link (standalone renders) → Back (morphs to table). Confirm `/catalog`,`/packs` 308 → `/`, and `/follow` + `/admin/newsletter` unchanged.
- **Shared-tree hygiene:** one atomic commit per phase, push to master promptly; stage source before any `generate:data`.
