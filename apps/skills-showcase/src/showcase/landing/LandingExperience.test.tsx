import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

// Staged journey: Select (project/goal) → Open (pack allotment) → Build (table).
// jsdom can't tear packs or run framer transitions, so the stage flow is driven
// through the window.__landing bridge (select/build/openAll/back).
const skills = [
  {
    id: "skill-a", name: "skill-a", title: "Skill A", pack: "vard",
    description: "A", platform: "claude", scope: "pack", version: "v0.0", type: "research", tags: ["x"],
  },
  {
    id: "skill-b", name: "skill-b", title: "Skill B", pack: "business-research",
    description: "B", platform: "claude", scope: "pack", version: "v0.0", type: "research", tags: ["y"],
  },
  {
    id: "skill-c", name: "skill-c", title: "Skill C", pack: "game",
    description: "C", platform: "claude", scope: "pack", version: "v0.0", type: "design", tags: ["z"],
  },
];

const decks = [
  {
    slug: "vard", name: "VARD", domain: "business", tempo: "rapid",
    phases: [{ key: "scan", name: "Scan", suggestedCardIds: ["skill-a"] }],
  },
  {
    slug: "business-afps", name: "Business AFPS", domain: "business", tempo: "standard",
    phases: [{ key: "align", name: "Align", suggestedCardIds: ["skill-b"] }],
  },
  {
    slug: "game-afps", name: "Game AFPS", domain: "game", tempo: "rapid",
    phases: [{ key: "concept", name: "Concept", suggestedCardIds: ["skill-c"] }],
  },
];

const sets = [
  { domain: "business", decks: ["business-afps", "vard"], packs: ["vard", "business-research"] },
  { domain: "game", decks: ["game-afps"], packs: ["game"] },
];

vi.mock("@/hooks/useSkillsData", () => ({
  useSkillsData: () => ({ skills, skillCount: skills.length, packCount: 3, decks, sets }),
}));

import LandingExperience from "./LandingExperience";

type Bridge = {
  stage: () => number;
  select: (slug: string) => void;
  build: () => void;
  back: () => void;
  openAll: () => void;
};
const bridge = () => (window as unknown as { __landing: Bridge }).__landing;

describe("LandingExperience (staged journey)", () => {
  beforeEach(() => {
    // The mounted deck table reads localStorage; give it a working stub.
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        get length() { return store.size; },
        clear: () => store.clear(),
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        removeItem: (k: string) => store.delete(k),
        setItem: (k: string, v: string) => store.set(k, String(v)),
      },
    });
  });

  afterEach(() => {
    cleanup();
    delete (window as { __landing?: unknown }).__landing;
  });

  it("opens on Stage 1 SELECT with a goal-framed project per starter deck", () => {
    render(<LandingExperience />);
    expect(screen.getByTestId("landing")).toHaveAttribute("data-stage", "1");
    const vard = screen.getByTestId("landing-project-vard");
    expect(vard).toBeInTheDocument();
    // Goal framing (projectMeta), not the bare deck name.
    expect(vard).toHaveTextContent("Validate a business idea");
    expect(screen.getByTestId("landing-project-business-afps")).toBeInTheDocument();
    expect(screen.getByTestId("landing-project-game-afps")).toBeInTheDocument();
    // Secondary deck-centric list groups the same decks by domain.
    expect(screen.getByTestId("landing-deck-pick-vard")).toBeInTheDocument();
    expect(screen.getByTestId("landing-deck-pick-game-afps")).toBeInTheDocument();
  });

  it("the secondary deck list also advances to Stage 2", () => {
    render(<LandingExperience />);
    act(() => screen.getByTestId("landing-deck-pick-game-afps").click());
    expect(screen.getByTestId("landing")).toHaveAttribute("data-stage", "2");
    expect(screen.getByTestId("landing-pack-game")).toBeInTheDocument();
  });

  it("select(slug) advances to Stage 2 OPEN with the deck's pack allotment", () => {
    render(<LandingExperience />);
    act(() => bridge().select("vard"));
    expect(screen.getByTestId("landing")).toHaveAttribute("data-stage", "2");
    expect(screen.getByTestId("landing-pack-shelf")).toBeInTheDocument();
    expect(screen.getByTestId("landing-pack-vard")).toBeInTheDocument();
    expect(screen.getByTestId("landing-pack-business-research")).toBeInTheDocument();
    expect(screen.getByTestId("landing-counter")).toHaveTextContent("Pack 0 of 2 opened");
    expect(screen.queryByTestId("landing-handoff")).not.toBeInTheDocument();
  });

  it("openAll surfaces the hand-off chooser → /deck/<selected>", () => {
    render(<LandingExperience />);
    act(() => bridge().select("vard"));
    act(() => bridge().openAll());
    expect(screen.getByTestId("landing-counter")).toHaveTextContent("Pack 2 of 2 opened");
    expect(screen.getByTestId("landing-handoff")).toBeInTheDocument();
    expect(screen.getByTestId("landing-handoff-starter")).toHaveAttribute("href", "/deck/vard");
  });

  it("build() advances to Stage 3 with the deck table present", () => {
    render(<LandingExperience />);
    act(() => bridge().select("vard"));
    act(() => bridge().build());
    expect(screen.getByTestId("landing")).toHaveAttribute("data-stage", "3");
    expect(screen.getByTestId("landing-build-stage")).toHaveAttribute("data-stage-active", "true");
    expect(screen.getByTestId("deck-blueprint-vard")).toBeInTheDocument();
  });

  it("back() steps Stage 3 → 2 → 1", () => {
    render(<LandingExperience />);
    act(() => bridge().select("vard"));
    act(() => bridge().build());
    expect(bridge().stage()).toBe(3);
    act(() => bridge().back());
    expect(screen.getByTestId("landing")).toHaveAttribute("data-stage", "2");
    act(() => bridge().back());
    expect(screen.getByTestId("landing")).toHaveAttribute("data-stage", "1");
  });

  it("keeps the deck table mounted across every stage (mount stability)", () => {
    render(<LandingExperience />);
    // Stage 1: the build stage + its harness are already mounted (hidden).
    expect(screen.getByTestId("landing-build-stage")).toBeInTheDocument();
    expect(screen.getByTestId("deck-table-surface")).toBeInTheDocument();
    const surface = screen.getByTestId("deck-table-surface");

    act(() => bridge().select("vard"));
    expect(screen.getByTestId("deck-table-surface")).toBe(surface); // same node, not remounted

    act(() => bridge().build());
    expect(screen.getByTestId("deck-table-surface")).toBe(surface);
  });
});
