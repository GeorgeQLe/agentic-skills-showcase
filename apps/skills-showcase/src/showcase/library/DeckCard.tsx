import Link from "next/link";

import type { GeneratedDeck } from "@/hooks/useSkillsData";

export interface DeckCounts {
  packs: number;
  skills: number;
}

/*
 * DeckCard — a deck tile that hard-loads the builder (`/deck/<slug>`), skipping
 * the staged journey (locked decision: any browse surface → builder directly).
 * Shared by the /library Decks tab (DeckGrid) and the `/` BrowseSection.
 */
export default function DeckCard({
  deck,
  domainLabel,
  counts,
}: {
  deck: GeneratedDeck;
  domainLabel: string;
  counts: DeckCounts;
}) {
  return (
    <Link
      href={`/deck/${deck.slug}`}
      className="deck-card"
      data-testid={`deck-card-${deck.slug}`}
    >
      <span className="deck-card-head">
        <span className="deck-card-name">{deck.name}</span>
        <span className="deck-card-domain">{domainLabel}</span>
      </span>
      {deck.tempo ? <span className="deck-card-tempo">{deck.tempo}</span> : null}
      {deck.phases.length > 0 ? (
        <span className="deck-card-phases">
          {deck.phases.map((phase) => (
            <span className="tag" key={phase.key}>
              {phase.name}
            </span>
          ))}
        </span>
      ) : null}
      <span className="deck-card-meta">
        {counts.packs} packs · {counts.skills} skills
      </span>
    </Link>
  );
}
