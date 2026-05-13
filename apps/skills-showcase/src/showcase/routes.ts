export type ShowcaseRoute = {
  href: string;
  label: string;
  description: string;
};

export const showcaseRoutes = [
  {
    href: "/",
    label: "Overview",
    description: "Showcase landing surface migrated from the static index page."
  },
  {
    href: "/workflows",
    label: "Workflows",
    description: "Workflow-oriented browsing surface for available skills."
  },
  {
    href: "/workflows/v1",
    label: "V1: Hacker",
    description: "Dark phosphor terminal-style workflow demo."
  },
  {
    href: "/workflows/v2",
    label: "V2: Clean",
    description: "Light, spacious dev-docs style workflow demo."
  },
  {
    href: "/workflows/v3",
    label: "V3: Retro",
    description: "Amber-on-navy CRT monitor style workflow demo."
  },
  {
    href: "/workflows/v4",
    label: "V4: Playful",
    description: "Colorful, rounded, fun workflow demo."
  },
  {
    href: "/workflows/v5",
    label: "V5: Pro",
    description: "Dark monitoring dashboard style workflow demo."
  },
  {
    href: "/packs",
    label: "Packs",
    description: "Pack-level grouping and distribution surface."
  },
  {
    href: "/catalog",
    label: "Catalog",
    description: "Searchable skill catalog backed by generated metadata."
  },
  {
    href: "/benchmarks",
    label: "Benchmarks",
    description: "Aggregated benchmark results from persisted evaluated runs."
  },
  {
    href: "/inspect",
    label: "Inspect",
    description: "Proof and metadata inspection surface."
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
