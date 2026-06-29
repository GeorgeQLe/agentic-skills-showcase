/**
 * Static step catalog for the /prototype debug harness.
 *
 * Each step id corresponds to a real callback boundary in the animation. The
 * gate() primitive (see DebugController) parks the chain at these ids when in
 * stepped mode. The OPEN phase is largely event-driven (concurrent reactions
 * once the drawer mounts), so only the in-chain boundaries truly freeze;
 * the CLOSE phase is a genuine sequential callback chain — that is where
 * stepping freezes the apex frame by frame.
 */

export type Phase = "open" | "close" | "deck-open" | "deck-close" | "flight";

export interface StepDef {
  id: string;
  label: string;
  phase: Phase;
  /** Where this boundary lives, for the timeline tooltip. */
  boundary: string;
  /** High-value freeze point for the recurring apex flash. */
  apex?: boolean;
}

export const OPEN_STEPS: StepDef[] = [
  { id: "tear", label: "Tear edge", phase: "open", boundary: "SealedPack.completeTear" },
  { id: "card-lift", label: "Card lift (drag-up)", phase: "open", boundary: "SealedPack.handleCardPointerUp" },
  { id: "card-click-rise", label: "Card rise (click)", phase: "open", boundary: "SealedPack.handlePackClick" },
  { id: "elevate-card", label: "Elevate card", phase: "open", boundary: "setCardElevated(true)" },
  { id: "request-open", label: "Request drawer open", phase: "open", boundary: "onOpen(getOrigin())" },
  { id: "sheet-open", label: "Sheet slide-up", phase: "open", boundary: "BottomSheet sheet onAnimationComplete" },
  { id: "layout-morph-in", label: "layoutId morph in", phase: "open", boundary: "PackOpener card0 onLayoutAnimationComplete" },
  { id: "fan-out", label: "Fan-out springs", phase: "open", boundary: "PackOpener last card onAnimationComplete" },
];

export const CLOSE_STEPS: StepDef[] = [
  { id: "close-trigger", label: "Close trigger", phase: "close", boundary: "page.handleClose -> phase=closing-collapse" },
  { id: "collapse-measure", label: "Collapse measure", phase: "close", boundary: "PackOpener collapse useLayoutEffect" },
  { id: "collapse-fan", label: "Collapse fan-in", phase: "close", boundary: "PackOpener collapse springs" },
  { id: "collapse-complete", label: "Collapse complete", phase: "close", boundary: "PackOpener onCollapseComplete" },
  { id: "drawer-teardown", label: "Drawer teardown", phase: "close", boundary: "page.handleCollapseComplete -> phase=sheet-exiting" },
  { id: "sheet-exit", label: "Sheet exit", phase: "close", boundary: "BottomSheet AnimatePresence onExitComplete" },
  { id: "layout-morph-out", label: "layoutId morph back (APEX)", phase: "close", boundary: "SealedPack onLayoutAnimationComplete (pre-body)", apex: true },
  { id: "drop-elevation", label: "Drop elevation / z-index (APEX)", phase: "close", boundary: "SealedPack setCardElevated(false)", apex: true },
];

/**
 * Deck-builder `blueprint-morph` boundaries (animation-plan-deck-builder.md §F).
 * Distinct ids from the pack flow (the pack uses layout-morph-in/out; the deck
 * uses blueprint-morph-in/out) so ALL_STEPS stays a flat, collision-free index.
 *
 * The card-flight contract's FLIGHT_STEPS plus the close-path `flights-flushed`
 * conditional land in the card-flight slice (below). `drawer-fast-teardown` from
 * §F has no boundary in this skeleton — there is no BottomSheet drawer; the fast
 * teardown maps onto the existing `builder-exit` content fast-fade — so it is
 * intentionally not a separate step.
 */
export const DECK_OPEN_STEPS: StepDef[] = [
  { id: "blueprint-tap", label: "Blueprint tap", phase: "deck-open", boundary: "DeckTableShell.openDeck -> phase=blueprint-morphing" },
  { id: "url-push", label: "URL pushState", phase: "deck-open", boundary: "DeckTableShell.pushDeckPath (window.history.pushState)" },
  { id: "builder-mount", label: "Builder mount", phase: "deck-open", boundary: "AnimatePresence mounts BuilderPanel (owns layoutId)" },
  { id: "blueprint-morph-in", label: "Blueprint morph in", phase: "deck-open", boundary: "BuilderPanel onLayoutAnimationComplete -> builder-open" },
  { id: "builder-content-in", label: "Builder content stagger", phase: "deck-open", boundary: "content variants animate to visible" },
];

export const DECK_CLOSE_STEPS: StepDef[] = [
  { id: "dismiss-trigger", label: "Dismiss trigger", phase: "deck-close", boundary: "DeckTableShell.closeDeck -> phase=builder-dismissing" },
  { id: "flights-flushed", label: "Flights flushed (conditional)", phase: "deck-close", boundary: "finishAllFlightsImmediately() before dismiss (only if flights in-flight)" },
  { id: "builder-exit", label: "Builder exit", phase: "deck-close", boundary: "BuilderPanel AnimatePresence exit (fast content fade)" },
  { id: "blueprint-morph-out", label: "Blueprint morph back (APEX)", phase: "deck-close", boundary: "source blueprint onLayoutAnimationComplete (flash apex)", apex: true },
  { id: "table-restored", label: "Table restored", phase: "deck-close", boundary: "DeckTableShell.onCloseMorphComplete -> table, focus restored" },
];

/**
 * Card-flight boundaries (animation-plan-deck-builder.md §B / §D card-flight /
 * §F flight portion). `flight-launch` and `flight-land` are the stepped-mode
 * gate points awaited inside FlightClone; `flight-batch-complete` fires once the
 * add-all batch decrement ref reaches zero. Distinct ids from the pack/deck
 * flows keep ALL_STEPS a flat, collision-free index.
 */
export const FLIGHT_STEPS: StepDef[] = [
  { id: "flight-tap", label: "Card tap (optimistic commit)", phase: "flight", boundary: "BuilderPanel.flyCard -> onCollect + fan-card dim" },
  { id: "flight-measure", label: "Measure source + slot rect", phase: "flight", boundary: "getBoundingClientRect (scrollIntoView re-measure if off-screen)" },
  { id: "flight-launch", label: "Clone launch (gate)", phase: "flight", boundary: "FlightClone imperative animate() start" },
  { id: "flight-land", label: "Clone land (gate): slot pulse + counter tick", phase: "flight", boundary: "FlightClone animate .then -> settle slot, displayedCount++" },
  { id: "flight-batch-complete", label: "Add-all batch complete", phase: "flight", boundary: "last flight settles (batch decrement ref reaches 0)" },
];

export const ALL_STEPS: StepDef[] = [
  ...OPEN_STEPS,
  ...CLOSE_STEPS,
  ...DECK_OPEN_STEPS,
  ...DECK_CLOSE_STEPS,
  ...FLIGHT_STEPS,
];

export function stepIndex(id: string): number {
  return ALL_STEPS.findIndex((s) => s.id === id);
}

export function stepDef(id: string): StepDef | undefined {
  return ALL_STEPS.find((s) => s.id === id);
}
