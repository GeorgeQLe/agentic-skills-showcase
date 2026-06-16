import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

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

describe("DeckTableShell skeleton", () => {
  beforeEach(() => {
    installLocalStorage();
    window.history.pushState({}, "", "/prototype/deck-routing-spike");
  });

  afterEach(() => {
    cleanup();
  });

  it("opens table -> builder-open and closes back to table", () => {
    render(<DeckTableShell />);

    expect(phase()).toBe("table");
    expect(screen.queryByTestId("deck-builder-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`deck-blueprint-${SLUG}`));

    expect(phase()).toBe("builder-open");
    expect(screen.getByTestId("deck-builder-panel")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("deck-back"));

    expect(phase()).toBe("table");
    expect(screen.queryByTestId("deck-builder-panel")).not.toBeInTheDocument();
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
