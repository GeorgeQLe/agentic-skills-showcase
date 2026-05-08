(function () {
  const repoBaseUrl = "https://github.com/GeorgeQLe/agentic-skills/blob/master/";

  function text(value, fallback) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    return fallback || "";
  }

  function toTitle(value) {
    return text(value)
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function sourceLink(path) {
    const cleanPath = text(path);
    if (!cleanPath) return null;
    return repoBaseUrl + cleanPath.split("/").map(encodeURIComponent).join("/");
  }

  function makeTag(label) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = label;
    return tag;
  }

  function platformCountByMirrorKey() {
    const counts = new Map();
    skills.forEach((skill) => {
      const key = text(skill.mirrorKey, skill.name);
      if (!key) return;
      if (!counts.has(key)) counts.set(key, new Set());
      counts.get(key).add(skill.platform);
    });
    return counts;
  }

  function renderEmpty(target, message) {
    if (!target) return;
    target.innerHTML = "";
    const notice = document.createElement("div");
    notice.className = "notice";
    notice.textContent = message;
    target.appendChild(notice);
  }

  const menuButton = document.querySelector("[data-menu-button]");
  const mobilePanel = document.querySelector("[data-mobile-panel]");

  function setMenu(open) {
    if (!menuButton || !mobilePanel) return;
    menuButton.setAttribute("aria-expanded", String(open));
    mobilePanel.dataset.open = String(open);
  }

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });

    mobilePanel.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobilePanel.dataset.open === "true") {
        setMenu(false);
        menuButton.focus();
      }
    });
  }

  const workflowButtons = Array.from(document.querySelectorAll("[data-workflow]"));
  const workflowTitle = document.querySelector("[data-workflow-title]");
  const workflowCopy = document.querySelector("[data-workflow-copy]");
  const workflowArtifacts = document.querySelector("[data-workflow-artifacts]");

  const workflows = {
    first: {
      title: "First Successful Cycle",
      copy: "Install skills, select the right workflow, run validation, and finish with a committed history record.",
      artifacts: ["install.sh output", "tasks/todo.md", "tasks/history.md", "shipping commit"]
    },
    packs: {
      title: "Pack Selection",
      copy: "Project context chooses a focused pack so Claude Code and Codex load only the workflows that matter.",
      artifacts: [".agents/project.json", "packs/*/PACK.md", "project-local skill links"]
    },
    ship: {
      title: "Plan -> Run -> Ship",
      copy: "A roadmap phase becomes one executable step, validation evidence, history, and a direct-to-primary push.",
      artifacts: ["tasks/roadmap.md", "tasks/todo.md", "quality gate manifest", "git push"]
    },
    spec: {
      title: "Spec -> Roadmap -> Implementation",
      copy: "Feature ideas are interviewed into specs, phased into roadmap work, then executed with scoped verification.",
      artifacts: ["specs/*.md", "assumptions manifest", "phase plan", "focused tests"]
    }
  };

  function renderWorkflow(key) {
    const workflow = workflows[key] || workflows.first;
    workflowButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.workflow === key));
    });
    if (workflowTitle) workflowTitle.textContent = workflow.title;
    if (workflowCopy) workflowCopy.textContent = workflow.copy;
    if (workflowArtifacts) {
      workflowArtifacts.innerHTML = "";
      workflow.artifacts.forEach((artifact) => {
        const item = document.createElement("li");
        item.textContent = artifact;
        workflowArtifacts.appendChild(item);
      });
    }
  }

  workflowButtons.forEach((button) => {
    button.addEventListener("click", () => renderWorkflow(button.dataset.workflow));
  });

  if (workflowButtons.length) {
    renderWorkflow(workflowButtons[0].dataset.workflow);
  }

  const showcaseData = window.SKILLS_SHOWCASE_DATA || {};
  const skills = Array.isArray(showcaseData.skills) ? showcaseData.skills : [];
  const packs = Array.isArray(showcaseData.packs) ? showcaseData.packs : [];

  function renderCatalog() {
    const catalogList = document.querySelector("[data-catalog-list]");
    if (!catalogList) return;

    const catalogSearch = document.querySelector("[data-catalog-search]");
    const platformFilter = document.querySelector("[data-catalog-platform]");
    const typeFilter = document.querySelector("[data-catalog-type]");
    const scopeFilter = document.querySelector("[data-catalog-scope]");
    const catalogCount = document.querySelector("[data-catalog-count]");
    const catalogTotal = document.querySelector("[data-catalog-total]");
    const missingData = document.querySelector("[data-catalog-missing]");

    if (!skills.length) {
      if (missingData) missingData.hidden = false;
      renderEmpty(catalogList, "No generated skill rows are available.");
      return;
    }

    if (catalogTotal) catalogTotal.textContent = String(skills.length);

    const types = Array.from(new Set(skills.map((skill) => text(skill.type)).filter(Boolean))).sort();
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = toTitle(type);
      if (typeFilter) typeFilter.appendChild(option);
    });

    function rowSearchText(skill) {
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
        Array.isArray(skill.tags) ? skill.tags.join(" ") : ""
      ]
        .map(text)
        .join(" ")
        .toLowerCase();
    }

    function matches(skill) {
      const query = catalogSearch && catalogSearch.value ? catalogSearch.value.trim().toLowerCase() : "";
      const platform = platformFilter ? platformFilter.value : "all";
      const type = typeFilter ? typeFilter.value : "all";
      const scope = scopeFilter ? scopeFilter.value : "all";
      return (
        (!query || rowSearchText(skill).includes(query)) &&
        (platform === "all" || skill.platform === platform) &&
        (type === "all" || skill.type === type) &&
        (scope === "all" || skill.scope === scope)
      );
    }

    const mirrorPlatformCounts = platformCountByMirrorKey();

    function createRow(skill) {
      const article = document.createElement("article");
      article.className = "catalog-row";

      const body = document.createElement("div");
      const heading = document.createElement("h3");
      heading.textContent = text(skill.title, toTitle(skill.name));
      const description = document.createElement("p");
      description.textContent = text(skill.description, "No description provided.");

      const chips = document.createElement("div");
      chips.className = "chip-row";
      [skill.platform, skill.type, skill.scope, skill.pack || "global", skill.command].filter(Boolean).forEach((label) => {
        chips.appendChild(makeTag(label));
      });
      const mirrorKey = text(skill.mirrorKey, skill.name);
      if ((mirrorPlatformCounts.get(mirrorKey) || new Set()).size === 1) {
        chips.appendChild(makeTag("one-platform"));
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

      body.append(heading, description, chips, details);

      const status = document.createElement("span");
      status.className = "status-ok";
      status.textContent = "generated";

      article.append(body, status);
      return article;
    }

    function filterCatalog() {
      const visibleSkills = skills.filter(matches);
      catalogList.innerHTML = "";
      visibleSkills.forEach((skill) => catalogList.appendChild(createRow(skill)));
      if (catalogCount) catalogCount.textContent = String(visibleSkills.length);
      if (!visibleSkills.length) {
        renderEmpty(catalogList, "No skills match the current filters.");
      }
    }

    [catalogSearch, platformFilter, typeFilter, scopeFilter].forEach((control) => {
      if (control) control.addEventListener("input", filterCatalog);
      if (control) control.addEventListener("change", filterCatalog);
    });

    filterCatalog();
  }

  function renderPacks() {
    const packMap = document.querySelector("[data-pack-map]");
    if (!packMap) return;

    const summary = document.querySelector("[data-pack-summary]");
    const missingData = document.querySelector("[data-pack-missing]");

    if (!packs.length) {
      if (missingData) missingData.hidden = false;
      renderEmpty(packMap, "No generated pack rows are available.");
      return;
    }

    if (summary) {
      summary.innerHTML = "";
      [
        ["packs", showcaseData.packCount || packs.length],
        ["skills", showcaseData.skillCount || skills.length],
        ["sources", showcaseData.sourceCount || skills.length]
      ].forEach(([label, value]) => {
        const metric = document.createElement("div");
        metric.className = "metric";
        metric.innerHTML = `<span class="metric-value">${value}</span><span class="metric-label">${label}</span>`;
        summary.appendChild(metric);
      });
    }

    packMap.innerHTML = "";
    packs.forEach((pack) => {
      const node = document.createElement("article");
      const name = text(pack.name);
      const isOverlay = name.includes("kanban") || name === "monorepo";
      node.className = `pack-node${isOverlay ? " overlay" : ""}`;

      const chips = document.createElement("div");
      chips.className = "chip-row";
      chips.appendChild(makeTag(isOverlay ? "overlay" : "domain pack"));
      (Array.isArray(pack.platforms) ? pack.platforms : []).forEach((platform) => chips.appendChild(makeTag(platform)));

      const heading = document.createElement("h3");
      heading.textContent = text(pack.title, toTitle(name));
      const copy = document.createElement("p");
      copy.textContent = text(pack.description, `${pack.skillCount || 0} generated skills are available for this pack.`);

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
      packMap.appendChild(node);
    });
  }

  function renderProof() {
    const proofData = window.SKILLS_SHOWCASE_GITHUB_PROOF_DATA || {};
    const artifactTarget = document.querySelector("[data-proof-artifacts]");
    if (!artifactTarget) return;

    const validationTarget = document.querySelector("[data-proof-validation]");
    const historyTarget = document.querySelector("[data-proof-history]");
    const boundaryTarget = document.querySelector("[data-proof-boundaries]");
    const missingData = document.querySelector("[data-proof-missing]");

    const artifacts = Array.isArray(proofData.proofArtifacts) ? proofData.proofArtifacts : [];
    const validationScripts = Array.isArray(proofData.validationScripts) ? proofData.validationScripts : [];
    const historyEntries = Array.isArray(proofData.recentHistoryEntries) ? proofData.recentHistoryEntries : [];
    const boundaries = Array.isArray(proofData.boundaries) ? proofData.boundaries : [];

    if (!artifacts.length && !validationScripts.length) {
      if (missingData) missingData.hidden = false;
      renderEmpty(artifactTarget, "No generated proof rows are available.");
      return;
    }

    function proofCard(item, statusLabel) {
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

    function proofTextCard(statusLabel, title, body, href) {
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

    artifactTarget.innerHTML = "";
    if (proofData.repository && proofData.repository.url) {
      const revisionStatus = proofData.repository.revisionPolicy ? proofData.repository.revisionPolicy.status : "repository";
      artifactTarget.appendChild(
        proofTextCard(revisionStatus, "Repository evidence", proofData.repository.url, proofData.repository.url)
      );
    }
    if (proofData.publicGithub && proofData.publicGithub.status) {
      artifactTarget.appendChild(
        proofTextCard(
          proofData.publicGithub.status,
          "Public GitHub metadata",
          proofData.publicGithub.reason || proofData.publicGithub.url || "Public metadata status recorded.",
          proofData.publicGithub.url
        )
      );
    }
    artifacts.forEach((artifact) => artifactTarget.appendChild(proofCard(artifact)));

    if (validationTarget) {
      validationTarget.innerHTML = "";
      validationScripts.forEach((script) => validationTarget.appendChild(proofCard(script, "validation")));
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
      boundaryTarget.appendChild(list);
    }
  }

  renderCatalog();
  renderPacks();
  renderProof();
})();
