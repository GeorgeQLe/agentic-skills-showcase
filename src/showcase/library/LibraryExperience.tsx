"use client";

/*
 * LibraryExperience — the client tab controller for /library. The server page
 * loads + dedupes data and precomputes facets/deck meta; this holds only the
 * tab selection and the Skills-tab filter state, and renders the two tabpanels
 * (Skills grid behind a filter bar, Decks grid). Skill tiles soft-nav to
 * /card/[id] (modal); deck cards hard-load /deck/<slug>.
 */
import { useMemo, useState } from "react";

import type { GeneratedDeck, Skill } from "@/hooks/useSkillsData";
import type { DeckCounts } from "./DeckCard";
import {
  EMPTY_FILTERS,
  filterSkills,
  type SkillFacets,
  type SkillFilterState,
} from "./useSkillFilters";
import LibraryTabs, { type LibraryTab } from "./LibraryTabs";
import SkillFilterBar from "./SkillFilterBar";
import SkillGrid from "./SkillGrid";
import DeckGrid from "./DeckGrid";

export default function LibraryExperience({
  skills,
  decks,
  facets,
  packTitles,
  domainLabels,
  deckCounts,
}: {
  skills: Skill[];
  decks: GeneratedDeck[];
  facets: SkillFacets;
  packTitles: Record<string, string>;
  domainLabels: Record<string, string>;
  deckCounts: Record<string, DeckCounts>;
}) {
  const [tab, setTab] = useState<LibraryTab>("skills");
  const [filters, setFilters] = useState<SkillFilterState>(EMPTY_FILTERS);

  const filtered = useMemo(() => filterSkills(skills, filters), [skills, filters]);

  const patch = (next: Partial<SkillFilterState>) =>
    setFilters((prev) => ({ ...prev, ...next }));
  const clear = () => setFilters(EMPTY_FILTERS);

  return (
    <main className="library" data-testid="library">
      <header className="library-header">
        <h1 className="library-title">Skill Library</h1>
        <p className="library-lede">
          Every skill and deck in the catalog — search, filter, and open any card.
        </p>
      </header>

      <LibraryTabs
        active={tab}
        onChange={setTab}
        skillCount={skills.length}
        deckCount={decks.length}
      />

      <section
        role="tabpanel"
        id="library-panel-skills"
        aria-labelledby="library-tab-skills"
        hidden={tab !== "skills"}
      >
        {tab === "skills" ? (
          <>
            <SkillFilterBar
              state={filters}
              facets={facets}
              packTitles={packTitles}
              filteredCount={filtered.length}
              total={skills.length}
              onChange={patch}
              onClear={clear}
            />
            <SkillGrid skills={filtered} onClear={clear} />
          </>
        ) : null}
      </section>

      <section
        role="tabpanel"
        id="library-panel-decks"
        aria-labelledby="library-tab-decks"
        hidden={tab !== "decks"}
      >
        {tab === "decks" ? (
          <DeckGrid
            decks={decks}
            domainLabels={domainLabels}
            countsBySlug={deckCounts}
          />
        ) : null}
      </section>
    </main>
  );
}
