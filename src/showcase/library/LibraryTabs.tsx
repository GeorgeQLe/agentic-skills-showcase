export type LibraryTab = "skills" | "decks";

/*
 * LibraryTabs — an ARIA tablist switching the Library between the Skills grid
 * and the Decks grid. Panels are owned by LibraryExperience (role="tabpanel"
 * with matching ids); this just renders the buttons and reports selection.
 */
export default function LibraryTabs({
  active,
  onChange,
  skillCount,
  deckCount,
}: {
  active: LibraryTab;
  onChange: (tab: LibraryTab) => void;
  skillCount: number;
  deckCount: number;
}) {
  const tabs: { id: LibraryTab; label: string; count: number }[] = [
    { id: "skills", label: "Skills", count: skillCount },
    { id: "decks", label: "Decks", count: deckCount },
  ];
  return (
    <div className="library-tablist" role="tablist" aria-label="Library catalog">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`library-tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`library-panel-${tab.id}`}
          tabIndex={active === tab.id ? 0 : -1}
          className="library-tab"
          data-active={active === tab.id}
          data-testid={`library-tab-${tab.id}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label} <span className="library-tab-count">{tab.count}</span>
        </button>
      ))}
    </div>
  );
}
