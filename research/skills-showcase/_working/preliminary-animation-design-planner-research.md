# Preliminary Animation Design Plan — Deck-Builder `blueprint-morph` + `card-flight` Transitions

> **Working packet — non-canonical.** Stage 1 output of `/animation-design-planner` (2026-06-10). Reviewed via
> `alignment/animation-design-planner-deck-builder-transitions.html`. On approval the content is written to the
> canonical plan at `apps/skills-showcase/docs/animation-plan-deck-builder.md` and this packet is archived.

## Context

The deck-builder UX design (`apps/skills-showcase/docs/deck-builder-ux.md`, committed `6e2e6aec`) introduces two new
framer-motion transitions that don't exist in the `/prototype` flow:

- **blueprint-morph** — deck blueprint card on the table ⇄ builder overlay at `/deck/[slug]`.
- **card-flight** — fan card flies into a deck slot on tap, plus an add-all stagger variant.

`/animation-design-planner` was invoked to plan these before building — naming the visible motion contracts, lifecycle
owner, state phases, and proof method so implementation doesn't start with local timing tweaks.

This is a **planning run**: design/review artifacts only, no implementation code and no new dependencies. Framework
detected: framer-motion 12.40 (imported as `"framer-motion"`) → `motion-framer` subskill guardrails apply.

## A. Visible Motion Contract — blueprint-morph

- **Trigger:** tap/click a deck blueprint on the table (`/`); close via Back button or dismiss affordance.
- **Start → end:** small blueprint card on the table → full builder panel (`/deck/[slug]`) with phase slots; reverse on
  close. URL changes both ways.
- **Focal/continuity element:** the blueprint card chrome is the single visually continuous rectangle (shared
  `layoutId="deck-blueprint-${slug}"`); builder content (slot columns, header, shelf glow) staggers in *after* the
  morph lands.
- **Never:**
  - double-vision (blueprint and panel both visible at full opacity)
  - flash at morph-back
  - builder content popping before the morph completes
  - table scroll jump
  - focus loss (focus moves to builder heading on open, returns to the originating blueprint on close)
  - URL/visual desync
- **Interruptions:**
  - blueprint taps ignored unless phase is `table`
  - dismiss legal only from `builder-open` (plus dismiss-during-`blueprint-morphing`, which retargets the layout morph
    from its current projected position)
  - hard load of `/deck/[slug]` skips the open morph (no origin) but still morphs back on close because the table
    renders underneath

## B. Visible Motion Contract — card-flight

- **Trigger:** tap an uncollected card in the open fan drawer; "Collect all N" triggers the staggered batch variant.
- **Start → end:** card visually leaves the fan, flies above the sheet to its phase slot, slot fills and pulses once,
  deck counter ticks; the fan card is dimmed with an "in deck ♦" badge from the tap frame onward.
- **Focal element:** the flying clone; the slot is the continuity target (pinned visible above the sheet on mobile).
- **Never:**
  - double-vision (full-opacity fan card while the clone flies)
  - clone clipped by the sheet's overflow or painted under the scrim/slot strip
  - slot filling before the clone lands (reduced motion excepted)
  - counter desync after interruptions
  - accidental collect from an inspect tap (flip and fly remain separate affordances)
- **Interruptions:**
  - re-tap of an in-flight or collected card is a no-op
  - concurrent flights of different cards allowed
  - drawer close or builder dismiss mid-flight snaps all flights to end (no cancel/rollback) before proceeding
  - deck-complete sequence defers until all flights land

## C. Lifecycle ownership map

Hierarchical composition; the existing `PackFlowPhase` machine is nested **unchanged**:

```
DeckTableShell (client; rendered by both app/page.tsx and app/deck/[slug]/page.tsx)
├── owns DeckFlowPhase: table → blueprint-morphing → builder-open → builder-dismissing → table
├── owns activeDeck + collectedCardIds (localStorage-backed, per slug)
├── one <LayoutGroup> wrapping table + builder
├── TableSurface (always mounted)
├── BuilderPanel (AnimatePresence; mounted while activeDeck != null)
│   └── BuilderPackFlow — PackFlowPhase owner extracted from PrototypeInner
│       (sealed → opening-apex → drawer-open → closing-* chain, verbatim)
│       └── owns flights Map<cardId, FlightRecord> (parallel records, NOT a scalar phase:
│           queued → measuring → in-flight → settling → done per record)
└── FlightLayer (fixed inset-0, pointer-events-none, z-[70]) — flight clones
```

- **Routing decision (load-bearing):** the morph is client-state-first; the URL syncs via shallow
  `window.history.pushState` (+ popstate listener), because App Router route-change unmounts are not
  AnimatePresence-aware — a route-first intercepting-route close would unmount the builder before the blueprint can
  reclaim the layoutId. `/deck/[slug]` exists as a real route for hard loads/SEO and renders the same shell with
  `initialDeckSlug`. **Spike first (~30 min): confirm shallow pushState + usePathname/popstate behavior on Next
  16.2.6** — flagged as the top pre-implementation risk.
- **Identity rules:**
  - fan cards keyed by `skill.id`, never filtered/reordered on collect (preserves PackOpener's fan/collapse math)
  - flight clones keyed `flight-${skill.id}`, max one per card
  - slots keyed `${deckSlug}:${slotId}`
  - exactly one mounted owner of `deck-blueprint-${slug}` at a time (source stays mounted at opacity 0, the SealedPack
    pattern)
- **Commit timing:** optimistic — `collectedCardIds` + localStorage commit at tap time; animation is pure
  presentation; a presentation-level `displayedCount` ticks on flight-land and reconciles on any interrupt. No
  rollback paths exist.
- **Interruption rule:** `finishAllFlightsImmediately()` (snap-to-end: stop controls, remove clones, force slots
  filled, reconcile counter) runs before any drawer close or builder dismiss. Back/dismiss with the drawer open uses a
  **fast drawer teardown** (BottomSheet's existing 0.01s `fadeExit` path, skip the collapse ritual) so leaving feels
  immediate.

## D. Storyboards (timings via `dbg.scaleT`, debug-speed scalable)

### blueprint-morph open

1. tap → pushState + blueprint claims opacity 0 / panel claims layoutId
2. layout spring morph (~450 ms, framer layout spring)
3. `onLayoutAnimationComplete` (one-shot ref) → `builder-open`
4. content stagger-in (slot columns then shelf, ~200 ms, 40 ms stagger)

### blueprint-morph close

1. content near-instant fade-out (0.01 s, so the morph reads)
2. AnimatePresence `onExitComplete` → blueprint reclaims id
3. morph-back (~350 ms) → `onLayoutAnimationComplete` → `table`, focus restored

Morph-back completion frame is the flash-risk apex.

### card-flight

1. tap → optimistic commit + fan card dims (same frame)
2. measure source rect; if the target slot is off-screen, `scrollIntoView({behavior:"instant"})` then re-measure next
   rAF
3. clone mounts in FlightLayer at source rect
4. imperative `animate()` x/y/scale to slot rect, spring `{stiffness: 260, damping: 26}` (~400 ms)
5. `.then()`: clone removed, slot ghost→filled, declarative pulse `scale [1, 1.08, 1]` ~250 ms, counter ticks

**Add-all:** filtered queue, 70 ms stagger per flight (13-card worst case ≈ 0.84 s tail), batch-complete via decrement
ref; single tap is a batch of 1.

- **Mechanism decision:** portal clone overlay (FlightLayer) — the real fan card must stay in the fan as the dimmed
  badge, and a sheet child can never paint above the slot strip outside the sheet's z-50 stacking context; clone +
  fixed layer needs no unclipping and no scroll-offset math. The layoutId+declarative-animate conflict
  (PackOpener.tsx:212-213) is why the clone is driven imperatively with motion values, and why slot cards (which need
  declarative pulses) never carry a layoutId.

## E. Implementation guardrails (motion-framer subskill + baseline)

- Transform/opacity only; the morph animates the panel chrome rectangle, never the slot grid layout; no filter/shadow
  animation.
- BuilderPanel's layoutId container takes no declarative `animate` on transforms; content motion lives on child
  wrappers.
- AnimatePresence placement: BuilderPanel's presence is owned by DeckTableShell (the component that decides mounting),
  mode `sync`; BottomSheet keeps its existing presence handling.
- **Reduced motion** (`useReducedMotion()`, read once in the shell): same state chain and callbacks fire in the same
  order (debug/test parity), durations degrade — blueprint-morph becomes a 120 ms opacity crossfade with layoutId
  omitted; card-flight mounts no clone, launch/land marks fire back-to-back, slot fills with a 120 ms fade, no pulse,
  add-all has no stagger. Retrofitting the existing pack flow is a named follow-up, out of scope.
- Pointer events: FlightLayer `pointer-events-none`; scrim/dismiss disabled during `blueprint-morphing` and
  `builder-dismissing`; focus management per contract A.

## F. Debug-harness extension

New step arrays in `steps.ts` (+ nodes/lanes `deck-shell`, `builder`, `flight-layer` and runtime slices in
`animationMachine.ts`):

- `DECK_OPEN_STEPS`: `blueprint-tap` → `url-push` → `builder-mount` → `blueprint-morph-in` (gate) →
  `builder-content-in`.
- `DECK_CLOSE_STEPS`: `dismiss-trigger` → `flights-flushed` (cond.) → `drawer-fast-teardown` (cond.) → `builder-exit`
  (gate) → `blueprint-morph-out` (gate, apex) → `table-restored`.
- `FLIGHT_STEPS`: `flight-tap` → `flight-measure` → `flight-launch` (gate) → `flight-land` (gate) →
  `flight-batch-complete`.

New debug drivers: `openDeck`, `dismissDeck`, `flyCard`, `flyAll`, extended `reset`. All new transitions pass through
`dbg.scaleT`.

## G. Proof gate (user chose: add Playwright at implementation time)

- **Vitest sequence tests** (existing pattern — mocked debug `report()` channel, mocked `getBoundingClientRect`):
  - morph open/close phase order
  - flight optimistic-commit + interrupt reconciliation (close-mid-flight leaves counter == collected size)
  - re-tap no-op
  - hard-load `/deck/[slug]` enters `builder-open` without morph
- **Playwright** (devDependency added in deck-builder implementation phase, local runs only — no GitHub Actions):
  - screenshots at each phase boundary
  - video of morph open/close and a 3-card add-all
  - assert no frame shows double-vision or a clipped clone
  - a `prefers-reduced-motion` project run asserting crossfade/instant-fill behavior
- **Manual slow-motion review** at `--debug-speed` 0.25: morph-back apex frame (flash risk), clone z-order over
  scrim/sheet/slot strip, perceived continuity of the chrome rectangle, interruption feel (back-during-flight).
- **Acceptance:** every "never" item in contracts A/B has a corresponding automated or named-manual check;
  `onExitComplete`-dependent cleanup verified to run after exit, not during.

## H. Known risks (assumptions register)

1. **Next 16 shallow-pushState spike** (load-bearing) — confirm shallow `window.history.pushState` +
   usePathname/popstate behavior on Next 16.2.6 before any implementation.
2. **Morph legibility across extreme aspect-ratio change** — mitigated: chrome-rectangle-only morph.
3. **Mobile slot-strip scroll-then-measure timing** — manual device check.
4. **Scroll drift during a ~400 ms flight** — accepted limitation, documented.

## Canonical destination

On approval: `apps/skills-showcase/docs/animation-plan-deck-builder.md` (new file). This packet is archived to
`docs/history/archive/YYYY-MM-DD/HHMMSS/research/skills-showcase/_working/preliminary-animation-design-planner-research.md`
and removed from the active tree.
