import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, fireEvent, screen, within } from "@testing-library/react";
import WorkflowsClient from "./workflows";
import { TuiWorkflow } from "./tui/TuiWorkflow";

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
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as any).SKILLS_SHOWCASE_DATA;
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

describe("TuiWorkflow replay pilot", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    (window as any).SKILLS_SHOWCASE_DATA = {
      workflowBenchmarks: {
        first: {
          workflowKey: "first",
          stepsTotal: 5,
          stepsBenchmarked: 1,
          aggregatePassRate: "100%",
          aggregateQuality: "92.0%",
          stepBenchmarks: {
            2: {
              skill: "roadmap",
              passRate: "100%",
              qualityScore: "92.0%",
              demo: {
                agent: "codex",
                runIndex: 2,
                prompt: "Run the roadmap workflow.",
                output: "Generated roadmap phase structure.",
                reportPath: "benchmark/test-roadmap-2026-05-17.md",
                runPath: "tests/benchmarks/runs/roadmap-codex-123/run-002.json",
              },
            },
          },
        },
      },
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as any).SKILLS_SHOWCASE_DATA;
  });

  it("renders the active replay data surface for the selected step", () => {
    render(<TuiWorkflow />);

    const replay = screen.getByLabelText("Install replay");
    expect(within(replay).getByText("User")).toBeTruthy();
    expect(within(replay).getByText("Run ./install.sh.")).toBeTruthy();
    expect(within(replay).getByText("Agent")).toBeTruthy();
    expect(within(replay).getAllByText("Global skill links refresh.").length).toBeGreaterThan(0);
    expect(within(replay).getByText("Terminal")).toBeTruthy();
    expect(within(replay).getAllByText(/\.\/install\.sh/).length).toBeGreaterThan(0);
    expect(within(replay).getByText("Result")).toBeTruthy();
  });

  it("changes replay state when a step circle is selected", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Plan"));

    expect(screen.getByLabelText("Plan replay")).toBeTruthy();
    expect(screen.getByText("$roadmap")).toBeTruthy();
    expect(screen.getByText("$roadmap for this workflow step.")).toBeTruthy();
    expect(screen.getAllByText("Task docs describe the next phase.").length).toBeGreaterThan(0);
  });

  it("keeps revealed transcript turns mounted when jumping back to an earlier step", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Plan"));
    expect(screen.getByLabelText("Plan replay")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Step 1: Install"));

    expect(screen.getAllByText(/Step\s+1\s+\/\s+5/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Install replay")).toBeTruthy();
    expect(screen.getByLabelText("Plan replay")).toBeTruthy();
  });

  it("renders visible benchmark receipt metadata when generated evidence exists", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Plan"));

    const replay = screen.getByLabelText("Plan replay");
    expect(within(replay).getByText("Benchmark receipt")).toBeTruthy();
    expect(within(replay).getByText("Persisted benchmark evidence")).toBeTruthy();
    expect(within(replay).getByText("Pass rate")).toBeTruthy();
    expect(within(replay).getByText("100%")).toBeTruthy();
    expect(within(replay).getByText("Quality")).toBeTruthy();
    expect(within(replay).getByText("92.0%")).toBeTruthy();
    expect(within(replay).getAllByText("Agent").length).toBeGreaterThan(0);
    expect(within(replay).getByText("codex")).toBeTruthy();
    expect(within(replay).getByText("Run artifact")).toBeTruthy();
    expect(
      within(replay).getByText("tests/benchmarks/runs/roadmap-codex-123/run-002.json"),
    ).toBeTruthy();
    expect(within(replay).getByText("Report")).toBeTruthy();
    expect(within(replay).getByText("benchmark/test-roadmap-2026-05-17.md")).toBeTruthy();
  });

  it("renders an explicit no-receipt state for curated steps", () => {
    render(<TuiWorkflow />);

    const replay = screen.getByLabelText("Install replay");
    expect(within(replay).getByText("Curated scenario")).toBeTruthy();
    expect(within(replay).getByText("No persisted benchmark receipt")).toBeTruthy();
    expect(
      within(replay).getByText("No persisted benchmark receipt is attached to this step yet."),
    ).toBeTruthy();
  });

  it("smooth-scrolls the active transcript turn during playback", () => {
    const scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Plan"));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    expect(document.querySelector('[data-workflow-turn="3"]')).toHaveAttribute(
      "data-workflow-turn-active",
      "true",
    );
  });

  it("does not animate transcript scroll for reduced-motion users", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Plan"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
