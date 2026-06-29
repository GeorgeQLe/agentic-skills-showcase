import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_STEPS, CLOSE_STEPS } from "./steps";
import {
  ANIMATION_MACHINE_MODEL,
  DEFAULT_ANIMATION_MACHINE_RUNTIME,
  buildAnimationMachineSnapshot,
  closePathTransitionIds,
} from "./animationMachine";
import { renderAnimationStateMachineReferencePage } from "./animationMachineStaticPage";
import { STATE_MACHINE_GRAPH_MODEL } from "./AnimationMachineGraph";

describe("animation machine model", () => {
  it("maps every debug step to at least one graph node or transition", () => {
    const coveredStepIds = new Set<string>();

    for (const node of ANIMATION_MACHINE_MODEL.nodes) {
      if (node.stepId) coveredStepIds.add(node.stepId);
    }
    for (const transition of ANIMATION_MACHINE_MODEL.transitions) {
      if (transition.stepId) coveredStepIds.add(transition.stepId);
    }

    for (const step of ALL_STEPS) {
      expect(coveredStepIds.has(step.id), step.id).toBe(true);
    }
  });

  it("keeps apex metadata on apex step nodes", () => {
    const apexSteps = ALL_STEPS.filter((step) => step.apex);

    for (const step of apexSteps) {
      const matchingNodes = ANIMATION_MACHINE_MODEL.nodes.filter(
        (node) => node.stepId === step.id
      );

      expect(matchingNodes.some((node) => node.apex), step.id).toBe(true);
    }
  });

  it("uses valid node endpoints for every transition", () => {
    const nodeIds = new Set(ANIMATION_MACHINE_MODEL.nodes.map((node) => node.id));

    for (const transition of ANIMATION_MACHINE_MODEL.transitions) {
      expect(nodeIds.has(transition.from), `${transition.id} from`).toBe(true);
      expect(nodeIds.has(transition.to), `${transition.id} to`).toBe(true);
    }
  });

  it("uses the same model export for the live graph", () => {
    expect(STATE_MACHINE_GRAPH_MODEL).toBe(ANIMATION_MACHINE_MODEL);
  });

  it("keeps the static reference page generated from the same model", () => {
    const staticPath = resolve(
      __dirname,
      "../../../alignment/animation-state-machine.html"
    );
    const html = readFileSync(staticPath, "utf8");
    const embeddedJson = html.match(
      /<script id="animation-machine-data" type="application\/json" data-model-source="src\/components\/debug\/animationMachine\.ts">([^]*?)<\/script>/
    )?.[1];

    expect(html).toBe(renderAnimationStateMachineReferencePage());
    expect(embeddedJson).toBeTruthy();
    expect(JSON.parse(embeddedJson!.replace(/\\u003c/g, "<"))).toEqual(
      ANIMATION_MACHINE_MODEL
    );
  });

  it("highlights the full close path when close steps are reached", () => {
    const closePath = CLOSE_STEPS.map((step) => step.id);
    const snapshot = buildAnimationMachineSnapshot(
      DEFAULT_ANIMATION_MACHINE_RUNTIME,
      {
        enabled: true,
        mode: "stepped",
        pausedAtStep: "drop-elevation",
        reachedSteps: closePath,
        currentStepIndex: ALL_STEPS.length - 1,
      }
    );

    expect(closePathTransitionIds()).toEqual([
      "close-trigger",
      "collapse-measure",
      "collapse-fan",
      "collapse-complete",
      "drawer-teardown",
      "sheet-exit",
      "layout-morph-out",
      "drop-elevation",
    ]);
    expect(snapshot.activeTransitionIds).toEqual(closePath);
    expect(snapshot.activeNodeIds).toContain("step-drop-elevation");
  });

  it("clears active graph transitions on reset", () => {
    const snapshot = buildAnimationMachineSnapshot(
      DEFAULT_ANIMATION_MACHINE_RUNTIME,
      {
        enabled: true,
        mode: "stepped",
        pausedAtStep: null,
        reachedSteps: [],
        currentStepIndex: -1,
      }
    );

    expect(snapshot.activeTransitionIds).toEqual([]);
    expect(snapshot.activeNodeIds).toEqual([]);
    expect(snapshot.resetNodeIds).toEqual(["debug-reset"]);
  });
});
