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
