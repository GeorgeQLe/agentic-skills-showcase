import type { GeneratedDeck } from "@/hooks/useSkillsData";
import DeckCard, { type DeckCounts } from "./DeckCard";

/*
 * DeckGrid — the /library Decks tab: a grid of DeckCards, each a hard link to
 * its builder. domainLabels/counts are precomputed by the caller so DeckCard
 * stays presentational.
 */
export default function DeckGrid({
  decks,
  domainLabels,
  countsBySlug,
}: {
  decks: GeneratedDeck[];
  domainLabels: Record<string, string>;
  countsBySlug: Record<string, DeckCounts>;
}) {
  return (
    <div className="deck-grid" data-testid="library-deck-grid">
      {decks.map((deck) => (
        <DeckCard
          key={deck.slug}
          deck={deck}
          domainLabel={domainLabels[deck.domain] ?? deck.domain}
          counts={countsBySlug[deck.slug] ?? { packs: 0, skills: 0 }}
        />
      ))}
    </div>
  );
}
