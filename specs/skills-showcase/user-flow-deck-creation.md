# User Flow Spec — gskillpacks.com Deck Creation

- **Status:** confirmed (approved 2026-06-10 via final compiled YAML — 12/12 gates answered, no section feedback)
- **Skill:** `/user-flow-map` v0.0 (product-design pack)
- **Product path:** `skills-showcase` (active in `research/.progress.yaml`)
- **Alignment page:** `alignment/user-flow-map-deck-creation.html` (confirmed)
- **Interview log:** `specs/skills-showcase/user-flow-deck-creation-interview.md`
- **Scope:** Flow structure only — screens, routes, actions, decisions, branches, states, failure paths, handoffs, and wireframe-level notes. No visual styling, no animation mechanics, no implementation plan.

## 1. Scope & Source Evidence

`/user-flow-map` was invoked to map the full deck-creation flow on gskillpacks.com — landing on the table through deck completion and CLI unlock, covering preset (canonical) decks, customization (swap/overlay), and custom decks — and to pressure-test whether phase-labeled slots mirroring the canonical card list make building feel like a chore versus user-defined phases. That second question was explicitly routed here by Amendment 2 of the animation design plan.

Scope resolved to the active product path `skills-showcase`. Research evidence: `research/skills-showcase/idea-brief.md`. **Gap:** customer discovery and positioning have not run yet (manifest `next_skill: /customer-discovery`), so persona assumptions come from the idea brief, not validated research. The flow map carries this as a standing risk (approved at the evidence gate: "Sufficient — proceed on idea-brief personas").

### Evidence behind load-bearing decisions

| Claim / decision | Evidence (observed) | Inference | Confidence |
|---|---|---|---|
| Entry is deck-first; site is one canvas with real URLs; add gesture is tap-to-add; slots are phase-labeled | `apps/skills-showcase/docs/deck-builder-ux.md` — four decisions marked "Decided with user 2026-06-10" | The flow map composes these locked decisions into a full flow rather than re-deciding them | High |
| Five preset decks: VARD, ORD, Business AFPS, Devtool AFPS, Game AFPS; graduation VARD→Business AFPS, ORD→Devtool AFPS | `docs/decks.md` domain × tempo grid and graduation paths | Preset deck inventory and graduation arrows are fixed inputs to the flow | High |
| Deck completion produces `npx skillpacks install-deck <slug>`; modified decks need an explicit pack list | `docs/skillpacks-npm-distribution.md` — CLI maps deck slug → pack list via manifest | System decision D3 (canonical-intact check) is structural, not cosmetic | High |
| The phase-slot chore concern came from demo review, with choice valves already in the locked UX | Animation plan Amendment 2 (`alignment/animation-design-planner-deck-builder-transitions.html`): demo's 1:1 card-to-slot mapping "reads as building a deck is a chore with no choices" | The pressure-test must answer chore-vs-structure for preset decks, not re-litigate animation | High |
| User direction for this flow: preset decks with default phases, modifiable as needed | Terminal interview answer, 2026-06-10 (recorded verbatim in §2) | Resolution in §3 keeps default phase slots on presets and concentrates user-defined phases in custom decks | High (user-stated) |
| No deck routes exist today; deck-builder is greenfield page structure | `apps/skills-showcase/app/` has `/`, `/workflows`, `/packs`, `/catalog`, `/benchmarks`, `/inspect`, `/follow`, `/prototype`; no `/deck/*` or `/card/*` | The flow map defines target structure, archiving old pages per the idea brief | High (repo-observed) |
| Generated site data contains zero deck definitions | `public/assets/skills-data.js` via `scripts/generate-skills-showcase-data.mjs` — no deck shapes | Deck data pipeline is a dependency for implementation; flagged in §11, out of flow-map scope | High (repo-observed) |
| Persistence is localStorage per deck slug; packs reseal per session; no accounts | `deck-builder-ux.md` state & persistence section | Resume, share, and failure paths must work without server state | High |

## 2. Flow Assumptions Checkpoint (confirmed)

Confirmed in the terminal interview on 2026-06-10 ("Confirmed as-is"). The slot-model direction was answered verbatim: *"we have preset decks which users can modify as needed with default phases."* Mobile branch notes were explicitly included.

| # | Assumption | Source |
|---|---|---|
| 1 | Primary persona: developer evaluating gSkillPacks who wants to assemble a workflow deck | [from research] |
| 2 | Secondary persona: existing user configuring a new repo fast | [from research] |
| 3 | First success = copyable `npx skillpacks install-deck …` or `project.json` download | [from artifact] |
| 4 | Primary entry: `/` table — 5 preset blueprints + pack shelf, deck-first | [from artifact — locked] |
| 5 | Hard-load entries: `/deck/[slug]`, `/card/[id]`, shared `/deck/custom?c=…` | [from artifact] |
| 6 | Returning visitor: localStorage restores deck progress; packs reseal per session | [from artifact] |
| 7 | Redirects: `/catalog`→`/`, `/packs`→`/` | [from artifact] |
| 8 | Happy path: table → blueprint morph → builder → ghost-slot tap → pack glow → tear → fan → tap-to-add / add-all → card flight → last core slot fills → stack-flip → CLI unlock → copy | [from artifact] |
| 9 | Preset decks ship with **default phases**; users modify as needed (swap/remove/overlay); modification produces a custom variant with explicit-pack-list CLI output | [user answer + artifact] |
| 10 | `[Custom deck +]` = from-scratch building; user-defined phases live here | [from artifact] |
| 11 | Overlay row (code-review, gitops, …) is additive and never blocks unlock | [from artifact] |
| 12 | Shelf-first browsing is inspect-only; "add to deck" prompts deck choice | [from artifact] |
| 13 | Graduation arrows: VARD→Business AFPS, ORD→Devtool AFPS | [from artifact] |
| 14 | User decisions: deck choice, accept vs swap, overlays, name, share. System decisions: one-liner vs explicit pack-list CLI; unlock gated on core slots only | [from artifact] |
| 15 | Designed states: fresh table, partial ("🔒 N more to unlock"), complete, custom-converted, in-flight (optimistic commit, snap-to-end), restored session | [from artifact] |
| 16 | Not yet designed (added in this flow map): data-load failure, corrupt share URL / localStorage, clipboard failure, empty custom deck | [inferred] |
| 17 | Handoffs: web→terminal (copy CLI), web→repo (project.json), share URL; no accounts or server state | [from artifact] |
| 18 | Animation mechanics locked — flow work only decides slot targets; styling & CLI internals out of scope | [from artifact] |
| 19 | Mobile: wireframe-level branch notes included | [user answer] |

## 3. Slot-Model Pressure-Test Resolution

**The question.** Do phase-labeled slots that mirror the canonical card list 1:1 make building a preset deck feel like a chore with no choices — and should phases instead be user-defined?

**Analysis.**

- **The chore risk is real but concentrated, not structural.** Slot-by-slot interaction cost per preset deck: VARD 3 taps, ORD 3, Devtool AFPS 8, Game AFPS 11, Business AFPS ~35. Transcription fatigue lives almost entirely in Business AFPS; the locked UX already mitigates it there with stacked pack-slots and per-fan add-all.
- **The genre distinction that matters: netdecking vs brewing.** Deck-builder games separate copying a known list (netdecking — players want one-click import) from composing your own (brewing — players want freedom). Preset decks are netdecks: nobody wants to place a known-good list card by card. The chore is not the phase structure — it is being forced through per-card placement when the user has already made their one real decision ("I want this deck"). The fix is speed, not loosened structure.
- **Why user-defined phases on preset decks would cost more than they give.** (a) The one-line `npx skillpacks install-deck <slug>` contract depends on the preset staying canonical; editable phase structure forces every deck onto the explicit-pack-list path. (b) "The deck IS the pipeline" is the product's teaching mechanism — phase columns read left-to-right as execution order; user-defined phases delete the lesson. (c) Graduation arrows (VARD→Business AFPS, ORD→Devtool AFPS) connect canonical structures; they have no meaning between freeform trays.

Interaction cost comparison:

| Preset deck | Slot-by-slot taps | With deck-level Collect-all |
|---|---|---|
| VARD | 3 | 1 |
| ORD | 3 | 1 |
| Devtool AFPS | 8 | 1 |
| Game AFPS | 11 | 1 |
| Business AFPS | ~35 | 1 |

**Resolution (encodes the user's direction; approved at the verdict gate: "Accept resolution as written").**

> **Preset decks keep default phase-labeled slots. Users modify as needed. User-defined phases live in custom decks.**

- **Keep:** phase-labeled slot columns mirroring each preset's canonical chain — the teaching artifact and the basis of the one-line CLI output.
- **Add — speed valve:** a deck-level **Collect-all** action ("Collect all N for this deck") that batches the whole preset in one decision. This is the netdeck import path and the primary chore killer. It extends the locked per-fan add-all across packs and needs a small animation-plan amendment (flight batching across sequential pack opens) — flagged in §11.
- **Add — choice valve:** `[Custom deck +]` is promoted to a first-class sixth tile on the table, not a buried affordance. Brewing is a peer entry point, with user-defined phases (add/rename/remove phase columns).
- **Keep (locked):** modification valves on presets — swap a suggested card or remove it, converting to a custom variant (editable name, explicit-pack-list CLI); freeform overlay row that never blocks unlock.

**Consequence for the locked animation contracts:** the card-flight *target* contract (slot identity/position) is unchanged — phase slots remain the targets. Only the new deck-level Collect-all needs animation-plan review; movement mechanics (optimistic commit, clone overlay, snap-to-end) are untouched.

## 4. Persona, Goal & Success Condition

| Persona | Goal | Success condition | Tempo |
|---|---|---|---|
| **Evaluator** — developer assessing gSkillPacks for adoption [provisional — ICP not yet run] | Understand what decks/packs/cards are and assemble a deck matching their workflow | Copies `npx skillpacks install-deck …` or downloads `project.json` for a deck they understand | Exploratory — inspects cards, reads phases, may browse shelf first |
| **Returner** — existing user configuring a new repo | Fastest path to the right pack list | Same artifact, minimal interactions (Collect-all or unmodified preset) | Direct — knows the deck they want; speed valves exist for them |

## 5. Entry Points & Preconditions

| ID | Entry | Trigger | Precondition | Lands on |
|---|---|---|---|---|
| E1 | `/` — the table | Organic, docs link, npm README, redirects | Skills data loads | S1 fresh (or restored) table |
| E2 | `/deck/[slug]` hard load | Shared preset link, docs deep link, refresh mid-build | Slug matches a preset deck | S2 builder open (no morph); invalid slug → F2 |
| E3 | `/deck/custom?c=…` | Shared custom/modified deck | Payload decodes to known card ids | S3 custom builder seeded from payload; corrupt → F3 |
| E4 | `/card/[id]` standalone | SEO, shared card link | Card id exists | S5 standalone card page with "Open on the table" CTA → S1 |
| E5 | Return visit | Any URL above | localStorage has per-deck progress | Same screen with restored slots; packs resealed |
| E6 | `/catalog`, `/packs` | Old bookmarks/links | — | Redirect to `/` (S1) |

## 6. Happy Path (preset deck, Evaluator)

| # | Step | Screen |
|---|---|---|
| 1 | Land on the table: 5 preset blueprints + `[Custom deck +]` tile, pack shelf below, graduation arrows between related blueprints | S1 `/` |
| 2 | Tap a blueprint → blueprint-morph into the builder (URL becomes `/deck/[slug]`) | S1 → S2 |
| 3 | Builder shows default phase columns with ghost-suggestion slots, empty overlay row, and the locked CLI panel ("🔒 N more to unlock") | S2 |
| 4 | Tap a ghost slot → the shelf pack containing that card glows | S2 |
| 5 | Tear the glowing pack open → fan drawer of its cards | S2 + S4 |
| 6 | Tap wanted card(s), or "Collect all N" — optimistic commit, card flight to phase slot, slot fills and pulses, counter ticks | S4 → S2 |
| 7 | Repeat 4–6 across packs, or use deck-level **Collect-all** to batch every remaining suggestion in one decision | S2/S4 |
| 8 | Last core slot fills (all flights landed) → slots gather into a stacked deck, stack flips to the output panel | S2 → S6 |
| 9 | Copy `npx skillpacks install-deck <slug>` (or download `project.json` / share / keep editing) → terminal handoff H1 | S6 |

### Screen/transition graph

| From | To | Transition |
|---|---|---|
| E1–E6 entries | S1 Table (or direct to S2/S3/S5 on hard loads) | land / redirect / restore |
| S1 Table | S2 Preset builder | tap blueprint (blueprint-morph, URL → /deck/[slug]) |
| S1 Table | S3 Custom builder | tap [Custom deck +] |
| S1 Table | S4 Pack fan | open pack shelf-first (inspect-only mode) |
| S4 Pack fan | S7 Deck picker | "add to deck" with no deck context |
| S7 Deck picker | S2/S3 builder | choose target deck; card commits |
| S2/S3 builder | S4 Pack fan | open pack; cards fly back to slots (card-flight) |
| S2 builder | S2 (custom variant) | swap/remove a suggestion → explicit-pack-list mode |
| S2/S3 builder | S6 Output panel | completion (preset: all core slots; custom: ≥1 card) |
| S6 Output panel | S2/S3 builder | keep editing |
| S6 Output panel | Terminal / repo / person | copy CLI (H1), project.json (H2), share URL (H3) |
| S2/S4/S5 | S5 Card detail | inspect card (modal in flow, standalone via /card/[id]) |
| S2/S3 builder | S1 Table | dismiss (morph back); progress kept in localStorage |

## 7. Alternate Paths & Branches

| ID | Branch | Diverges at | Behavior | Rejoins |
|---|---|---|---|---|
| B1 | **Deck-level Collect-all** (new in this flow map) | S2, any time core slots remain | One action batches every remaining suggested card: packs open in sequence, flights are staggered batches. Returner fast path; the netdeck import. | Happy path step 8 |
| B2 | Modify a preset (swap / remove) | S2, any filled or ghost slot | Replacing a suggestion or removing a card converts the deck to a **custom variant**: name becomes editable ("VARD — modified" default), CLI output switches to explicit pack list. Removal returns a slot to its ghost; unlock state recomputes. | Happy path step 8 (gate now evaluates current slots) |
| B3 | Overlay additions | S2/S3 overlay row | Any card may be added to the freeform overlay row (e.g. code-review, gitops). Never blocks unlock; emits extra `install <pack>` lines in the output. | No divergence from gate logic |
| B4 | Custom deck from scratch | S1 `[Custom deck +]` tile | Empty builder at `/deck/custom` with **user-defined phases**: starts with one unnamed phase column; add/rename/remove phases; freeform slots accept any card. Unlock gate: ≥1 card. | S6 with explicit-pack-list output and encoded share URL |
| B5 | Shelf-first browsing | S1 pack shelf | Packs open in **inspect-only mode** (no deck context). Cards show "add to deck" which opens the deck picker (S7); choosing a deck navigates to its builder with the card committed. | S2/S3 mid-build |
| B6 | Card inspection | S4 (flip), S2 slots (flip), anywhere via `/card/[id]` | Flip shows stats/benchmark back. Standalone page (E4) is the SEO surface with a "Open on the table" CTA. | Where the user left off |
| B7 | Dismiss & resume | S2/S3, any time | Dismiss morphs back to the table; progress persists per deck slug in localStorage. Blueprints on S1 show progress badges ("2/3"). Packs reseal each session. | Re-entry at step 3 with restored slots |
| B8 | Graduation | S1 arrows; S6 hint after completing VARD/ORD | Faint arrows VARD→Business AFPS and ORD→Devtool AFPS; tapping routes to the target preset's builder. | Step 2 for the graduated deck |
| B9 | Keep editing after completion | S6 | Stack unflips to the builder; swaps/overlays continue (may convert to custom variant per B2). Re-completion re-runs the gather without ceremony loss. | Step 8 |
| B10 | Share | S6 | Unmodified preset → canonical URL `/deck/[slug]`. Modified/custom → `/deck/custom?c=…` URL-encoded card list + name. | Recipient enters at E2/E3 |

## 8. Decision-Point Table

| ID | Type | Where | Decision | Branch rule |
|---|---|---|---|---|
| D1 | User | S1 | Preset blueprint vs `[Custom deck +]` vs browse shelf | → S2 / S3 / B5 |
| D2 | User | S2 slot | Accept suggestion, swap, or leave empty | Swap/remove → B2 custom variant |
| D3 | System | S2→S6 | **Canonical-intact check:** do filled slots exactly match the preset list? | Yes → one-line `install-deck <slug>`; no → explicit pack list |
| D4 | System | S2/S3 | Unlock gate | Preset: all core slots filled (overlay ignored). Custom: ≥1 card |
| D5 | User | S2/S3 | Add overlay cards? | B3; never affects D4 |
| D6 | User | S6 | Copy CLI vs download project.json vs share vs keep editing | H1 / H2 / B10 / B9 |
| D7 | System | S6 share | Share URL form | Canonical slug if D3 passed; else encoded `?c=` payload |
| D8 | User | S7 | Which deck receives a shelf-first add? | Existing in-progress deck, fresh preset, or new custom |
| D9 | System | E2/E3/E5 | Input validity (slug, `?c=` payload, localStorage schema, card ids vs current data) | Invalid → F2/F3/F4/F7 recovery |
| D10 | User | S1/S6 | Follow a graduation arrow? | B8 |

## 9. Screen/Route Inventory

| ID | Screen | Route | Purpose | Inputs | Outputs / destinations | Evidence |
|---|---|---|---|---|---|---|
| S1 | Table | `/` | Orient; choose a deck or browse packs | skills data, localStorage progress | S2, S3, S4 (inspect-only), S5 | deck-builder-ux.md (deck-first, canvas) |
| S2 | Preset builder | `/deck/[slug]` — intercepting overlay over the table + real route for hard loads | Fill default phase slots; modify; reach unlock | preset definition, progress, shelf | S4, S5, S6, back to S1 | deck-builder-ux.md (phase slots, ghosts, CLI lock) |
| S3 | Custom builder | `/deck/custom` (+ `?c=` seed) | From-scratch deck; user-defined phases | optional share payload, shelf | S4, S5, S6, back to S1 | deck-builder-ux.md ([Custom deck +]); §3 resolution |
| S4 | Pack fan drawer | client state (no route) | Open a pack; inspect/collect cards | pack contents, deck context (or none) | card flights to S2/S3; S7 when context-free; S5 flip | prototype flow (SealedPack/PackOpener/BottomSheet) |
| S5 | Card detail | modal in-flow; standalone `/card/[id]` | Inspect a skill: stats, benchmark evidence, command | card id | "add to deck" → S7/S2/S3; standalone CTA → S1 | deck-builder-ux.md (card pages, SEO) |
| S6 | Output panel | state within S2/S3 (deck back) | Deliver the artifact: CLI, project.json, share | completed deck composition, D3 result | H1/H2/H3; B9 back to builder | deck-builder-ux.md (completion, CLI unlock) |
| S7 | Deck picker | modal (no route) | Route a shelf-first add to a deck | card being added, deck list + progress | S2/S3 with card committed; cancel → S4 | deck-builder-ux.md (shelf browsable, add prompts deck selection) |

Kept outside this flow's scope: `/follow` and `/admin/newsletter` (unchanged), legacy showcase pages (archived once the deck-builder ships, per the idea brief). `/catalog` and `/packs` become redirects (E6).

## 10. Per-Screen Action/State Matrix

| Screen | Actions | Navigation | Disabled / blocked rules | Validation | States |
|---|---|---|---|---|---|
| **S1 Table** | Tap blueprint; tap `[Custom deck +]`; open pack (inspect-only); tap graduation arrow; tap card progress badge | → S2/S3/S4/S5 | Blueprint taps ignored while a morph is in progress (animation contract); shelf packs never "tear" accidentally on scroll | — | loading (data fetch), fresh, restored (progress badges), data-error (F1), reduced-motion |
| **S2 Preset builder** | Tap ghost (glow source pack); tap filled slot (flip → inspect/remove); swap suggestion; deck-level Collect-all; open pack; add overlay card; rename (only after custom-variant conversion); copy CLI; share; download; dismiss | → S4, S5, S6, S1 | CLI copy disabled in locked state — button visible from first paint with "🔒 N more to unlock"; rename disabled while canonical; remove only from flipped slot back | Slot accepts only its suggested card unless swapping (B2); overlay accepts any card not already in the deck | empty, partial, in-flight, complete, custom-variant, restored, stale-data (F7), reduced-motion |
| **S3 Custom builder** | Name deck; add/rename/remove phase column; add any card to any slot; overlay adds; copy CLI; share (encoded); download; dismiss | → S4, S5, S6, S1 | CLI locked until ≥1 card (D4); phase removal with cards inside asks before discarding (destructive) | Duplicate cards rejected with notice; phase names length-capped | empty (helper text), partial, complete, seeded-from-share, corrupt-payload recovery (F3) |
| **S4 Pack fan** | Flip card; tap-to-add (deck context); per-fan "Collect all N"; "add to deck" (no context → S7); drag-dismiss | → S2/S3 (flights), S5, S7 | Re-tap of in-flight/collected card is a no-op; collected cards dimmed with "in deck ♦" badge; close mid-flight snaps flights to end (locked contract) | — | fanned, partially-collected, all-collected ("all in deck"), inspect-only, closing |
| **S5 Card detail** | Flip; "add to deck" / "in deck ♦"; copy command; (standalone) "Open on the table" | → S7 or back; standalone → S1 | "add to deck" hidden when card already in the active deck | Unknown card id on hard load → F2-style fallback | front, back (stats/benchmarks), standalone, in-deck |
| **S6 Output panel** | Copy CLI; download project.json; share; keep editing | → S2/S3 (B9) or exit | Appears only after D4 passes and all flights have landed (locked contract) | Clipboard failure → F5 fallback | canonical output (one-liner), custom output (pack list + overlay lines), copied-confirmation, copy-failed |
| **S7 Deck picker** | Choose deck; create new custom; cancel | → S2/S3 or back to S4 | Decks already containing the card shown as "already in deck" (not selectable) | — | list (with progress per deck), empty-progress (all fresh) |

## 11. State Coverage

| State class | Where it appears | Status |
|---|---|---|
| Empty | S1 fresh table; S2 all-ghost builder; S3 empty custom deck with helper text ("add a card to unlock the CLI"); S7 all-fresh deck list | S3 helper newly designed; rest locked |
| Loading | S1 initial data load (single skeleton pass — data is one static JS asset) | Newly designed |
| Error | F1 data-load failure (retry panel); F2 bad slug; F3 corrupt payload; F5 clipboard denied | Newly designed |
| Partial | S2/S3 some-slots-filled with locked CLI counter ("🔒 N more to unlock"); S1 blueprint progress badges | Locked (deck-builder-ux.md) |
| Success | S6 unlocked output; copied-confirmation; per-slot fill pulse | Locked |
| Permission-denied | Only clipboard (F5) — site has no accounts or gated data | Newly designed |
| Offline | Static site: after first load everything except the initial fetch works offline; copy/download/share unaffected. Initial-load-offline is browser-default, explicitly out of scope | Scoped note |
| Validation | S3 duplicate-card rejection, phase-name cap; S2 slot accepts only suggestion unless swapping; D9 input validity | Newly designed |
| Edge — in-flight | Optimistic commit at tap; interruption snaps flights to end; completion defers until all flights land | Locked (animation contract) |
| Edge — restored | E5 localStorage restore; packs resealed; stale card ids pruned (F7) | Pruning newly designed |
| Edge — reduced motion | State parity required: every flow state reachable with flights/morphs replaced by fades (mechanics owned by animation plan) | Parity requirement stated here |

## 12. Failure & Recovery Paths

| ID | Failure | Recovery |
|---|---|---|
| F1 | Skills data fails to load (S1 or any hard load) | Error panel with retry; no interactive surfaces rendered half-broken. Table never renders from stale partial data |
| F2 | Invalid deck slug at `/deck/[slug]`, or unknown card id at `/card/[id]` | Redirect to `/` with a "deck/card not found" toast; no dead-end 404 inside the experience |
| F3 | Corrupt or unparseable `?c=` share payload | `/deck/custom` opens fresh and empty with a "couldn't read the shared deck" toast; salvageable known card ids are kept when partially parseable |
| F4 | Corrupt or schema-mismatched localStorage | Versioned schema key; mismatch discards progress silently for that deck and starts fresh — never blocks entry |
| F5 | Clipboard API denied/unavailable on copy | Command text auto-selects with a "press Ctrl+C / ⌘C" hint; download and share unaffected |
| F6 | Interruption mid-flight (drawer close, builder dismiss, route change) | All flights snap to end; optimistic commits are kept — no rollback (locked animation contract) |
| F7 | Restored progress references a card id no longer in the catalog (data updated between sessions) | Stale ids pruned at load; affected slots revert to ghosts; one notice ("1 card is no longer available"); unlock recomputes |
| F8 | Custom deck completion attempted with zero cards | CLI stays locked (D4); helper text names the unlock condition instead of a dead button |
| F9 | Offline after first load | Everything except the initial data fetch works; initial-load-offline is browser default (out of scope) |
| F10 | Contradictory choice: swapping in a card already in the overlay row | Card moves from overlay to the phase slot (no duplicates); reverse direction (slot→overlay) via remove-then-add |

## 13. Handoffs & External/Manual Dependencies

| ID | Handoff | Mechanism | Failure surface |
|---|---|---|---|
| H1 | Web → terminal | Copy `npx skillpacks install-deck <slug>` (or explicit `install <packs>` list) | F5 clipboard; CLI-side errors are the CLI's scope, not the showcase's |
| H2 | Web → repo | Download `project.json` mirroring `.agents/project.json` (`enabled_packs` + deck metadata) | Browser download permission (browser-default) |
| H3 | Person → person | Share URL: canonical slug (D3 pass) or encoded `?c=` payload | F3 corrupt payload on the receiving side |
| H4 | Docs/npm → showcase | Inbound links to `/`, `/deck/[slug]`, `/card/[id]` | F2 invalid targets |
| H5 | System dependency | Custom/modified decks must emit explicit pack lists — the CLI deck manifest only maps canonical slugs | Drift between showcase deck definitions and CLI manifest; flagged in §14 (shared data source needed) |

## 14. Low-Fidelity Wireframe Notes

Structural regions only — no styling, spacing, or visual design. Those belong to `/ui-interview` and later stages.

### S1 Table (`/`)

```
┌─ brand strip ──────────────────────────────────────────────┐
│                                                            │
│  BLUEPRINT ROW (primary)                                   │
│  [VARD 2/3] [ORD] [Biz AFPS] [Devtool AFPS] [Game AFPS]    │
│      └────traction──→ [Biz AFPS]   (faint arrows)          │
│  [ + Custom deck ]   ← first-class sixth tile (§3)         │
│                                                            │
│  PACK SHELF (secondary, below the fold acceptable)         │
│  ( 7 sealed boosters, horizontal scroll )                  │
└────────────────────────────────────────────────────────────┘
```

- Blueprints carry progress badges from localStorage; the badge is the resume affordance (B7).
- Shelf packs open inspect-only from here (B5); no deck context implied.

### S2 Preset builder (`/deck/[slug]`)

```
┌─ deck name (editable only as custom variant)      [✕] ─────┐
│  PHASE COLUMNS, left→right = execution order               │
│  ┌ Scan ─┐  ┌ Align ─┐  ┌ Ship ─┐                          │
│  │ ghost │  │ FILLED │  │ ghost │   ← ghost = suggestion   │
│  └───────┘  └────────┘  └───────┘     outline + /command   │
│  Business AFPS: column = stacked pack-slot w/ counter      │
│  ─ overlay row (freeform, any card) ───────────────────    │
│  [ Collect all N ]                ← deck-level (B1)        │
│  CLI PANEL (persistent): 🔒 2 more to unlock │ [copy]      │
│  ─ condensed shelf strip (packs reachable in-context) ──   │
└────────────────────────────────────────────────────────────┘
```

- CLI panel visible from first paint in locked state — the destination is never a surprise.
- Tapping a ghost glows the source pack in the condensed shelf strip; the fan opens over the builder with slots still visible (flight targets).

### S3 Custom builder (`/deck/custom`)

```
┌─ [name your deck…]                                [✕] ─────┐
│  ┌ Phase 1 (rename) ─┐  [+ add phase]                      │
│  │ empty freeform    │   phases: add / rename / remove     │
│  │ slots (any card)  │   (remove asks if cards inside)     │
│  └───────────────────┘                                     │
│  ─ overlay row ─────────────────────────────────────────   │
│  CLI PANEL: 🔒 add a card to unlock │ explicit pack list    │
└────────────────────────────────────────────────────────────┘
```

### S4 Pack fan drawer

```
╔═ bottom sheet (drag-dismiss) ══════════════════════════════╗
║  pack name · fan of cards (flip = inspect, tap = collect)  ║
║  [card] [card] [card] [card]      [ Collect all 4 ]        ║
║  inspect-only mode: tap → card detail, "add to deck" → S7  ║
╚════════════════════════════════════════════════════════════╝
```

### S5 Card detail / S6 Output / S7 Deck picker

```
S5: [ card art/front | stats back: type, benchmark grade,    S6 (deck back):
      version, /command, pack ]                               npx skillpacks install-deck vard   [copy]
    [add to deck]  (standalone: [Open on the table])          + install code-review (overlay)
                                                              [⬇ project.json] [share] [keep editing]
S7: "Add /benchmark-card to…"  ▸ VARD (2/3)  ▸ ORD  ▸ + new custom deck   [cancel]
```

### Mobile branch notes (wireframe level)

- **Slot strip pinned above the BottomSheet:** when the fan is open on mobile, the active deck's slots condense to a pinned horizontal strip so flight targets stay visible (carries the locked animation constraint into layout structure).
- **Tap-everything:** all collection and navigation is tap-based; the tear gesture gets a tap-to-open equivalent (already in SealedPack). No interaction is drag-only.
- **Phase columns become vertically stacked phase rows** on narrow screens; left→right order becomes top→bottom; Business AFPS pack-stacks stay collapsed by default.
- **Output panel becomes a full-width sheet;** the command line wraps with a copy button adjacent, not trailing off-screen.

## 15. Open Questions, Risks & Non-Goals

| Item | Detail | Owner / where it resolves |
|---|---|---|
| Collect-all motion mechanics | Does deck-level Collect-all open packs sequentially (spectacle) or fly cards directly from the shelf (speed)? Either way it is a new trigger for the card-flight batching contract. | Small amendment to the animation design plan (named follow-up after this approval) |
| Swap gesture detail | How does a user swap a filled slot's card — tap-while-occupied prompt from the fan, or a slot context action? Flow defines that swap exists and converts to custom variant (B2); the interaction detail is per-screen content design. | `/ui-interview --requirements-only deck-creation` |
| Custom phase editing depth | Proposed: add/rename/remove only; defer drag-reorder of phases out of v1. | Confirm in `/ui-interview` |
| Next 16.2.6 intercepting routes | Client-state-first with shallow pushState is the routing decision; the spike is the top implementation risk (carried from the animation plan, not re-decided here). | First implementation task |
| Persona validation | Evaluator/Returner personas come from the idea brief; customer discovery and positioning have not run. Approved as a recorded risk ("Sufficient — proceed on idea-brief personas"). | `/customer-discovery` -> positioning (business-discovery pack, installed) |
| Deck data pipeline | `skills-data.js` has zero deck definitions; deck shapes must be added to `generate-skills-showcase-data.mjs` output and shared with the CLI manifest (H5 drift risk). | Implementation planning |

### Explicit non-goals

- No visual styling, color, component design, or design tokens (downstream: `/ui-interview`, `/ux-variations --layout-mode`).
- No animation mechanics — motion contracts stay owned by the approved animation plan; this flow only fixed slot *targets* and added the Collect-all trigger to be amended there.
- No accounts, trading/progression systems, or server-side state.
- No CLI behavior changes; `install-deck` semantics are an input, not an output.
- No production architecture, database schemas, or implementation plans.
- No mobile-specific spec beyond the wireframe branch notes in §14.

## 16. Downstream Handoff

Recommended next command: `/ui-interview --requirements-only deck-creation` (per the approved post-approval route gate; requires `/pack install ui-interview` first — the `product-design` pack is not installed, only `user-flow-map` and `brainstorm` are individually enabled). Do not route directly to `/ux-variations`; per-screen content requirements come first.
