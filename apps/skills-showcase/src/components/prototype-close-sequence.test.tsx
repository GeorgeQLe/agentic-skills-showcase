import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type ReactNode } from "react";

const debugHarness = vi.hoisted(() => ({
  drivers: {} as Record<string, (() => void) | undefined>,
  sealedPackResetValues: vi.fn(),
  debug: {
    mark: vi.fn(),
    report: vi.fn(),
    registerDrivers: vi.fn((drivers: Record<string, (() => void) | undefined>) => {
      Object.assign(debugHarness.drivers, drivers);
    }),
  },
}));

vi.mock("@/components/debug/DebugController", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    DebugProvider: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useDebug: () => debugHarness.debug,
  };
});

vi.mock("@/components/debug/DebugPanel", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useSkillsData", () => {
  const skills = [
    {
      id: "skill-0",
      name: "Skill 0",
      description: "Test skill",
      source: "business-discovery",
      pack: "business-discovery",
    },
  ];

  return {
    useSkillsData: () => ({ skills, skillCount: 1 }),
    getGlobalSkills: () => [],
    getPackSkills: (_allSkills: unknown[], packName: string) =>
      packName === "business-discovery" ? skills : [],
  };
});

vi.mock("@/components/SealedPack", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  const MockSealedPack = React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({
      openViaClick: () => props.onOpen({ x: 100, y: 100 }),
      openViaTear: () => props.onOpen({ x: 100, y: 100 }),
      resetValues: debugHarness.sealedPackResetValues,
    }));

    return React.createElement(
      "div",
      {
        "data-testid": `pack-${props.name}`,
        "data-drawer-open": String(!!props.isDrawerOpen),
        "data-flow-phase": props.flowPhase,
      },
      React.createElement(
        "button",
        {
          "data-testid": `pack-open-${props.name}`,
          onClick: () => props.onOpen({ x: 100, y: 100 }),
        },
        props.name
      ),
      React.createElement("button", {
        "data-testid": `pack-settle-${props.name}`,
        onClick: props.onCardSettleComplete,
      })
    );
  });
  MockSealedPack.displayName = "MockSealedPack";

  return { default: MockSealedPack };
});

vi.mock("@/components/BottomSheet", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({ isOpen, onClose, onExitComplete, dismissable, children }: any) =>
      React.createElement(
        "section",
        {
          "data-testid": "bottom-sheet",
          "data-open": String(!!isOpen),
          "data-dismissable": String(!!dismissable),
        },
        React.createElement("button", {
          "data-testid": "sheet-close",
          onClick: onClose,
        }),
        React.createElement("button", {
          "data-testid": "sheet-exit",
          onClick: onExitComplete,
        }),
        isOpen ? children : null
      ),
  };
});

vi.mock("@/components/PackOpener", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({ isClosing, isRisingToApex, onCollapseComplete, onApexComplete }: any) =>
      React.createElement(
        "section",
        {
          "data-testid": "pack-opener",
          "data-closing": String(!!isClosing),
          "data-rising": String(!!isRisingToApex),
        },
        React.createElement("button", {
          "data-testid": "collapse-complete",
          onClick: onCollapseComplete,
        }),
        React.createElement("button", {
          "data-testid": "apex-complete",
          onClick: onApexComplete,
        })
      ),
  };
});

import PrototypePage from "../../app/prototype/page";

describe("prototype close sequence", () => {
  beforeEach(() => {
    debugHarness.debug.mark.mockClear();
    debugHarness.debug.report.mockClear();
    debugHarness.debug.registerDrivers.mockClear();
    debugHarness.sealedPackResetValues.mockClear();
    for (const key of Object.keys(debugHarness.drivers)) {
      delete debugHarness.drivers[key];
    }
  });

  afterEach(() => {
    cleanup();
  });

  function expectLatestPageState(expected: Record<string, unknown>) {
    expect(debugHarness.debug.report).toHaveBeenCalledWith({
      machine: {
        page: expect.objectContaining(expected),
      },
    });
  }

  it("walks the close phase chain without clearing activePack before card settles", () => {
    render(<PrototypePage />);

    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByTestId("pack-open-market-intel"));

    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-dismissable", "true");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-closing", "false");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "true");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-flow-phase", "drawer-open");
    expectLatestPageState({
      phase: "drawer-open",
      activePack: "market-intel",
      isSheetOpen: true,
      isDrawerClosing: false,
      canDismiss: true,
    });

    fireEvent.click(screen.getByTestId("sheet-close"));

    expect(debugHarness.debug.mark).toHaveBeenCalledWith("close-trigger");
    expectLatestPageState({
      phase: "closing-collapse",
      activePack: "market-intel",
      isSheetOpen: true,
      isDrawerClosing: true,
      canDismiss: false,
    });
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-dismissable", "false");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-closing", "true");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "true");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-flow-phase", "closing-collapse");

    fireEvent.click(screen.getByTestId("collapse-complete"));

    expect(debugHarness.debug.mark).toHaveBeenCalledWith("drawer-teardown");
    expectLatestPageState({
      phase: "closing-apex",
      activePack: "market-intel",
      isSheetOpen: true,
      isDrawerClosing: true,
      canDismiss: false,
    });
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-rising", "true");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "true");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-flow-phase", "closing-apex");

    fireEvent.click(screen.getByTestId("apex-complete"));

    expectLatestPageState({
      phase: "sheet-exiting",
      activePack: "market-intel",
      isSheetOpen: false,
      isDrawerClosing: false,
      canDismiss: false,
    });
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("pack-opener")).not.toBeInTheDocument();
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "false");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-flow-phase", "sheet-exiting");

    fireEvent.click(screen.getByTestId("sheet-exit"));

    expectLatestPageState({
      phase: "card-settling",
      activePack: "market-intel",
      isSheetOpen: false,
    });
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "false");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-flow-phase", "card-settling");

    fireEvent.click(screen.getByTestId("pack-settle-market-intel"));

    expectLatestPageState({
      phase: "sealed",
      activePack: null,
      isSheetOpen: false,
      isDrawerClosing: false,
      canDismiss: false,
    });
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "false");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-flow-phase", "sealed");
  });

  it("lets the registered debug close driver start the same collapse handoff", () => {
    render(<PrototypePage />);

    fireEvent.click(screen.getByTestId("pack-open-market-intel"));

    act(() => {
      debugHarness.drivers.close?.();
    });

    expect(debugHarness.debug.mark).toHaveBeenCalledWith("close-trigger");
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-closing", "true");
    expect(screen.getByTestId("pack-market-intel")).toHaveAttribute("data-drawer-open", "true");
    expectLatestPageState({
      phase: "closing-collapse",
      activePack: "market-intel",
    });
  });

  it("reset seals the phase, clears pack identity and opened packs, and resets target values", () => {
    render(<PrototypePage />);

    fireEvent.click(screen.getByTestId("pack-open-market-intel"));

    act(() => {
      debugHarness.drivers.reset?.();
    });

    expect(debugHarness.debug.report).toHaveBeenCalledWith({
      machine: {
        page: {
          phase: "sealed",
          activePack: null,
          openedPacks: [],
          isSheetOpen: false,
          isDrawerClosing: false,
          canDismiss: false,
        },
      },
    });
    expect(debugHarness.sealedPackResetValues).toHaveBeenCalledTimes(1);
  });

  it("keeps the card-settling debug gate before elevation drops", () => {
    const source = readFileSync(resolve(__dirname, "SealedPack.tsx"), "utf8");
    const settlingHandler = source.slice(source.indexOf('flowPhaseRef.current === "card-settling"'));

    const settlingGate = settlingHandler.indexOf('await dbg.gate("card-settling")');
    const elevationDrop = settlingHandler.indexOf("setCardElevated(false)");

    expect(settlingGate).toBeGreaterThanOrEqual(0);
    expect(elevationDrop).toBeGreaterThan(settlingGate);
  });

  it("keeps the fallback card-settling debug gate before elevation drops", () => {
    const source = readFileSync(resolve(__dirname, "SealedPack.tsx"), "utf8");
    const fallbackEffect = source.slice(source.indexOf('flowPhase === "card-settling"'));

    const fallbackGate = fallbackEffect.indexOf('await dbg.gate("card-settling")');
    const elevationDrop = fallbackEffect.indexOf("setCardElevated(false)");

    expect(fallbackGate).toBeGreaterThanOrEqual(0);
    expect(elevationDrop).toBeGreaterThan(fallbackGate);
  });

  it("guards PackOpener collapse completion as a one-shot handoff", () => {
    const source = readFileSync(resolve(__dirname, "PackOpener.tsx"), "utf8");
    const completeCollapse = source.slice(source.indexOf("const completeCollapse"));

    expect(source).toContain("const collapseCompleteFiredRef = useRef(false)");
    expect(completeCollapse).toContain("if (collapseCompleteFiredRef.current) return;");
    expect(completeCollapse).toContain('dbgRef.current.gate("collapse-complete")');
    expect(source).toContain("if (skills.length <= 1)");
  });

  it("does not keep page-level lifecycle boolean state declarations", () => {
    const source = readFileSync(
      resolve(__dirname, "../../app/prototype/page.tsx"),
      "utf8"
    );

    expect(source).not.toContain("const [isSheetMounted");
    expect(source).not.toContain("const [isDrawerClosing");
    expect(source).not.toContain("const isDrawerClosing");
    expect(source).not.toContain("isDrawerClosingRef");
    expect(source).not.toContain("setIsSheetMounted");
    expect(source).not.toContain("setIsDrawerClosing");
  });
});
