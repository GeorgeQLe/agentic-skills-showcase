import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// Two domains so the picker → CTA reactivity (and domain switch) is exercised.
// Each pack carries at least one skill so the allotment shelf is non-empty, and
// each deck resolves to a non-empty builder so the mounted hand-off table is real.
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

describe("LandingExperience", () => {
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

  it("renders the picker with a tile per domain, business picked by default", () => {
    render(<LandingExperience />);
    expect(screen.getByTestId("landing-domain-business")).toHaveAttribute("data-picked", "true");
    expect(screen.getByTestId("landing-domain-game")).toHaveAttribute("data-picked", "false");
    // Default CTA sub-label reflects the business allotment (2 packs, 2 skills).
    expect(screen.getByTestId("landing-cta-sub")).toHaveTextContent("2 packs · 2 skills");
    expect(screen.getByTestId("landing-cta")).toHaveTextContent("Open your Business starter packs");
  });

  it("picking a domain updates the CTA sub-label and label", () => {
    render(<LandingExperience />);
    fireEvent.click(screen.getByTestId("landing-domain-game"));
    expect(screen.getByTestId("landing-domain-game")).toHaveAttribute("data-picked", "true");
    expect(screen.getByTestId("landing-cta-sub")).toHaveTextContent("1 packs · 1 skills");
    expect(screen.getByTestId("landing-cta")).toHaveTextContent("Open your Game starter packs");
  });

  it("the CTA deals the picked domain's pack allotment", () => {
    render(<LandingExperience />);
    fireEvent.click(screen.getByTestId("landing-cta"));
    // The journey starts: a sealed pack per allotment pack, counter at 0 of N.
    expect(screen.getByTestId("landing-pack-shelf")).toBeInTheDocument();
    expect(screen.getByTestId("landing-pack-vard")).toBeInTheDocument();
    expect(screen.getByTestId("landing-pack-business-research")).toBeInTheDocument();
    expect(screen.getByTestId("landing-counter")).toHaveTextContent("Pack 0 of 2 opened");
    // No hand-off yet — packs are still sealed.
    expect(screen.queryByTestId("landing-handoff")).not.toBeInTheDocument();
  });

  it("surfaces the hand-off chooser once every allotment pack is opened", () => {
    render(<LandingExperience />);
    fireEvent.click(screen.getByTestId("landing-cta"));
    // Drive the opened-pack set through the test bridge (jsdom can't tear packs).
    act(() => {
      (window as unknown as { __landing: { openAll: () => void } }).__landing.openAll();
    });
    expect(screen.getByTestId("landing-counter")).toHaveTextContent("Pack 2 of 2 opened");
    const handoff = screen.getByTestId("landing-handoff");
    expect(handoff).toBeInTheDocument();
    // Starter = the curated non-AFPS business deck (VARD) → /deck/vard.
    expect(screen.getByTestId("landing-handoff-starter")).toHaveAttribute("href", "/deck/vard");
    // The other domain deck appears in the blueprint strip.
    expect(
      screen.getByTestId("landing-handoff-blueprint-business-afps"),
    ).toHaveAttribute("href", "/deck/business-afps");
  });

  it("the hand-off starter falls back to the AFPS deck for single-deck domains", () => {
    render(<LandingExperience />);
    fireEvent.click(screen.getByTestId("landing-domain-game"));
    fireEvent.click(screen.getByTestId("landing-cta"));
    act(() => {
      (window as unknown as { __landing: { openAll: () => void } }).__landing.openAll();
    });
    expect(screen.getByTestId("landing-handoff-starter")).toHaveAttribute("href", "/deck/game-afps");
  });

  it("mounts the deck blueprint table below the journey (hand-off destination)", () => {
    render(<LandingExperience />);
    // The table is present from first paint in `table` phase, with its blueprints.
    expect(screen.getByTestId("landing-table")).toBeInTheDocument();
    expect(screen.getByTestId("deck-table-surface")).toBeInTheDocument();
    expect(screen.getByTestId("deck-blueprint-vard")).toBeInTheDocument();
  });
});
