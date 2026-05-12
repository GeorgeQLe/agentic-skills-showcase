"use client";

import { useEffect, useRef } from "react";

type WorkflowStep = [string, string, string];

interface Workflow {
  key: string;
  coordinate: string;
  badge: string;
  command: string;
  title: string;
  subtitle: string;
  copy: string;
  when: string;
  changes: string[];
  artifacts: string[];
  failure: string;
  steps: WorkflowStep[];
}

const workflows: Workflow[] = [
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

const workflowByKey = workflows.reduce<Record<string, Workflow>>((map, w) => {
  map[w.key] = w;
  return map;
}, {});

function makeTag(label: string): HTMLSpanElement {
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = label;
  return tag;
}

function renderList(target: Element, items: string[]) {
  target.innerHTML = "";
  items.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    target.appendChild(item);
  });
}

export default function WorkflowsClient() {
  const stateRef = useRef({
    activeKey: "first",
    activeStep: 0,
    playing: true,
    timer: null as ReturnType<typeof setInterval> | null
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const els = {
      list: document.querySelector("[data-workflow-list]"),
      title: document.querySelector("[data-workflow-title]"),
      copy: document.querySelector("[data-workflow-copy]"),
      artifacts: document.querySelector("[data-workflow-artifacts]"),
      changes: document.querySelector("[data-workflow-changes]"),
      when: document.querySelector("[data-workflow-when]"),
      failure: document.querySelector("[data-workflow-failure]"),
      stage: document.querySelector("[data-workflow-stage]"),
      progress: document.querySelector("[data-workflow-progress]"),
      coordinate: document.querySelector("[data-workflow-coordinate]"),
      prev: document.querySelector("[data-workflow-prev]") as HTMLButtonElement | null,
      next: document.querySelector("[data-workflow-next]") as HTMLButtonElement | null,
      toggle: document.querySelector("[data-workflow-toggle]") as HTMLButtonElement | null,
      restart: document.querySelector("[data-workflow-restart]") as HTMLButtonElement | null,
      preview: document.querySelector("[data-workflow-preview]"),
      skillCount: document.querySelector("[data-skill-count]")
    };

    const state = stateRef.current;

    function stopTimer() {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }
    }

    function startTimer() {
      stopTimer();
      if (!state.playing || reducedMotion || !els.stage) return;
      state.timer = setInterval(() => {
        const wf = workflowByKey[state.activeKey] || workflows[0];
        const nextStep = (state.activeStep + 1) % wf.steps.length;
        renderWorkflow(wf.key, nextStep, false);
      }, 3200);
    }

    function renderStage(workflow: Workflow, stepIndex: number) {
      if (!els.stage) return;
      const step = workflow.steps[stepIndex] || workflow.steps[0];
      els.stage.innerHTML = "";
      const node = document.createElement("div");
      node.className = "stage-node active";
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
      node.append(label, title, command, copy);
      els.stage.appendChild(node);
    }

    function renderProgress(workflow: Workflow, stepIndex: number) {
      if (!els.progress) return;
      els.progress.innerHTML = "";
      workflow.steps.forEach((step, index) => {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = "progress-step";
        marker.setAttribute("aria-current", String(index === stepIndex));
        marker.setAttribute("aria-label", `Go to ${step[0]}`);
        marker.textContent = step[0];
        marker.addEventListener("click", () => renderWorkflow(workflow.key, index, false));
        els.progress!.appendChild(marker);
      });
    }

    function updateControls(workflow: Workflow) {
      if (els.prev) els.prev.disabled = state.activeStep === 0;
      if (els.next) els.next.disabled = state.activeStep === workflow.steps.length - 1;
      if (els.restart) els.restart.disabled = state.activeStep === 0;
      if (els.toggle) {
        els.toggle.disabled = reducedMotion;
        els.toggle.textContent = state.playing && !reducedMotion ? "Pause" : "Play";
        els.toggle.setAttribute(
          "aria-label",
          state.playing && !reducedMotion ? "Pause animation" : "Play animation"
        );
        els.toggle.title = reducedMotion
          ? "Reduced motion is active; use manual step controls."
          : els.toggle.getAttribute("aria-label") || "";
      }
    }

    function renderWorkflow(key: string, stepIndex: number, resetPlayback: boolean) {
      const workflow = workflowByKey[key] || workflows[0];
      state.activeKey = workflow.key;
      state.activeStep = Math.max(0, Math.min(stepIndex || 0, workflow.steps.length - 1));
      if (resetPlayback && !reducedMotion) state.playing = true;
      if (reducedMotion) state.playing = false;

      document.querySelectorAll("[data-workflow]").forEach((button) => {
        button.setAttribute("aria-pressed", String((button as HTMLElement).dataset.workflow === workflow.key));
      });
      if (els.title) els.title.textContent = workflow.title;
      if (els.copy) els.copy.textContent = workflow.copy;
      if (els.coordinate) els.coordinate.textContent = workflow.coordinate;
      if (els.when) els.when.textContent = workflow.when;
      if (els.failure) els.failure.textContent = workflow.failure;
      if (els.artifacts) renderList(els.artifacts, workflow.artifacts);
      if (els.changes) renderList(els.changes, workflow.changes);
      renderStage(workflow, state.activeStep);
      renderProgress(workflow, state.activeStep);
      updateControls(workflow);
      startTimer();
    }

    function createWorkflowButton(workflow: Workflow): HTMLButtonElement {
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

    function renderSelector() {
      if (!els.list) return;
      els.list.innerHTML = "";
      workflows.forEach((w) => els.list!.appendChild(createWorkflowButton(w)));
    }

    function renderPreview() {
      if (!els.preview) return;
      els.preview.innerHTML = "";
      workflows.forEach((w) => {
        const card = document.createElement("a");
        card.className = "route-card workflow-preview-card";
        card.href = `/workflows#${w.key}`;
        card.append(makeTag(w.badge));
        const heading = document.createElement("h3");
        heading.textContent = w.title;
        const copy = document.createElement("p");
        copy.textContent = w.subtitle;
        const command = document.createElement("span");
        command.className = "command";
        command.textContent = w.command;
        card.append(heading, copy, command);
        els.preview!.appendChild(card);
      });
    }

    renderSelector();
    renderPreview();

    const showcaseData = (window as unknown as Record<string, unknown>).SKILLS_SHOWCASE_DATA as
      | { skillCount?: number }
      | undefined;
    if (els.skillCount && showcaseData?.skillCount) {
      els.skillCount.textContent = `${showcaseData.skillCount} skills`;
    }

    const hashKey = window.location.hash ? window.location.hash.slice(1) : "";
    renderWorkflow(workflowByKey[hashKey] ? hashKey : "first", 0, true);

    function handlePrev() {
      renderWorkflow(state.activeKey, state.activeStep - 1, false);
    }
    function handleNext() {
      renderWorkflow(state.activeKey, state.activeStep + 1, false);
    }
    function handleRestart() {
      renderWorkflow(state.activeKey, 0, true);
    }
    function handleToggle() {
      if (reducedMotion) return;
      state.playing = !state.playing;
      updateControls(workflowByKey[state.activeKey] || workflows[0]);
      startTimer();
    }

    els.prev?.addEventListener("click", handlePrev);
    els.next?.addEventListener("click", handleNext);
    els.restart?.addEventListener("click", handleRestart);
    els.toggle?.addEventListener("click", handleToggle);

    return () => {
      stopTimer();
      els.prev?.removeEventListener("click", handlePrev);
      els.next?.removeEventListener("click", handleNext);
      els.restart?.removeEventListener("click", handleRestart);
      els.toggle?.removeEventListener("click", handleToggle);
    };
  }, []);

  return null;
}
