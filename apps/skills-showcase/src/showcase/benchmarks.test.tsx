import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import BenchmarksClient from "./benchmarks";

const MOCK_SKILLS = [
  {
    name: "run",
    title: "Run",
    description: "Execute the next step",
    type: "execution",
    platform: "claude",
    command: "$exec",
    scope: "global",
    pack: "",
    path: "global/claude/exec/SKILL.md",
    mirrorKey: "run",
    tags: ["planning"],
    benchmarkEvidence: {
      date: "2026-05-11",
      reportPath: "benchmark/test-run-2026-05-11.md",
      agents: [
        { agent: "Codex", passRate: "100.0% (3/3)", latencyP50: "42.6s", totalCost: "$3.00" },
        { agent: "Claude", passRate: "66.7% (2/3)", latencyP50: "38.1s", totalCost: "$4.50" }
      ],
      quality: [
        { agent: "Codex", averageQualityScore: "100.0%" },
        { agent: "Claude", averageQualityScore: "72.9%" }
      ],
      subjectiveReview: {
        reportPath: "benchmark/review-run-2026-05-11.md",
        medianScore: "92.0",
        scoreRange: "90-94",
        verdict: "Excellent overall.",
        nextCommand: "$ship"
      }
    }
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
    tags: ["shipping"],
    benchmarkEvidence: {
      date: "2026-05-10",
      reportPath: "benchmark/test-ship-2026-05-10.md",
      agents: [{ agent: "Claude", passRate: "100.0% (3/3)" }]
    }
  },
  {
    name: "sync",
    title: "Sync",
    description: "Pull latest changes",
    type: "utility",
    platform: "claude",
    command: "$sync",
    scope: "global",
    pack: "",
    path: "global/claude/sync/SKILL.md",
    mirrorKey: "sync",
    tags: []
  },
  {
    name: "run-codex",
    title: "Run (Codex)",
    description: "Execute the next step in Codex",
    type: "execution",
    platform: "codex",
    command: "$exec",
    scope: "global",
    pack: "",
    path: "global/codex/exec/SKILL.md",
    mirrorKey: "run",
    tags: ["planning"],
    benchmarkEvidence: {
      date: "2026-05-11",
      reportPath: "benchmark/test-run-2026-05-11.md",
      agents: [{ agent: "Codex", passRate: "100.0% (3/3)" }],
      quality: [{ agent: "Codex", averageQualityScore: "100.0%" }]
    }
  }
];

function setWindowData(skills = MOCK_SKILLS) {
  (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_DATA = {
    skills,
    packs: [],
    skillCount: skills.length,
    packCount: 0,
    sourceCount: skills.length
  };
}

function clearWindowData() {
  delete (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_DATA;
}

function setupDOM() {
  document.body.innerHTML = `
    <span data-benchmarks-count>0</span>
    <div data-benchmarks-missing hidden></div>
    <div data-benchmarks-list></div>
  `;
}

describe("BenchmarksClient", () => {
  afterEach(() => {
    cleanup();
    clearWindowData();
  });

  it("renders a table with benchmarked skills (deduped by mirrorKey)", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const table = document.querySelector(".benchmarks-table")!;
    expect(table).toBeTruthy();
    const rows = table.querySelectorAll("tbody tr");
    // run has 2 agents = 2 rows, ship has 1 agent = 1 row, run-codex deduped = 0
    expect(rows).toHaveLength(3);
  });

  it("updates the benchmark count", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    // 3 skills have benchmarkEvidence but run-codex is deduped; count shows pre-dedup
    const count = document.querySelector("[data-benchmarks-count]")!;
    expect(count.textContent).toBe("3");
  });

  it("shows graded badge for skills with quality data", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const graded = document.querySelectorAll(".badge-graded");
    expect(graded).toHaveLength(1);
  });

  it("shows assertions-only badge for skills without quality data", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const partial = document.querySelectorAll(".badge-partial");
    expect(partial).toHaveLength(1);
  });

  it("links skill names to catalog with search query", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const links = document.querySelectorAll(".benchmarks-table a[href*='/catalog']");
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect((links[0] as HTMLAnchorElement).href).toContain("/catalog?q=run");
  });

  it("links report paths to GitHub", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const reportLinks = document.querySelectorAll(".benchmarks-table a[href*='github.com']");
    expect(reportLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("shows quality scores for graded agents", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const table = document.querySelector(".benchmarks-table")!;
    expect(table.textContent).toContain("100.0%");
    expect(table.textContent).toContain("72.9%");
  });

  it("shows subjective review scores and links review reports", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const table = document.querySelector(".benchmarks-table")!;
    expect(table.textContent).toContain("median 92.0 (90-94)");
    const reviewLink = table.querySelector("a[href*='review-run-2026-05-11.md']");
    expect(reviewLink).toBeTruthy();
  });

  it("shows -- for agents without quality data", () => {
    setWindowData();
    setupDOM();
    render(<BenchmarksClient />);

    const cells = document.querySelectorAll(".benchmarks-table .mono");
    const dashes = Array.from(cells).filter((c) => c.textContent === "--");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows missing notice when no benchmark evidence exists", () => {
    setWindowData([{
      name: "sync",
      title: "Sync",
      description: "Pull latest",
      type: "utility",
      platform: "claude",
      command: "$sync",
      scope: "global",
      pack: "",
      path: "global/claude/sync/SKILL.md",
      mirrorKey: "sync",
      tags: []
    }]);
    setupDOM();
    render(<BenchmarksClient />);

    const missing = document.querySelector("[data-benchmarks-missing]") as HTMLElement;
    expect(missing.hidden).toBe(false);
    expect(document.querySelector(".benchmarks-table")).toBeNull();
  });

  it("shows notice when showcase data is completely empty", () => {
    (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_DATA = {};
    setupDOM();
    render(<BenchmarksClient />);

    const list = document.querySelector("[data-benchmarks-list]")!;
    expect(list.querySelector(".notice")).toBeTruthy();
  });
});
