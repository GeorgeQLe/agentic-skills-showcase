import { describe, expect, it } from "vitest";
import {
  ALL_STEPS,
  DECK_CLOSE_STEPS,
  DECK_OPEN_STEPS,
  FLIGHT_STEPS,
  stepDef,
  stepIndex,
} from "./steps";
import {
  ANIMATION_MACHINE_MODEL,
  DEFAULT_ANIMATION_MACHINE_RUNTIME,
  buildAnimationMachineSnapshot,
  mergeAnimationMachineRuntime,
} from "./animationMachine";

const DEBUG_OFF = {
  enabled: false,
  mode: "auto" as const,
  pausedAtStep: null,
  reachedSteps: [] as string[],
  currentStepIndex: -1,
};

describe("deck-builder blueprint-morph harness (§F)", () => {
  it("registers the deck step boundaries in order and folds them into ALL_STEPS", () => {
    expect(DECK_OPEN_STEPS.map((s) => s.id)).toEqual([
      "blueprint-tap",
      "url-push",
      "builder-mount",
      "blueprint-morph-in",
      "builder-content-in",
    ]);
    expect(DECK_CLOSE_STEPS.map((s) => s.id)).toEqual([
      "dismiss-trigger",
      "flights-flushed",
      "builder-exit",
      "blueprint-morph-out",
      "table-restored",
    ]);

    // Flat, collision-free index: every deck step resolves and is unique.
    for (const step of [...DECK_OPEN_STEPS, ...DECK_CLOSE_STEPS]) {
      expect(stepDef(step.id)).toBe(step);
      expect(stepIndex(step.id)).toBeGreaterThanOrEqual(0);
    }
    const ids = ALL_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks the morph-back as the close apex", () => {
    const morphOut = stepDef("blueprint-morph-out");
    expect(morphOut?.apex).toBe(true);
    expect(morphOut?.phase).toBe("deck-close");

    const apexNode = ANIMATION_MACHINE_MODEL.nodes.find(
      (node) => node.stepId === "blueprint-morph-out" && node.apex,
    );
    expect(apexNode).toBeTruthy();
  });

  it("adds the deck-shell and builder lanes with runtime nodes", () => {
    const laneIds = ANIMATION_MACHINE_MODEL.lanes.map((lane) => lane.id);
    expect(laneIds).toContain("deck-shell");
    expect(laneIds).toContain("builder");

    const deckNodes = ANIMATION_MACHINE_MODEL.nodes.filter((n) => n.lane === "deck-shell");
    const builderNodes = ANIMATION_MACHINE_MODEL.nodes.filter((n) => n.lane === "builder");
    expect(deckNodes.map((n) => n.id)).toContain("deck-phase");
    expect(builderNodes.map((n) => n.id)).toContain("builder-mounted");
  });

  it("seeds an idle deck-shell/builder runtime slice", () => {
    expect(DEFAULT_ANIMATION_MACHINE_RUNTIME.deckShell).toEqual({
      phase: "table",
      activeDeckSlug: null,
      closingSlug: null,
      reducedMotion: false,
    });
    expect(DEFAULT_ANIMATION_MACHINE_RUNTIME.builder).toEqual({
      mounted: false,
      morphing: false,
      contentState: "hidden",
      collectedCount: 0,
    });
  });

  it("merges deck-shell and builder patches without touching other slices", () => {
    const next = mergeAnimationMachineRuntime(DEFAULT_ANIMATION_MACHINE_RUNTIME, {
      deckShell: { phase: "builder-open", activeDeckSlug: "market-intel" },
      builder: { mounted: true, contentState: "visible" },
    });

    expect(next.deckShell.phase).toBe("builder-open");
    expect(next.deckShell.activeDeckSlug).toBe("market-intel");
    expect(next.deckShell.closingSlug).toBeNull();
    expect(next.builder.mounted).toBe(true);
    expect(next.builder.contentState).toBe("visible");
    // Untouched slices keep their references.
    expect(next.page).toBe(DEFAULT_ANIMATION_MACHINE_RUNTIME.page);
    expect(next.pack).toBe(DEFAULT_ANIMATION_MACHINE_RUNTIME.pack);
  });

  it("activates deck nodes from runtime and keeps the default snapshot reset", () => {
    const idle = buildAnimationMachineSnapshot(DEFAULT_ANIMATION_MACHINE_RUNTIME, DEBUG_OFF);
    expect(idle.activeNodeIds).not.toContain("deck-phase");
    expect(idle.resetNodeIds).toContain("debug-reset");

    const open = mergeAnimationMachineRuntime(DEFAULT_ANIMATION_MACHINE_RUNTIME, {
      deckShell: { phase: "builder-open", activeDeckSlug: "market-intel" },
      builder: { mounted: true, contentState: "visible", collectedCount: 2 },
    });
    const snapshot = buildAnimationMachineSnapshot(open, DEBUG_OFF);
    expect(snapshot.activeNodeIds).toEqual(
      expect.arrayContaining([
        "deck-phase",
        "deck-activeSlug",
        "builder-mounted",
        "builder-content",
        "builder-collectedCount",
      ]),
    );
    // An active deck must not be mistaken for a fully reset machine.
    expect(snapshot.resetNodeIds).not.toContain("debug-reset");
  });

  it("lights the full deck open+close path when its steps are reached", () => {
    const deckPath = [...DECK_OPEN_STEPS, ...DECK_CLOSE_STEPS].map((s) => s.id);
    const snapshot = buildAnimationMachineSnapshot(DEFAULT_ANIMATION_MACHINE_RUNTIME, {
      ...DEBUG_OFF,
      enabled: true,
      mode: "stepped",
      reachedSteps: deckPath,
    });

    expect(snapshot.activeTransitionIds).toEqual(
      expect.arrayContaining([
        "deck-blueprint-tap",
        "deck-morph-in",
        "deck-dismiss-trigger",
        "deck-morph-out",
        "deck-table-restored",
      ]),
    );
    // Deck steps must not leak into the pack close-path transitions.
    expect(snapshot.activeTransitionIds).not.toContain("layout-morph-out");
  });

  it("exposes the deck step arrays on the canonical model", () => {
    expect(ANIMATION_MACHINE_MODEL.deckOpenSteps).toBe(DECK_OPEN_STEPS);
    expect(ANIMATION_MACHINE_MODEL.deckCloseSteps).toBe(DECK_CLOSE_STEPS);
  });
});

describe("card-flight harness (§B / §F)", () => {
  it("registers the flight step boundaries in order and folds them into ALL_STEPS", () => {
    expect(FLIGHT_STEPS.map((s) => s.id)).toEqual([
      "flight-tap",
      "flight-measure",
      "flight-launch",
      "flight-land",
      "flight-batch-complete",
    ]);
    for (const step of FLIGHT_STEPS) {
      expect(stepDef(step.id)).toBe(step);
      expect(stepIndex(step.id)).toBeGreaterThanOrEqual(0);
    }
    expect(ANIMATION_MACHINE_MODEL.flightSteps).toBe(FLIGHT_STEPS);
  });

  it("adds the flight-layer lane with its runtime nodes", () => {
    const laneIds = ANIMATION_MACHINE_MODEL.lanes.map((lane) => lane.id);
    expect(laneIds).toContain("flight-layer");

    const flightNodes = ANIMATION_MACHINE_MODEL.nodes.filter(
      (n) => n.lane === "flight-layer",
    );
    expect(flightNodes.map((n) => n.id)).toEqual(
      expect.arrayContaining(["flight-clones", "flight-settled", "flight-batch"]),
    );
  });

  it("seeds an idle flight-layer runtime slice", () => {
    expect(DEFAULT_ANIMATION_MACHINE_RUNTIME.flightLayer).toEqual({
      inFlightCount: 0,
      settledCount: 0,
      batchRemaining: 0,
    });
  });

  it("merges and activates the flight-layer slice without touching others", () => {
    const next = mergeAnimationMachineRuntime(DEFAULT_ANIMATION_MACHINE_RUNTIME, {
      flightLayer: { inFlightCount: 2, settledCount: 1, batchRemaining: 3 },
    });
    expect(next.flightLayer).toEqual({
      inFlightCount: 2,
      settledCount: 1,
      batchRemaining: 3,
    });
    expect(next.deckShell).toBe(DEFAULT_ANIMATION_MACHINE_RUNTIME.deckShell);

    const snapshot = buildAnimationMachineSnapshot(next, DEBUG_OFF);
    expect(snapshot.activeNodeIds).toEqual(
      expect.arrayContaining(["flight-clones", "flight-settled", "flight-batch"]),
    );
    // In-flight clones must not read as a fully reset machine.
    expect(snapshot.resetNodeIds).not.toContain("debug-reset");
  });

  it("lights the flight + flush transitions when their steps are reached", () => {
    const flightPath = [...FLIGHT_STEPS.map((s) => s.id), "flights-flushed"];
    const snapshot = buildAnimationMachineSnapshot(DEFAULT_ANIMATION_MACHINE_RUNTIME, {
      ...DEBUG_OFF,
      enabled: true,
      mode: "stepped",
      reachedSteps: flightPath,
    });
    expect(snapshot.activeTransitionIds).toEqual(
      expect.arrayContaining([
        "flight-tap",
        "flight-measure",
        "flight-land",
        "flight-batch-complete",
        "deck-flights-flushed",
      ]),
    );
  });
});
