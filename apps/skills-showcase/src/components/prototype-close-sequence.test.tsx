import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type ReactNode } from "react";

const debugHarness = vi.hoisted(() => ({
  drivers: {} as Record<string, (() => void) | undefined>,
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
      source: "global",
    },
  ];

  return {
    useSkillsData: () => ({ skills }),
    getGlobalSkills: () => skills,
    getPackSkills: () => [],
  };
});

vi.mock("@/components/SealedPack", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  const MockSealedPack = React.forwardRef((props: any, ref) => {
    React.useImperativeHandle(ref, () => ({
      openViaClick: () => props.onOpen({ x: 100, y: 100 }),
      openViaTear: () => props.onOpen({ x: 100, y: 100 }),
      resetValues: vi.fn(),
    }));

    return React.createElement(
      "button",
      {
        "data-testid": `pack-${props.name}`,
        "data-drawer-open": String(!!props.isDrawerOpen),
        onClick: () => props.onOpen({ x: 100, y: 100 }),
      },
      props.name
    );
  });
  MockSealedPack.displayName = "MockSealedPack";

  return { default: MockSealedPack };
});

vi.mock("@/components/BottomSheet", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({ isOpen, onClose, onExitComplete, children }: any) =>
      React.createElement(
        "section",
        { "data-testid": "bottom-sheet", "data-open": String(!!isOpen) },
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
    default: ({ isClosing, onCollapseComplete }: any) =>
      React.createElement(
        "section",
        {
          "data-testid": "pack-opener",
          "data-closing": String(!!isClosing),
        },
        React.createElement("button", {
          "data-testid": "collapse-complete",
          onClick: onCollapseComplete,
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
    for (const key of Object.keys(debugHarness.drivers)) {
      delete debugHarness.drivers[key];
    }
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the sheet mounted until PackOpener reports collapse complete", () => {
    render(<PrototypePage />);

    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "false");

    fireEvent.click(screen.getByTestId("pack-global"));

    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-closing", "false");
    expect(screen.getByTestId("pack-global")).toHaveAttribute("data-drawer-open", "true");

    fireEvent.click(screen.getByTestId("sheet-close"));

    expect(debugHarness.debug.mark).toHaveBeenCalledWith("close-trigger");
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-closing", "true");
    expect(screen.getByTestId("pack-global")).toHaveAttribute("data-drawer-open", "true");

    fireEvent.click(screen.getByTestId("collapse-complete"));

    expect(debugHarness.debug.mark).toHaveBeenCalledWith("drawer-teardown");
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("pack-opener")).not.toBeInTheDocument();
    expect(screen.getByTestId("pack-global")).toHaveAttribute("data-drawer-open", "true");

    fireEvent.click(screen.getByTestId("sheet-exit"));

    expect(screen.getByTestId("pack-global")).toHaveAttribute("data-drawer-open", "false");
  });

  it("lets the registered debug close driver start the same collapse handoff", () => {
    render(<PrototypePage />);

    fireEvent.click(screen.getByTestId("pack-global"));

    act(() => {
      debugHarness.drivers.close?.();
    });

    expect(debugHarness.debug.mark).toHaveBeenCalledWith("close-trigger");
    expect(screen.getByTestId("bottom-sheet")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("pack-opener")).toHaveAttribute("data-closing", "true");
    expect(screen.getByTestId("pack-global")).toHaveAttribute("data-drawer-open", "true");
  });

  it("reports page machine state through close and reset", () => {
    render(<PrototypePage />);

    fireEvent.click(screen.getByTestId("pack-global"));

    expect(debugHarness.debug.report).toHaveBeenCalledWith({
      machine: {
        page: expect.objectContaining({
          openPack: "global",
          isSheetMounted: true,
          isDrawerClosing: false,
        }),
      },
    });

    fireEvent.click(screen.getByTestId("sheet-close"));

    expect(debugHarness.debug.report).toHaveBeenCalledWith({
      machine: {
        page: expect.objectContaining({
          openPack: "global",
          isSheetMounted: true,
          isDrawerClosing: true,
        }),
      },
    });

    act(() => {
      debugHarness.drivers.reset?.();
    });

    expect(debugHarness.debug.report).toHaveBeenCalledWith({
      machine: {
        page: {
          openPack: null,
          openedPacks: [],
          isDrawerClosing: false,
          isSheetMounted: false,
        },
      },
    });
  });

  it("keeps the close apex debug gates before elevation drops", () => {
    const source = readFileSync(resolve(__dirname, "SealedPack.tsx"), "utf8");
    const closeBranch = source.slice(source.indexOf("CLOSE morph-back"));

    const layoutMorphGate = closeBranch.indexOf('await dbg.gate("layout-morph-out")');
    const dropElevationGate = closeBranch.indexOf('await dbg.gate("drop-elevation")');
    const elevationDrop = closeBranch.indexOf("setCardElevated(false)");

    expect(layoutMorphGate).toBeGreaterThanOrEqual(0);
    expect(dropElevationGate).toBeGreaterThan(layoutMorphGate);
    expect(elevationDrop).toBeGreaterThan(dropElevationGate);
  });

  it("guards PackOpener collapse completion as a one-shot handoff", () => {
    const source = readFileSync(resolve(__dirname, "PackOpener.tsx"), "utf8");
    const completeCollapse = source.slice(source.indexOf("const completeCollapse"));

    expect(source).toContain("const collapseCompleteFiredRef = useRef(false)");
    expect(completeCollapse).toContain("if (collapseCompleteFiredRef.current) return;");
    expect(completeCollapse).toContain('dbgRef.current.gate("collapse-complete")');
    expect(source).toContain("if (skills.length <= 1)");
    expect(source).toContain("expectedCollapseRef.current = skills.length - 1");
  });
});
