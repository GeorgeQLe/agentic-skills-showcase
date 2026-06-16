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

export type Phase = "open" | "close" | "deck-open" | "deck-close";

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
 * / `drawer-fast-teardown` conditionals are deferred to the later card-flight
 * slice, matching the implementation handoff for this §F harness step.
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
  { id: "builder-exit", label: "Builder exit", phase: "deck-close", boundary: "BuilderPanel AnimatePresence exit (fast content fade)" },
  { id: "blueprint-morph-out", label: "Blueprint morph back (APEX)", phase: "deck-close", boundary: "source blueprint onLayoutAnimationComplete (flash apex)", apex: true },
  { id: "table-restored", label: "Table restored", phase: "deck-close", boundary: "DeckTableShell.onCloseMorphComplete -> table, focus restored" },
];

export const ALL_STEPS: StepDef[] = [
  ...OPEN_STEPS,
  ...CLOSE_STEPS,
  ...DECK_OPEN_STEPS,
  ...DECK_CLOSE_STEPS,
];

export function stepIndex(id: string): number {
  return ALL_STEPS.findIndex((s) => s.id === id);
}

export function stepDef(id: string): StepDef | undefined {
  return ALL_STEPS.find((s) => s.id === id);
}
