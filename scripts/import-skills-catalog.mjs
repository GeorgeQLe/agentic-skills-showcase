#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportRelativeDir = "exports/skills-catalog/v1";
const catalogFile = "catalog.json";
const proofFile = "proof.json";
const manifestFile = "manifest.json";
const schemaVersion = "skills-catalog.v1";

const skillsRepoUrl = process.env.SKILLS_REPO_URL || "https://github.com/GeorgeQLe/agentic-skills.git";
const skillsRepoRef = process.env.SKILLS_REPO_REF || "master";
const outputJsonDir = path.join(repoRoot, "public/assets/skills-catalog/v1");
const skillsDataPath = path.join(repoRoot, "public/assets/skills-data.js");
const proofDataPath = path.join(repoRoot, "public/assets/github-proof-data.js");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeJsGlobal(filePath, globalName, data) {
  const body = JSON.stringify(data, null, 2);
  writeFileSync(filePath, `window.${globalName} = ${body};\n`);
}

function isLocalDirectory(value) {
  return existsSync(value) && existsSync(path.join(value, ".git"));
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  }).trim();
}

function checkoutSource() {
  if (isLocalDirectory(skillsRepoUrl) && /^(WORKTREE|working-tree|local)$/i.test(skillsRepoRef)) {
    return {
      root: skillsRepoUrl,
      cleanup: () => {}
    };
  }

  const tmp = mkdtempSync(path.join(os.tmpdir(), "agentic-skills-catalog-"));
  try {
    try {
      git(["clone", "--quiet", "--depth", "1", "--branch", skillsRepoRef, skillsRepoUrl, tmp]);
    } catch {
      rmSync(tmp, { recursive: true, force: true });
      const fullTmp = mkdtempSync(path.join(os.tmpdir(), "agentic-skills-catalog-"));
      git(["clone", "--quiet", skillsRepoUrl, fullTmp]);
      git(["-C", fullTmp, "checkout", "--quiet", skillsRepoRef]);
      return {
        root: fullTmp,
        cleanup: () => rmSync(fullTmp, { recursive: true, force: true })
      };
    }

    return {
      root: tmp,
      cleanup: () => rmSync(tmp, { recursive: true, force: true })
    };
  } catch (error) {
    rmSync(tmp, { recursive: true, force: true });
    throw error;
  }
}

function requireSchema(name, data) {
  if (data?.schema_version !== schemaVersion) {
    throw new Error(`${name} uses ${data?.schema_version || "no schema_version"}, expected ${schemaVersion}`);
  }
}

function mapDeck(deck) {
  return {
    ...deck,
    phases: Array.isArray(deck.phases)
      ? deck.phases.map((phase) => ({
          ...phase,
          suggestedCardIds: phase.suggested_card_ids || phase.suggestedCardIds || []
        }))
      : []
  };
}

function mapPack(pack) {
  return {
    ...pack,
    skillCount: pack.skillCount ?? pack.skill_count ?? 0
  };
}

function mapSkill(skill) {
  return {
    ...skill,
    benchmarkEvidence: skill.benchmarkEvidence ?? skill.benchmark_evidence ?? null
  };
}

function buildShowcaseData(catalog, manifest) {
  return {
    schemaVersion: catalog.schema_version,
    generatedAt: catalog.generated_at,
    sourceCommit: catalog.source_commit,
    sourceFingerprint: catalog.source_fingerprint,
    sourceCount: catalog.source_count,
    skillCount: catalog.skill_count,
    packCount: catalog.pack_count,
    packageManifest: manifest.package_manifest || null,
    skills: Array.isArray(catalog.skills) ? catalog.skills.map(mapSkill) : [],
    packs: Array.isArray(catalog.packs) ? catalog.packs.map(mapPack) : [],
    decks: Array.isArray(catalog.decks) ? catalog.decks.map(mapDeck) : [],
    sets: Array.isArray(catalog.sets) ? catalog.sets : []
  };
}

function buildProofData(proof) {
  return {
    schemaVersion: proof.schema_version,
    generatedAt: proof.generated_at,
    sourceCommit: proof.source_commit,
    sourceFingerprint: proof.source_fingerprint,
    sourceCount: proof.source_count,
    repository: proof.repository || null,
    proofArtifacts: proof.proof_artifacts || [],
    validationScripts: proof.validation_scripts || [],
    recentHistoryEntries: proof.recent_history_entries || [],
    boundaries: proof.boundaries || [],
    publicGithub: {
      status: "source-export",
      reason: "Public Showcase proof is imported from the pinned agentic-skills skills-catalog export.",
      url: proof.repository?.url || null
    }
  };
}

function main() {
  const source = checkoutSource();
  try {
    const sourceExportDir = path.join(source.root, exportRelativeDir);
    const catalog = readJson(path.join(sourceExportDir, catalogFile));
    const proof = readJson(path.join(sourceExportDir, proofFile));
    const manifest = readJson(path.join(sourceExportDir, manifestFile));

    requireSchema(catalogFile, catalog);
    requireSchema(proofFile, proof);
    requireSchema(manifestFile, manifest);

    mkdirSync(outputJsonDir, { recursive: true });
    for (const file of [catalogFile, proofFile, manifestFile]) {
      cpSync(path.join(sourceExportDir, file), path.join(outputJsonDir, file));
    }

    writeJsGlobal(skillsDataPath, "SKILLS_SHOWCASE_DATA", buildShowcaseData(catalog, manifest));
    writeJsGlobal(proofDataPath, "SKILLS_SHOWCASE_GITHUB_PROOF_DATA", buildProofData(proof));

    writeJson(path.join(outputJsonDir, "import-source.json"), {
      schema_version: "skills-showcase.import.v1",
      imported_at: new Date(0).toISOString(),
      skills_repo_url: skillsRepoUrl,
      skills_repo_ref: skillsRepoRef,
      source_commit: catalog.source_commit,
      source_fingerprint: catalog.source_fingerprint,
      source_export_dir: exportRelativeDir
    });

    console.log(`Imported ${catalog.skill_count} skills from ${skillsRepoUrl} @ ${skillsRepoRef}`);
  } finally {
    source.cleanup();
  }
}

main();
