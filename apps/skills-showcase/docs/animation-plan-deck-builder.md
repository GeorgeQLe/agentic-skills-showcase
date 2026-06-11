# Animation Design Plan - Deck-Builder `blueprint-morph` + `card-flight` Transitions

**Status:** Approved canonical plan (2026-06-11)
**Approval source:** `alignment/animation-design-planner-deck-builder-transitions.html`
**Upstream UX:** `apps/skills-showcase/docs/deck-builder-ux.md` (commit `6e2e6aec`)
**Implementation route:** `$exec` deck-builder implementation, spike first

This plan is the approved implementation contract for the deck-builder transition work. It was produced by
`$animation-design-planner`, reviewed through the alignment page above, and approved with `section_feedback: []`.

## Approval Record

```yaml
alignment_page: alignment/animation-design-planner-deck-builder-transitions.html
approval_status: ready-for-agent-review
gate_answers:
  - section: "Motion Contract A — blueprint-morph"
    gate_type: "motion-contract"
    status: answered
    answer: "Accept as specified"
  - section: "Motion Contract B — card-flight"
    gate_type: "motion-contract"
    status: answered
    answer: "Accept as specified"
  - section: "Lifecycle Ownership Map"
    gate_type: "lifecycle-ownership"
    status: answered
    answer: "Approve — shell ownership + pushState routing, spike first"
  - section: "Lifecycle Ownership Map"
    gate_type: "interruption-semantics"
    status: answered
    answer: "Approve both"
  - section: "Implementation Guardrails"
    gate_type: "scope/non-goals"
    status: answered
    answer: "Confirmed — retrofit stays out of scope"
  - section: "Proof Gate"
    gate_type: "proof-tooling"
    status: answered
    answer: "Confirmed — add Playwright at implementation time"
  - section: "Artifact Destination & Proposed File Changes"
    gate_type: "artifact destination"
    status: answered
    answer: "Approve destination"
    target_path: "apps/skills-showcase/docs/animation-plan-deck-builder.md"
  - section: "Artifact Destination & Proposed File Changes"
    gate_type: "proposed file changes"
    status: answered
    answer: "Approve scope and timing as listed"
  - section: "Post-Approval Route"
    gate_type: "post-approval route"
    status: answered
    answer: "Hand off to /exec for deck-builder implementation (spike first)"
section_feedback: []
```

## Context

The deck-builder UX design introduces two new framer-motion transitions that do not exist in the current `/prototype`
flow:

- **blueprint-morph** - deck blueprint card on the table to/from the builder overlay at `/deck/[slug]`.
- **card-flight** - fan card flies into a deck slot on tap, plus an add-all stagger variant.

This plan names the visible motion contracts, lifecycle owner, state phases, and proof method before implementation.
Framework detected: framer-motion 12.40 (`"framer-motion"`), so motion-framer guardrails apply.

## A. Visible Motion Contract - `blueprint-morph`

- **Trigger:** tap/click a deck blueprint on the table (`/`); close via Back button or dismiss affordance.
- **Start to end:** small blueprint card on the table to full builder panel (`/deck/[slug]`) with phase slots; reverse on
  close. URL changes both ways.
- **Focal / continuity element:** the blueprint card chrome is the single visually continuous rectangle:
  `layoutId="deck-blueprint-${slug}"`. Builder content (slot columns, header, shelf glow) staggers in after the morph
  lands.
- **Never:** double-vision; flash at morph-back; builder content popping before morph completion; table scroll jump;
  focus loss; URL/visual desync.
- **Interruptions:** blueprint taps are ignored unless `DeckFlowPhase` is `table`; dismiss is legal from `builder-open`
  and during `blueprint-morphing` only if it retargets the layout morph from its current projected position.
- **Hard load:** `/deck/[slug]` skips open morph because there is no origin, but close still morphs back because the
  table renders underneath.

## B. Visible Motion Contract - `card-flight`

- **Trigger:** tap an uncollected card in the open fan drawer; "Collect all N" triggers the staggered batch variant.
- **Start to end:** card visually leaves the fan, flies above the sheet to its phase slot, slot fills and pulses once,
  deck counter ticks; the fan card is dimmed with an `in deck` badge from the tap frame onward.
- **Focal element:** the flying clone; the slot is the continuity target and stays pinned visible above the sheet on
  mobile.
- **Never:** double-vision; clone clipped by sheet overflow or painted under scrim/slot strip; slot filling before the
  clone lands except in reduced motion; counter desync after interruptions; accidental collect from inspect tap.
- **Interruptions:** re-tap of an in-flight or collected card is a no-op; concurrent flights of different cards are
  allowed; drawer close or builder dismiss mid-flight snaps all flights to end before proceeding; deck-complete sequence
  defers until all flights land.

### Amendment 2 - Demo Scope And Slot Model

The alignment page's directional demo used five cards mapped one-to-one onto five mirrored phase slots. That demo binds
the card movement mechanics only; it is not the deck model. The locked UX specifies ghost slots as suggestions, swap
behavior that converts a preset to a custom variant, an overlay row that accepts any card, custom decks with freeform
phases, and add-all to avoid high-tap-count chores on large decks. If future deck-creation design changes slot identity
or position, re-review the `card-flight` target before implementation; optimistic commit, clone overlay, and snap-to-end
mechanics remain unaffected.

## C. Lifecycle Ownership Map

The existing `PackFlowPhase` machine stays nested unchanged:

```text
DeckTableShell (client; rendered by both app/page.tsx and app/deck/[slug]/page.tsx)
├── owns DeckFlowPhase: table -> blueprint-morphing -> builder-open -> builder-dismissing -> table
├── owns activeDeck + collectedCardIds (localStorage-backed, per slug)
├── one <LayoutGroup> wrapping table + builder
├── TableSurface (always mounted)
├── BuilderPanel (AnimatePresence; mounted while activeDeck != null)
│   └── BuilderPackFlow - PackFlowPhase owner extracted from PrototypeInner
│       (sealed -> opening-apex -> drawer-open -> closing-* chain, verbatim)
│       └── owns flights Map<cardId, FlightRecord> (parallel records, not a scalar phase:
│           queued -> measuring -> in-flight -> settling -> done per record)
└── FlightLayer (fixed inset-0, pointer-events-none, z-[70]) - flight clones
```

### Routing Decision

The morph is client-state-first. The URL syncs via shallow `window.history.pushState` plus a `popstate` listener because
App Router route-change unmounts are not AnimatePresence-aware; route-first close can unmount the builder before the
blueprint reclaims its `layoutId`. `/deck/[slug]` must exist as a real route for hard loads and SEO, rendering the same
shell with `initialDeckSlug`.

**Implementation must spike this first:** confirm shallow `pushState` + `usePathname` + `popstate` behavior on Next
16.2.6 before building the full transition layer. If shallow pushState fights the App Router, redesign routing before
motion implementation.

### Identity Rules

- Fan cards keyed by `skill.id`, never filtered or reordered on collect.
- Flight clones keyed `flight-${skill.id}`, max one per card.
- Slots keyed `${deckSlug}:${slotId}`.
- Exactly one mounted owner of `deck-blueprint-${slug}` at a time; source stays mounted at opacity 0, matching the
  SealedPack pattern.

### Commit Timing And Interruptions

Commit is optimistic: `collectedCardIds` plus localStorage commit at tap time. Animation is presentation-only. A
presentation-level `displayedCount` ticks on flight-land and reconciles on any interrupt. There are no rollback paths.

`finishAllFlightsImmediately()` runs before any drawer close or builder dismiss: stop controls, remove clones, force
slots filled, and reconcile the counter. Back/dismiss with the drawer open uses a fast drawer teardown: BottomSheet's
existing 0.01s `fadeExit` path, skipping the collapse ritual.

## D. Storyboards

All timings pass through `dbg.scaleT` and are debug-speed scalable.

### `blueprint-morph` Open

1. Tap -> `pushState`; blueprint claims opacity 0; panel claims `layoutId`.
2. Layout spring morph, approximately 450 ms.
3. `onLayoutAnimationComplete` with one-shot ref -> `builder-open`.
4. Content stagger-in: slot columns then shelf, approximately 200 ms with 40 ms stagger.

### `blueprint-morph` Close

1. Content near-instant fade-out, 0.01 s, so the morph reads.
2. AnimatePresence `onExitComplete` -> blueprint reclaims id.
3. Morph-back, approximately 350 ms -> `onLayoutAnimationComplete` -> `table`, focus restored.

The morph-back completion frame is the flash-risk apex.

### `card-flight`

1. Tap -> optimistic commit + fan card dims in the same frame.
2. Measure source rect. If the target slot is off-screen, `scrollIntoView({ behavior: "instant" })`, then re-measure
   next rAF.
3. Clone mounts in `FlightLayer` at source rect.
4. Imperative `animate()` x/y/scale to slot rect with spring `{ stiffness: 260, damping: 26 }`, approximately 400 ms.
5. `.then()`: clone removed, slot ghost becomes filled, declarative pulse `scale [1, 1.08, 1]` for approximately
   250 ms, counter ticks.

Add-all uses a filtered queue with 70 ms stagger per flight. The 13-card worst case has an approximately 0.84 s launch
tail; batch completion is tracked via decrement ref.

### Mechanism Decision

Use a portal clone overlay (`FlightLayer`). The real fan card stays in the fan as the dimmed badge. A sheet child cannot
paint above the slot strip outside the sheet stacking context, so clone + fixed layer avoids unclipping and scroll-offset
math. The `layoutId` + declarative `animate` conflict in `PackOpener.tsx` is why the clone is driven imperatively with
motion values, and why slot cards that need declarative pulses do not carry a `layoutId`.

## E. Implementation Guardrails

- Transform/opacity only. The morph animates the panel chrome rectangle, never the slot grid layout. Do not animate
  filter or shadow.
- BuilderPanel's `layoutId` container takes no declarative transform `animate`; content motion lives on child wrappers.
- BuilderPanel AnimatePresence is owned by `DeckTableShell`, mode `sync`. BottomSheet keeps its existing presence
  handling.
- Reduced motion uses the same state chain and callback order. `blueprint-morph` becomes a 120 ms opacity crossfade with
  `layoutId` omitted. `card-flight` mounts no clone; launch/land marks fire back-to-back; slot fills with a 120 ms fade,
  no pulse, no add-all stagger.
- Retrofitting the existing pack flow is explicitly out of scope for this implementation slice.
- `FlightLayer` has `pointer-events: none`; scrim/dismiss are disabled during `blueprint-morphing` and
  `builder-dismissing`; focus management follows contract A.

## F. Debug-Harness Extension

Add new step arrays in `steps.ts` plus nodes/lanes `deck-shell`, `builder`, and `flight-layer`, and runtime slices in
`animationMachine.ts`:

- `DECK_OPEN_STEPS`: `blueprint-tap` -> `url-push` -> `builder-mount` -> `blueprint-morph-in` (gate) ->
  `builder-content-in`.
- `DECK_CLOSE_STEPS`: `dismiss-trigger` -> `flights-flushed` (conditional) -> `drawer-fast-teardown` (conditional) ->
  `builder-exit` (gate) -> `blueprint-morph-out` (gate, apex) -> `table-restored`.
- `FLIGHT_STEPS`: `flight-tap` -> `flight-measure` -> `flight-launch` (gate) -> `flight-land` (gate) ->
  `flight-batch-complete`.

New debug drivers: `openDeck`, `dismissDeck`, `flyCard`, `flyAll`, and extended `reset`.

## G. Proof Gate

User-approved proof tooling: add Playwright at implementation time, local runs only, no GitHub Actions.

### Vitest Sequence Tests

- Morph open/close phase order.
- Flight optimistic-commit + interrupt reconciliation.
- Re-tap no-op.
- Hard-load `/deck/[slug]` enters `builder-open` without morph.

### Playwright

- Screenshots at each phase boundary.
- Video of morph open/close and a 3-card add-all.
- Assert no frame shows double-vision or a clipped clone.
- Run a `prefers-reduced-motion` project asserting crossfade/instant-fill behavior.

### Manual Slow-Motion Review

At `--debug-speed` 0.25, review:

- morph-back apex frame
- clone z-order over scrim/sheet/slot strip
- perceived continuity of the chrome rectangle
- interruption feel on back-during-flight

Acceptance: every "never" item in contracts A/B has an automated or named-manual check; `onExitComplete` cleanup is
verified to run after exit, not during.

## H. Assumptions And Risks

| Risk / assumption | Status | Mitigation | What changes the plan |
| --- | --- | --- | --- |
| Next 16 shallow-pushState behavior | Load-bearing, unproven | Run spike before animation implementation | If it fights App Router, redesign routing layer before motion work |
| Morph legibility across extreme aspect-ratio change | Provisional | Chrome-rectangle-only morph, delayed content | If slow-motion review fails, fall back to shorter scale+fade |
| Mobile slot-strip scroll-then-measure timing | Provisional | Manual device check | If races persist, pin slot strip during flights |
| Scroll drift during 400 ms flight | Accepted limitation | Clone targets launch-time rect | Revisit only if device review finds it disorienting |

## Implementation Handoff

The first implementation step is the Next 16.2.6 routing spike:

1. Build the smallest shell that can render a table state and a `/deck/[slug]` hard-load state.
2. Use native `window.history.pushState` for deck open/close and a `popstate` listener for Back.
3. Prove `usePathname` updates without remounting the shell.
4. Prove hard-load `/deck/[slug]` initializes `builder-open` without requiring an origin morph.
5. Only after the spike is green, proceed to full table + builder skeleton and then motion implementation.
