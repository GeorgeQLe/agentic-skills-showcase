/**
 * projectMeta — the goal/project framing for the Stage 1 SELECT screen
 * (landing redesign Phase 4). Each starter deck is presented as a *project goal*
 * ("Validate a business idea → VARD") rather than an abstract domain. Hand-
 * authored for the five starter decks; un-authored decks fall back to the deck
 * name as the goal so the grid degrades gracefully.
 */

export interface ProjectMeta {
  /** The headline goal a user picks ("Validate a business idea"). */
  goal: string;
  /** One sentence on what the deck does. */
  blurb: string;
  /** What the user walks away with. */
  outcome: string;
  /** Owning domain (must match the generated set domain). */
  domain: string;
}

/** Curated display order for the primary project grid (rapid/curated first). */
export const PROJECT_ORDER = [
  "vard",
  "ord",
  "business-afps",
  "devtool-afps",
  "game-afps",
];

export const PROJECT_META: Record<string, ProjectMeta> = {
  vard: {
    goal: "Validate a business idea",
    blurb: "Pressure-test an idea against the market before you build it.",
    outcome: "A validated, aligned direction ready to ship.",
    domain: "business",
  },
  ord: {
    goal: "Ship a developer tool change",
    blurb: "Scan the codebase, align on a plan, and ship behind proof gates.",
    outcome: "A reviewed change shipped with evidence.",
    domain: "devtool",
  },
  "business-afps": {
    goal: "Run the full business pipeline",
    blurb: "Discover, nurture, grow, and operate — the end-to-end business deck.",
    outcome: "A market-facing operation from discovery to ops.",
    domain: "business",
  },
  "devtool-afps": {
    goal: "Take a dev tool to market",
    blurb: "Position, drive adoption, map the journey, document, and monetize.",
    outcome: "A dev tool positioned, adopted, and earning.",
    domain: "devtool",
  },
  "game-afps": {
    goal: "Design and launch a game",
    blurb: "Align the concept, validate the fun, then launch it.",
    outcome: "A validated game concept ready to launch.",
    domain: "game",
  },
};

/** Resolve a deck to its project framing, falling back to the deck name. */
export function getProjectMeta(deck: { slug: string; name: string; domain: string }): ProjectMeta {
  return (
    PROJECT_META[deck.slug] ?? {
      goal: deck.name,
      blurb: "",
      outcome: "",
      domain: deck.domain,
    }
  );
}

export const DOMAIN_META: Record<string, { label: string; blurb: string }> = {
  business: {
    label: "Business",
    blurb: "Validate, align, research, decide — the market-facing decks.",
  },
  devtool: {
    label: "Devtool",
    blurb: "Operate, refactor, and ship developer tooling with proof gates.",
  },
  game: {
    label: "Game",
    blurb: "Concept, design, and prototype game systems end to end.",
  },
};

export const DOMAIN_ORDER = ["business", "devtool", "game"];
