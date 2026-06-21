import type { Skill } from "@/hooks/useSkillsData";
import NavigableCardTile from "./NavigableCardTile";

/*
 * SkillGrid — responsive grid of NavigableCardTiles, or an empty state with a
 * clear-all escape hatch when the active filters match nothing.
 */
export default function SkillGrid({
  skills,
  onClear,
}: {
  skills: Skill[];
  onClear: () => void;
}) {
  if (skills.length === 0) {
    return (
      <div className="library-empty" data-testid="library-empty">
        <p>No skills match the current filters.</p>
        <button type="button" className="button secondary" onClick={onClear}>
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="library-grid" data-testid="library-skill-grid">
      {skills.map((skill) => (
        <NavigableCardTile key={skill.id} skill={skill} />
      ))}
    </div>
  );
}
