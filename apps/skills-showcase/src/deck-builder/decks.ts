/*
 * Shared deck-builder data model.
 *
 * `SETS` / `SetDef` / `getSetSkills` were originally defined inline in
 * app/prototype/page.tsx; they are extracted here so both the pack-opening
 * prototype and the real DeckTableShell consume one source of truth.
 *
 * A resolved deck exposes `{ name, slug, phases, skills }`; the `phases`
 * array seeds the builder's slot columns.
 */
import {
  getGlobalSkills,
  getPackSkills,
  type Skill,
} from "@/hooks/useSkillsData";

export interface SetDef {
  name: string;
  slug: string;
  packs: string[];
  phases: string[];
}

export interface Deck {
  name: string;
  slug: string;
  phases: string[];
  skills: Skill[];
}

export const SETS: SetDef[] = [
  {
    name: "Market Intel",
    slug: "market-intel",
    packs: ["business-discovery", "customer-lifecycle"],
    phases: ["LAB-01", "LAB-02"],
  },
  {
    name: "Growth Engine",
    slug: "growth-engine",
    packs: ["business-growth", "business-ops"],
    phases: ["LAB-02", "LAB-03", "LAB-07"],
  },
  {
    name: "Creator Studio",
    slug: "creator-studio",
    packs: ["creator-foundation", "youtube-ops", "remotion"],
    phases: ["LAB-01", "LAB-02", "LAB-07"],
  },
  {
    name: "Design Lab",
    slug: "design-lab",
    packs: ["product-design", "product-testing", "guided-walkthrough", "alignment-loop", "research-admin"],
    phases: ["LAB-02", "LAB-04", "LAB-05", "LAB-06"],
  },
  {
    name: "Domain Decks",
    slug: "domain-decks",
    packs: ["devtool", "game"],
    phases: ["LAB-01", "LAB-02", "LAB-03", "LAB-04", "LAB-05", "LAB-07"],
  },
  {
    name: "Forge",
    slug: "forge",
    packs: ["exec-loop", "agent-work-admin", "monorepo", "code-review", "code-debug", "code-quality", "code-maintenance", "gitops", "release-ops", "docs-health"],
    phases: ["LAB-06", "LAB-07"],
  },
  {
    name: "Foundation",
    slug: "foundation",
    packs: ["global", "skill-dev", "agentic-skills-bench", "session-analytics", "project-fleet", "alignment-page-admin", "teardown", "knowledge-check", "agent-bridge", "context-transfer", "exec-profile", "repo-maintenance", "report-gen", "website-polish"],
    phases: ["LAB-01", "LAB-07"],
  },
];

export function getSetSkills(allSkills: Skill[], set: SetDef): Skill[] {
  const seen = new Set<string>();
  const result: Skill[] = [];
  for (const packName of set.packs) {
    const packSkills = packName === "global"
      ? getGlobalSkills(allSkills)
      : getPackSkills(allSkills, packName);
    for (const s of packSkills) {
      const key = s.pack + "/" + s.name;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(s);
      }
    }
  }
  return result;
}

/**
 * Resolve every set definition against the loaded skill catalog into a deck
 * with its skills attached, dropping empty decks (no skills available).
 */
export function buildDecks(allSkills: Skill[]): Deck[] {
  return SETS.map((set) => ({
    name: set.name,
    slug: set.slug,
    phases: set.phases,
    skills: getSetSkills(allSkills, set),
  })).filter((deck) => deck.skills.length > 0);
}

export function getDeckBySlug(decks: Deck[], slug: string | null): Deck | null {
  if (!slug) return null;
  return decks.find((deck) => deck.slug === slug) ?? null;
}
