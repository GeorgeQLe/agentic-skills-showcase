#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fileFingerprint,
  readTextFromIndex
} from "../../../scripts/catalog/index.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const outputPath = path.join(repoRoot, "docs/skills-showcase/assets/github-proof-data.js");
const appOutputPath = path.join(repoRoot, "apps/skills-showcase/public/assets/github-proof-data.js");

const proofArtifacts = [
  {
    id: "dogfood-history",
    title: "Dogfood changelog",
    path: "tasks/history.md",
    kind: "history"
  },
  {
    id: "phase-plan",
    title: "Active roadmap and todo",
    path: "tasks/todo.md",
    kind: "planning"
  },
  {
    id: "quality-gate",
    title: "Quality gate contract",
    path: "docs/quality-gate-contract.md",
    kind: "quality"
  },
  {
    id: "skills-reference",
    title: "Skills reference",
    path: "docs/skills-reference.md",
    kind: "reference"
  }
];

const validationScripts = [
  {
    id: "skill-deps",
    title: "Skill dependency references",
    command: "./scripts/skill-deps.sh --broken",
    path: "scripts/skill-deps.sh"
  },
  {
    id: "skill-versions",
    title: "Skill version metadata",
    command: "./scripts/skill-versions.sh --missing",
    path: "scripts/skill-versions.sh"
  },
  {
    id: "skill-mirror-parity",
    title: "Claude/Codex mirror parity",
    command: "./scripts/skill-mirror-parity-audit.sh",
    path: "scripts/skill-mirror-parity-audit.sh"
  },
  {
    id: "next-step-routing",
    title: "Mutation next-step routing",
    command: "./scripts/skill-next-step-routing.sh --missing",
    path: "scripts/skill-next-step-routing.sh"
  },
  {
    id: "pack-routing",
    title: "Cross-pack routing guard",
    command: "./scripts/skill-pack-routing-audit.sh",
    path: "scripts/skill-pack-routing-audit.sh"
  },
  {
    id: "showcase-data",
    title: "Skills Showcase data freshness",
    command: "./apps/skills-showcase/scripts/validate-skills-showcase-data.sh",
    path: "apps/skills-showcase/scripts/validate-skills-showcase-data.sh"
  }
];

function git(args, fallback = null) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return fallback;
  }
}

function readText(relativePath) {
  return readTextFromIndex(repoRoot, relativePath);
}

function normalizeRepoUrl(remoteUrl) {
  if (!remoteUrl) {
    return null;
  }
  if (remoteUrl.startsWith("git@github.com:")) {
    return `https://github.com/${remoteUrl.slice("git@github.com:".length).replace(/\.git$/, "")}`;
  }
  return remoteUrl.replace(/\.git$/, "");
}

function githubApiUrl(repositoryUrl) {
  const match = repositoryUrl && repositoryUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }
  return `https://api.github.com/repos/${match[1]}/${match[2]}`;
}

function trackedStatus(relativePath) {
  const exists = existsSync(path.join(repoRoot, relativePath));
  return {
    path: relativePath,
    tracked: exists,
    exists
  };
}

function recentHistoryEntries() {
  if (!existsSync(path.join(repoRoot, "tasks/history.md"))) {
    return [];
  }

  const lines = readText("tasks/history.md").split("\n");
  return lines
    .filter((line) => /^##\s+\d{4}-\d{2}-\d{2}/.test(line))
    .slice(0, 8)
    .map((line) => line.replace(/^##\s+/, "").trim());
}

async function publicGithubMetadata(repositoryUrl) {
  const apiUrl = githubApiUrl(repositoryUrl);
  if (process.env.SKILLS_SHOWCASE_REFRESH_GITHUB !== "1") {
    return {
      status: "local-only",
      reason: "Committed proof data uses deterministic local git evidence. Set SKILLS_SHOWCASE_REFRESH_GITHUB=1 for an ad hoc public GitHub metadata refresh.",
      url: repositoryUrl
    };
  }

  if (!apiUrl || typeof fetch !== "function") {
    return {
      status: "fallback",
      reason: "Repository remote is not a public GitHub HTTPS URL or fetch is unavailable.",
      url: repositoryUrl
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "agentic-skills-showcase-generator"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        status: "fallback",
        reason: `GitHub public metadata request returned HTTP ${response.status}.`,
        url: repositoryUrl
      };
    }

    const json = await response.json();
    return {
      status: "refreshed",
      repository: json.full_name || null,
      description: json.description || null,
      visibility: json.visibility || null,
      defaultBranch: json.default_branch || null,
      stars: Number.isInteger(json.stargazers_count) ? json.stargazers_count : null,
      forks: Number.isInteger(json.forks_count) ? json.forks_count : null,
      openIssues: Number.isInteger(json.open_issues_count) ? json.open_issues_count : null,
      freshnessPolicy: {
        status: "volatile-fields-excluded",
        reason: "GitHub pushed_at changes after every repository push, so it is excluded from committed proof data."
      },
      url: json.html_url || repositoryUrl
    };
  } catch (error) {
    return {
      status: "fallback",
      reason: `GitHub public metadata unavailable: ${error.name || "request-failed"}.`,
      url: repositoryUrl
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const remoteUrl = git(["remote", "get-url", "origin"], null);
  const repositoryUrl = normalizeRepoUrl(remoteUrl);
  const sourceFiles = [
    ...proofArtifacts.map((artifact) => artifact.path),
    ...validationScripts.map((script) => script.path),
    "docs/skills-showcase/assets/skills-data.js"
  ].filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const sourceFingerprint = fileFingerprint(repoRoot, sourceFiles, { source: "index" });

  const data = {
    generatedAt: "1970-01-01T00:00:00.000Z",
    sourceFingerprint,
    repository: {
      remoteUrl,
      url: repositoryUrl,
      branch: git(["branch", "--show-current"], null),
      revisionPolicy: {
        status: "content-fingerprint",
        reason: "Commit SHA is excluded so committed generated data does not become stale immediately after the shipping commit."
      }
    },
    publicGithub: await publicGithubMetadata(repositoryUrl),
    proofArtifacts: proofArtifacts.map((artifact) => ({
      ...artifact,
      ...trackedStatus(artifact.path)
    })),
    validationScripts: validationScripts.map((script) => ({
      ...script,
      ...trackedStatus(script.path)
    })),
    recentHistoryEntries: recentHistoryEntries(),
    boundaries: [
      "Static proof data only; no runtime API or database is used.",
      "Committed proof data uses deterministic local git evidence; public GitHub metadata refresh is opt-in.",
      "No LexCorp live product metrics, visitor analytics, secrets, or GitHub Actions are claimed."
    ]
  };

  const serialized = JSON.stringify(data, null, 2);
  const contents = `// Generated by apps/skills-showcase/scripts/generate-skills-showcase-github-data.mjs. Do not edit by hand.\nwindow.SKILLS_SHOWCASE_GITHUB_PROOF_DATA = ${serialized};\n`;

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, contents);
  mkdirSync(path.dirname(appOutputPath), { recursive: true });
  writeFileSync(appOutputPath, contents);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)} with ${data.proofArtifacts.length} proof artifacts and ${data.validationScripts.length} validation scripts.`);
  console.log(`Wrote ${path.relative(repoRoot, appOutputPath)} (Next.js app copy).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
