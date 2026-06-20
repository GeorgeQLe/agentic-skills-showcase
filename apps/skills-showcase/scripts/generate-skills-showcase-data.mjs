#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  activeSkillPaths,
  compactText,
  discoverBenchmarkReportPaths,
  discoverBenchmarkRunReportPaths,
  fingerprintFiles,
  gitFiles,
  listPacks,
  parseSkill,
  readJson as readCatalogJson,
  readTextFromIndex,
  titleize
} from "../../../scripts/catalog/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const manifestRelativePath = "packages/skillpacks/dist/skillpacks-manifest.json";
const outputPath = path.join(repoRoot, "docs/skills-showcase/assets/skills-data.js");
const appOutputPath = path.join(repoRoot, "apps/skills-showcase/public/assets/skills-data.js");
const matrixOutputPath = path.join(repoRoot, "docs/benchmark-results-matrix.md");

function readText(relativePath) {
  return readTextFromIndex(repoRoot, relativePath);
}

function parsePercent(value) {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : null;
}

function readJson(relativePath) {
  return readCatalogJson(repoRoot, relativePath);
}

function parseMarkdownTableRows(text, heading) {
  const headingIndex = text.indexOf(`## ${heading}`);
  if (headingIndex === -1) return [];

  const nextHeadingIndex = text.indexOf("\n## ", headingIndex + 1);
  const section = text.slice(headingIndex, nextHeadingIndex === -1 ? undefined : nextHeadingIndex);
  const tableLines = section
    .split("\n")
    .filter((line) => line.trim().startsWith("|") && line.trim().endsWith("|"));
  if (tableLines.length < 2) return [];

  const headers = tableLines[0]
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim().toLowerCase());

  return tableLines
    .slice(2)
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length !== headers.length) return null;
      return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
    })
    .filter(Boolean);
}

function extractPromptFromRun(run) {
  const stderr = String(run?.stderr || "");
  const codexPrompt = stderr.match(/\nuser\n([\s\S]*?)(?:\n(?:codex|assistant|exec|apply patch)\n|$)/);
  if (codexPrompt) return compactText(codexPrompt[1], 600);
  return "";
}

function extractOutputFromRun(run) {
  return compactText(String(run?.stdout || ""), 900);
}

function buildBenchmarkDemo(report) {
  for (const agent of report.agents) {
    const rawSessionPath = String(agent.rawSessionPath || "").replace(/\/?$/, "/");
    if (!rawSessionPath.startsWith("tests/benchmarks/runs/")) continue;

    const reportJsonPath = `${rawSessionPath}report.json`;
    const reportJson = readJson(reportJsonPath);
    const preferredIndex =
      Array.isArray(reportJson?.failedRuns) && reportJson.failedRuns.length
        ? 0
        : Number.isInteger(reportJson?.consistency?.medoidIndex)
          ? reportJson.consistency.medoidIndex
          : 0;

    const candidateIndexes = Array.from(new Set([preferredIndex, 0, 1, 2])).filter((index) => index >= 0);
    for (const index of candidateIndexes) {
      const runPath = `${rawSessionPath}run-${String(index).padStart(3, "0")}.json`;
      const run = readJson(runPath);
      if (!run || run.infrastructureBlocked) continue;

      const prompt = extractPromptFromRun(run);
      const output = extractOutputFromRun(run);
      if (!prompt || !output) continue;

      return {
        agent: agent.agent,
        runIndex: index,
        prompt,
        output,
        runPath,
        reportPath: report.reportPath
      };
    }
  }

  return null;
}

function parseRawSessionList(text) {
  const section = text.match(/## Raw Sessions\s+([\s\S]*?)(?:\n## |\n# |$)/i)?.[1] || "";
  const sessions = new Map();
  for (const match of section.matchAll(/-\s*(Claude|Codex):\s*`([^`]+)`/gi)) {
    sessions.set(match[1].toLowerCase(), match[2]);
  }
  return sessions;
}

function parseBenchmarkReport(relativePath) {
  const text = readText(relativePath);
  const pathMatch = relativePath.match(/^benchmark\/test-(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
  if (!pathMatch) return null;

  const skill = pathMatch[1];
  const date = pathMatch[2];
  const coverage = ((text.match(/\*\*Coverage:\*\*\s*([^\n]+)/) || [])[1] || "").trim() || null;
  const verifyPassed = /\|\s*layer1\s*\|\s*PASS\s*\|/i.test(text);
  const layer2Skipped = /\|\s*layer2\s*\|\s*SKIP\s*\|/i.test(text);
  const rawSessions = parseRawSessionList(text);
  const agents = [];
  for (const row of parseMarkdownTableRows(text, "Benchmark Summary")) {
    const agent = String(row.agent || "").toLowerCase();
    if (agent !== "claude" && agent !== "codex") continue;
    const rawSessionPath =
      String(row["raw session"] || row["raw session path"] || "").replace(/^`|`$/g, "") ||
      rawSessions.get(agent) ||
      "";
    agents.push({
      agent,
      passRate: row["evaluated pass rate"] || row["pass rate"] || "",
      passRatePercent: parsePercent(row["evaluated pass rate"] || row["pass rate"]),
      infrastructureBlocked: row["blocked runs"] || row["infrastructure blocked"] || "",
      wilson95: row["wilson 95% ci"] || row["wilson95"] || "",
      latencyP50: row.p50 || "",
      latencyP95: row.p95 || "",
      latencyP99: row.p99 || "",
      costPerRun: row["cost / run"] || row["cost per run"] || "",
      totalCost: row["total cost"] || "",
      meanPairwiseSimilarity: row.consistency || row["mean pairwise similarity"] || "",
      outliers: row.outliers || "",
      rawSessionPath
    });
  }

  const qualityRows = [];
  for (const row of [
    ...parseMarkdownTableRows(text, "Output-Quality Details"),
    ...parseMarkdownTableRows(text, "Output Quality"),
    ...parseMarkdownTableRows(text, "Output-Quality Rubric")
  ]) {
    const agent = String(row.agent || "").toLowerCase();
    if (agent !== "claude" && agent !== "codex") continue;
    const averageQualityScore = row["average score"] || row["average quality score"] || "";
    if (!/%/.test(String(averageQualityScore))) continue;
    qualityRows.push({
      agent,
      averageQualityScore,
      thresholdFailures: row["threshold failures"] || "",
      criticalFailures: row["critical failures"] || "",
      lowestScoringCriteria: row["lowest-scoring criteria"] || ""
    });
  }

  const failedAssertions = /## Failed Assertions\s+None\./i.test(text) ? "none" : "see-report";

  const report = {
    skill,
    date,
    reportPath: relativePath,
    coverage,
    verify: {
      layer1: verifyPassed ? "PASS" : "UNKNOWN",
      layer2: layer2Skipped ? "SKIP" : "UNKNOWN"
    },
    agents,
    quality: qualityRows,
    failedAssertions
  };

  const demo = buildBenchmarkDemo(report);
  return demo ? { ...report, demo } : report;
}

function parseBenchmarkReview(relativePath) {
  const text = readText(relativePath);
  const pathMatch = relativePath.match(/^benchmark\/review-(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
  if (!pathMatch) return null;

  const median = (text.match(/Median subjective score:\s*([0-9]+(?:\.[0-9]+)?)/i) || [])[1] || "";
  const range = (text.match(/Score range:\s*([0-9]+(?:\.[0-9]+)?-[0-9]+(?:\.[0-9]+)?)/i) || [])[1] || "";
  const nextCommand = (text.match(/Recommended next command:\s*`([^`]+)`/i) || [])[1] || "";
  const verdictMatch = text.match(/## Output-Quality Verdict\s+([\s\S]*?)(?:\n## |\n# |$)/i);
  const verdict = verdictMatch ? compactText(verdictMatch[1], 280) : "";

  return {
    skill: pathMatch[1],
    date: pathMatch[2],
    reportPath: relativePath,
    medianScore: median,
    scoreRange: range,
    verdict,
    nextCommand
  };
}

function benchmarkEvidenceBySkill(files) {
  const reviews = files
    .filter((file) => /^benchmark\/review-.+-\d{4}-\d{2}-\d{2}\.md$/.test(file))
    .map(parseBenchmarkReview)
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  const reviewBySkill = new Map();
  reviews.forEach((review) => reviewBySkill.set(review.skill, review));

  const reports = files
    .filter((file) => /^benchmark\/test-.+-\d{4}-\d{2}-\d{2}\.md$/.test(file))
    .map(parseBenchmarkReport)
    .filter(Boolean)
    .filter((report) => report.agents.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const evidence = new Map();
  reports.forEach((report) => {
    const review = reviewBySkill.get(report.skill);
    evidence.set(report.skill, review ? { ...report, subjectiveReview: review } : report);
  });
  return evidence;
}

const WORKFLOW_SKILL_MAP = {
  first:      { 2: "roadmap", 3: "exec" },
  ship:       { 4: "ship" },
  spec:       { 1: "spec-interview", 3: "roadmap", 4: "exec" },
  research:   { 4: "feature-interview" },
  handoff:    { 2: "exec", 4: "ship" },
  validation: { 1: "debug" },
};

function buildWorkflowBenchmarks(benchmarkEvidence) {
  const result = {};
  for (const [workflowKey, stepMap] of Object.entries(WORKFLOW_SKILL_MAP)) {
    const stepBenchmarks = {};
    const passRates = [];
    const qualityScores = [];
    let stepsBenchmarked = 0;

    for (const [indexStr, skillName] of Object.entries(stepMap)) {
      const evidence = benchmarkEvidence.get(skillName);
      if (!evidence) {
        stepBenchmarks[Number(indexStr)] = {
          skill: skillName,
          passRate: null,
          qualityScore: null,
          demo: null,
        };
        continue;
      }

      const bestAgent = evidence.agents.reduce((best, a) => {
        const bp = parsePercent(best.passRate);
        const ap = parsePercent(a.passRate);
        return (ap ?? -1) > (bp ?? -1) ? a : best;
      }, evidence.agents[0]);

      const passRate = bestAgent ? bestAgent.passRate : null;
      const qualityEntry = (evidence.quality || []).find((q) => q.agent === (bestAgent?.agent || ""));
      const qualityScore = qualityEntry ? qualityEntry.averageQualityScore : null;

      if (passRate) {
        const pv = parsePercent(passRate);
        if (pv !== null) passRates.push(pv);
      }
      if (qualityScore) {
        const qv = parsePercent(qualityScore);
        if (qv !== null) qualityScores.push(qv);
      }

      stepsBenchmarked++;
      stepBenchmarks[Number(indexStr)] = {
        skill: skillName,
        passRate: passRate || null,
        qualityScore: qualityScore || null,
        demo: evidence.demo || null,
      };
    }

    const stepsTotal = Object.keys(stepMap).length;
    result[workflowKey] = {
      workflowKey,
      stepsTotal,
      stepsBenchmarked,
      aggregatePassRate: passRates.length ? `${Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length)}%` : null,
      aggregateQuality: qualityScores.length ? `${(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1)}%` : null,
      stepBenchmarks,
    };
  }
  return result;
}

function generateBenchmarkMatrix(files, activeSkillNames) {
  const reportPaths = discoverBenchmarkRunReportPaths(repoRoot);
  const { testReports: curatedReports, reviewReports: reviewFiles } = discoverBenchmarkReportPaths(files);

  const curatedBySkill = new Map();
  for (const rp of curatedReports) {
    const m = rp.match(/^benchmark\/test-(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
    if (m) {
      const existing = curatedBySkill.get(m[1]);
      if (!existing || m[2] > existing.date) curatedBySkill.set(m[1], { path: rp, date: m[2] });
    }
  }

  const reviewBySkill = new Map();
  for (const rv of reviewFiles) {
    const m = rv.match(/^benchmark\/review-(.+)-(\d{4}-\d{2}-\d{2})\.md$/);
    if (m) {
      const existing = reviewBySkill.get(m[1]);
      if (!existing || m[2] > existing.date) reviewBySkill.set(m[1], { path: rv, date: m[2] });
    }
  }

  const reports = reportPaths.map((rp) => {
    const json = readJson(rp);
    if (!json || !json.skill || !json.agent) return null;
    return { ...json, reportPath: rp };
  }).filter((report) => report && activeSkillNames.has(report.skill));

  const isNewerReport = (candidate, existing) => {
    const candidateGeneratedAt = candidate.generatedAt || "";
    const existingGeneratedAt = existing.generatedAt || "";
    if (candidateGeneratedAt !== existingGeneratedAt) {
      return candidateGeneratedAt > existingGeneratedAt;
    }
    return (candidate.reportPath || "") > (existing.reportPath || "");
  };

  // Group by skill+agent: keep latest evaluated report (for graded table)
  // and collect all zero-evaluated reports (for incomplete table)
  const latestEvaluated = new Map();
  const zeroEvaluated = [];
  for (const r of reports) {
    if (r.evaluatedRuns > 0) {
      const key = `${r.skill}|${r.agent}`;
      const existing = latestEvaluated.get(key);
      if (!existing || isNewerReport(r, existing)) {
        latestEvaluated.set(key, r);
      }
    } else {
      zeroEvaluated.push(r);
    }
  }

  const graded = [];
  for (const r of Array.from(latestEvaluated.values()).sort((a, b) => a.skill.localeCompare(b.skill) || a.agent.localeCompare(b.agent))) {
    const hardPassRate = `${Math.round(r.passRate * 100)}%`;
    const hasQuality = r.qualitySummary && r.qualitySummary.evaluatedRuns > 0;
    const outputQuality = hasQuality ? `${(r.qualitySummary.averageScore * 100).toFixed(1)}%` : "not scored";
    const review = reviewBySkill.get(r.skill);
    const subjectiveReview = review ? `\`${review.path}\`` : "none";
    const curated = curatedBySkill.get(r.skill);
    const status = hasQuality ? "graded" : "partially graded";

    const notes = [];
    if (curated) notes.push(`Curated report: \`${curated.path}\`.`);
    if (hasQuality && r.evaluatedRuns === 1) notes.push("One evaluated persisted run with deterministic quality scoring.");
    if (!hasQuality && r.evaluatedRuns > 0) notes.push("Hard assertion evidence exists; no quality score in the latest persisted evaluated report.");
    if (review) notes.push(`Subjective review median score available.`);

    graded.push({
      skill: r.skill,
      agent: titleize(r.agent),
      reportPath: r.reportPath,
      runs: r.evaluatedRuns,
      hardPassRate,
      outputQuality,
      subjectiveReview,
      status,
      notes: notes.join(" ") || "—"
    });
  }

  // Keep only the latest zero-evaluated report per skill+agent for the incomplete table
  const latestZero = new Map();
  for (const r of zeroEvaluated) {
    const key = `${r.skill}|${r.agent}`;
    const existing = latestZero.get(key);
    if (!existing || isNewerReport(r, existing)) {
      latestZero.set(key, r);
    }
  }

  const dedupedIncomplete = Array.from(latestZero.values())
    .sort((a, b) => a.skill.localeCompare(b.skill) || a.agent.localeCompare(b.agent))
    .map((r) => {
      const hasEvaluated = latestEvaluated.has(`${r.skill}|${r.agent}`);
      const notes = [];
      if (r.totalRuns === 0 && r.evaluatedRuns === 0) notes.push("Report exists with zero total and evaluated runs. Do not count as benchmarked.");
      if (hasEvaluated) notes.push("Prefer the later evaluated report listed above.");
      return {
        skill: r.skill,
        agent: titleize(r.agent),
        reportPath: r.reportPath,
        status: "blocked/incomplete",
        notes: notes.join(" ") || "Report exists with zero evaluated runs."
      };
    });

  const now = new Date().toISOString().slice(0, 10);

  let md = `# Benchmark Results Matrix

> Generated by \`apps/skills-showcase/scripts/generate-skills-showcase-data.mjs\` on ${now}. Do not edit by hand.

This matrix tracks skills that already have persisted benchmark run data and grades. It is separate from the benchmark coverage registry in \`tests/harness/bench-coverage.ts\`, which tracks whether a skill has custom, generic, or blocked setup coverage.

## Status Definitions

| Status | Meaning |
|---|---|
| \`graded\` | Persisted benchmark data exists with evaluated runs and either hard assertion grades, output-quality grades, or both. |
| \`partially graded\` | Persisted evaluated runs exist, but quality scoring or subjective review is missing. |
| \`blocked/incomplete\` | Persisted report exists, but no evaluated skill run was completed. |

## Current Graded Skills

| Skill | Agent | Latest Raw Report | Runs | Hard Pass Rate | Output Quality | Subjective Review | Status | Notes |
|---|---|---:|---:|---:|---:|---|---|---|
`;

  for (const row of graded) {
    md += `| \`${row.skill}\` | ${row.agent} | \`${row.reportPath}\` | ${row.runs} | ${row.hardPassRate} | ${row.outputQuality} | ${row.subjectiveReview} | ${row.status} | ${row.notes} |\n`;
  }

  if (dedupedIncomplete.length > 0) {
    md += `
## Incomplete Persisted Reports

| Skill | Agent | Raw Report | Status | Notes |
|---|---|---|---|---|
`;
    for (const row of dedupedIncomplete) {
      md += `| \`${row.skill}\` | ${row.agent} | \`${row.reportPath}\` | ${row.status} | ${row.notes} |\n`;
    }
  }

  md += `
## Coverage Gaps

- Most repository skills have custom benchmark setup coverage but do not yet have persisted evaluated benchmark data and grades.
- The website currently has no public benchmark-results surface. A follow-up should expose this matrix or generated data derived from it in the Skills Showcase.

## Safe Git-Fixture Skills

\`commit-and-push-by-feature\` and \`sync\` now have custom benchmark coverage using permission-gated disposable GitHub test repositories (see \`docs/safe-git-benchmark-fixtures.md\`):

- \`commit-and-push-by-feature\`: \`tests/layer4/setups/git-fixture-commit-and-push.setup.ts\`
- \`sync\`: \`tests/layer4/setups/git-fixture-sync.setup.ts\`

Both fixtures require explicit user permission before any live GitHub operation (\`gh repo create\`, \`gh repo delete\`). Cleanup failures are reported as infrastructure-blocked evidence, not skill failures.
`;

  writeFileSync(matrixOutputPath, md);
  console.log(`Wrote ${path.relative(repoRoot, matrixOutputPath)} with ${graded.length} graded and ${dedupedIncomplete.length} incomplete rows.`);
}

// Read the generated skillpacks manifest from the git index (the same
// index-truth rule parseSkill/fingerprintFiles follow), so a concurrent
// session's unstaged manifest edits never leak into committed showcase data.
function readManifestFromIndex() {
  const text = readTextFromIndex(repoRoot, manifestRelativePath);
  return text ? JSON.parse(text) : null;
}

// Resolve the manifest's 5 canonical decks into showcase shapes. Each phase
// card (an exact skill name) resolves to the mirrorKey-deduped showcase skill
// id from the already-parsed `skills` list, scoped to the deck's packs so the
// claude variant wins (skills are path-sorted, claude before codex).
function buildDecksAndSets(manifest, skills) {
  const manifestDecks = manifest?.decks ?? [];

  const resolveCardId = (deck, card) => {
    const match = skills.find(
      (skill) =>
        deck.full_packs.includes(skill.pack) &&
        (skill.mirrorKey || skill.name) === card,
    );
    return match ? match.id : null;
  };

  const decks = manifestDecks.map((deck) => ({
    slug: deck.name,
    name: deck.title,
    domain: deck.domain,
    tempo: deck.tempo,
    phases: (deck.phases ?? []).map((phase) => ({
      key: phase.key,
      name: phase.name,
      suggestedCardIds: (phase.cards ?? [])
        .map((card) => resolveCardId(deck, card))
        .filter(Boolean),
    })),
  }));

  // Group decks by domain into sets — the parent grouping the showcase renders
  // as a domain shelf; packs are the deduped union of the grouped decks' packs.
  const setsByDomain = new Map();
  for (const deck of manifestDecks) {
    const entry = setsByDomain.get(deck.domain) ?? {
      domain: deck.domain,
      decks: [],
      packs: [],
    };
    entry.decks.push(deck.name);
    entry.packs.push(...(deck.full_packs ?? []));
    setsByDomain.set(deck.domain, entry);
  }
  const sets = Array.from(setsByDomain.values()).map((set) => ({
    domain: set.domain,
    decks: set.decks,
    packs: Array.from(new Set(set.packs)),
  }));

  return { decks, sets };
}

function main() {
  const files = gitFiles(repoRoot);
  const benchmarkEvidence = benchmarkEvidenceBySkill(files);
  const skillPaths = activeSkillPaths(files);
  const { testReports: benchmarkPaths, reviewReports: benchmarkReviewPaths } = discoverBenchmarkReportPaths(files);
  const benchmarkDemoPaths = Array.from(benchmarkEvidence.values())
    .flatMap((evidence) => (evidence.demo ? [evidence.demo.runPath] : []))
    .filter((file) => files.includes(file));
  const packPaths = files.filter((file) => /^packs\/[^/]+\/PACK\.md$/.test(file));
  const sourcePaths = [...skillPaths, ...packPaths, ...benchmarkPaths, ...benchmarkReviewPaths, ...benchmarkDemoPaths, manifestRelativePath].sort();

  const skills = skillPaths
    .map((skillPath) => parseSkill(repoRoot, skillPath, { source: "index" }))
    .map((skill) => {
      const evidence = benchmarkEvidence.get(skill.mirrorKey);
      return evidence ? { ...skill, benchmarkEvidence: evidence } : skill;
    })
    .sort((a, b) => a.path.localeCompare(b.path));
  const packs = listPacks(repoRoot, files, skills, { source: "index" });
  const manifest = readManifestFromIndex();
  const { decks, sets } = buildDecksAndSets(manifest, skills);
  const sourceFingerprint = fingerprintFiles(repoRoot, sourcePaths, { source: "index" });

  const data = {
    generatedAt: "1970-01-01T00:00:00.000Z",
    sourceFingerprint,
    sourceCount: sourcePaths.length,
    skillCount: skills.length,
    packCount: packs.length,
    skills,
    packs,
    decks,
    sets,
    workflowBenchmarks: buildWorkflowBenchmarks(benchmarkEvidence)
  };

  const serialized = JSON.stringify(data, null, 2);
  const contents = `// Generated by apps/skills-showcase/scripts/generate-skills-showcase-data.mjs. Do not edit by hand.\nwindow.SKILLS_SHOWCASE_DATA = ${serialized};\n`;

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, contents);
  mkdirSync(path.dirname(appOutputPath), { recursive: true });
  writeFileSync(appOutputPath, contents);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)} with ${skills.length} skills and ${packs.length} packs.`);
  console.log(`Wrote ${path.relative(repoRoot, appOutputPath)} (Next.js app copy).`);

  generateBenchmarkMatrix(files, new Set(skills.map((skill) => skill.name)));
}

main();
