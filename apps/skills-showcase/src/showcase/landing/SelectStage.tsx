"use client";

/**
 * SelectStage — Stage 1 of the landing journey (landing redesign Phase 4).
 *
 * Leads with a project/goal per starter deck ("Validate a business idea → VARD")
 * as the primary entry, then offers a secondary, deck-centric "or pick the deck
 * that fits your goals" list grouped by domain. Both routes call onSelect(slug),
 * which advances to Stage 2 OPEN.
 */

import { useMemo } from "react";

import type { GeneratedDeck } from "@/hooks/useSkillsData";
import type { DomainOption } from "./types";
import {
  DOMAIN_META,
  DOMAIN_ORDER,
  PROJECT_ORDER,
  getProjectMeta,
} from "./projectMeta";

export default function SelectStage({
  domains,
  decks,
  onSelect,
  selectedSlug,
}: {
  domains: DomainOption[];
  decks: GeneratedDeck[];
  onSelect: (slug: string) => void;
  selectedSlug: string | null;
}) {
  // Per-deck pack/skill counts come from the deck's domain allotment.
  const countsByDomain = useMemo(() => {
    const map = new Map<
      string,
      { packs: number; skills: number; label: string }
    >();
    for (const d of domains) {
      map.set(d.domain, {
        packs: d.packs.length,
        skills: d.skillCount,
        label: d.label,
      });
    }
    return map;
  }, [domains]);

  // Primary grid: curated project order first, then any un-listed decks.
  const orderedDecks = useMemo(() => {
    const rank = (slug: string) => {
      const i = PROJECT_ORDER.indexOf(slug);
      return i === -1 ? PROJECT_ORDER.length : i;
    };
    return [...decks].sort((a, b) => rank(a.slug) - rank(b.slug));
  }, [decks]);

  // Secondary list: decks grouped by domain.
  const decksByDomain = useMemo(() => {
    const map = new Map<string, GeneratedDeck[]>();
    for (const deck of decks) {
      const list = map.get(deck.domain);
      if (list) list.push(deck);
      else map.set(deck.domain, [deck]);
    }
    return map;
  }, [decks]);

  return (
    <section className="select-stage" aria-labelledby="select-stage-title">
      <header className="landing-hero">
        <p className="landing-eyebrow">G Skillpacks</p>
        <h1 id="select-stage-title" className="landing-title">
          What are you building?
        </h1>
        <p className="landing-lede">
          Pick a goal. We&apos;ll deal you the starter packs for it, then help you
          build the deck.
        </p>
      </header>

      <div className="select-grid" data-testid="landing-project-grid">
        {orderedDecks.map((deck) => {
          const meta = getProjectMeta(deck);
          const counts = countsByDomain.get(deck.domain);
          const isSelected = deck.slug === selectedSlug;
          return (
            <button
              key={deck.slug}
              type="button"
              className="select-card"
              data-testid={`landing-project-${deck.slug}`}
              data-selected={String(isSelected)}
              onClick={() => onSelect(deck.slug)}
            >
              <span className="select-card-goal">{meta.goal}</span>
              <span className="select-card-deck">
                {deck.name}
                <span className="select-card-domain">
                  {counts?.label ?? deck.domain}
                </span>
              </span>
              {meta.blurb ? (
                <span className="select-card-blurb">{meta.blurb}</span>
              ) : null}
              {meta.outcome ? (
                <span className="select-card-outcome">→ {meta.outcome}</span>
              ) : null}
              {counts ? (
                <span className="select-card-meta">
                  {counts.packs} packs · {counts.skills} skills
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section className="select-secondary" aria-labelledby="select-secondary-title">
        <h2 id="select-secondary-title" className="landing-section-title">
          …or pick the deck that fits your goals
        </h2>
        <div className="select-domain-groups">
          {DOMAIN_ORDER.filter((d) => decksByDomain.has(d)).map((domainKey) => {
            const groupDecks = decksByDomain.get(domainKey) ?? [];
            const label = DOMAIN_META[domainKey]?.label ?? domainKey;
            return (
              <div className="select-domain-group" key={domainKey}>
                <p className="select-domain-label">{label}</p>
                <ul className="select-deck-list">
                  {groupDecks.map((deck) => (
                    <li key={deck.slug}>
                      <button
                        type="button"
                        className="select-deck-pick"
                        data-testid={`landing-deck-pick-${deck.slug}`}
                        data-selected={String(deck.slug === selectedSlug)}
                        onClick={() => onSelect(deck.slug)}
                      >
                        {deck.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
