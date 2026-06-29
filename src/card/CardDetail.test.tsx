import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { Skill } from "@/hooks/useSkillsData";
import type { SkillsData } from "@/server/skillsData";
import { dedupeCards, decksForCard, getCardById } from "@/server/skillsData";
import CardDetail from "./CardDetail";

function makeSkill(over: Partial<Skill> & { id: string }): Skill {
  return {
    id: over.id,
    name: over.name ?? over.id,
    title: over.title ?? over.id,
    description: over.description ?? "A test skill.",
    type: over.type ?? "workflow",
    version: over.version ?? "v0.0",
    platform: over.platform ?? "claude",
    command: over.command ?? `/${over.id}`,
    scope: over.scope ?? "base",
    pack: over.pack ?? null,
    path: over.path ?? `base/claude/${over.id}/SKILL.md`,
    mirrorKey: over.mirrorKey,
    tags: over.tags ?? [],
    benchmarkEvidence: over.benchmarkEvidence ?? null,
  };
}

afterEach(cleanup);

describe("dedupeCards", () => {
  it("keeps one card per mirrorKey and prefers the claude variant (path-sorted)", () => {
    const skills = [
      makeSkill({ id: "codex-scan", mirrorKey: "scan", platform: "codex", path: "base/codex/scan/SKILL.md" }),
      makeSkill({ id: "claude-scan", mirrorKey: "scan", platform: "claude", path: "base/claude/scan/SKILL.md" }),
      makeSkill({ id: "claude-ship", mirrorKey: "ship", platform: "claude", path: "base/claude/ship/SKILL.md" }),
    ];
    const deduped = dedupeCards(skills);
    expect(deduped.map((s) => s.id)).toEqual(["claude-scan", "claude-ship"]);
  });

  it("falls back to name when a skill has no mirrorKey", () => {
    const skills = [
      makeSkill({ id: "a", mirrorKey: undefined, name: "solo", path: "base/claude/a/SKILL.md" }),
      makeSkill({ id: "b", mirrorKey: undefined, name: "solo", path: "base/codex/b/SKILL.md" }),
    ];
    expect(dedupeCards(skills).map((s) => s.id)).toEqual(["a"]);
  });
});

describe("decksForCard", () => {
  const data = {
    skills: [],
    decks: [
      { slug: "vard", name: "VARD", domain: "x", tempo: "y", phases: [
        { key: "scan", name: "Scan", suggestedCardIds: ["claude-scan"] },
      ] },
      { slug: "ord", name: "ORD", domain: "x", tempo: "y", phases: [
        { key: "ship", name: "Ship", suggestedCardIds: ["claude-ship", "claude-scan"] },
      ] },
    ],
    sets: [],
    generatedAt: "",
    skillCount: 0,
    packCount: 0,
  } as unknown as SkillsData;

  it("returns every deck whose phases suggest the card id", () => {
    expect(decksForCard(data, "claude-scan").map((d) => d.slug)).toEqual(["vard", "ord"]);
    expect(decksForCard(data, "claude-ship").map((d) => d.slug)).toEqual(["ord"]);
    expect(decksForCard(data, "unknown")).toEqual([]);
  });

  it("getCardById resolves and returns null for unknown ids", () => {
    const withSkills = { ...data, skills: [makeSkill({ id: "claude-scan" })] };
    expect(getCardById(withSkills, "claude-scan")?.id).toBe("claude-scan");
    expect(getCardById(withSkills, "nope")).toBeNull();
  });
});

describe("CardDetail", () => {
  it("renders the card facts, benchmark table, and deck chips", () => {
    const skill = makeSkill({
      id: "claude-scan",
      title: "Scan",
      description: "Scan the thing.",
      tags: ["scan", "base"],
      benchmarkEvidence: {
        skill: "scan",
        date: "2026-01-01",
        verify: { layer1: "ok", layer2: "ok" },
        agents: [
          { agent: "claude", passRate: "9/10", passRatePercent: 90, costPerRun: "$0.10" },
        ],
      },
    });
    render(<CardDetail skill={skill} decks={[{ slug: "vard", name: "VARD" }]} />);

    expect(screen.getByTestId("card-detail")).toHaveAttribute("data-card-id", "claude-scan");
    expect(screen.getAllByText("Scan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Scan the thing.").length).toBeGreaterThan(0);
    // Benchmark grade badge + per-agent pass rate.
    expect(screen.getByTestId("card-detail-grade")).toHaveTextContent("A");
    expect(screen.getByText("9/10")).toBeInTheDocument();
    // Deck chip links to the deck route.
    expect(screen.getByTestId("card-detail-deck-vard")).toHaveAttribute("href", "/deck/vard");
  });

  it("shows an empty-benchmark and empty-deck state when there is no evidence", () => {
    const skill = makeSkill({ id: "claude-solo", title: "Solo" });
    render(<CardDetail skill={skill} decks={[]} />);
    expect(screen.getByText("No benchmark evidence yet.")).toBeInTheDocument();
    expect(screen.getByText("Not part of any deck.")).toBeInTheDocument();
  });
});
