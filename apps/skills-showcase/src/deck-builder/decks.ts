/*
 * Shared deck-builder data model.
 *
 * The builder renders the 5 canonical decks (VARD, ORD, Business/Devtool/Game
 * AFPS) the skillpacks manifest defines. Each deck carries a named phase chain
 * (`Phase[]`) whose `suggestedSkills` seed the builder's slot columns; a card
 * lands in the phase whose suggestion list contains it (no round-robin).
 *
 * `data.decks` / `data.sets` are emitted by
 * apps/skills-showcase/scripts/generate-skills-showcase-data.mjs from the
 * manifest. `buildDecks` resolves the generated card ids back to `Skill`
 * objects from the loaded catalog.
 */
import {
  type GeneratedDeck,
  type GeneratedSet,
  type Skill,
} from "@/hooks/useSkillsData";

export interface DeckData {
  skills: Skill[];
  decks?: GeneratedDeck[];
  sets?: GeneratedSet[];
}

export interface Phase {
  key: string;
  name: string;
  suggestedSkills: Skill[];
}

export interface Deck {
  name: string;
  slug: string;
  domain: string;
  tempo: string;
  phases: Phase[];
  skills: Skill[];
  /**
   * Overlay packs/cards layered onto a *custom* deck (cards composed beyond a
   * canonical blueprint, e.g. decoded from a `?c=` share link). Empty/undefined
   * for canonical decks. `overlayPacks` drives the custom-deck install output's
   * overlay `install <pack>` lines; `overlaySkills` round-trips through `?c=`.
   */
  overlayPacks?: string[];
  overlaySkills?: Skill[];
}

/** Slug of the synthetic, share-encoded custom deck (`/deck/custom?c=…`). */
export const CUSTOM_SLUG = "custom";

/** Unique packs feeding a card list, in stable card order — the `enabled_packs`
 *  set. Shared by the project.json builder and the custom-deck install output. */
export function deckPacks(skills: Skill[]): string[] {
  const seen = new Set<string>();
  const packs: string[] = [];
  for (const skill of skills) {
    if (skill.pack && !seen.has(skill.pack)) {
      seen.add(skill.pack);
      packs.push(skill.pack);
    }
  }
  return packs;
}

/**
 * Resolve the generated decks against the loaded skill catalog. Each phase's
 * `suggestedCardIds` become `Skill[]`; a deck's `skills` is the deduped union
 * of every phase's suggestions, in stable phase-then-card order. Decks with no
 * resolvable skills are dropped.
 */
export function buildDecks(data: DeckData): Deck[] {
  const byId = new Map(data.skills.map((skill) => [skill.id, skill]));
  const generated = data.decks ?? [];

  return generated
    .map((deck) => {
      const phases: Phase[] = deck.phases.map((phase) => ({
        key: phase.key,
        name: phase.name,
        suggestedSkills: phase.suggestedCardIds
          .map((id) => byId.get(id))
          .filter((skill): skill is Skill => Boolean(skill)),
      }));

      const seen = new Set<string>();
      const skills: Skill[] = [];
      for (const phase of phases) {
        for (const skill of phase.suggestedSkills) {
          if (seen.has(skill.id)) continue;
          seen.add(skill.id);
          skills.push(skill);
        }
      }

      return {
        name: deck.name,
        slug: deck.slug,
        domain: deck.domain,
        tempo: deck.tempo,
        phases,
        skills,
      };
    })
    .filter((deck) => deck.skills.length > 0);
}

export function getDeckBySlug(decks: Deck[], slug: string | null): Deck | null {
  if (!slug) return null;
  return decks.find((deck) => deck.slug === slug) ?? null;
}
