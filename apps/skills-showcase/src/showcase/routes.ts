export type ShowcaseRoute = {
  href: string;
  label: string;
  description: string;
};

// Unified-experience Phase 6: `/` is the only content front door (the pack-first
// landing mounts the deck Table + card surfaces). The folded marketing routes
// (workflows/packs/catalog/benchmarks/inspect) 308 → `/` via next.config, so the
// nav surface is the game-metaphor set: Cards (browse), Library (the dedicated
// catalog), Follow, and Admin. The external LexCorp link is not an app route and
// lives in the header/footer chrome.
export const showcaseRoutes = [
  {
    href: "/",
    label: "Cards",
    description: "Browse the skill packs and build your workflow deck."
  },
  {
    href: "/library",
    label: "Library",
    description: "Browse the full skill catalog and decks."
  },
  {
    href: "/follow",
    label: "Follow",
    description: "Newsletter subscription and mailing list capture."
  },
  {
    href: "/admin/newsletter",
    label: "Admin",
    description: "Protected newsletter subscriber admin panel."
  }
] as const satisfies readonly ShowcaseRoute[];
