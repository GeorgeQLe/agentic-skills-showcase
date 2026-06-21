import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import type { GeneratedDeck, Skill } from "@/hooks/useSkillsData";
import LibraryExperience from "./LibraryExperience";
import { deriveFacets } from "./useSkillFilters";

function skill(p: Partial<Skill> & { id: string }): Skill {
  return {
    id: p.id,
    name: p.name ?? p.id,
    title: p.title ?? p.id,
    description: p.description ?? "",
    type: p.type ?? "research",
    version: "v0.0",
    platform: p.platform ?? "claude",
    command: `/${p.id}`,
    scope: "pack",
    pack: p.pack ?? null,
    path: `packs/x/${p.id}/SKILL.md`,
    tags: p.tags ?? [],
    benchmarkEvidence: null,
  };
}

const skills: Skill[] = [
  skill({ id: "lean-canvas", title: "Lean Canvas", type: "research", platform: "claude", pack: "business-research", tags: ["strategy"] }),
  skill({ id: "code-review", title: "Code Review", type: "review", platform: "codex", pack: "ord" }),
  skill({ id: "gtm", title: "Go To Market", type: "analysis", platform: "claude", pack: "business-growth" }),
];

const decks: GeneratedDeck[] = [
  { slug: "vard", name: "VARD", domain: "business", tempo: "rapid", phases: [{ key: "scan", name: "Scan", suggestedCardIds: ["lean-canvas"] }] },
  { slug: "ord", name: "ORD", domain: "devtool", tempo: "rapid", phases: [{ key: "ship", name: "Ship", suggestedCardIds: ["code-review"] }] },
];

const packTitles = {
  "business-research": "Business Research Pack",
  ord: "ORD Pack",
  "business-growth": "Business Growth Pack",
};
const domainLabels = { business: "Business", devtool: "Devtool" };
const deckCounts = { vard: { packs: 1, skills: 3 }, ord: { packs: 1, skills: 2 } };

function renderLibrary() {
  return render(
    <LibraryExperience
      skills={skills}
      decks={decks}
      facets={deriveFacets(skills)}
      packTitles={packTitles}
      domainLabels={domainLabels}
      deckCounts={deckCounts}
    />,
  );
}

describe("LibraryExperience", () => {
  afterEach(cleanup);

  it("defaults to the Skills tab with all tiles and a full count", () => {
    renderLibrary();
    expect(screen.getByTestId("library-tab-skills")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("library-skill-grid")).toBeInTheDocument();
    expect(screen.getByTestId("library-count")).toHaveTextContent("3 of 3 skills");
    expect(screen.getByTestId("library-tile-lean-canvas")).toBeInTheDocument();
  });

  it("renders skill tiles as anchors to /card/<id>", () => {
    renderLibrary();
    expect(screen.getByTestId("library-tile-lean-canvas")).toHaveAttribute("href", "/card/lean-canvas");
  });

  it("narrows the grid + count by search query", () => {
    renderLibrary();
    fireEvent.change(screen.getByTestId("library-search"), { target: { value: "market" } });
    expect(screen.getByTestId("library-count")).toHaveTextContent("1 of 3 skills");
    expect(screen.getByTestId("library-tile-gtm")).toBeInTheDocument();
    expect(screen.queryByTestId("library-tile-lean-canvas")).not.toBeInTheDocument();
  });

  it("narrows by type, platform, and pack facets", () => {
    renderLibrary();
    fireEvent.change(screen.getByTestId("library-filter-type"), { target: { value: "review" } });
    expect(screen.getByTestId("library-count")).toHaveTextContent("1 of 3 skills");
    expect(screen.getByTestId("library-tile-code-review")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("library-filter-type"), { target: { value: "" } });
    fireEvent.change(screen.getByTestId("library-filter-platform"), { target: { value: "codex" } });
    expect(screen.getByTestId("library-tile-code-review")).toBeInTheDocument();
    expect(screen.queryByTestId("library-tile-gtm")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("library-filter-platform"), { target: { value: "" } });
    fireEvent.change(screen.getByTestId("library-filter-pack"), { target: { value: "business-growth" } });
    expect(screen.getByTestId("library-count")).toHaveTextContent("1 of 3 skills");
    expect(screen.getByTestId("library-tile-gtm")).toBeInTheDocument();
  });

  it("shows the Pack facet with human titles", () => {
    renderLibrary();
    const packSelect = screen.getByTestId("library-filter-pack");
    expect(within(packSelect).getByText("Business Research Pack")).toBeInTheDocument();
  });

  it("clear-all restores the full grid", () => {
    renderLibrary();
    fireEvent.change(screen.getByTestId("library-search"), { target: { value: "market" } });
    expect(screen.getByTestId("library-count")).toHaveTextContent("1 of 3 skills");
    fireEvent.click(screen.getByTestId("library-clear"));
    expect(screen.getByTestId("library-count")).toHaveTextContent("3 of 3 skills");
  });

  it("shows an empty state with clear-all when nothing matches", () => {
    renderLibrary();
    fireEvent.change(screen.getByTestId("library-search"), { target: { value: "zzzznomatch" } });
    expect(screen.getByTestId("library-empty")).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId("library-empty")).getByRole("button"));
    expect(screen.getByTestId("library-count")).toHaveTextContent("3 of 3 skills");
  });

  it("Decks tab shows deck cards linking to /deck/<slug>", () => {
    renderLibrary();
    fireEvent.click(screen.getByTestId("library-tab-decks"));
    expect(screen.getByTestId("library-tab-decks")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("deck-card-vard")).toHaveAttribute("href", "/deck/vard");
    expect(screen.getByTestId("deck-card-ord")).toHaveAttribute("href", "/deck/ord");
  });

  it("exposes a tablist with two tabs", () => {
    renderLibrary();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });
});
