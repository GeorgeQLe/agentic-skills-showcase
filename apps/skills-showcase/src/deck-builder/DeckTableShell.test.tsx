import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// Two skills in one pack so the "market-intel" deck
// (packs: business-discovery + customer-lifecycle) resolves to a non-empty
// deck; every other set resolves empty and is filtered out by buildDecks.
// Full skill shape — the fan now renders SkillCard (tags/description/platform/
// scope/version), not a bare title button, so the fixtures carry those fields.
const skills = [
  {
    id: "skill-a", name: "skill-a", title: "Skill A", pack: "business-discovery",
    description: "Skill A desc", platform: "claude", scope: "global", version: "v0.0", tags: ["x"],
  },
  {
    id: "skill-b", name: "skill-b", title: "Skill B", pack: "business-discovery",
    description: "Skill B desc", platform: "claude", scope: "global", version: "v0.0", tags: ["y"],
  },
];

vi.mock("@/hooks/useSkillsData", () => ({
  useSkillsData: () => ({ skills, skillCount: skills.length }),
  getGlobalSkills: () => [],
  getPackSkills: (_all: unknown[], packName: string) =>
    packName === "business-discovery" ? skills : [],
}));

import DeckTableShell from "./DeckTableShell";

const SLUG = "market-intel";
const STORAGE_KEY = `deck:${SLUG}:collected`;

// The test runner's localStorage is partial (no .clear); use a Map-backed stub.
function installLocalStorage() {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: stub,
  });
}

function phase(): string | null {
  return screen.getByTestId("deck-phase").textContent;
}

// jsdom never fires framer's onLayoutAnimationComplete, so the morph boundaries
// are driven through the window test bridge the shell exposes.
function fireOpenMorphComplete() {
  act(() => window.__deckMorphComplete?.open());
}
function fireCloseMorphComplete() {
  act(() => window.__deckMorphComplete?.close());
}

// framer's imperative animate() never settles deterministically under jsdom, so
// flight landings are driven through the window bridge BuilderPanel exposes
// (mirrors the morph bridge above).
function landAllFlights() {
  act(() => window.__deckFlight?.landAll());
}
function inFlightIds(): string[] {
  return window.__deckFlight?.inFlight() ?? [];
}

// The card-flight source is now the torn-pack fan, not a flat shelf. jsdom can't
// perform the SealedPack drag gesture, so the ritual is driven through the
// window bridge BuilderPackFlow exposes (mirrors the flight/morph bridges).
function openPack() {
  act(() => window.__deckPack?.open());
}
function packPhase(): string | null {
  return screen.getByTestId("deck-pack-phase").textContent;
}

// Force prefers-reduced-motion for the crossfade-path test. Default tests leave
// matchMedia undefined (optional-chained to `false` = full-motion path).
function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("DeckTableShell blueprint-morph", () => {
  beforeEach(() => {
    installLocalStorage();
    window.history.pushState({}, "", "/prototype/deck-routing-spike");
  });

  afterEach(() => {
    cleanup();
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  it("open phase order: table -> blueprint-morphing -> builder-open (advances only on morph complete)", () => {
    render(<DeckTableShell />);

    expect(phase()).toBe("table");
    expect(screen.queryByTestId("deck-builder-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`deck-blueprint-${SLUG}`));

    // Parks on blueprint-morphing — the panel mounts (it owns the layoutId) but
    // the phase does not advance until the morph lands.
    expect(phase()).toBe("blueprint-morphing");
    expect(screen.getByTestId("deck-builder-panel")).toBeInTheDocument();

    fireOpenMorphComplete();

    expect(phase()).toBe("builder-open");
  });

  it("ignores blueprint taps while blueprint-morphing", () => {
    render(<DeckTableShell />);

    fireEvent.click(screen.getByTestId(`deck-blueprint-${SLUG}`));
    expect(phase()).toBe("blueprint-morphing");

    // A second tap mid-morph is a no-op (contract A interruption rule).
    fireEvent.click(screen.getByTestId(`deck-blueprint-${SLUG}`));
    expect(phase()).toBe("blueprint-morphing");
  });

  it("close phase order: builder-open -> builder-dismissing -> table; completion fires once", () => {
    render(<DeckTableShell />);

    fireEvent.click(screen.getByTestId(`deck-blueprint-${SLUG}`));
    fireOpenMorphComplete();
    expect(phase()).toBe("builder-open");

    fireEvent.click(screen.getByTestId("deck-back"));

    // Parks on builder-dismissing until the morph-back lands.
    expect(phase()).toBe("builder-dismissing");

    fireCloseMorphComplete();
    expect(phase()).toBe("table");

    // One-shot: a duplicate completion callback is ignored, phase stays table.
    fireCloseMorphComplete();
    expect(phase()).toBe("table");
    // (The panel's DOM unmount is driven by AnimatePresence exit, asserted in
    // the Playwright spec where framer actually animates.)
  });

  it("reduced motion runs the identical phase chain (open + close) without a layout callback", () => {
    mockReducedMotion(true);
    render(<DeckTableShell />);

    expect(phase()).toBe("table");

    // Crossfade path: openDeck fires the completion synchronously, so the phase
    // lands on builder-open within the same event — no morph callback needed.
    fireEvent.click(screen.getByTestId(`deck-blueprint-${SLUG}`));
    expect(phase()).toBe("builder-open");
    expect(screen.getByTestId("deck-builder-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("deck-back"));
    expect(phase()).toBe("table");
  });

  it("hard-loads /deck/[slug] straight into builder-open with no morph phase", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);

    expect(phase()).toBe("builder-open");
    expect(screen.getByTestId("deck-entry-mode").textContent).toBe("hard-load");
    expect(screen.getByTestId("deck-builder-panel")).toBeInTheDocument();
  });

  it("pack ritual: sealed -> drawer-open on open, closing-collapse on close", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);

    expect(packPhase()).toBe("sealed");

    openPack();
    expect(packPhase()).toBe("drawer-open");
    // The fanned cards (the card-flight source) are now mounted in the sheet.
    expect(screen.getByTestId("deck-card-skill-a")).toBeInTheDocument();
    expect(screen.getByTestId("deck-card-skill-b")).toBeInTheDocument();

    act(() => window.__deckPack?.close());
    expect(packPhase()).toBe("closing-collapse");
  });

  it("card-flight: optimistic commit on tap, slot/counter tick only on land", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("0 / 2 collected");

    openPack();
    const card = screen.getByTestId("deck-card-skill-a");
    expect(card).toHaveAttribute("data-collected", "false");

    fireEvent.click(card);

    // Commit is optimistic: the fan card dims with its "in deck" badge and
    // localStorage persists from the tap frame...
    expect(screen.getByTestId("deck-card-skill-a")).toHaveAttribute("data-collected", "true");
    expect(screen.getByTestId("deck-card-badge-skill-a")).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(["skill-a"]));
    // ...but the slot stays empty and the counter does not tick until the clone
    // lands (§B "never: slot filling before the clone lands").
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("0 / 2 collected");
    expect(screen.queryByTestId("deck-slot-card-skill-a")).not.toBeInTheDocument();
    expect(inFlightIds()).toEqual(["skill-a"]);

    landAllFlights();

    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");
    expect(screen.getByTestId("deck-slot-card-skill-a")).toBeInTheDocument();
    expect(inFlightIds()).toEqual([]);
  });

  it("card-flight: interrupt (close) reconciles the counter — finishAllFlightsImmediately", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    openPack();

    fireEvent.click(screen.getByTestId("deck-card-skill-a"));
    fireEvent.click(screen.getByTestId("deck-card-skill-b"));
    // Both committed and in-flight; counter still lagging at the settled count.
    expect(inFlightIds().sort()).toEqual(["skill-a", "skill-b"]);
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("0 / 2 collected");

    // Close mid-flight: closeDeck runs finishAllFlightsImmediately() before the
    // dismiss, snapping every flight to end and reconciling the counter — no
    // desync (§B "never: counter desync after interruptions").
    fireEvent.click(screen.getByTestId("deck-back"));

    expect(inFlightIds()).toEqual([]);
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("2 / 2 collected");
  });

  it("re-tap of a collected or in-flight card is a no-op", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    openPack();

    const card = () => screen.getByTestId("deck-card-skill-a");
    fireEvent.click(card()); // commits + launches one flight
    fireEvent.click(card()); // in-flight re-tap: ignored
    expect(inFlightIds()).toEqual(["skill-a"]);

    landAllFlights();
    fireEvent.click(card()); // collected re-tap: ignored

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(["skill-a"]));
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");
    expect(inFlightIds()).toEqual([]);
  });

  it("add-all: collect-all commits every card up front and lands the staggered batch", () => {
    vi.useFakeTimers();
    try {
      render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
      openPack();

      fireEvent.click(screen.getByTestId("deck-collect-all"));

      // Every uncollected card commits in the same frame (all fan cards dim)...
      expect(screen.getByTestId("deck-card-skill-a")).toHaveAttribute("data-collected", "true");
      expect(screen.getByTestId("deck-card-skill-b")).toHaveAttribute("data-collected", "true");
      expect(screen.getByTestId("deck-collected-count").textContent).toBe("0 / 2 collected");

      // ...but the clones launch on a 70 ms-per-flight stagger.
      act(() => vi.advanceTimersByTime(70 * 2 + 10));
      expect(inFlightIds().sort()).toEqual(["skill-a", "skill-b"]);
    } finally {
      vi.useRealTimers();
    }

    landAllFlights();

    expect(screen.getByTestId("deck-collected-count").textContent).toBe("2 / 2 collected");
    expect(screen.getByTestId("deck-collect-all")).toBeDisabled();
  });

  it("reduced motion fills slots with no clone and ticks the counter immediately", () => {
    mockReducedMotion(true);
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    openPack();

    fireEvent.click(screen.getByTestId("deck-card-skill-a"));

    // No clone is ever in flight; the slot fills and the counter ticks in the
    // same frame (§E reduced-motion fill).
    expect(inFlightIds()).toEqual([]);
    expect(screen.getByTestId("deck-slot-card-skill-a")).toBeInTheDocument();
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");
  });

  it("hydrates collected state from localStorage on hard-load", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["skill-b"]));

    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    // The counter reflects hydrated state immediately; the per-card "in deck"
    // dim/badge lives on the fanned card, so open the pack to assert it.
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");

    openPack();
    expect(screen.getByTestId("deck-card-skill-b")).toHaveAttribute("data-collected", "true");
  });

  it("overlay row: empty until a card settles, reflects settled cards, with the fan closed", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);

    // The row is always visible in the builder, independent of the pack fan.
    expect(screen.getByTestId("deck-overlay-row")).toBeInTheDocument();
    expect(screen.getByTestId("deck-overlay-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("deck-overlay-chip-skill-a")).not.toBeInTheDocument();

    openPack();
    fireEvent.click(screen.getByTestId("deck-card-skill-a"));

    // Off settledIds, not the optimistic commit: no chip until the clone lands.
    expect(screen.queryByTestId("deck-overlay-chip-skill-a")).not.toBeInTheDocument();

    landAllFlights();

    // The chip appears and the empty state clears the frame the slot fills.
    expect(screen.getByTestId("deck-overlay-chip-skill-a")).toBeInTheDocument();
    expect(screen.queryByTestId("deck-overlay-empty")).not.toBeInTheDocument();

    // Persists once the fan is collapsed — the row is the always-on readout.
    act(() => window.__deckPack?.close());
    expect(screen.getByTestId("deck-overlay-chip-skill-a")).toBeInTheDocument();
  });

  it("overlay row: hydrates from localStorage and reflects every settled card", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["skill-b"]));

    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    // Hydrated cards are settled on mount, so they show in the row immediately.
    expect(screen.getByTestId("deck-overlay-chip-skill-b")).toBeInTheDocument();
    expect(screen.queryByTestId("deck-overlay-empty")).not.toBeInTheDocument();

    openPack();
    fireEvent.click(screen.getByTestId("deck-card-skill-a"));
    landAllFlights();

    expect(screen.getByTestId("deck-overlay-chip-skill-a")).toBeInTheDocument();
    expect(screen.getByTestId("deck-overlay-chip-skill-b")).toBeInTheDocument();
  });

  it("wanted rims: first card of each empty phase glows; clears once its slot fills", () => {
    // Market Intel has two phases (LAB-01, LAB-02); skill-a maps to column 0,
    // skill-b to column 1, so both columns start empty and both cards are wanted.
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);
    openPack();

    expect(screen.getByTestId("deck-card-skill-a")).toHaveAttribute("data-wanted", "true");
    expect(screen.getByTestId("deck-card-skill-b")).toHaveAttribute("data-wanted", "true");

    // Collect skill-a: the optimistic commit clears its rim the same frame (a
    // collected card never glows), and its slot fills on land — skill-b, whose
    // LAB-02 column is still empty, keeps glowing.
    fireEvent.click(screen.getByTestId("deck-card-skill-a"));
    landAllFlights();

    expect(screen.getByTestId("deck-card-skill-a")).toHaveAttribute("data-wanted", "false");
    expect(screen.getByTestId("deck-slot-card-skill-a")).toBeInTheDocument();
    expect(screen.getByTestId("deck-card-skill-b")).toHaveAttribute("data-wanted", "true");

    // Filling the last empty column clears the last rim.
    fireEvent.click(screen.getByTestId("deck-card-skill-b"));
    landAllFlights();

    expect(screen.getByTestId("deck-card-skill-b")).toHaveAttribute("data-wanted", "false");
  });
});
