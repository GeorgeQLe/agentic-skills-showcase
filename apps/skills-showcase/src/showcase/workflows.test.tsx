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
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as any).SKILLS_SHOWCASE_DATA;
  });

  it("renders 7 workflow buttons into the selector list", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const list = document.querySelector("[data-workflow-list]")!;
    expect(list.querySelectorAll(".workflow-item")).toHaveLength(7);
  });

  it("renders 7 preview cards", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const preview = document.querySelector("[data-workflow-preview]")!;
    expect(preview.querySelectorAll(".workflow-preview-card")).toHaveLength(7);
  });

  it("defaults to Market Discovery", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    expect(document.querySelector("[data-workflow-title]")!.textContent).toBe(
      "Market Discovery"
    );
    expect(document.querySelector("[data-workflow-coordinate]")!.textContent).toBe("LAB-01");
  });

  it("renders stage content for the active step", () => {
    workflowPageDOM();
    render(<WorkflowsClient />);

    const stage = document.querySelector("[data-workflow-stage]")!;
    expect(stage.querySelector(".stage-node")).toBeTruthy();
    expect(stage.querySelector("strong")!.textContent).toBe("Explore concept");
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
    const productionButton = Array.from(buttons).find(
      (b) => (b as HTMLElement).dataset.workflow === "production"
    )!;
    productionButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelector("[data-workflow-title]")!.textContent).toBe(
      "Production"
    );
    expect(document.querySelector("[data-workflow-coordinate]")!.textContent).toBe("LAB-07");
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

    expect(stage.querySelector("strong")!.textContent).toBe("Explore concept");
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
      (b) => (b as HTMLElement).dataset.workflow === "market-discovery"
    )!;
    expect(firstButton.getAttribute("aria-pressed")).toBe("true");

    const valueButton = Array.from(buttons).find(
      (b) => (b as HTMLElement).dataset.workflow === "value-strategy"
    )!;
    expect(valueButton.getAttribute("aria-pressed")).toBe("false");
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
    expect(stage.querySelector("strong")!.textContent).toBe("Explore concept");
  });
});

describe("TuiWorkflow replay pilot", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Element.prototype.scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    (window as any).SKILLS_SHOWCASE_DATA = {
      workflowBenchmarks: {
        "market-discovery": {
          workflowKey: "market-discovery",
          stepsTotal: 5,
          stepsBenchmarked: 1,
          aggregatePassRate: "100%",
          aggregateQuality: "92.0%",
          stepBenchmarks: {
            0: {
              skill: "concept-exploration",
              passRate: "100%",
              qualityScore: "92.0%",
              demo: {
                agent: "codex",
                runIndex: 2,
                prompt: "Run concept exploration.",
                output: "Generated concept brief.",
                reportPath: "benchmark/test-concept-exploration-2026-05-17.md",
                runPath: "tests/benchmarks/runs/concept-exploration-codex-123/run-002.json",
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

    const replay = screen.getByLabelText("Explore concept replay");
    expect(within(replay).getByText("User goal")).toBeTruthy();
    expect(
      within(replay).getByText("Use $concept-exploration to move this workflow step from intent to evidence."),
    ).toBeTruthy();
    expect(within(replay).getByText("Agent")).toBeTruthy();
    expect(within(replay).getAllByText("Rough idea becomes a bounded concept brief.").length).toBeGreaterThan(0);
    expect(within(replay).getByText("Terminal")).toBeTruthy();
    expect(within(replay).getAllByText(/\$concept-exploration/).length).toBeGreaterThan(0);
    expect(within(replay).getByText("Result")).toBeTruthy();
  });

  it("changes replay state when a step circle is selected", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 2: Select pack"));

    expect(screen.getByLabelText("Select pack replay")).toBeTruthy();
    expect(screen.getByText("$pack")).toBeTruthy();
  });

  it("keeps completed transcript turns expanded after advancing", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.useFakeTimers();

    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Next step"));
    vi.runOnlyPendingTimers();

    const exploreReplay = screen.getByLabelText("Explore concept replay");
    expect(
      within(exploreReplay).getByText("Use $concept-exploration to move this workflow step from intent to evidence."),
    ).toBeTruthy();
    expect(within(exploreReplay).getByText("Terminal")).toBeTruthy();
    expect(within(exploreReplay).getByText("Result")).toBeTruthy();

    const selectPackReplay = screen.getByLabelText("Select pack replay");
    expect(within(selectPackReplay).getByText("User goal")).toBeTruthy();
    expect(within(selectPackReplay).getByText("Agent")).toBeTruthy();

    vi.useRealTimers();
  });

  it("keeps revealed transcript turns mounted when jumping back to an earlier step", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Define ICP"));
    expect(screen.getByLabelText("Define ICP replay")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Step 1: Explore concept"));

    expect(screen.getAllByText(/Step\s+1\s+\/\s+5/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Explore concept replay")).toBeTruthy();
    expect(screen.getByLabelText("Define ICP replay")).toBeTruthy();
  });

  it("resets transcript turns when switching workflows", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Define ICP"));
    expect(screen.getByLabelText("Define ICP replay")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Production" }));

    expect(screen.getByLabelText("Roadmap replay")).toBeTruthy();
    expect(screen.queryByLabelText("Explore concept replay")).toBeNull();
    expect(screen.queryByText("$concept-exploration")).toBeNull();
  });

  it("renders visible benchmark receipt metadata when generated evidence exists", () => {
    render(<TuiWorkflow />);

    const replay = screen.getByLabelText("Explore concept replay");
    expect(within(replay).getByText("Run concept exploration.")).toBeTruthy();
    expect(within(replay).getByText("Generated concept brief.")).toBeTruthy();
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
      within(replay).getByText("tests/benchmarks/runs/concept-exploration-codex-123/run-002.json"),
    ).toBeTruthy();
    expect(within(replay).getByText("Report")).toBeTruthy();
    expect(within(replay).getByText("benchmark/test-concept-exploration-2026-05-17.md")).toBeTruthy();
  });

  it("renders an explicit no-receipt state for curated steps", () => {
    render(<TuiWorkflow />);

    fireEvent.click(screen.getByLabelText("Step 3: Define ICP"));

    const replay = screen.getByLabelText("Define ICP replay");
    expect(within(replay).getByText("Curated scenario")).toBeTruthy();
    expect(within(replay).getByText("No persisted benchmark receipt")).toBeTruthy();
    expect(
      within(replay).getByText("No persisted benchmark receipt is attached to this step yet."),
    ).toBeTruthy();
  });

  it("renders reduced-motion turns and proof blocks without typewriter delay", () => {
    render(<TuiWorkflow />);

    const replay = screen.getByLabelText("Explore concept replay");
    expect(within(replay).getAllByText("Rough idea becomes a bounded concept brief.").length).toBeGreaterThan(0);
    expect(within(replay).getByText("Terminal")).toBeTruthy();
    expect(within(replay).getByText("Result")).toBeTruthy();
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

    fireEvent.click(screen.getByLabelText("Step 3: Define ICP"));

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

    fireEvent.click(screen.getByLabelText("Step 3: Define ICP"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
