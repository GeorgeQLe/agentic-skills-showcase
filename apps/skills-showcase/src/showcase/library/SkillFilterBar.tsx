import type { SkillFacets, SkillFilterState } from "./useSkillFilters";
import { hasActiveFilters } from "./useSkillFilters";

/*
 * SkillFilterBar — the horizontal filter bar for the Skills tab: a search box
 * plus native Type / Platform / Pack selects (reusing .catalog-tools), a live
 * result count, and a Clear-all shown only while filters are active.
 */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function SkillFilterBar({
  state,
  facets,
  packTitles,
  filteredCount,
  total,
  onChange,
  onClear,
}: {
  state: SkillFilterState;
  facets: SkillFacets;
  packTitles: Record<string, string>;
  filteredCount: number;
  total: number;
  onChange: (patch: Partial<SkillFilterState>) => void;
  onClear: () => void;
}) {
  const active = hasActiveFilters(state);
  return (
    <div className="library-filter-bar">
      <div className="catalog-tools">
        <label className="sr-only" htmlFor="library-search">
          Search skills
        </label>
        <input
          id="library-search"
          type="search"
          placeholder="Search skills…"
          value={state.query}
          data-testid="library-search"
          onChange={(e) => onChange({ query: e.target.value })}
        />
        <select
          aria-label="Filter by type"
          value={state.type}
          data-testid="library-filter-type"
          onChange={(e) => onChange({ type: e.target.value })}
        >
          <option value="">All types</option>
          {facets.types.map((type) => (
            <option key={type} value={type}>
              {titleCase(type)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by platform"
          value={state.platform}
          data-testid="library-filter-platform"
          onChange={(e) => onChange({ platform: e.target.value })}
        >
          <option value="">All platforms</option>
          {facets.platforms.map((platform) => (
            <option key={platform} value={platform}>
              {titleCase(platform)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by pack"
          value={state.pack}
          data-testid="library-filter-pack"
          onChange={(e) => onChange({ pack: e.target.value })}
        >
          <option value="">All packs</option>
          {facets.packs.map((pack) => (
            <option key={pack} value={pack}>
              {packTitles[pack] ?? pack}
            </option>
          ))}
        </select>
      </div>
      <div className="library-filter-meta">
        <span data-testid="library-count">
          {filteredCount} of {total} skills
        </span>
        {active ? (
          <button
            type="button"
            className="library-clear"
            data-testid="library-clear"
            onClick={onClear}
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
