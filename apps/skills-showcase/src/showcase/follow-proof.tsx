/**
 * Imperative DOM renderer for the /follow proof preview.
 * The page is server-rendered HTML with `data-follow-proof-stats` and
 * `data-follow-receipts` hooks; this client component hydrates them from the
 * generated static GitHub-proof data. Extracted from the retired catalog.tsx
 * (unified-experience Phase 6) — /follow is the only surviving consumer of the
 * follow-proof slice, so it now owns a focused component instead of importing
 * the full catalog renderer.
 */
"use client";

import { useEffect } from "react";

function text(value: unknown, fallback?: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback || "";
}

function toTitle(value: unknown): string {
  return text(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const repoBaseUrl = "https://github.com/GeorgeQLe/agentic-skills/blob/master/";

function sourceLink(path: unknown): string | null {
  const cleanPath = text(path);
  if (!cleanPath) return null;
  return repoBaseUrl + cleanPath.split("/").map(encodeURIComponent).join("/");
}

function renderEmpty(target: Element, message: string) {
  target.innerHTML = "";
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.textContent = message;
  target.appendChild(notice);
}

interface ProofArtifact {
  id: string;
  title?: string;
  path?: string;
  command?: string;
  tracked?: boolean;
  exists?: boolean;
}

interface ProofData {
  proofArtifacts?: ProofArtifact[];
  validationScripts?: ProofArtifact[];
  recentHistoryEntries?: string[];
  publicGithub?: { status?: string; reason?: string; url?: string };
}

export default function FollowProofClient() {
  useEffect(() => {
    const statsTarget = document.querySelector("[data-follow-proof-stats]");
    const receiptTarget = document.querySelector("[data-follow-receipts]");
    if (!statsTarget && !receiptTarget) return;

    const proofData = ((window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_GITHUB_PROOF_DATA || {}) as ProofData;
    const artifacts = Array.isArray(proofData.proofArtifacts) ? proofData.proofArtifacts : [];
    const validationScripts = Array.isArray(proofData.validationScripts) ? proofData.validationScripts : [];
    const historyEntries = Array.isArray(proofData.recentHistoryEntries) ? proofData.recentHistoryEntries : [];
    const publicStatus = proofData.publicGithub?.status || "static";

    if (statsTarget) {
      statsTarget.innerHTML = "";
      (
        [
          [String(artifacts.length || "static"), "proof artifacts"],
          [String(validationScripts.length || "tracked"), "validation scripts"],
          [publicStatus, "GitHub metadata"]
        ] as [string, string][]
      ).forEach(([value, label]) => {
        const item = document.createElement("div");
        const valueNode = document.createElement("strong");
        valueNode.textContent = value;
        const labelNode = document.createElement("span");
        labelNode.textContent = label;
        item.append(valueNode, labelNode);
        statsTarget.appendChild(item);
      });
    }

    if (!receiptTarget) return;
    receiptTarget.innerHTML = "";
    const receiptRows: { status: string; title: string; body: string; href: string | null }[] = [
      ...artifacts.slice(0, 2).map((a) => ({
        status: a.tracked ? "tracked" : "available",
        title: text(a.title, toTitle(a.id)),
        body: text(a.path, "Static repository proof."),
        href: sourceLink(a.path)
      })),
      ...validationScripts.slice(0, 1).map((s) => ({
        status: "validation",
        title: text(s.title, toTitle(s.id)),
        body: text(s.command, s.path),
        href: sourceLink(s.path)
      })),
      {
        status: publicStatus,
        title: "GitHub enrichment boundary",
        body: proofData.publicGithub?.reason
          || "Public GitHub metadata is optional; local git evidence remains the fallback.",
        href: proofData.publicGithub?.url || null
      },
      ...historyEntries.slice(0, 1).map((entry) => ({
        status: "history",
        title: entry,
        body: "Recent shipped work from generated static proof data.",
        href: sourceLink("tasks/history.md")
      }))
    ];

    if (!receiptRows.length) {
      renderEmpty(receiptTarget, "Static proof preview is unavailable.");
      return;
    }

    receiptRows.forEach((row) => {
      const card = document.createElement("article");
      card.className = "proof-item";
      const status = document.createElement("span");
      status.className = row.status === "fallback" ? "status-warn" : "status-ok";
      status.textContent = row.status;
      const heading = document.createElement("h3");
      heading.textContent = row.title;
      const copy = document.createElement("p");
      if (row.href) {
        const anchor = document.createElement("a");
        anchor.href = row.href;
        anchor.textContent = row.body;
        copy.appendChild(anchor);
      } else {
        copy.textContent = row.body;
      }
      card.append(status, heading, copy);
      receiptTarget.appendChild(card);
    });
  }, []);

  return null;
}
