/*
 * Per-deck pack/skill counts for DeckCard. A deck's phases reference card ids;
 * the skill count is the distinct ids across phases and the pack count is the
 * distinct owning packs of those cards (resolved through a card-id → pack map).
 */
import type { GeneratedDeck, Skill } from "@/hooks/useSkillsData";
import type { DeckCounts } from "./DeckCard";

export function buildCardPackMap(skills: Skill[]): Map<string, string | null> {
  return new Map(skills.map((s) => [s.id, s.pack]));
}

export function deckCounts(
  deck: GeneratedDeck,
  cardPack: Map<string, string | null>,
): DeckCounts {
  const cardIds = new Set<string>();
  const packs = new Set<string>();
  for (const phase of deck.phases) {
    for (const id of phase.suggestedCardIds) {
      cardIds.add(id);
      const pack = cardPack.get(id);
      if (pack) packs.add(pack);
    }
  }
  return { packs: packs.size, skills: cardIds.size };
}
