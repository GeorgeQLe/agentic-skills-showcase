"use client";

import { useEffect, useRef } from "react";
import { workflows, workflowByKey } from "./tui/workflow-data";
import type { Workflow } from "./tui/workflow-data";

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
      title.textContent = step.title;
      const command = document.createElement("span");
      command.className = "command";
      command.textContent = step.command;
      const copy = document.createElement("p");
      copy.textContent = step.summary;
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
        marker.setAttribute("aria-label", `Go to ${step.title}`);
        marker.textContent = step.title;
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
