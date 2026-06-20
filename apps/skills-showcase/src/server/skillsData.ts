/*
 * Server-side reader for the generated skills catalog.
 *
 * The browser path injects the catalog onto window.SKILLS_SHOWCASE_DATA via a
 * <Script> tag (see app/layout.tsx) and client components read it through
 * useSkillsData(). Server components and generateStaticParams() can't reach a
 * browser global, so this module reads the same pre-built file straight off
 * disk and parses the `window.SKILLS_SHOWCASE_DATA = {…}` assignment back into
 * an object. The file is generated, never hand-edited, so a one-time module-
 * level cache is safe for the build/runtime process.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import type { Skill, GeneratedDeck, GeneratedSet } from "@/hooks/useSkillsData";

export interface SkillsData {
  generatedAt: string;
  skillCount: number;
  packCount: number;
  skills: Skill[];
  decks: GeneratedDeck[];
  sets: GeneratedSet[];
}

export interface CardDeckRef {
  slug: string;
  name: string;
}

// process.cwd() is the app root (apps/skills-showcase) during next build/dev
// and Vitest, which is where the generated asset lives.
const DATA_PATH = path.join(process.cwd(), "public", "assets", "skills-data.js");

let cached: SkillsData | null = null;

export function loadSkillsData(): SkillsData {
  if (cached) return cached;
  const raw = readFileSync(DATA_PATH, "utf8");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Unrecognized skills-data.js format at ${DATA_PATH}`);
  }
  cached = JSON.parse(raw.slice(start, end + 1)) as SkillsData;
  return cached;
}

/**
 * The mirrorKey dedup the card surfaces use: one logical card per mirrorKey.
 * Sorting by path first makes the choice deterministic and picks the claude
 * variant — `…/claude/…` sorts before `…/codex/…`, so it is seen first.
 * Falls back to `name` when a skill carries no mirrorKey.
 */
export function dedupeCards(skills: Skill[]): Skill[] {
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

export function getCardById(data: SkillsData, id: string): Skill | null {
  return data.skills.find((skill) => skill.id === id) ?? null;
}

/**
 * Decks whose phases suggest this exact card id — the "part of deck(s)" chips.
 * Deck phases reference canonical (claude) card ids, so codex variants resolve
 * to no decks, which is the intended behavior for the deduped SEO surface.
 */
export function decksForCard(data: SkillsData, id: string): CardDeckRef[] {
  return data.decks
    .filter((deck) => deck.phases.some((phase) => phase.suggestedCardIds.includes(id)))
    .map((deck) => ({ slug: deck.slug, name: deck.name }));
}
