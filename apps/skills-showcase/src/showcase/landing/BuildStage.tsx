"use client";

/**
 * BuildStage — Stage 3 of the landing journey: the deck blueprint table.
 *
 * CONTRACT (do not break): this component is rendered on EVERY path — never
 * behind a ternary, never inside AnimatePresence. It wraps <DeckDebugHarness/>
 * (→ DeckTableShell) which must mount exactly once and never remount, so the
 * /deck/[slug] pushState + layoutId="deck-blueprint-${slug}" morph and the
 * stable deck-mount-id (locked by e2e/deck-table-shell.spec.ts) survive stage
 * changes. The inactive stage is hidden with visibility:hidden (NOT
 * display:none) so the blueprint keeps a measurable box for the morph origin.
 */

import DeckDebugHarness from "@/deck-builder/DeckDebugHarness";

export default function BuildStage({ active }: { active: boolean }) {
  return (
    <section
      className="build-stage"
      data-testid="landing-build-stage"
      data-stage-active={String(active)}
      aria-hidden={active ? undefined : true}
    >
      <DeckDebugHarness />
    </section>
  );
}
