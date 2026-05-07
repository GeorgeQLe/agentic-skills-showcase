(function () {
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

  const catalogSearch = document.querySelector("[data-catalog-search]");
  const catalogRows = Array.from(document.querySelectorAll("[data-catalog-row]"));
  const catalogCount = document.querySelector("[data-catalog-count]");

  function filterCatalog() {
    const query = (catalogSearch && catalogSearch.value ? catalogSearch.value : "").trim().toLowerCase();
    let visible = 0;
    catalogRows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const show = !query || text.includes(query);
      row.hidden = !show;
      if (show) visible += 1;
    });
    if (catalogCount) {
      catalogCount.textContent = String(visible);
    }
  }

  if (catalogSearch) {
    catalogSearch.addEventListener("input", filterCatalog);
    filterCatalog();
  }
})();
