import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import WorkflowsClient from "./workflows";

function workflowPageDOM() {
  document.body.innerHTML = `
    <div data-workflow-list></div>
    <strong data-workflow-title></strong>
    <p data-workflow-copy></p>
    <div data-workflow-stage></div>
    <div data-workflow-progress></div>
    <span data-workflow-coordinate></span>
    <ul data-workflow-artifacts></ul>
    <ul data-workflow-changes></ul>
    <p data-workflow-when></p>
    <p data-workflow-failure></p>
    <button data-workflow-prev></button>
    <button data-workflow-next></button>
    <button data-workflow-toggle></button>
    <button data-workflow-restart></button>
    <div data-workflow-preview></div>
  `;
}

describe("WorkflowsClient", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders 8 workflow buttons into the selector list", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const list = document.querySelector("[data-workflow-list]")!;
    expect(list.querySelectorAll(".workflow-item")).toHaveLength(8);
  });

  it("renders 8 preview cards", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const preview = document.querySelector("[data-workflow-preview]")!;
    expect(preview.querySelectorAll(".workflow-preview-card")).toHaveLength(8);
  });

  it("defaults to First Successful Cycle", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    expect(document.querySelector("[data-workflow-title]")!.textContent).toBe(
      "First Successful Cycle"
    );
    expect(document.querySelector("[data-workflow-coordinate]")!.textContent).toBe("LAB-01");
  });

  it("renders stage content for the active step", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const stage = document.querySelector("[data-workflow-stage]")!;
    expect(stage.querySelector(".stage-node")).toBeTruthy();
    expect(stage.querySelector("strong")!.textContent).toBe("Install");
  });

  it("renders progress markers matching step count", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const progress = document.querySelector("[data-workflow-progress]")!;
    expect(progress.querySelectorAll(".progress-step")).toHaveLength(5);
  });

  it("switches workflow on selector click", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const buttons = document.querySelectorAll("[data-workflow-list] .workflow-item");
    const shipButton = Array.from(buttons).find(
      (b) => (b as HTMLElement).dataset.workflow === "ship"
    )!;
    shipButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector("[data-workflow-title]")!.textContent).toBe(
      "Plan -> Run -> Ship"
    );
    expect(document.querySelector("[data-workflow-coordinate]")!.textContent).toBe("LAB-03");
  });

  it("navigates steps with prev/next buttons", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const next = document.querySelector("[data-workflow-next]") as HTMLButtonElement;
    next.click();

    const stage = document.querySelector("[data-workflow-stage]")!;
    expect(stage.querySelector("strong")!.textContent).toBe("Select pack");

    const prev = document.querySelector("[data-workflow-prev]") as HTMLButtonElement;
    prev.click();

    expect(stage.querySelector("strong")!.textContent).toBe("Install");
  });

  it("disables prev on first step and next on last step", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const prev = document.querySelector("[data-workflow-prev]") as HTMLButtonElement;
    expect(prev.disabled).toBe(true);

    const next = document.querySelector("[data-workflow-next]") as HTMLButtonElement;
    for (let i = 0; i < 4; i++) next.click();
    expect(next.disabled).toBe(true);
  });

  it("populates artifacts and changes lists", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const artifacts = document.querySelector("[data-workflow-artifacts]")!;
    const changes = document.querySelector("[data-workflow-changes]")!;
    expect(artifacts.querySelectorAll("li").length).toBeGreaterThanOrEqual(1);
    expect(changes.querySelectorAll("li").length).toBeGreaterThanOrEqual(1);
  });

  it("populates when and failure text", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    expect(document.querySelector("[data-workflow-when]")!.textContent).toBeTruthy();
    expect(document.querySelector("[data-workflow-failure]")!.textContent).toBeTruthy();
  });

  it("sets aria-pressed on the active workflow button", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const buttons = document.querySelectorAll("[data-workflow-list] .workflow-item");
    const firstButton = Array.from(buttons).find(
      (b) => (b as HTMLElement).dataset.workflow === "first"
    )!;
    expect(firstButton.getAttribute("aria-pressed")).toBe("true");

    const packButton = Array.from(buttons).find(
      (b) => (b as HTMLElement).dataset.workflow === "packs"
    )!;
    expect(packButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("restart button resets to step 0", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const next = document.querySelector("[data-workflow-next]") as HTMLButtonElement;
    next.click();
    next.click();

    const restart = document.querySelector("[data-workflow-restart]") as HTMLButtonElement;
    restart.click();

    const stage = document.querySelector("[data-workflow-stage]")!;
    expect(stage.querySelector("strong")!.textContent).toBe("Install");
  });
});
