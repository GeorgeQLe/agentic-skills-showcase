import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { Skill } from "@/hooks/useSkillsData";

const debugHarness = vi.hoisted(() => ({
  report: vi.fn(),
  mark: vi.fn(),
  gate: vi.fn(async () => {}),
}));

vi.mock("@/components/debug/DebugController", () => ({
  useDebug: () => ({
    enabled: false,
    report: debugHarness.report,
    mark: debugHarness.mark,
    gate: debugHarness.gate,
    scaleT: (t: unknown) => t,
  }),
}));

vi.mock("@/components/SkillCard", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({ skill }: { skill: Skill }) =>
      React.createElement("div", {
        "data-testid": `card-${skill.id}`,
        style: { width: 180, height: 252 },
      }),
  };
});

import PackOpener from "./PackOpener";

const CARD_WIDTH = 180;
const CARD_HEIGHT = 252;

function makeSkills(count: number): Skill[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `skill-${i}`,
    name: `skill-${i}`,
    title: `Skill ${i}`,
    description: "Test skill",
    type: "workflow",
    version: "v0.0",
    platform: "claude",
    command: `/skill-${i}`,
    scope: "pack",
    pack: "market-intel",
    path: `packs/market-intel/claude/skill-${i}/SKILL.md`,
    tags: [],
    benchmarkEvidence: null,
  }));
}

interface RectSpec {
  top: number;
  left: number;
  width?: number;
  height?: number;
}

function mockRect(el: Element, { top, left, width = CARD_WIDTH, height = CARD_HEIGHT }: RectSpec) {
  (el as HTMLElement).getBoundingClientRect = () =>
    ({
      top,
      left,
      bottom: top + height,
      right: left + width,
      width,
      height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

// Renders PackOpener inside a scrollable drawer viewport (top 0, bottom 600),
// pins each card to the given client rect to simulate a scrolled card grid,
// then flips isClosing so the collapse effect measures those positions.
function renderClose(cardPositions: RectSpec[]) {
  const skills = makeSkills(cardPositions.length);
  const ui = (isClosing: boolean) => (
    <div data-testid="drawer-scroll" style={{ overflowY: "auto" }}>
      <PackOpener
        skills={skills}
        packName="market-intel"
        origin={{ x: 0, y: 0 }}
        isClosing={isClosing}
      />
    </div>
  );

  const view = render(ui(false));
  const scrollEl = view.getByTestId("drawer-scroll");
  mockRect(scrollEl, { top: 0, left: 0, width: 800, height: 600 });

  const cardsContainer = scrollEl.querySelector(".flex.flex-wrap") as HTMLElement;
  expect(cardsContainer).not.toBeNull();
  const cards = Array.from(cardsContainer.children);
  expect(cards).toHaveLength(cardPositions.length);
  cards.forEach((card, i) => mockRect(card, cardPositions[i]));

  view.rerender(ui(true));
  return view;
}

function latestCollapseReport() {
  const drawers = debugHarness.report.mock.calls
    .map(([arg]) => arg?.machine?.drawer)
    .filter((d) => d?.collapseState && typeof d.animatedSetSize === "number");
  return drawers[drawers.length - 1];
}

describe("PackOpener collapse target selection", () => {
  beforeEach(() => {
    debugHarness.report.mockClear();
    debugHarness.mark.mockClear();
    debugHarness.gate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("collapses onto card 0 when the drawer is not scrolled", () => {
    renderClose([
      { top: 20, left: 100 },
      { top: 20, left: 300 },
      { top: 290, left: 100 },
      { top: 290, left: 300 },
    ]);

    const report = latestCollapseReport();
    expect(report.targetIndex).toBe(0);
    expect(report.collapseState.targetIndex).toBe(0);
    expect(report.collapseState.offsets[0]).toEqual({ x: 0, y: 0 });
    // Every other card converges on card 0's position.
    expect(report.collapseState.offsets[1]).toEqual({ x: -200, y: 0 });
    expect(report.collapseState.offsets[2]).toEqual({ x: 0, y: -270 });
  });

  it("collapses onto the visible top-left card after scrolling past the first row", () => {
    // Row 0 is fully above the viewport (bottom -48 < 0): the user scrolled down.
    renderClose([
      { top: -300, left: 100 },
      { top: -300, left: 300 },
      { top: 20, left: 100 },
      { top: 20, left: 300 },
      { top: 290, left: 100 },
      { top: 290, left: 300 },
    ]);

    const report = latestCollapseReport();
    expect(report.targetIndex).toBe(2);
    expect(report.collapseState.targetIndex).toBe(2);
    expect(report.collapseState.offsets[2]).toEqual({ x: 0, y: 0 });
    expect(report.collapseState.offsets[3]).toEqual({ x: -200, y: 0 });
    // Off-screen card 0 still converges on the visible target, not vice versa.
    expect(report.collapseState.offsets[0]).toEqual({ x: 0, y: 320 });
  });

  it("prefers the left-most card within the top visible row", () => {
    // DOM order puts index 2 to the right of index 3 in the same row.
    renderClose([
      { top: -300, left: 100 },
      { top: -300, left: 300 },
      { top: 20, left: 300 },
      { top: 20, left: 100 },
      { top: 290, left: 100 },
      { top: 290, left: 300 },
    ]);

    const report = latestCollapseReport();
    expect(report.targetIndex).toBe(3);
    expect(report.collapseState.offsets[3]).toEqual({ x: 0, y: 0 });
    expect(report.collapseState.offsets[2]).toEqual({ x: -200, y: 0 });
  });

  it("treats a partially visible top row as visible", () => {
    // Row 0 pokes above the viewport but its bottom edge is still on screen.
    renderClose([
      { top: -100, left: 100 },
      { top: -100, left: 300 },
      { top: 170, left: 100 },
      { top: 170, left: 300 },
    ]);

    const report = latestCollapseReport();
    expect(report.targetIndex).toBe(0);
    expect(report.collapseState.offsets[0]).toEqual({ x: 0, y: 0 });
  });
});
