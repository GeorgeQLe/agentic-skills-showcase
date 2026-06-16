import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// Two skills in one pack so the "market-intel" deck
// (packs: business-discovery + customer-lifecycle) resolves to a non-empty
// deck; every other set resolves empty and is filtered out by buildDecks.
const skills = [
  { id: "skill-a", name: "skill-a", title: "Skill A", pack: "business-discovery" },
  { id: "skill-b", name: "skill-b", title: "Skill B", pack: "business-discovery" },
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

  it("collect toggles collectedCardIds and persists to localStorage", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);

    const card = screen.getByTestId("deck-card-skill-a");
    expect(card).toHaveAttribute("data-collected", "false");
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("0 / 2 collected");

    fireEvent.click(card);

    expect(screen.getByTestId("deck-card-skill-a")).toHaveAttribute("data-collected", "true");
    expect(screen.getByTestId("deck-card-badge-skill-a")).toBeInTheDocument();
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(["skill-a"]));
  });

  it("re-tap of a collected card is a no-op", () => {
    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);

    const card = () => screen.getByTestId("deck-card-skill-a");
    fireEvent.click(card());
    fireEvent.click(card());

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(["skill-a"]));
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");
  });

  it("hydrates collected state from localStorage on hard-load", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(["skill-b"]));

    render(<DeckTableShell hardLoad initialDeckSlug={SLUG} />);

    expect(screen.getByTestId("deck-card-skill-b")).toHaveAttribute("data-collected", "true");
    expect(screen.getByTestId("deck-collected-count").textContent).toBe("1 / 2 collected");
  });
});
