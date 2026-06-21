import Link from "next/link";

import type { GeneratedDeck } from "@/hooks/useSkillsData";
import DeckCard from "./DeckCard";

/*
 * BrowseSection — the visually-secondary browse affordance below the Stage 1
 * goal grid on `/`. Serves returning users who already know they want a deck:
 * each DeckCard hard-loads its builder (`/deck/<slug>`), skipping the staged
 * journey, and a prominent link routes to the full /library. This is distinct
 * from the primary goal cards, which call onSelect → Stage 2 (new-user path).
 */
export default function BrowseSection({
  decks,
  countsByDomain,
}: {
  decks: GeneratedDeck[];
  countsByDomain: Map<string, { packs: number; skills: number; label: string }>;
}) {
  return (
    <section className="browse-section" aria-labelledby="browse-section-title">
      <div className="browse-section-head">
        <h2 id="browse-section-title" className="browse-section-title">
          Browse the decks
        </h2>
        <Link
          href="/library"
          className="browse-library-link"
          data-testid="landing-browse-library"
        >
          Browse the full library →
        </Link>
      </div>
      <div className="browse-deck-grid" data-testid="landing-browse-grid">
        {decks.map((deck) => {
          const counts = countsByDomain.get(deck.domain);
          return (
            <DeckCard
              key={deck.slug}
              deck={deck}
              domainLabel={counts?.label ?? deck.domain}
              counts={{ packs: counts?.packs ?? 0, skills: counts?.skills ?? 0 }}
            />
          );
        })}
      </div>
    </section>
  );
}
