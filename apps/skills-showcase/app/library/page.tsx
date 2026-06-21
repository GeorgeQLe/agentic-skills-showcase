/*
 * /library — the dedicated skill catalog. A statically-generated server page
 * that loads the catalog at build, mirrorKey-dedupes the cards (the same ~190
 * logical cards /card/[id] indexes), precomputes facet option lists + per-deck
 * meta, and hands it all to the <LibraryExperience> client subtree (tabs +
 * filtering). Server-rendering the grid keeps the <a href="/card/..."> anchors
 * crawlable and avoids the useSkillsData() loading flash.
 */
import type { Metadata } from "next";

import { loadSkillsData, dedupeCards } from "@/server/skillsData";
import { DOMAIN_META } from "@/showcase/landing/projectMeta";
import LibraryExperience from "@/showcase/library/LibraryExperience";
import { deriveFacets } from "@/showcase/library/useSkillFilters";
import { buildCardPackMap, deckCounts } from "@/showcase/library/deckCounts";
import type { DeckCounts } from "@/showcase/library/DeckCard";

export const metadata: Metadata = {
  title: "Skill Library — G Skillpacks",
  description:
    "Browse the full G Skillpacks catalog: every skill and workflow deck for Claude Code and Codex. Search and filter by type, platform, and pack.",
};

export default function LibraryPage() {
  const data = loadSkillsData();
  const skills = dedupeCards(data.skills);
  const facets = deriveFacets(skills);

  const packTitles: Record<string, string> = {};
  for (const pack of data.packs) packTitles[pack.name] = pack.title;

  const cardPack = buildCardPackMap(data.skills);
  const counts: Record<string, DeckCounts> = {};
  const domainLabels: Record<string, string> = {};
  for (const deck of data.decks) {
    counts[deck.slug] = deckCounts(deck, cardPack);
    domainLabels[deck.domain] =
      DOMAIN_META[deck.domain]?.label ?? deck.domain;
  }

  return (
    <LibraryExperience
      skills={skills}
      decks={data.decks}
      facets={facets}
      packTitles={packTitles}
      domainLabels={domainLabels}
      deckCounts={counts}
    />
  );
}
