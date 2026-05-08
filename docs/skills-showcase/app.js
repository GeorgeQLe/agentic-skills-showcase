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
  const workflowList = document.querySelector("[data-workflow-list]");
  const workflowTitle = document.querySelector("[data-workflow-title]");
  const workflowCopy = document.querySelector("[data-workflow-copy]");
  const workflowArtifacts = document.querySelector("[data-workflow-artifacts]");
  const workflowChanges = document.querySelector("[data-workflow-changes]");
  const workflowWhen = document.querySelector("[data-workflow-when]");
  const workflowFailure = document.querySelector("[data-workflow-failure]");
  const workflowStage = document.querySelector("[data-workflow-stage]");
  const workflowProgress = document.querySelector("[data-workflow-progress]");
  const workflowCoordinate = document.querySelector("[data-workflow-coordinate]");
  const workflowPrev = document.querySelector("[data-workflow-prev]");
  const workflowNext = document.querySelector("[data-workflow-next]");
  const workflowToggle = document.querySelector("[data-workflow-toggle]");
  const workflowRestart = document.querySelector("[data-workflow-restart]");
  const workflowPreview = document.querySelector("[data-workflow-preview]");
  const skillCount = document.querySelector("[data-skill-count]");
  const showcaseData = window.SKILLS_SHOWCASE_DATA || {};
  const skills = Array.isArray(showcaseData.skills) ? showcaseData.skills : [];
  const packs = Array.isArray(showcaseData.packs) ? showcaseData.packs : [];

  const workflows = [
    {
      key: "first",
      coordinate: "LAB-01",
      badge: "setup",
      command: "./install.sh",
      title: "First Successful Cycle",
      subtitle: "Install, select, validate, ship.",
      copy: "A new checkout gets installed, scoped, verified, and closed with a history-backed commit.",
      when: "Use this when a project needs the agentic-skills operating model for the first time or after a stale local setup.",
      changes: ["global and project skill links", ".agents/project.json", "tasks/todo.md", "tasks/history.md"],
      artifacts: ["install output", "pack status", "validation transcript", "shipping commit"],
      failure: "If install or validation fails, rerun the failed script, inspect missing links, and ship only after the task history and generated references agree.",
      steps: [
        ["Install", "./install.sh", "Global skill links refresh."],
        ["Select pack", "./scripts/pack.sh", "Project context narrows loaded workflows."],
        ["Plan", "$roadmap", "Task docs describe the next phase."],
        ["Run", "$run", "One step executes with validation."],
        ["Ship", "git push", "History and commit land on primary."]
      ]
    },
    {
      key: "packs",
      coordinate: "LAB-02",
      badge: "planning",
      command: "$pack",
      title: "Pack Selection",
      subtitle: "Load only the workflows a project needs.",
      copy: "Project type routes to global foundations, focused domain packs, and overlays without crowding every session.",
      when: "Use this before roadmap work when a repo needs business, devtool, game, creator, monorepo, or kanban-specific workflows.",
      changes: [".agents/project.json", "project-local skill pack links", "pack status docs", "task recommendations"],
      artifacts: ["enabled pack list", "pack-specific commands", "compatibility alias notes", "context hygiene boundary"],
      failure: "If a pack is unavailable or ambiguous, keep the global workflow active and record the pack decision as a task-doc follow-up.",
      steps: [
        ["Detect shape", "repo context", "Project evidence sets the lane."],
        ["Choose core", "global/codex", "Shared planning and shipping stay loaded."],
        ["Add pack", "packs/*", "Domain skills become local context."],
        ["Overlay", "kanban/monorepo", "Execution style adapts without replacing core."],
        ["Verify", "list-packs", "Recommendation text matches enabled packs."]
      ]
    },
    {
      key: "ship",
      coordinate: "LAB-03",
      badge: "shipping",
      command: "$run",
      title: "Plan -> Run -> Ship",
      subtitle: "Turn one roadmap step into committed work.",
      copy: "The active todo becomes an execution plan, source change, validation record, history note, and direct-to-primary push.",
      when: "Use this for the next incomplete implementation step when the roadmap already has enough detail.",
      changes: ["target source files", "tasks/todo.md", "tasks/history.md", "generated proof assets when stale"],
      artifacts: ["quality gate manifest", "validation output", "history entry", "primary branch commit"],
      failure: "If validation fails, fix the source issue and rerun the failing command; do not commit known regressions.",
      steps: [
        ["Read todo", "tasks/todo.md", "The next unchecked item sets scope."],
        ["Plan", "update_plan", "Files, trade-offs, and tests are explicit."],
        ["Execute", "source diff", "Only the scoped change lands."],
        ["Validate", "tests/checks", "Warnings are fixed or recorded."],
        ["Ship", "commit + push", "History and next work are ready."]
      ]
    },
    {
      key: "spec",
      coordinate: "LAB-04",
      badge: "planning",
      command: "$spec-interview",
      title: "Spec -> Roadmap -> Implementation",
      subtitle: "Move from idea to executable tasks.",
      copy: "A rough feature idea becomes assumptions, a spec, a phased roadmap, and concrete implementation steps.",
      when: "Use this when the desired product behavior is real but the file-level work is still ambiguous.",
      changes: ["specs/*.md", "tasks/roadmap.md", "tasks/todo.md", "assumption and evidence notes"],
      artifacts: ["interview log", "implementation-ready spec", "phase plan", "verification strategy"],
      failure: "If evidence contradicts the idea, update assumptions before writing roadmap tasks; do not encode speculative work as accepted scope.",
      steps: [
        ["Idea", "user brief", "Intent and unknowns are separated."],
        ["Interview", "$spec-interview", "Assumptions become explicit."],
        ["Spec", "specs/*.md", "Behavior and constraints are written."],
        ["Roadmap", "$roadmap", "The work becomes phases."],
        ["Implement", "$run", "A single phase step executes."]
      ]
    },
    {
      key: "research",
      coordinate: "LAB-05",
      badge: "research",
      command: "$research-roadmap",
      title: "Research Chains",
      subtitle: "Produce evidence before product decisions.",
      copy: "Devtool, business, creator, and game research lanes gather source-backed artifacts before implementation work starts.",
      when: "Use this when a project needs market, platform, user, technical, or content evidence before committing to a feature.",
      changes: ["research directories", "evidence registers", "decision notes", "roadmap candidates"],
      artifacts: ["capability matrix", "dossier", "research queue", "prioritized next action"],
      failure: "If sources are missing or private, mark the evidence gap and route to manual collection instead of fabricating certainty.",
      steps: [
        ["Scope", "research brief", "The question is bounded."],
        ["Collect", "sources", "Evidence gets archived."],
        ["Synthesize", "analysis", "Claims cite artifacts."],
        ["Prioritize", "queue", "Next research or build step is ranked."],
        ["Route", "$feature-interview", "Good candidates become product work."]
      ]
    },
    {
      key: "handoff",
      coordinate: "LAB-06",
      badge: "hybrid",
      command: "$run --execute-approved",
      title: "Hybrid Handoff",
      subtitle: "Plan in Claude, execute in Codex.",
      copy: "A Claude planning packet can hand one approved step to Codex while preserving scope, validation, and integration ownership.",
      when: "Use this when planning and execution happen in different agent surfaces but the step still needs a single shipping boundary.",
      changes: [".agents/approved-plan.json", "tasks/todo.md", "source files", "tasks/history.md"],
      artifacts: ["approved packet", "consumed approval record", "validation transcript", "shipping commit"],
      failure: "If the packet is stale, mode-mismatched, or missing `jq`, stop and fall back to the standard `$run` planning path.",
      steps: [
        ["Plan", "Claude", "Scope is approved elsewhere."],
        ["Packet", "approved-plan.json", "One step becomes executable."],
        ["Consume", "$run --execute-approved", "Codex records the handoff."],
        ["Integrate", "main agent", "Conflicts and docs stay owned here."],
        ["Ship", "primary branch", "The result lands with evidence."]
      ]
    },
    {
      key: "authoring",
      coordinate: "LAB-07",
      badge: "authoring",
      command: "$create-agentic-skill",
      title: "Skill Authoring",
      subtitle: "Create or update workflow contracts.",
      copy: "New repo-managed skills are scaffolded, mirrored where needed, validated, installed, and reflected in showcase data.",
      when: "Use this when a repeated workflow deserves a durable skill instead of another ad hoc prompt.",
      changes: ["global/*/<skill>/SKILL.md", "agents/openai.yaml", "docs/skills-reference.md", "showcase generated assets"],
      artifacts: ["skill contract", "metadata", "routing docs", "fresh catalog/proof data"],
      failure: "If validation finds stale metadata or broken references, fix the skill contract before installing or shipping it.",
      steps: [
        ["Name", "workflow gap", "The repeated behavior is concrete."],
        ["Scaffold", "SKILL.md", "Contract and metadata are written."],
        ["Mirror", "Claude/Codex", "Surfaces stay aligned when needed."],
        ["Validate", "skill scripts", "References and routing pass."],
        ["Refresh", "showcase data", "Public catalog reflects the change."]
      ]
    },
    {
      key: "validation",
      coordinate: "LAB-08",
      badge: "validation",
      command: "$debug",
      title: "Validation / Troubleshooting",
      subtitle: "Stop drift before shipping.",
      copy: "A failed check becomes a bounded investigation, source fix, rerun, and documented residual risk.",
      when: "Use this when tests, generated-data freshness, skill audits, or browser checks expose a real regression.",
      changes: ["failing source boundary", "validation script output", "tasks/history.md", "tasks/lessons.md after corrections"],
      artifacts: ["root cause", "fixed diff", "passing rerun", "accepted residual risk if any"],
      failure: "If the failure cannot be fixed confidently, stop before commit and report the exact command output and next decision.",
      steps: [
        ["Fail", "check output", "The problem is reproduced."],
        ["Trace", "$debug", "Root cause is found."],
        ["Fix", "minimal diff", "The behavior changes at the source."],
        ["Rerun", "failing command", "The proof is executable."],
        ["Record", "history/lessons", "The pattern is not lost."]
      ]
    }
  ];

  const workflowByKey = workflows.reduce((map, workflow) => {
    map[workflow.key] = workflow;
    return map;
  }, {});

  let activeWorkflowKey = "first";
  let activeWorkflowStep = 0;
  let workflowPlaying = true;
  let workflowTimer = null;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function renderList(target, items) {
    if (!target) return;
    target.innerHTML = "";
    items.forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      target.appendChild(item);
    });
  }

  function createWorkflowButton(workflow) {
    const button = document.createElement("button");
    button.className = "workflow-item";
    button.type = "button";
    button.dataset.workflow = workflow.key;
    button.append(makeTag(workflow.badge));
    const title = document.createElement("strong");
    title.textContent = workflow.title;
    const subtitle = document.createElement("span");
    subtitle.textContent = workflow.subtitle;
    const command = document.createElement("span");
    command.className = "command";
    command.textContent = workflow.command;
    button.append(title, subtitle, command);
    button.addEventListener("click", () => renderWorkflow(workflow.key, 0, true));
    return button;
  }

  function renderWorkflowSelector() {
    if (!workflowList) return;
    workflowList.innerHTML = "";
    workflows.forEach((workflow) => workflowList.appendChild(createWorkflowButton(workflow)));
  }

  function renderWorkflowPreview() {
    if (!workflowPreview) return;
    workflowPreview.innerHTML = "";
    workflows.forEach((workflow) => {
      const card = document.createElement("a");
      card.className = "route-card workflow-preview-card";
      card.href = `./workflows/#${workflow.key}`;
      card.append(makeTag(workflow.badge));
      const heading = document.createElement("h3");
      heading.textContent = workflow.title;
      const copy = document.createElement("p");
      copy.textContent = workflow.subtitle;
      const command = document.createElement("span");
      command.className = "command";
      command.textContent = workflow.command;
      card.append(heading, copy, command);
      workflowPreview.appendChild(card);
    });
  }

  function renderWorkflowStage(workflow, stepIndex) {
    if (!workflowStage) return;
    const step = workflow.steps[stepIndex] || workflow.steps[0];
    workflowStage.innerHTML = "";
    const stage = document.createElement("div");
    stage.className = "stage-node active";
    const label = document.createElement("span");
    label.className = "coordinate";
    label.textContent = `Step ${stepIndex + 1} / ${workflow.steps.length}`;
    const title = document.createElement("strong");
    title.textContent = step[0];
    const command = document.createElement("span");
    command.className = "command";
    command.textContent = step[1];
    const copy = document.createElement("p");
    copy.textContent = step[2];
    stage.append(label, title, command, copy);
    workflowStage.appendChild(stage);
  }

  function renderWorkflowProgress(workflow, stepIndex) {
    if (!workflowProgress) return;
    workflowProgress.innerHTML = "";
    workflow.steps.forEach((step, index) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "progress-step";
      marker.setAttribute("aria-current", String(index === stepIndex));
      marker.setAttribute("aria-label", `Go to ${step[0]}`);
      marker.textContent = step[0];
      marker.addEventListener("click", () => renderWorkflow(workflow.key, index, false));
      workflowProgress.appendChild(marker);
    });
  }

  function stopWorkflowTimer() {
    if (workflowTimer) {
      window.clearInterval(workflowTimer);
      workflowTimer = null;
    }
  }

  function startWorkflowTimer() {
    stopWorkflowTimer();
    if (!workflowPlaying || reducedMotion || !workflowStage) return;
    workflowTimer = window.setInterval(() => {
      const workflow = workflowByKey[activeWorkflowKey] || workflows[0];
      const nextStep = (activeWorkflowStep + 1) % workflow.steps.length;
      renderWorkflow(activeWorkflowKey, nextStep, false);
    }, 3200);
  }

  function updateWorkflowControls(workflow) {
    if (workflowPrev) workflowPrev.disabled = activeWorkflowStep === 0;
    if (workflowNext) workflowNext.disabled = activeWorkflowStep === workflow.steps.length - 1;
    if (workflowRestart) workflowRestart.disabled = activeWorkflowStep === 0;
    if (workflowToggle) {
      workflowToggle.disabled = reducedMotion;
      workflowToggle.textContent = workflowPlaying && !reducedMotion ? "Pause" : "Play";
      workflowToggle.setAttribute("aria-label", workflowPlaying && !reducedMotion ? "Pause animation" : "Play animation");
      workflowToggle.title = reducedMotion ? "Reduced motion is active; use manual step controls." : workflowToggle.getAttribute("aria-label");
    }
  }

  function renderWorkflow(key, stepIndex, resetPlayback) {
    const workflow = workflowByKey[key] || workflows[0];
    activeWorkflowKey = workflow.key;
    activeWorkflowStep = Math.max(0, Math.min(stepIndex || 0, workflow.steps.length - 1));
    if (resetPlayback && !reducedMotion) workflowPlaying = true;
    if (reducedMotion) workflowPlaying = false;

    Array.from(document.querySelectorAll("[data-workflow]")).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.workflow === workflow.key));
    });
    if (workflowTitle) workflowTitle.textContent = workflow.title;
    if (workflowCopy) workflowCopy.textContent = workflow.copy;
    if (workflowCoordinate) workflowCoordinate.textContent = workflow.coordinate;
    if (workflowWhen) workflowWhen.textContent = workflow.when;
    if (workflowFailure) workflowFailure.textContent = workflow.failure;
    renderList(workflowArtifacts, workflow.artifacts);
    renderList(workflowChanges, workflow.changes);
    renderWorkflowStage(workflow, activeWorkflowStep);
    renderWorkflowProgress(workflow, activeWorkflowStep);
    updateWorkflowControls(workflow);
    startWorkflowTimer();
  }

  function initializeWorkflows() {
    renderWorkflowSelector();
    renderWorkflowPreview();
    if (skillCount && showcaseData.skillCount) {
      skillCount.textContent = `${showcaseData.skillCount} skills`;
    }
    const hashKey = window.location.hash ? window.location.hash.slice(1) : "";
    renderWorkflow(workflowByKey[hashKey] ? hashKey : "first", 0, true);
  }

  if (workflowPrev) {
    workflowPrev.addEventListener("click", () => renderWorkflow(activeWorkflowKey, activeWorkflowStep - 1, false));
  }
  if (workflowNext) {
    workflowNext.addEventListener("click", () => renderWorkflow(activeWorkflowKey, activeWorkflowStep + 1, false));
  }
  if (workflowRestart) {
    workflowRestart.addEventListener("click", () => renderWorkflow(activeWorkflowKey, 0, true));
  }
  if (workflowToggle) {
    workflowToggle.addEventListener("click", () => {
      if (reducedMotion) return;
      workflowPlaying = !workflowPlaying;
      updateWorkflowControls(workflowByKey[activeWorkflowKey] || workflows[0]);
      startWorkflowTimer();
    });
  }

  initializeWorkflows();

  /*
   * Legacy fallback for the Phase 32 static workflow shell. It is retained so
   * direct HTML fixtures with old buttons still render, but the live route now
   * uses the data-driven workflow component above.
   */
  const legacyWorkflows = {
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

  function renderLegacyWorkflow(key) {
    const workflow = legacyWorkflows[key] || legacyWorkflows.first;
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

  if (workflowButtons.length && !workflowList) {
    workflowButtons.forEach((button) => {
      button.addEventListener("click", () => renderLegacyWorkflow(button.dataset.workflow));
    });
    renderLegacyWorkflow(workflowButtons[0].dataset.workflow);
  }

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
    const controls = Array.from(document.querySelectorAll("[data-pack-filter]"));
    const overlayToggle = document.querySelector("[data-pack-overlays]");
    const detail = document.querySelector("[data-pack-detail]");
    const missingData = document.querySelector("[data-pack-missing]");
    let activeFilter = "all";
    let activePackName = "";

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

    const packAnnotations = {
      "alignment-loop": ["domain", "business", "planning"],
      "business-app-kanban": ["overlay", "business", "kanban"],
      "business-discovery": ["domain", "business"],
      "business-growth": ["domain", "business"],
      "business-ops": ["domain", "business"],
      "code-quality": ["overlay", "quality"],
      "creator-foundation": ["domain", "creator"],
      devtool: ["domain", "devtool", "alias"],
      "devtool-kanban": ["overlay", "devtool", "kanban"],
      game: ["domain", "game", "alias"],
      "game-kanban": ["overlay", "game", "kanban"],
      monorepo: ["overlay", "monorepo"],
      "poketowork-kanban": ["overlay", "kanban", "alias"],
      "project-fleet": ["domain", "business"],
      remotion: ["domain", "creator"],
      "youtube-ops": ["domain", "creator"]
    };

    const packPurpose = {
      "alignment-loop": "Keeps decision loops explicit when strategy, research, and implementation need repeated alignment.",
      "business-app-kanban": "Kanban execution overlay for business application projects.",
      "business-discovery": "Researches market, user, ICP, and product direction before build work.",
      "business-growth": "Supports acquisition, monetization, launch, and growth-system work.",
      "business-ops": "Covers operating workflows for internal business systems and repeatable delivery.",
      "code-quality": "Adds adversarial review and quality gates around risky source changes.",
      "creator-foundation": "Builds creator research foundations, evidence schemas, and platform dossiers.",
      devtool: "Compatibility alias for devtool workflow coverage.",
      "devtool-kanban": "Kanban execution overlay for developer-tool product work.",
      game: "Compatibility alias for game workflow coverage.",
      "game-kanban": "Kanban execution overlay for game development work.",
      monorepo: "Adds package-boundary planning, lane specs, and monorepo validation guardrails.",
      "poketowork-kanban": "Compatibility kanban overlay for Poketowork-style project boards.",
      "project-fleet": "Coordinates portfolio and multi-project fleet operations.",
      remotion: "Scopes video-production workflows away from general creator research.",
      "youtube-ops": "Handles YouTube-specific research, operations, and evidence workflows."
    };

    function annotatedPack(pack) {
      const name = text(pack.name);
      const tags = packAnnotations[name] || ["domain"];
      const overlay = tags.includes("overlay") || name.includes("kanban") || name === "monorepo";
      const alias = tags.includes("alias") || !pack.path;
      return { name, tags, overlay, alias, purpose: packPurpose[name] || text(pack.description, `${pack.skillCount || 0} generated skills are available for this pack.`) };
    }

    function packMatches(annotation) {
      const showOverlays = !overlayToggle || overlayToggle.checked;
      if (annotation.overlay && !showOverlays) return false;
      return activeFilter === "all" || annotation.tags.includes(activeFilter);
    }

    function setActivePack(pack, annotation) {
      activePackName = annotation.name;
      Array.from(packMap.querySelectorAll(".pack-node")).forEach((node) => {
        node.setAttribute("aria-selected", String(node.dataset.packName === activePackName));
      });
      if (!detail) return;
      const install = pack.path ? `./scripts/pack.sh enable ${annotation.name}` : `./scripts/pack.sh enable ${annotation.name} (compatibility alias)`;
      const relatedSkills = skills
        .filter((skill) => skill.pack === annotation.name || skill.path.includes(`/${annotation.name}/`))
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
      relatedSkills.forEach((skill) => {
        const item = document.createElement("li");
        item.textContent = `${skill.command}: ${skill.description}`;
        skillsList.appendChild(item);
      });
      if (!relatedSkills.length) {
        const item = document.createElement("li");
        item.textContent = "Generated skill rows are available through alias or pack metadata.";
        skillsList.appendChild(item);
      }
      const link = document.createElement("a");
      link.className = "button secondary";
      link.href = `../catalog/#pack-${encodeURIComponent(annotation.name)}`;
      link.textContent = "View skills";
      detail.append(makeTag(annotation.overlay ? "overlay" : "domain pack"), title, purpose, command, skillsList, link);
    }

    function createPackNode(pack) {
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
      annotation.tags.filter((tag) => !["overlay", "domain", "alias"].includes(tag)).forEach((tag) => chips.appendChild(makeTag(tag)));
      (Array.isArray(pack.platforms) ? pack.platforms : []).forEach((platform) => chips.appendChild(makeTag(platform)));

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
      packMap.innerHTML = "";
      const visiblePacks = packs.filter((pack) => packMatches(annotatedPack(pack)));
      visiblePacks.forEach((pack) => {
        packMap.appendChild(createPackNode(pack));
      });
      if (!visiblePacks.length) {
        renderEmpty(packMap, "No packs match the selected project type and overlay setting.");
        if (detail) detail.innerHTML = "";
        return;
      }
      const selected = visiblePacks.find((pack) => annotatedPack(pack).name === activePackName) || visiblePacks[0];
      setActivePack(selected, annotatedPack(selected));
    }

    controls.forEach((control) => {
      control.addEventListener("click", () => {
        activeFilter = control.dataset.packFilter || "all";
        controls.forEach((button) => button.setAttribute("aria-pressed", String(button === control)));
        renderPackMap();
      });
    });
    if (overlayToggle) {
      overlayToggle.addEventListener("change", renderPackMap);
    }

    renderPackMap();
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

  function renderFollowProof() {
    const statsTarget = document.querySelector("[data-follow-proof-stats]");
    const receiptTarget = document.querySelector("[data-follow-receipts]");
    if (!statsTarget && !receiptTarget) return;

    const proofData = window.SKILLS_SHOWCASE_GITHUB_PROOF_DATA || {};
    const artifacts = Array.isArray(proofData.proofArtifacts) ? proofData.proofArtifacts : [];
    const validationScripts = Array.isArray(proofData.validationScripts) ? proofData.validationScripts : [];
    const historyEntries = Array.isArray(proofData.recentHistoryEntries) ? proofData.recentHistoryEntries : [];
    const publicStatus = proofData.publicGithub && proofData.publicGithub.status ? proofData.publicGithub.status : "static";

    if (statsTarget) {
      statsTarget.innerHTML = "";
      [
        [String(artifacts.length || "static"), "proof artifacts"],
        [String(validationScripts.length || "tracked"), "validation scripts"],
        [publicStatus, "GitHub metadata"]
      ].forEach(([value, label]) => {
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
    const receiptRows = [
      ...artifacts.slice(0, 2).map((artifact) => ({
        status: artifact.tracked ? "tracked" : "available",
        title: text(artifact.title, toTitle(artifact.id)),
        body: text(artifact.path, "Static repository proof."),
        href: sourceLink(artifact.path)
      })),
      ...validationScripts.slice(0, 1).map((script) => ({
        status: "validation",
        title: text(script.title, toTitle(script.id)),
        body: text(script.command, script.path),
        href: sourceLink(script.path)
      })),
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

  renderCatalog();
  renderPacks();
  renderProof();
  renderFollowProof();
})();
