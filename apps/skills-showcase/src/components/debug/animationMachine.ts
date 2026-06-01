import { ALL_STEPS, CLOSE_STEPS, OPEN_STEPS, type StepDef } from "./steps";

export type AnimationMachineLane =
  | "page"
  | "sealed-pack"
  | "bottom-sheet"
  | "pack-opener"
  | "debug-gates";

export type AnimationMachinePhase = "idle" | "open" | "close" | "reset";

export type AnimationMachineNodeKind =
  | "state"
  | "ref"
  | "motion"
  | "gate";

export interface AnimationMachineNode {
  id: string;
  label: string;
  lane: AnimationMachineLane;
  phase: AnimationMachinePhase;
  kind: AnimationMachineNodeKind;
  stepId?: string;
  apex?: boolean;
  trackedFields: string[];
  description: string;
  x: number;
  y: number;
}

export interface AnimationMachineTransition {
  id: string;
  from: string;
  to: string;
  trigger: string;
  source: string;
  guard?: string;
  effect?: string;
  stepId?: string;
}

export interface AnimationMachineLaneDef {
  id: AnimationMachineLane;
  label: string;
  y: number;
}

export interface AnimationMachinePageRuntime {
  openPack: string | null;
  openedPacks: string[];
  isDrawerClosing: boolean;
  isSheetMounted: boolean;
}

export interface AnimationMachinePackRuntime {
  dragX: number;
  curlOpacity: number;
  pendingOpen: boolean;
  cardDragY: number;
  cardSlideY: number;
  cardElevated: boolean;
  wasInDrawer: boolean;
  isCloseMorphBackInFlight: boolean;
  isDrawerOpen: boolean;
  isClosingFromDrawer: boolean;
  cardZIndex: number | "unset";
}

export interface AnimationMachineDrawerRuntime {
  fanOffsets: Array<{ x: number; y: number }> | null;
  collapseState: { targetIndex: number; offsets: Array<{ x: number; y: number }> } | null;
  targetIndex: number | null;
  card0X: number;
  card0Y: number;
  collapseCount: number;
  expectedCollapseCount: number;
  collapseCompleteFiredRef: boolean;
}

export interface AnimationMachineSheetRuntime {
  sheetY: number;
  mounted: boolean;
  open: boolean;
  exiting: boolean;
  dismissable: boolean;
}

export interface AnimationMachineRuntimeState {
  page: AnimationMachinePageRuntime;
  pack: AnimationMachinePackRuntime;
  drawer: AnimationMachineDrawerRuntime;
  sheet: AnimationMachineSheetRuntime;
}

export interface AnimationMachineRuntimePatch {
  page?: Partial<AnimationMachinePageRuntime>;
  pack?: Partial<AnimationMachinePackRuntime>;
  drawer?: Partial<AnimationMachineDrawerRuntime>;
  sheet?: Partial<AnimationMachineSheetRuntime>;
}

export interface AnimationMachineDebugRuntime {
  enabled: boolean;
  mode: "auto" | "stepped";
  pausedAtStep: string | null;
  reachedSteps: string[];
  currentStepIndex: number;
}

export interface AnimationMachineSnapshot extends AnimationMachineRuntimeState {
  debug: AnimationMachineDebugRuntime;
  activeNodeIds: string[];
  activeTransitionIds: string[];
  blockedNodeIds: string[];
  resetNodeIds: string[];
}

export interface AnimationMachineModel {
  lanes: AnimationMachineLaneDef[];
  nodes: AnimationMachineNode[];
  transitions: AnimationMachineTransition[];
  openSteps: StepDef[];
  closeSteps: StepDef[];
}

const LANE_Y: Record<AnimationMachineLane, number> = {
  page: 32,
  "sealed-pack": 142,
  "bottom-sheet": 252,
  "pack-opener": 362,
  "debug-gates": 482,
};

export const ANIMATION_MACHINE_LANES: AnimationMachineLaneDef[] = [
  { id: "page", label: "Page", y: LANE_Y.page },
  { id: "sealed-pack", label: "SealedPack", y: LANE_Y["sealed-pack"] },
  { id: "bottom-sheet", label: "BottomSheet", y: LANE_Y["bottom-sheet"] },
  { id: "pack-opener", label: "PackOpener", y: LANE_Y["pack-opener"] },
  { id: "debug-gates", label: "Debug Gates", y: LANE_Y["debug-gates"] },
];

const nodeY = (lane: AnimationMachineLane) => LANE_Y[lane] + 46;

function stepNode(step: StepDef, index: number): AnimationMachineNode {
  return {
    id: getAnimationMachineStepNodeId(step.id),
    label: step.label,
    lane: "debug-gates",
    phase: step.phase,
    kind: "gate",
    stepId: step.id,
    apex: step.apex,
    trackedFields: ["debug.pausedAtStep", "debug.reachedSteps"],
    description: step.boundary,
    x: 88 + index * 86,
    y: nodeY("debug-gates"),
  };
}

export function getAnimationMachineStepNodeId(stepId: string): string {
  return `step-${stepId}`;
}

export const ANIMATION_MACHINE_NODES: AnimationMachineNode[] = [
  {
    id: "page-openPack",
    label: "openPack",
    lane: "page",
    phase: "open",
    kind: "state",
    trackedFields: ["page.openPack"],
    description: "The page-level identity for the pack that owns the drawer and shared-layout morph.",
    x: 88,
    y: nodeY("page"),
  },
  {
    id: "page-openedPacks",
    label: "openedPacks",
    lane: "page",
    phase: "open",
    kind: "state",
    trackedFields: ["page.openedPacks"],
    description: "Session-local pack names that have been unsealed, which gates first-tear auto-open behavior.",
    x: 248,
    y: nodeY("page"),
  },
  {
    id: "page-isDrawerClosing",
    label: "isDrawerClosing",
    lane: "page",
    phase: "close",
    kind: "state",
    trackedFields: ["page.isDrawerClosing"],
    description: "Close-phase state that tells PackOpener to collapse cards while the sheet remains mounted.",
    x: 430,
    y: nodeY("page"),
  },
  {
    id: "page-isSheetMounted",
    label: "isSheetMounted",
    lane: "page",
    phase: "open",
    kind: "state",
    trackedFields: ["page.isSheetMounted"],
    description: "The sheet lifetime flag, intentionally separate from openPack during close exit.",
    x: 626,
    y: nodeY("page"),
  },
  {
    id: "pack-dragX",
    label: "dragX",
    lane: "sealed-pack",
    phase: "open",
    kind: "motion",
    trackedFields: ["pack.dragX"],
    description: "Horizontal tear progress across the sealed pack.",
    x: 88,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-curlOpacity",
    label: "curlOpacity",
    lane: "sealed-pack",
    phase: "open",
    kind: "motion",
    trackedFields: ["pack.curlOpacity"],
    description: "Opacity of the foil curl during the tear completion.",
    x: 244,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-pendingOpen",
    label: "pendingOpen",
    lane: "sealed-pack",
    phase: "open",
    kind: "ref",
    trackedFields: ["pack.pendingOpen"],
    description: "First-tear auto-open continuation waiting for the layout animation boundary.",
    x: 410,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-cardDragY",
    label: "cardDragY",
    lane: "sealed-pack",
    phase: "open",
    kind: "motion",
    trackedFields: ["pack.cardDragY"],
    description: "Upward card-drag distance for the drag-up open path.",
    x: 578,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-cardSlideY",
    label: "cardSlideY",
    lane: "sealed-pack",
    phase: "open",
    kind: "motion",
    trackedFields: ["pack.cardSlideY"],
    description: "Card slide offset for click open and close morph-back travel.",
    x: 746,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-cardElevated",
    label: "cardElevated",
    lane: "sealed-pack",
    phase: "open",
    kind: "state",
    trackedFields: ["pack.cardElevated", "pack.cardZIndex"],
    description: "Elevation state that raises the shared-layout card over the pack body.",
    x: 918,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-wasInDrawer",
    label: "wasInDrawer",
    lane: "sealed-pack",
    phase: "close",
    kind: "ref",
    trackedFields: ["pack.wasInDrawer"],
    description: "Close morph-back guard set when the drawer identity leaves the pack.",
    x: 1096,
    y: nodeY("sealed-pack"),
  },
  {
    id: "pack-closeMorph",
    label: "closeMorphBack",
    lane: "sealed-pack",
    phase: "close",
    kind: "ref",
    trackedFields: ["pack.isCloseMorphBackInFlight"],
    description: "One-shot ref that prevents repeated close morph-back/elevation gates.",
    x: 1292,
    y: nodeY("sealed-pack"),
  },
  {
    id: "sheet-sheetY",
    label: "sheetY",
    lane: "bottom-sheet",
    phase: "open",
    kind: "motion",
    trackedFields: ["sheet.sheetY"],
    description: "Drag-to-dismiss motion value for the bottom sheet.",
    x: 88,
    y: nodeY("bottom-sheet"),
  },
  {
    id: "sheet-mounted",
    label: "mounted",
    lane: "bottom-sheet",
    phase: "open",
    kind: "state",
    trackedFields: ["sheet.mounted"],
    description: "Whether AnimatePresence is currently rendering the sheet subtree.",
    x: 248,
    y: nodeY("bottom-sheet"),
  },
  {
    id: "sheet-open",
    label: "open",
    lane: "bottom-sheet",
    phase: "open",
    kind: "state",
    stepId: "sheet-open",
    trackedFields: ["sheet.open"],
    description: "The sheet has completed its slide-up enter animation.",
    x: 408,
    y: nodeY("bottom-sheet"),
  },
  {
    id: "sheet-exiting",
    label: "exiting",
    lane: "bottom-sheet",
    phase: "close",
    kind: "state",
    stepId: "sheet-exit",
    trackedFields: ["sheet.exiting"],
    description: "The sheet is exiting; openPack is intentionally still retained until exit completion.",
    x: 568,
    y: nodeY("bottom-sheet"),
  },
  {
    id: "sheet-dismissable",
    label: "dismissable",
    lane: "bottom-sheet",
    phase: "close",
    kind: "state",
    trackedFields: ["sheet.dismissable"],
    description: "Dismissal guard disabled while drawer collapse and sheet exit are in flight.",
    x: 742,
    y: nodeY("bottom-sheet"),
  },
  {
    id: "drawer-fanOffsets",
    label: "fanOffsets",
    lane: "pack-opener",
    phase: "open",
    kind: "state",
    trackedFields: ["drawer.fanOffsets"],
    description: "Measured fan-out offsets from card 0 to each drawer card.",
    x: 88,
    y: nodeY("pack-opener"),
  },
  {
    id: "drawer-collapseState",
    label: "collapseState",
    lane: "pack-opener",
    phase: "close",
    kind: "state",
    trackedFields: ["drawer.collapseState"],
    description: "Collapse target and per-card offsets used during close fan-in.",
    x: 268,
    y: nodeY("pack-opener"),
  },
  {
    id: "drawer-targetIndex",
    label: "targetIndex",
    lane: "pack-opener",
    phase: "close",
    kind: "state",
    trackedFields: ["drawer.targetIndex"],
    description: "Visible top-left card index that the drawer collapses into.",
    x: 456,
    y: nodeY("pack-opener"),
  },
  {
    id: "drawer-card0",
    label: "card0X/Y",
    lane: "pack-opener",
    phase: "close",
    kind: "motion",
    trackedFields: ["drawer.card0X", "drawer.card0Y"],
    description: "Imperative card 0 collapse motion values; card 0 cannot use animate because it owns layoutId.",
    x: 632,
    y: nodeY("pack-opener"),
  },
  {
    id: "drawer-collapseCounters",
    label: "collapse counters",
    lane: "pack-opener",
    phase: "close",
    kind: "ref",
    trackedFields: ["drawer.collapseCount", "drawer.expectedCollapseCount"],
    description: "Count of completed card-collapse animations versus the expected handoff count.",
    x: 826,
    y: nodeY("pack-opener"),
  },
  {
    id: "drawer-collapseCompleteFired",
    label: "complete fired",
    lane: "pack-opener",
    phase: "close",
    kind: "ref",
    trackedFields: ["drawer.collapseCompleteFiredRef"],
    description: "One-shot ref that prevents duplicate collapse-complete handoffs.",
    x: 1040,
    y: nodeY("pack-opener"),
  },
  {
    id: "debug-reset",
    label: "reset",
    lane: "debug-gates",
    phase: "reset",
    kind: "gate",
    trackedFields: ["debug.reachedSteps", "page.openPack"],
    description: "Reset clears reached/paused graph state, page state, and target pack motion values.",
    x: 1464,
    y: nodeY("debug-gates"),
  },
  ...ALL_STEPS.map(stepNode),
];

export const ANIMATION_MACHINE_TRANSITIONS: AnimationMachineTransition[] = [
  {
    id: "open-tear",
    from: "pack-dragX",
    to: "pack-curlOpacity",
    trigger: "open-tear",
    source: "SealedPack.completeTear",
    effect: "Animate dragX to PACK_WIDTH and fade curlOpacity",
    stepId: "tear",
  },
  {
    id: "tear-pending-open",
    from: "pack-curlOpacity",
    to: "pack-pendingOpen",
    trigger: "first tear auto-open",
    source: "SealedPack.completeTear",
    guard: "autoOpenOnTear",
    effect: "Arm pendingOpen and fallback timer",
    stepId: "tear",
  },
  {
    id: "drag-up",
    from: "pack-cardDragY",
    to: "pack-cardElevated",
    trigger: "drag-up",
    source: "SealedPack.handleCardPointerUp",
    guard: "cardDragY >= DRAG_UP_THRESHOLD",
    effect: "Lift card before requesting drawer open",
    stepId: "card-lift",
  },
  {
    id: "open-click",
    from: "pack-cardSlideY",
    to: "pack-cardElevated",
    trigger: "open-click",
    source: "SealedPack.handlePackClick",
    effect: "Slide card to the apex before requesting drawer open",
    stepId: "card-click-rise",
  },
  {
    id: "elevate-card",
    from: "pack-cardElevated",
    to: "page-openPack",
    trigger: "elevate-card",
    source: "SealedPack.proceedToOpen",
    effect: "Set cardElevated before page open request",
    stepId: "elevate-card",
  },
  {
    id: "request-open",
    from: "page-openPack",
    to: "page-isSheetMounted",
    trigger: "request-open",
    source: "PrototypePage.handleOpen",
    effect: "Set openPack, isSheetMounted, and openedPacks",
    stepId: "request-open",
  },
  {
    id: "sheet-open",
    from: "page-isSheetMounted",
    to: "sheet-open",
    trigger: "sheet-open",
    source: "BottomSheet onAnimationComplete",
    effect: "Mark sheet enter complete",
    stepId: "sheet-open",
  },
  {
    id: "layout-morph-in",
    from: "pack-cardElevated",
    to: "drawer-card0",
    trigger: "layout-morph-in",
    source: "PackOpener card0 onLayoutAnimationComplete",
    effect: "Shared-layout card lands in the drawer",
    stepId: "layout-morph-in",
  },
  {
    id: "fan-out",
    from: "drawer-card0",
    to: "drawer-fanOffsets",
    trigger: "fan-out",
    source: "PackOpener last card onAnimationComplete",
    effect: "Drawer cards fan out from the measured offsets",
    stepId: "fan-out",
  },
  {
    id: "close-trigger",
    from: "sheet-dismissable",
    to: "page-isDrawerClosing",
    trigger: "close",
    source: "PrototypePage.handleClose",
    effect: "Mark close-trigger and set isDrawerClosing",
    stepId: "close-trigger",
  },
  {
    id: "collapse-measure",
    from: "page-isDrawerClosing",
    to: "drawer-collapseState",
    trigger: "collapse",
    source: "PackOpener collapse useLayoutEffect",
    effect: "Measure visible top-left target and card offsets",
    stepId: "collapse-measure",
  },
  {
    id: "collapse-fan",
    from: "drawer-collapseState",
    to: "drawer-card0",
    trigger: "collapse-fan",
    source: "PackOpener collapse springs",
    effect: "Animate drawer cards into the target card",
    stepId: "collapse-fan",
  },
  {
    id: "collapse-complete",
    from: "drawer-collapseCounters",
    to: "drawer-collapseCompleteFired",
    trigger: "collapse-complete",
    source: "PackOpener.completeCollapse",
    effect: "Gate the one-shot handoff before notifying the page",
    stepId: "collapse-complete",
  },
  {
    id: "drawer-teardown",
    from: "drawer-collapseCompleteFired",
    to: "page-isSheetMounted",
    trigger: "drawer-teardown",
    source: "PrototypePage.handleCollapseComplete",
    effect: "Unmount sheet content without clearing openPack",
    stepId: "drawer-teardown",
  },
  {
    id: "sheet-exit",
    from: "page-isSheetMounted",
    to: "sheet-exiting",
    trigger: "sheet-exit",
    source: "BottomSheet AnimatePresence onExitComplete",
    effect: "Mark sheet-exit and then clear openPack",
    stepId: "sheet-exit",
  },
  {
    id: "layout-morph-out",
    from: "sheet-exiting",
    to: "pack-wasInDrawer",
    trigger: "morph-out",
    source: "SealedPack close onLayoutAnimationComplete",
    effect: "Hold the apex z-index frame before body/elevation state changes",
    stepId: "layout-morph-out",
  },
  {
    id: "drop-elevation",
    from: "pack-wasInDrawer",
    to: "pack-cardElevated",
    trigger: "drop-elevation",
    source: "SealedPack close onLayoutAnimationComplete",
    effect: "Drop card elevation only after the close apex is inspectable",
    stepId: "drop-elevation",
  },
  {
    id: "reset-state",
    from: "debug-reset",
    to: "page-openPack",
    trigger: "reset",
    source: "DebugProvider.reset",
    effect: "Clear page, pack, drawer, sheet, reached, paused, and active graph state",
  },
];

export const ANIMATION_MACHINE_MODEL: AnimationMachineModel = {
  lanes: ANIMATION_MACHINE_LANES,
  nodes: ANIMATION_MACHINE_NODES,
  transitions: ANIMATION_MACHINE_TRANSITIONS,
  openSteps: OPEN_STEPS,
  closeSteps: CLOSE_STEPS,
};

export const DEFAULT_ANIMATION_MACHINE_RUNTIME: AnimationMachineRuntimeState = {
  page: {
    openPack: null,
    openedPacks: [],
    isDrawerClosing: false,
    isSheetMounted: false,
  },
  pack: {
    dragX: 0,
    curlOpacity: 1,
    pendingOpen: false,
    cardDragY: 0,
    cardSlideY: 0,
    cardElevated: false,
    wasInDrawer: false,
    isCloseMorphBackInFlight: false,
    isDrawerOpen: false,
    isClosingFromDrawer: false,
    cardZIndex: "unset",
  },
  drawer: {
    fanOffsets: null,
    collapseState: null,
    targetIndex: null,
    card0X: 0,
    card0Y: 0,
    collapseCount: 0,
    expectedCollapseCount: 0,
    collapseCompleteFiredRef: false,
  },
  sheet: {
    sheetY: 0,
    mounted: false,
    open: false,
    exiting: false,
    dismissable: true,
  },
};

const DEFAULT_DEBUG_RUNTIME: AnimationMachineDebugRuntime = {
  enabled: false,
  mode: "auto",
  pausedAtStep: null,
  reachedSteps: [],
  currentStepIndex: -1,
};

export const DEFAULT_ANIMATION_MACHINE_SNAPSHOT = buildAnimationMachineSnapshot(
  DEFAULT_ANIMATION_MACHINE_RUNTIME,
  DEFAULT_DEBUG_RUNTIME
);

export function mergeAnimationMachineRuntime(
  previous: AnimationMachineRuntimeState,
  patch?: AnimationMachineRuntimePatch
): AnimationMachineRuntimeState {
  if (!patch) return previous;

  return {
    page: patch.page ? { ...previous.page, ...patch.page } : previous.page,
    pack: patch.pack ? { ...previous.pack, ...patch.pack } : previous.pack,
    drawer: patch.drawer ? { ...previous.drawer, ...patch.drawer } : previous.drawer,
    sheet: patch.sheet ? { ...previous.sheet, ...patch.sheet } : previous.sheet,
  };
}

export function buildAnimationMachineSnapshot(
  runtime: AnimationMachineRuntimeState,
  debug: AnimationMachineDebugRuntime
): AnimationMachineSnapshot {
  const activeNodeIds = new Set<string>();
  const blockedNodeIds = new Set<string>();
  const resetNodeIds = new Set<string>();
  const reachedStepIds = new Set(debug.reachedSteps);

  if (runtime.page.openPack) activeNodeIds.add("page-openPack");
  if (runtime.page.openedPacks.length > 0) activeNodeIds.add("page-openedPacks");
  if (runtime.page.isDrawerClosing) activeNodeIds.add("page-isDrawerClosing");
  if (runtime.page.isSheetMounted) activeNodeIds.add("page-isSheetMounted");

  if (Math.abs(runtime.pack.dragX) > 0.5) activeNodeIds.add("pack-dragX");
  if (runtime.pack.curlOpacity < 0.99) activeNodeIds.add("pack-curlOpacity");
  if (runtime.pack.pendingOpen) activeNodeIds.add("pack-pendingOpen");
  if (Math.abs(runtime.pack.cardDragY) > 0.5) activeNodeIds.add("pack-cardDragY");
  if (Math.abs(runtime.pack.cardSlideY) > 0.5) activeNodeIds.add("pack-cardSlideY");
  if (runtime.pack.cardElevated) activeNodeIds.add("pack-cardElevated");
  if (runtime.pack.wasInDrawer) activeNodeIds.add("pack-wasInDrawer");
  if (runtime.pack.isCloseMorphBackInFlight) activeNodeIds.add("pack-closeMorph");

  if (runtime.sheet.mounted) activeNodeIds.add("sheet-mounted");
  if (runtime.sheet.open) activeNodeIds.add("sheet-open");
  if (runtime.sheet.exiting) activeNodeIds.add("sheet-exiting");
  if (Math.abs(runtime.sheet.sheetY) > 0.5) activeNodeIds.add("sheet-sheetY");
  if (!runtime.sheet.dismissable) blockedNodeIds.add("sheet-dismissable");

  if (runtime.drawer.fanOffsets?.length) activeNodeIds.add("drawer-fanOffsets");
  if (runtime.drawer.collapseState) activeNodeIds.add("drawer-collapseState");
  if (runtime.drawer.targetIndex !== null) activeNodeIds.add("drawer-targetIndex");
  if (Math.abs(runtime.drawer.card0X) > 0.5 || Math.abs(runtime.drawer.card0Y) > 0.5) {
    activeNodeIds.add("drawer-card0");
  }
  if (runtime.drawer.expectedCollapseCount > 0 || runtime.drawer.collapseCount > 0) {
    activeNodeIds.add("drawer-collapseCounters");
  }
  if (runtime.drawer.collapseCompleteFiredRef) activeNodeIds.add("drawer-collapseCompleteFired");

  if (debug.pausedAtStep) {
    activeNodeIds.add(getAnimationMachineStepNodeId(debug.pausedAtStep));
  }

  const isReset =
    !runtime.page.openPack &&
    runtime.page.openedPacks.length === 0 &&
    !runtime.page.isDrawerClosing &&
    !runtime.page.isSheetMounted &&
    !runtime.pack.cardElevated &&
    !runtime.drawer.collapseState &&
    debug.reachedSteps.length === 0 &&
    debug.pausedAtStep === null;

  if (isReset) resetNodeIds.add("debug-reset");

  const activeTransitionIds = ANIMATION_MACHINE_TRANSITIONS.filter(
    (transition) => transition.stepId && reachedStepIds.has(transition.stepId)
  ).map((transition) => transition.id);

  return {
    ...runtime,
    debug,
    activeNodeIds: [...activeNodeIds],
    activeTransitionIds,
    blockedNodeIds: [...blockedNodeIds],
    resetNodeIds: [...resetNodeIds],
  };
}

export function closePathTransitionIds(): string[] {
  return CLOSE_STEPS.map((step) => step.id);
}
