/**
 * Imperative DOM renderer for the catalog page.
 * The page is server-rendered HTML with `data-*` attribute hooks; this client
 * component hydrates by finding those hooks and injecting dynamic content
 * (skill cards, pack maps, benchmarks). This avoids re-rendering the entire
 * page as a client component while still adding interactivity.
 */
"use client";

import { useEffect } from "react";
import type { Skill, Pack, ShowcaseData, BenchmarkEvidence } from "./types";

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

function makeTag(label: string, href?: string): HTMLElement {
  if (href) {
    const tag = document.createElement("a");
    tag.className = "tag tag-link";
    tag.textContent = label;
    tag.href = href;
    return tag;
  }
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = label;
  return tag;
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
  boundaries?: string[];
  repository?: { url?: string; revisionPolicy?: { status: string } };
  publicGithub?: { status?: string; reason?: string; url?: string };
}

function makeBenchmarkPanel(evidence: BenchmarkEvidence | undefined): HTMLDivElement | null {
  if (!evidence || !Array.isArray(evidence.agents) || !evidence.agents.length) return null;

  const panel = document.createElement("div");
  panel.className = "benchmark-panel";
  const heading = document.createElement("strong");
  heading.textContent = `Benchmark passed ${text(evidence.date)}`;
  const summary = document.createElement("p");
  const agents = evidence.agents.map((a) => `${a.agent} ${a.passRate}`).join(" / ");
  const quality =
    Array.isArray(evidence.quality) && evidence.quality.length
      ? ` Quality: ${evidence.quality.map((r) => `${r.agent} ${r.averageQualityScore}`).join(" / ")}.`
      : "";
  summary.textContent = `${agents}.${quality}`;

  const metrics = document.createElement("dl");
  metrics.className = "benchmark-metrics";
  evidence.agents.forEach((a) => {
    (
      [
        [`${a.agent} p50`, a.latencyP50],
        [`${a.agent} cost`, a.totalCost]
      ] as [string, string | undefined][]
    ).forEach(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = text(value, "--");
      metrics.append(term, detail);
    });
  });

  const link = sourceLink(evidence.reportPath);
  if (link) {
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.textContent = text(evidence.reportPath);
    panel.append(heading, summary, metrics, anchor);
  } else {
    panel.append(heading, summary, metrics);
  }

  if (evidence.subjectiveReview) {
    const review = document.createElement("div");
    review.className = "benchmark-review";

    const label = document.createElement("span");
    label.className = "demo-label";
    label.textContent = "Agent review";

    const reviewSummary = document.createElement("p");
    const score = text(evidence.subjectiveReview.medianScore);
    const range = text(evidence.subjectiveReview.scoreRange);
    const scoreText = score ? `Median ${score}${range ? `, range ${range}` : ""}.` : "";
    reviewSummary.textContent = [scoreText, text(evidence.subjectiveReview.verdict)].filter(Boolean).join(" ");

    const reviewLink = sourceLink(evidence.subjectiveReview.reportPath);
    if (reviewLink) {
      const anchor = document.createElement("a");
      anchor.href = reviewLink;
      anchor.textContent = text(evidence.subjectiveReview.reportPath);
      review.append(label, reviewSummary, anchor);
    } else {
      review.append(label, reviewSummary);
    }

    panel.appendChild(review);
  }

  if (evidence.demo) {
    const demo = document.createElement("div");
    demo.className = "benchmark-demo";

    const demoHeading = document.createElement("strong");
    demoHeading.textContent = `${toTitle(evidence.demo.agent)} benchmark demo`;

    const promptLabel = document.createElement("span");
    promptLabel.className = "demo-label";
    promptLabel.textContent = "Prompt";
    const prompt = document.createElement("pre");
    prompt.textContent = evidence.demo.prompt;

    const outputLabel = document.createElement("span");
    outputLabel.className = "demo-label";
    outputLabel.textContent = "Output";
    const output = document.createElement("pre");
    output.textContent = evidence.demo.output;

    const runLink = sourceLink(evidence.demo.runPath);
    if (runLink) {
      const artifact = document.createElement("a");
      artifact.href = runLink;
      artifact.textContent = `run-${String(evidence.demo.runIndex).padStart(3, "0")}.json`;
      demo.append(demoHeading, promptLabel, prompt, outputLabel, output, artifact);
    } else {
      demo.append(demoHeading, promptLabel, prompt, outputLabel, output);
    }

    panel.appendChild(demo);
  }

  return panel;
}

export default function CatalogClient() {
  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    const showcaseData = (win.SKILLS_SHOWCASE_DATA || {}) as ShowcaseData;
    const skills: Skill[] = Array.isArray(showcaseData.skills) ? showcaseData.skills : [];
    const packs: Pack[] = Array.isArray(showcaseData.packs) ? showcaseData.packs : [];

    renderCatalog(skills);
    renderPacks(skills, packs, showcaseData);
    renderProof();
    renderFollowProof();

    // Skills can appear in multiple platform variants (claude/codex) sharing
    // the same mirrorKey - dedup prevents double-counting in the catalog view.
    function platformCountByMirrorKey(): Map<string, Set<string>> {
      const counts = new Map<string, Set<string>>();
      skills.forEach((skill) => {
        const key = text(skill.mirrorKey, skill.name);
        if (!key) return;
        if (!counts.has(key)) counts.set(key, new Set());
        counts.get(key)!.add(skill.platform);
      });
      return counts;
    }

    function renderCatalog(skills: Skill[]) {
      const catalogList = document.querySelector("[data-catalog-list]");
      if (!catalogList) return;

      const catalogSearch = document.querySelector("[data-catalog-search]") as HTMLInputElement | null;
      const platformFilter = document.querySelector("[data-catalog-platform]") as HTMLSelectElement | null;
      const typeFilter = document.querySelector("[data-catalog-type]") as HTMLSelectElement | null;
      const scopeFilter = document.querySelector("[data-catalog-scope]") as HTMLSelectElement | null;
      const catalogCount = document.querySelector("[data-catalog-count]");
      const catalogTotal = document.querySelector("[data-catalog-total]");
      const missingData = document.querySelector("[data-catalog-missing]") as HTMLElement | null;

      if (!skills.length) {
        if (missingData) missingData.hidden = false;
        renderEmpty(catalogList, "No generated skill rows are available.");
        return;
      }

      if (catalogTotal) catalogTotal.textContent = String(skills.length);

      const types = Array.from(new Set(skills.map((s) => text(s.type)).filter(Boolean))).sort();
      types.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = toTitle(type);
        typeFilter?.appendChild(option);
      });

      function rowSearchText(skill: Skill): string {
        return [
          skill.name,
          skill.title,
          skill.description,
          skill.type,
          skill.platform,
          skill.command,
          skill.scope,
          skill.pack,
          skill.path,
          skill.benchmarkEvidence ? skill.benchmarkEvidence.reportPath : "",
          skill.benchmarkEvidence?.demo
            ? `${skill.benchmarkEvidence.demo.prompt} ${skill.benchmarkEvidence.demo.output}`
            : "",
          skill.benchmarkEvidence && Array.isArray(skill.benchmarkEvidence.agents)
            ? skill.benchmarkEvidence.agents.map((a) => `${a.agent} ${a.passRate}`).join(" ")
            : "",
          Array.isArray(skill.tags) ? skill.tags.join(" ") : ""
        ]
          .map((v) => text(v))
          .join(" ")
          .toLowerCase();
      }

      const mirrorPlatformCounts = platformCountByMirrorKey();

      function matches(skill: Skill): boolean {
        const query = catalogSearch?.value?.trim().toLowerCase() || "";
        const platform = platformFilter?.value || "all";
        const type = typeFilter?.value || "all";
        const scope = scopeFilter?.value || "all";
        return (
          (!query || rowSearchText(skill).includes(query)) &&
          (platform === "all" || skill.platform === platform) &&
          (type === "all" || skill.type === type) &&
          (scope === "all" || skill.scope === scope)
        );
      }

      function createRow(skill: Skill): HTMLElement {
        const article = document.createElement("article");
        article.className = "catalog-row";

        const body = document.createElement("div");
        const heading = document.createElement("h3");
        heading.textContent = text(skill.title, toTitle(skill.name));
        const description = document.createElement("p");
        description.textContent = text(skill.description, "No description provided.");

        const chips = document.createElement("div");
        chips.className = "chip-row";
        [skill.platform, skill.type, skill.scope, skill.pack || "global", skill.command]
          .filter(Boolean)
          .forEach((label) => chips.appendChild(makeTag(label as string)));
        const mirrorKey = text(skill.mirrorKey, skill.name);
        if ((mirrorPlatformCounts.get(mirrorKey) || new Set()).size === 1) {
          chips.appendChild(makeTag("one-platform"));
        }
        if (skill.benchmarkEvidence) {
          chips.appendChild(makeTag("benchmark-passed", "/benchmarks"));
        }

        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = "Source details";
        const path = document.createElement("p");
        const link = sourceLink(skill.path);
        if (link) {
          const anchor = document.createElement("a");
          anchor.href = link;
          anchor.textContent = text(skill.path);
          path.appendChild(anchor);
        } else {
          path.textContent = "No source path recorded.";
        }
        details.append(summary, path);

        const benchmarkPanel = makeBenchmarkPanel(skill.benchmarkEvidence);
        body.append(heading, description, chips);
        if (benchmarkPanel) body.appendChild(benchmarkPanel);
        body.appendChild(details);

        const status = document.createElement("span");
        status.className = "status-ok";
        status.textContent = "generated";

        article.append(body, status);
        return article;
      }

      function filterCatalog() {
        const visible = skills.filter(matches);
        catalogList!.innerHTML = "";
        visible.forEach((skill) => catalogList!.appendChild(createRow(skill)));
        if (catalogCount) catalogCount.textContent = String(visible.length);
        if (!visible.length) {
          renderEmpty(catalogList!, "No skills match the current filters.");
        }
      }

      [catalogSearch, platformFilter, typeFilter, scopeFilter].forEach((control) => {
        control?.addEventListener("input", filterCatalog);
        control?.addEventListener("change", filterCatalog);
      });

      filterCatalog();
    }

    function renderPacks(skills: Skill[], packs: Pack[], showcaseData: ShowcaseData) {
      const packMap = document.querySelector("[data-pack-map]");
      if (!packMap) return;

      const summary = document.querySelector("[data-pack-summary]");
      const controls = Array.from(document.querySelectorAll("[data-pack-filter]"));
      const overlayToggle = document.querySelector("[data-pack-overlays]") as HTMLInputElement | null;
      const detail = document.querySelector("[data-pack-detail]");
      const missingData = document.querySelector("[data-pack-missing]") as HTMLElement | null;
      let activeFilter = "all";
      let activePackName = "";

      if (!packs.length) {
        if (missingData) missingData.hidden = false;
        renderEmpty(packMap, "No generated pack rows are available.");
        return;
      }

      if (summary) {
        summary.innerHTML = "";
        (
          [
            ["packs", showcaseData.packCount || packs.length],
            ["skills", showcaseData.skillCount || skills.length],
            ["sources", showcaseData.sourceCount || skills.length]
          ] as [string, number][]
        ).forEach(([label, value]) => {
          const metric = document.createElement("div");
          metric.className = "metric";
          metric.innerHTML = `<span class="metric-value">${value}</span><span class="metric-label">${label}</span>`;
          summary.appendChild(metric);
        });
      }

      const packAnnotations: Record<string, string[]> = {
        "alignment-loop": ["domain", "business", "planning"],
        "business-discovery": ["domain", "business"],
        "business-growth": ["domain", "business"],
        "business-ops": ["domain", "business"],
        "code-quality": ["overlay", "quality"],
        "creator-foundation": ["domain", "creator"],
        devtool: ["domain", "devtool", "alias"],
        game: ["domain", "game", "alias"],
        monorepo: ["overlay", "monorepo"],
        "project-fleet": ["domain", "business"],
        remotion: ["domain", "creator"],
        "youtube-ops": ["domain", "creator"]
      };

      const packPurpose: Record<string, string> = {
        "alignment-loop": "Keeps decision loops explicit when strategy, research, and implementation need repeated alignment.",
        "business-discovery": "Researches market, user, ICP, and product direction before build work.",
        "business-growth": "Supports acquisition, monetization, launch, and growth-system work.",
        "business-ops": "Covers operating workflows for internal business systems and repeatable delivery.",
        "code-quality": "Adds adversarial review and quality gates around risky source changes.",
        "creator-foundation": "Builds creator research foundations, evidence schemas, and platform dossiers.",
        devtool: "Compatibility alias for devtool workflow coverage.",
        game: "Compatibility alias for game workflow coverage.",
        monorepo: "Adds package-boundary planning, lane specs, and monorepo validation guardrails.",
        "project-fleet": "Coordinates portfolio and multi-project fleet operations.",
        remotion: "Scopes video-production workflows away from general creator research.",
        "youtube-ops": "Handles YouTube-specific research, operations, and evidence workflows."
      };

      interface PackAnnotation {
        name: string;
        tags: string[];
        overlay: boolean;
        alias: boolean;
        purpose: string;
      }

      function annotatedPack(pack: Pack): PackAnnotation {
        const name = text(pack.name);
        const tags = packAnnotations[name] || ["domain"];
        const overlay = tags.includes("overlay") || name.includes("kanban") || name === "monorepo";
        const alias = tags.includes("alias") || !pack.path;
        return {
          name,
          tags,
          overlay,
          alias,
          purpose: packPurpose[name] || text(pack.description, `${pack.skillCount || 0} generated skills are available for this pack.`)
        };
      }

      function packMatches(annotation: PackAnnotation): boolean {
        const showOverlays = !overlayToggle || overlayToggle.checked;
        if (annotation.overlay && !showOverlays) return false;
        return activeFilter === "all" || annotation.tags.includes(activeFilter);
      }

      function setActivePack(pack: Pack, annotation: PackAnnotation) {
        activePackName = annotation.name;
        packMap!.querySelectorAll(".pack-node").forEach((node) => {
          node.setAttribute("aria-selected", String((node as HTMLElement).dataset.packName === activePackName));
        });
        if (!detail) return;
        const install = pack.path
          ? `./scripts/pack.sh enable ${annotation.name}`
          : `./scripts/pack.sh enable ${annotation.name} (compatibility alias)`;
        const relatedSkills = skills
          .filter((s) => s.pack === annotation.name || s.path.includes(`/${annotation.name}/`))
          .slice(0, 5);
        detail.innerHTML = "";
        const title = document.createElement("h3");
        title.textContent = text(pack.title, toTitle(annotation.name));
        const purpose = document.createElement("p");
        purpose.textContent = annotation.purpose;
        const command = document.createElement("p");
        command.className = "command";
        command.textContent = install;
        const skillsList = document.createElement("ul");
        skillsList.className = "artifact-list";
        relatedSkills.forEach((s) => {
          const item = document.createElement("li");
          item.textContent = `${s.command}: ${s.description}`;
          skillsList.appendChild(item);
        });
        if (!relatedSkills.length) {
          const item = document.createElement("li");
          item.textContent = "Generated skill rows are available through alias or pack metadata.";
          skillsList.appendChild(item);
        }
        const link = document.createElement("a");
        link.className = "button secondary";
        link.href = `/catalog#pack-${encodeURIComponent(annotation.name)}`;
        link.textContent = "View skills";
        detail.append(makeTag(annotation.overlay ? "overlay" : "domain pack"), title, purpose, command, skillsList, link);
      }

      function createPackNode(pack: Pack): HTMLElement {
        const annotation = annotatedPack(pack);
        const node = document.createElement("article");
        node.className = `pack-node${annotation.overlay ? " overlay" : ""}${annotation.alias ? " alias" : ""}`;
        node.dataset.packName = annotation.name;
        node.dataset.packTags = annotation.tags.join(" ");
        node.tabIndex = 0;
        node.setAttribute("role", "button");
        node.setAttribute("aria-selected", "false");

        const chips = document.createElement("div");
        chips.className = "chip-row";
        chips.appendChild(makeTag(annotation.overlay ? "overlay" : "domain pack"));
        if (annotation.alias) chips.appendChild(makeTag("alias"));
        annotation.tags
          .filter((t) => !["overlay", "domain", "alias"].includes(t))
          .forEach((t) => chips.appendChild(makeTag(t)));
        (Array.isArray(pack.platforms) ? pack.platforms : []).forEach((p) => chips.appendChild(makeTag(p)));

        const heading = document.createElement("h3");
        heading.textContent = text(pack.title, toTitle(annotation.name));
        const copy = document.createElement("p");
        copy.textContent = annotation.purpose;

        const path = document.createElement("p");
        path.className = "coordinate";
        const link = sourceLink(pack.path);
        if (link) {
          const anchor = document.createElement("a");
          anchor.href = link;
          anchor.textContent = text(pack.path);
          path.appendChild(anchor);
        } else {
          path.textContent = "Compatibility alias; no PACK.md path recorded.";
        }

        node.append(chips, heading, copy, path);
        node.addEventListener("click", () => setActivePack(pack, annotation));
        node.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setActivePack(pack, annotation);
          }
        });
        return node;
      }

      function renderPackMap() {
        packMap!.innerHTML = "";
        const visible = packs.filter((p) => packMatches(annotatedPack(p)));
        visible.forEach((p) => packMap!.appendChild(createPackNode(p)));
        if (!visible.length) {
          renderEmpty(packMap!, "No packs match the selected project type and overlay setting.");
          if (detail) detail.innerHTML = "";
          return;
        }
        const selected = visible.find((p) => annotatedPack(p).name === activePackName) || visible[0];
        setActivePack(selected, annotatedPack(selected));
      }

      controls.forEach((control) => {
        control.addEventListener("click", () => {
          activeFilter = (control as HTMLElement).dataset.packFilter || "all";
          controls.forEach((b) => b.setAttribute("aria-pressed", String(b === control)));
          renderPackMap();
        });
      });
      overlayToggle?.addEventListener("change", renderPackMap);

      renderPackMap();
    }

    function renderProof() {
      const proofData = ((window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_GITHUB_PROOF_DATA || {}) as ProofData;
      const artifactTarget = document.querySelector("[data-proof-artifacts]");
      if (!artifactTarget) return;

      const validationTarget = document.querySelector("[data-proof-validation]");
      const historyTarget = document.querySelector("[data-proof-history]");
      const boundaryTarget = document.querySelector("[data-proof-boundaries]");
      const missingData = document.querySelector("[data-proof-missing]") as HTMLElement | null;
      const summaryTarget = document.querySelector("[data-proof-summary]");

      const artifacts = Array.isArray(proofData.proofArtifacts) ? proofData.proofArtifacts : [];
      const validationScripts = Array.isArray(proofData.validationScripts) ? proofData.validationScripts : [];
      const historyEntries = Array.isArray(proofData.recentHistoryEntries) ? proofData.recentHistoryEntries : [];
      const boundaries = Array.isArray(proofData.boundaries) ? proofData.boundaries : [];

      if (!artifacts.length && !validationScripts.length) {
        if (missingData) missingData.hidden = false;
        renderEmpty(artifactTarget, "No generated proof rows are available.");
        return;
      }

      function proofCard(item: ProofArtifact, statusLabel?: string): HTMLElement {
        const card = document.createElement("article");
        card.className = "proof-item";
        const status = document.createElement("span");
        status.className = item.exists === false ? "status-error" : "status-ok";
        status.textContent = statusLabel || (item.tracked ? "tracked" : "available");
        const heading = document.createElement("h3");
        heading.textContent = text(item.title, toTitle(item.id));
        const copy = document.createElement("p");
        const link = sourceLink(item.path);
        if (link) {
          const anchor = document.createElement("a");
          anchor.href = link;
          anchor.textContent = text(item.path);
          copy.appendChild(anchor);
        } else {
          copy.textContent = text(item.command || item.path, "Static proof record.");
        }
        if (item.command) {
          const command = document.createElement("p");
          command.className = "command";
          command.textContent = item.command;
          card.append(status, heading, copy, command);
        } else {
          card.append(status, heading, copy);
        }
        return card;
      }

      function proofTextCard(
        statusLabel: string,
        title: string,
        body: string,
        href: string | null
      ): HTMLElement {
        const card = document.createElement("article");
        card.className = "proof-item";
        const status = document.createElement("span");
        status.className = statusLabel === "fallback" ? "status-warn" : "status-ok";
        status.textContent = statusLabel;
        const heading = document.createElement("h3");
        heading.textContent = title;
        const copy = document.createElement("p");
        if (href) {
          const anchor = document.createElement("a");
          anchor.href = href;
          anchor.textContent = body;
          copy.appendChild(anchor);
        } else {
          copy.textContent = body;
        }
        card.append(status, heading, copy);
        return card;
      }

      if (summaryTarget) {
        summaryTarget.innerHTML = "";
        const label = document.createElement("span");
        label.className = "coordinate";
        label.textContent = "generated static telemetry";
        const heading = document.createElement("h2");
        heading.textContent = `${artifacts.length} artifacts / ${validationScripts.length} checks`;
        const copy = document.createElement("p");
        const publicStatus = proofData.publicGithub?.status || "static";
        copy.textContent = `Repository evidence uses ${proofData.repository?.revisionPolicy?.status || "tracked"} freshness with ${publicStatus} public GitHub enrichment.`;
        const list = document.createElement("ul");
        list.className = "proof-summary-list";
        [
          "Static route evidence only",
          "Public GitHub or local git fallback",
          "No LexCorp live metrics or visitor analytics"
        ].forEach((item) => {
          const row = document.createElement("li");
          row.textContent = item;
          list.appendChild(row);
        });
        summaryTarget.append(label, heading, copy, list);
      }

      artifactTarget.innerHTML = "";
      if (proofData.repository?.url) {
        const revisionStatus = proofData.repository.revisionPolicy?.status || "repository";
        artifactTarget.appendChild(
          proofTextCard(revisionStatus, "Repository evidence", proofData.repository.url, proofData.repository.url)
        );
      }
      if (proofData.publicGithub?.status) {
        artifactTarget.appendChild(
          proofTextCard(
            proofData.publicGithub.status,
            "Public GitHub metadata",
            proofData.publicGithub.reason || proofData.publicGithub.url || "Public metadata status recorded.",
            proofData.publicGithub.url || null
          )
        );
      }
      artifacts.forEach((a) => artifactTarget.appendChild(proofCard(a)));

      if (validationTarget) {
        validationTarget.innerHTML = "";
        validationScripts.forEach((s) => validationTarget.appendChild(proofCard(s, "validation")));
      }

      if (historyTarget) {
        historyTarget.innerHTML = "";
        historyEntries.slice(0, 6).forEach((entry) => {
          const item = document.createElement("article");
          item.className = "proof-item";
          const status = document.createElement("span");
          status.className = "status-ok";
          status.textContent = "history";
          const heading = document.createElement("h3");
          heading.textContent = entry;
          const copy = document.createElement("p");
          copy.textContent = "Recent shipped work from generated proof data.";
          item.append(status, heading, copy);
          historyTarget.appendChild(item);
        });
      }

      if (boundaryTarget) {
        boundaryTarget.innerHTML = "<strong>Boundary:</strong>";
        const list = document.createElement("ul");
        boundaries.forEach((boundary) => {
          const item = document.createElement("li");
          item.textContent = boundary;
          list.appendChild(item);
        });
        [
          "Follow, Discord, LexCorp, and newsletter actions are conversion paths, not measured outcomes in this static proof file.",
          "Newsletter provider behavior is configured outside this repository and is not counted here."
        ].forEach((boundary) => {
          const item = document.createElement("li");
          item.textContent = boundary;
          list.appendChild(item);
        });
        boundaryTarget.appendChild(list);
      }
    }

    function renderFollowProof() {
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
        renderEmpty(receiptTarget, "Static proof preview is unavailable. Inspect route links remain available.");
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
    }
  }, []);

  return null;
}
