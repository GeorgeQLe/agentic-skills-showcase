import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import CatalogClient from "./catalog";

const MOCK_SKILLS = [
  {
    name: "run",
    title: "Run",
    description: "Execute the next step",
    type: "execution",
    platform: "claude",
    command: "$run",
    scope: "global",
    pack: "",
    path: "global/claude/run/SKILL.md",
    mirrorKey: "run",
    tags: ["planning"]
  },
  {
    name: "ship",
    title: "Ship",
    description: "Ship current work",
    type: "shipping",
    platform: "claude",
    command: "$ship",
    scope: "global",
    pack: "",
    path: "global/claude/ship/SKILL.md",
    mirrorKey: "ship",
    tags: ["shipping"]
  },
  {
    name: "run-codex",
    title: "Run (Codex)",
    description: "Execute the next step in Codex",
    type: "execution",
    platform: "codex",
    command: "$run",
    scope: "global",
    pack: "",
    path: "global/codex/run/SKILL.md",
    mirrorKey: "run",
    tags: ["planning"]
  }
];

const MOCK_PACKS = [
  {
    name: "game",
    title: "Game",
    description: "Game development workflows",
    path: "packs/game/PACK.md",
    skillCount: 5,
    platforms: ["claude", "codex"]
  },
  {
    name: "monorepo",
    title: "Monorepo",
    description: "Monorepo overlay",
    path: "packs/monorepo/PACK.md",
    skillCount: 3,
    platforms: ["claude"]
  }
];

const MOCK_PROOF = {
  proofArtifacts: [
    { id: "routes", title: "Route files", path: "app/", tracked: true, exists: true },
    { id: "catalog-data", title: "Catalog data", path: "public/assets/skills-data.js", tracked: true, exists: true }
  ],
  validationScripts: [
    { id: "validate-data", title: "Validate data", command: "scripts/validate-skills-showcase-data.sh" }
  ],
  recentHistoryEntries: ["Step 37.5: shipped static retirement"],
  boundaries: ["No live LexCorp metrics"],
  repository: { url: "https://github.com/GeorgeQLe/agentic-skills", revisionPolicy: { status: "tracked" } },
  publicGithub: { status: "public", reason: "Public repo", url: "https://github.com/GeorgeQLe/agentic-skills" }
};

function setWindowData(skills = MOCK_SKILLS, packs = MOCK_PACKS) {
  (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_DATA = {
    skills,
    packs,
    skillCount: skills.length,
    packCount: packs.length,
    sourceCount: skills.length
  };
}

function setProofData(proof: Record<string, unknown> = MOCK_PROOF) {
  (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_GITHUB_PROOF_DATA = proof;
}

function clearWindowData() {
  delete (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_DATA;
  delete (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_GITHUB_PROOF_DATA;
}

describe("CatalogClient", () => {
  afterEach(() => {
    cleanup();
    clearWindowData();
  });

  describe("catalog search and filter", () => {
    beforeEach(() => {
      setWindowData();
    });

    it("renders all skills into [data-catalog-list]", () => {
      document.body.innerHTML = `
        <input data-catalog-search />
        <select data-catalog-platform><option value="all">All</option><option value="claude">Claude</option><option value="codex">Codex</option></select>
        <select data-catalog-type><option value="all">All</option></select>
        <select data-catalog-scope><option value="all">All</option><option value="global">Global</option></select>
        <span data-catalog-count></span>
        <span data-catalog-total></span>
        <div data-catalog-list></div>
      `;
      render(<CatalogClient />);

      const list = document.querySelector("[data-catalog-list]")!;
      expect(list.querySelectorAll(".catalog-row")).toHaveLength(3);
      expect(document.querySelector("[data-catalog-count]")!.textContent).toBe("3");
      expect(document.querySelector("[data-catalog-total]")!.textContent).toBe("3");
    });

    it("filters by search text", () => {
      document.body.innerHTML = `
        <input data-catalog-search />
        <select data-catalog-platform><option value="all">All</option></select>
        <select data-catalog-type><option value="all">All</option></select>
        <select data-catalog-scope><option value="all">All</option></select>
        <span data-catalog-count></span>
        <div data-catalog-list></div>
      `;
      render(<CatalogClient />);

      const search = document.querySelector("[data-catalog-search]") as HTMLInputElement;
      search.value = "ship";
      search.dispatchEvent(new Event("input", { bubbles: true }));

      const list = document.querySelector("[data-catalog-list]")!;
      expect(list.querySelectorAll(".catalog-row")).toHaveLength(1);
      expect(document.querySelector("[data-catalog-count]")!.textContent).toBe("1");
    });

    it("filters by platform", () => {
      document.body.innerHTML = `
        <input data-catalog-search />
        <select data-catalog-platform><option value="all">All</option><option value="codex">Codex</option></select>
        <select data-catalog-type><option value="all">All</option></select>
        <select data-catalog-scope><option value="all">All</option></select>
        <span data-catalog-count></span>
        <div data-catalog-list></div>
      `;
      render(<CatalogClient />);

      const platformFilter = document.querySelector("[data-catalog-platform]") as HTMLSelectElement;
      platformFilter.value = "codex";
      platformFilter.dispatchEvent(new Event("change", { bubbles: true }));

      expect(document.querySelector("[data-catalog-count]")!.textContent).toBe("1");
    });

    it("shows empty notice when no skills match", () => {
      document.body.innerHTML = `
        <input data-catalog-search />
        <select data-catalog-platform><option value="all">All</option></select>
        <select data-catalog-type><option value="all">All</option></select>
        <select data-catalog-scope><option value="all">All</option></select>
        <span data-catalog-count></span>
        <div data-catalog-list></div>
      `;
      render(<CatalogClient />);

      const search = document.querySelector("[data-catalog-search]") as HTMLInputElement;
      search.value = "zzzznonexistent";
      search.dispatchEvent(new Event("input", { bubbles: true }));

      const list = document.querySelector("[data-catalog-list]")!;
      expect(list.querySelector(".notice")).toBeTruthy();
      expect(list.querySelector(".notice")!.textContent).toMatch(/no skills match/i);
    });

    it("shows missing-data notice when skills array is empty", () => {
      setWindowData([], []);
      document.body.innerHTML = `
        <div data-catalog-missing hidden></div>
        <div data-catalog-list></div>
      `;
      render(<CatalogClient />);

      const missing = document.querySelector("[data-catalog-missing]") as HTMLElement;
      expect(missing.hidden).toBe(false);
    });
  });

  describe("pack map", () => {
    beforeEach(() => {
      setWindowData();
    });

    it("renders pack nodes into [data-pack-map]", () => {
      document.body.innerHTML = `
        <div data-pack-summary></div>
        <div data-pack-map></div>
        <div data-pack-detail></div>
      `;
      render(<CatalogClient />);

      const map = document.querySelector("[data-pack-map]")!;
      expect(map.querySelectorAll(".pack-node")).toHaveLength(2);
    });

    it("renders summary metrics", () => {
      document.body.innerHTML = `
        <div data-pack-summary></div>
        <div data-pack-map></div>
        <div data-pack-detail></div>
      `;
      render(<CatalogClient />);

      const summary = document.querySelector("[data-pack-summary]")!;
      expect(summary.querySelectorAll(".metric")).toHaveLength(3);
    });

    it("selects first pack and shows detail", () => {
      document.body.innerHTML = `
        <div data-pack-summary></div>
        <div data-pack-map></div>
        <div data-pack-detail></div>
      `;
      render(<CatalogClient />);

      const detail = document.querySelector("[data-pack-detail]")!;
      expect(detail.querySelector("h3")).toBeTruthy();
    });

    it("marks the monorepo pack as overlay", () => {
      document.body.innerHTML = `
        <div data-pack-map></div>
        <div data-pack-detail></div>
      `;
      render(<CatalogClient />);

      const map = document.querySelector("[data-pack-map]")!;
      const overlayNodes = map.querySelectorAll(".pack-node.overlay");
      expect(overlayNodes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("proof rendering", () => {
    beforeEach(() => {
      setWindowData();
      setProofData();
    });

    it("renders proof artifacts into [data-proof-artifacts]", () => {
      document.body.innerHTML = `
        <div data-proof-summary></div>
        <div data-proof-artifacts></div>
        <div data-proof-validation></div>
        <div data-proof-history></div>
        <div data-proof-boundaries></div>
      `;
      render(<CatalogClient />);

      const artifacts = document.querySelector("[data-proof-artifacts]")!;
      expect(artifacts.querySelectorAll(".proof-item").length).toBeGreaterThanOrEqual(2);
    });

    it("renders validation scripts", () => {
      document.body.innerHTML = `
        <div data-proof-artifacts></div>
        <div data-proof-validation></div>
      `;
      render(<CatalogClient />);

      const validation = document.querySelector("[data-proof-validation]")!;
      expect(validation.querySelectorAll(".proof-item")).toHaveLength(1);
    });

    it("renders proof summary", () => {
      document.body.innerHTML = `
        <div data-proof-summary></div>
        <div data-proof-artifacts></div>
      `;
      render(<CatalogClient />);

      const summary = document.querySelector("[data-proof-summary]")!;
      expect(summary.querySelector("h2")!.textContent).toMatch(/artifacts/i);
    });

    it("renders history entries", () => {
      document.body.innerHTML = `
        <div data-proof-artifacts></div>
        <div data-proof-history></div>
      `;
      render(<CatalogClient />);

      const history = document.querySelector("[data-proof-history]")!;
      expect(history.querySelectorAll(".proof-item")).toHaveLength(1);
    });

    it("renders boundary list", () => {
      document.body.innerHTML = `
        <div data-proof-artifacts></div>
        <div data-proof-boundaries></div>
      `;
      render(<CatalogClient />);

      const boundaries = document.querySelector("[data-proof-boundaries]")!;
      expect(boundaries.querySelectorAll("li").length).toBeGreaterThanOrEqual(1);
    });

    it("shows missing-data notice when proof is empty", () => {
      setProofData({ proofArtifacts: [], validationScripts: [] });
      document.body.innerHTML = `
        <div data-proof-missing hidden></div>
        <div data-proof-artifacts></div>
      `;
      render(<CatalogClient />);

      const missing = document.querySelector("[data-proof-missing]") as HTMLElement;
      expect(missing.hidden).toBe(false);
    });
  });

  describe("follow proof rendering", () => {
    beforeEach(() => {
      setWindowData();
      setProofData();
    });

    it("renders follow proof stats", () => {
      document.body.innerHTML = `
        <div data-proof-artifacts></div>
        <div data-follow-proof-stats></div>
        <div data-follow-receipts></div>
      `;
      render(<CatalogClient />);

      const stats = document.querySelector("[data-follow-proof-stats]")!;
      expect(stats.children.length).toBe(3);
    });

    it("renders follow receipt cards", () => {
      document.body.innerHTML = `
        <div data-proof-artifacts></div>
        <div data-follow-proof-stats></div>
        <div data-follow-receipts></div>
      `;
      render(<CatalogClient />);

      const receipts = document.querySelector("[data-follow-receipts]")!;
      expect(receipts.querySelectorAll(".proof-item").length).toBeGreaterThanOrEqual(1);
    });
  });
});
