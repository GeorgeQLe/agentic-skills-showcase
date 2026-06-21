/*
 * useSkillFilters — the pure filtering core for the /library Skills tab.
 *
 * Everything here is side-effect free and unit-tested so the client components
 * (LibraryExperience, SkillFilterBar, SkillGrid) stay thin. `dedupeSkills`
 * mirrors the server's dedupeCards (sort by path, key on mirrorKey||name) so the
 * client grid shows the same ~190 logical cards the /card/[id] surface indexes.
 */
import type { Skill } from "@/hooks/useSkillsData";

export interface SkillFilterState {
  query: string;
  type: string;
  platform: string;
  pack: string;
}

export const EMPTY_FILTERS: SkillFilterState = {
  query: "",
  type: "",
  platform: "",
  pack: "",
};

export interface SkillFacets {
  types: string[];
  platforms: string[];
  packs: string[];
}

/**
 * One logical card per mirrorKey — the same dedup the server's dedupeCards uses
 * (sort by path first so the claude variant wins, key on mirrorKey||name).
 */
export function dedupeSkills(skills: Skill[]): Skill[] {
  const sorted = [...skills].sort((a, b) => a.path.localeCompare(b.path));
  const seen = new Set<string>();
  const out: Skill[] = [];
  for (const skill of sorted) {
    const key = skill.mirrorKey || skill.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
  }
  return out;
}

/** Distinct, sorted facet option lists derived from the skill set. */
export function deriveFacets(skills: Skill[]): SkillFacets {
  const types = new Set<string>();
  const platforms = new Set<string>();
  const packs = new Set<string>();
  for (const skill of skills) {
    if (skill.type) types.add(skill.type);
    if (skill.platform) platforms.add(skill.platform);
    if (skill.pack) packs.add(skill.pack);
  }
  const sort = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b));
  return { types: sort(types), platforms: sort(platforms), packs: sort(packs) };
}

/** Case-insensitive substring match over name + title + description + tags. */
export function matches(skill: Skill, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [skill.name, skill.title, skill.description, ...(skill.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** AND across every active facet (unset facet = "" = no constraint). */
export function filterSkills(skills: Skill[], state: SkillFilterState): Skill[] {
  return skills.filter(
    (skill) =>
      matches(skill, state.query) &&
      (!state.type || skill.type === state.type) &&
      (!state.platform || skill.platform === state.platform) &&
      (!state.pack || skill.pack === state.pack),
  );
}

/** True when any facet or the query is constraining the result set. */
export function hasActiveFilters(state: SkillFilterState): boolean {
  return Boolean(state.query.trim() || state.type || state.platform || state.pack);
}
