import { describe, it, expect } from "vitest";
import type { Skill } from "@/hooks/useSkillsData";
import {
  dedupeSkills,
  deriveFacets,
  matches,
  filterSkills,
  hasActiveFilters,
  EMPTY_FILTERS,
} from "./useSkillFilters";

function skill(partial: Partial<Skill> & { id: string }): Skill {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    title: partial.title ?? partial.id,
    description: partial.description ?? "",
    type: partial.type ?? "research",
    version: partial.version ?? "v0.0",
    platform: partial.platform ?? "claude",
    command: partial.command ?? `/${partial.id}`,
    scope: partial.scope ?? "pack",
    pack: partial.pack ?? null,
    path: partial.path ?? `packs/x/${partial.id}/SKILL.md`,
    mirrorKey: partial.mirrorKey,
    tags: partial.tags ?? [],
    benchmarkEvidence: null,
  };
}

describe("dedupeSkills", () => {
  it("collapses mirrorKey pairs to one logical card (claude wins by path sort)", () => {
    const claude = skill({
      id: "c",
      name: "alpha",
      mirrorKey: "alpha",
      platform: "claude",
      path: "packs/x/claude/alpha/SKILL.md",
    });
    const codex = skill({
      id: "x",
      name: "alpha",
      mirrorKey: "alpha",
      platform: "codex",
      path: "packs/x/codex/alpha/SKILL.md",
    });
    const out = dedupeSkills([codex, claude]);
    expect(out).toHaveLength(1);
    expect(out[0].platform).toBe("claude");
  });

  it("falls back to name when no mirrorKey is present", () => {
    const a = skill({ id: "a", name: "solo", path: "packs/x/a/SKILL.md" });
    const b = skill({ id: "b", name: "solo", path: "packs/x/b/SKILL.md" });
    expect(dedupeSkills([a, b])).toHaveLength(1);
  });

  it("keeps distinct skills", () => {
    const a = skill({ id: "a", name: "a" });
    const b = skill({ id: "b", name: "b" });
    expect(dedupeSkills([a, b])).toHaveLength(2);
  });
});

describe("deriveFacets", () => {
  it("returns distinct, sorted type/platform/pack lists", () => {
    const skills = [
      skill({ id: "a", type: "review", platform: "codex", pack: "zeta" }),
      skill({ id: "b", type: "analysis", platform: "claude", pack: "alpha" }),
      skill({ id: "c", type: "review", platform: "claude", pack: "alpha" }),
      skill({ id: "d", type: "analysis", platform: "claude", pack: null }),
    ];
    const facets = deriveFacets(skills);
    expect(facets.types).toEqual(["analysis", "review"]);
    expect(facets.platforms).toEqual(["claude", "codex"]);
    expect(facets.packs).toEqual(["alpha", "zeta"]);
  });
});

describe("matches", () => {
  const s = skill({
    id: "a",
    name: "lean-canvas",
    title: "Lean Canvas",
    description: "Map the business model",
    tags: ["strategy", "validation"],
  });

  it("is true for empty query", () => {
    expect(matches(s, "")).toBe(true);
    expect(matches(s, "   ")).toBe(true);
  });

  it("matches case-insensitively over name/title/description/tags", () => {
    expect(matches(s, "LEAN")).toBe(true);
    expect(matches(s, "business model")).toBe(true);
    expect(matches(s, "validation")).toBe(true);
    expect(matches(s, "canvas")).toBe(true);
  });

  it("is false for a non-match", () => {
    expect(matches(s, "kubernetes")).toBe(false);
  });
});

describe("filterSkills", () => {
  const skills = [
    skill({ id: "a", title: "Alpha", type: "research", platform: "claude", pack: "p1", tags: ["x"] }),
    skill({ id: "b", title: "Beta", type: "review", platform: "codex", pack: "p1", tags: ["y"] }),
    skill({ id: "c", title: "Gamma", type: "research", platform: "claude", pack: "p2", tags: ["z"] }),
  ];

  it("returns all with empty filters", () => {
    expect(filterSkills(skills, EMPTY_FILTERS)).toHaveLength(3);
  });

  it("filters by text query", () => {
    expect(filterSkills(skills, { ...EMPTY_FILTERS, query: "beta" }).map((s) => s.id)).toEqual(["b"]);
  });

  it("filters by type", () => {
    expect(filterSkills(skills, { ...EMPTY_FILTERS, type: "research" }).map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("filters by platform", () => {
    expect(filterSkills(skills, { ...EMPTY_FILTERS, platform: "codex" }).map((s) => s.id)).toEqual(["b"]);
  });

  it("filters by pack", () => {
    expect(filterSkills(skills, { ...EMPTY_FILTERS, pack: "p2" }).map((s) => s.id)).toEqual(["c"]);
  });

  it("ANDs across active facets", () => {
    const out = filterSkills(skills, { ...EMPTY_FILTERS, type: "research", platform: "claude", pack: "p1" });
    expect(out.map((s) => s.id)).toEqual(["a"]);
  });

  it("returns empty when nothing matches", () => {
    expect(filterSkills(skills, { ...EMPTY_FILTERS, type: "research", platform: "codex" })).toHaveLength(0);
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty filters", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });
  it("is true when any facet or query is set", () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "x" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, type: "research" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, platform: "claude" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, pack: "p1" })).toBe(true);
  });
});
