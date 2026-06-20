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
