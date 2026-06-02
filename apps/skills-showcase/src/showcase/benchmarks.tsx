/**
 * Imperative DOM renderer for the benchmarks section - same pattern as
 * catalog.tsx: finds `data-*` hooks in server-rendered HTML and injects
 * benchmark cards/tables.
 */
"use client";

import { useEffect } from "react";
import type { Skill, ShowcaseData, BenchmarkEvidence } from "./types";

const repoBaseUrl = "https://github.com/GeorgeQLe/agentic-skills/blob/master/";

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

function sourceLink(path: unknown): string | null {
  const cleanPath = text(path);
  if (!cleanPath) return null;
  return repoBaseUrl + cleanPath.split("/").map(encodeURIComponent).join("/");
}

function isGraded(evidence: BenchmarkEvidence): boolean {
  return Array.isArray(evidence.quality) && evidence.quality.length > 0;
}

function reviewLabel(evidence: BenchmarkEvidence): string {
  const review = evidence.subjectiveReview;
  if (!review) return "--";
  const score = text(review.medianScore);
  const range = text(review.scoreRange);
  if (!score) return "reviewed";
  return `median ${score}${range ? ` (${range})` : ""}`;
}

export default function BenchmarksClient() {
  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    const showcaseData = (win.SKILLS_SHOWCASE_DATA || {}) as ShowcaseData;
    const allSkills: Skill[] = Array.isArray(showcaseData.skills) ? showcaseData.skills : [];

    const benchmarked = allSkills.filter(
      (s) => s.benchmarkEvidence && Array.isArray(s.benchmarkEvidence.agents) && s.benchmarkEvidence.agents.length
    );

    const listTarget = document.querySelector("[data-benchmarks-list]");
    const countTarget = document.querySelector("[data-benchmarks-count]");
    const missingTarget = document.querySelector("[data-benchmarks-missing]") as HTMLElement | null;

    if (!listTarget) return;

    if (!benchmarked.length) {
      if (missingTarget) missingTarget.hidden = false;
      listTarget.innerHTML = "";
      const notice = document.createElement("div");
      notice.className = "notice";
      notice.textContent = "No benchmark evidence is available. Run benchmarks and regenerate showcase data.";
      listTarget.appendChild(notice);
      return;
    }

    if (countTarget) countTarget.textContent = String(benchmarked.length);

    // Multi-platform skills (claude/codex) share a mirrorKey - dedup so each
    // logical skill gets one benchmark row regardless of platform variants.
    const seen = new Set<string>();
    const deduped = benchmarked.filter((s) => {
      const key = text(s.mirrorKey, s.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const table = document.createElement("table");
    table.className = "benchmarks-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Skill", "Status", "Agent", "Pass Rate", "Quality", "Review", "Date", "Report"].forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    deduped.forEach((skill) => {
      const evidence = skill.benchmarkEvidence!;
      const graded = isGraded(evidence);

      evidence.agents.forEach((agent, agentIdx) => {
        const tr = document.createElement("tr");

        if (agentIdx === 0) {
          const tdSkill = document.createElement("td");
          tdSkill.rowSpan = evidence.agents.length;
          const skillLink = document.createElement("a");
          skillLink.href = `/catalog?q=${encodeURIComponent(skill.name)}`;
          skillLink.textContent = text(skill.title, toTitle(skill.name));
          tdSkill.appendChild(skillLink);
          tr.appendChild(tdSkill);

          const tdStatus = document.createElement("td");
          tdStatus.rowSpan = evidence.agents.length;
          const badge = document.createElement("span");
          badge.className = graded ? "badge badge-graded" : "badge badge-partial";
          badge.textContent = graded ? "graded" : "assertions only";
          tdStatus.appendChild(badge);
          tr.appendChild(tdStatus);
        }

        const tdAgent = document.createElement("td");
        tdAgent.textContent = agent.agent;
        tr.appendChild(tdAgent);

        const tdPass = document.createElement("td");
        tdPass.className = "mono";
        tdPass.textContent = agent.passRate;
        tr.appendChild(tdPass);

        const tdQuality = document.createElement("td");
        tdQuality.className = "mono";
        const qualityEntry = Array.isArray(evidence.quality)
          ? evidence.quality.find((q) => q.agent === agent.agent)
          : undefined;
        tdQuality.textContent = qualityEntry ? qualityEntry.averageQualityScore : "--";
        tr.appendChild(tdQuality);

        if (agentIdx === 0) {
          const tdReview = document.createElement("td");
          tdReview.rowSpan = evidence.agents.length;
          const review = evidence.subjectiveReview;
          const reviewPath = sourceLink(review?.reportPath);
          if (reviewPath) {
            const anchor = document.createElement("a");
            anchor.href = reviewPath;
            anchor.textContent = reviewLabel(evidence);
            tdReview.appendChild(anchor);
          } else {
            tdReview.textContent = reviewLabel(evidence);
          }
          tr.appendChild(tdReview);

          const tdDate = document.createElement("td");
          tdDate.rowSpan = evidence.agents.length;
          tdDate.textContent = text(evidence.date, "--");
          tr.appendChild(tdDate);

          const tdReport = document.createElement("td");
          tdReport.rowSpan = evidence.agents.length;
          const link = sourceLink(evidence.reportPath);
          if (link) {
            const anchor = document.createElement("a");
            anchor.href = link;
            anchor.textContent = "report";
            tdReport.appendChild(anchor);
          } else {
            tdReport.textContent = "--";
          }
          tr.appendChild(tdReport);
        }

        tbody.appendChild(tr);
      });
    });

    table.appendChild(tbody);
    listTarget.innerHTML = "";
    listTarget.appendChild(table);
  }, []);

  return null;
}
