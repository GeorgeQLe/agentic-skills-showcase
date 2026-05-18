"use client";

import { useState, useEffect, useRef } from "react";
import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import { useTypewriter } from "@/showcase/tui/shared/useTypewriter";
import type { WorkflowBenchmarkSummary, WorkflowStepBenchmark } from "@/showcase/types";
import "./workflow.css";

export function TuiWorkflow() {
  const [activeTurnReady, setActiveTurnReady] = useState(false);
  const turnRefs = useRef<Array<HTMLElement | null>>([]);
  const {
    activeKey,
    activeStep,
    revealedStep,
    playing,
    workflow,
    workflows,
    selectWorkflow,
    goToStep,
    nextStep,
    prevStep,
    togglePlay,
    restart,
    reducedMotion,
  } = useWorkflowPlayer(900, activeTurnReady);

  const [benchmarks, setBenchmarks] = useState<Record<string, WorkflowBenchmarkSummary>>({});

  useEffect(() => {
    const data = (window as any).SKILLS_SHOWCASE_DATA;
    if (data?.workflowBenchmarks) setBenchmarks(data.workflowBenchmarks);
  }, []);

  const totalSteps = workflow.steps.length;
  const workflowIndex = workflows.findIndex((w) => w.key === activeKey);
  const tiltClass = `tui-workflow__notebook--tilt-${workflowIndex % 7}`;
  const summary = benchmarks[activeKey];
  const revealedSteps = workflow.steps.slice(0, revealedStep + 1);
  const activeAgentBody = workflow.steps[activeStep]?.replay.agent.body ?? "";
  const { displayed: activeAgentBodyDisplayed, done: activeAgentBodyDone } = useTypewriter(
    activeAgentBody,
    2,
    30,
    !reducedMotion,
  );

  useEffect(() => {
    setActiveTurnReady(reducedMotion);
  }, [activeKey, activeStep, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || activeAgentBodyDone) {
      setActiveTurnReady(true);
    }
  }, [activeAgentBodyDone, reducedMotion]);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const activeTurn = turnRefs.current[activeStep];
    if (!activeTurn) return;

    const frame = window.requestAnimationFrame(() => {
      activeTurn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeKey, activeStep, playing, reducedMotion]);

  return (
    <div className="tui-workflow">
      {/* Chip row */}
      <div className="tui-workflow__chips">
        {workflows.map((wf) => (
          <button
            key={wf.key}
            className={`tui-workflow__chip ${
              activeKey === wf.key ? "tui-workflow__chip--active" : ""
            }`}
            onClick={() => selectWorkflow(wf.key)}
            aria-current={activeKey === wf.key ? "true" : undefined}
          >
            {wf.title}
          </button>
        ))}
      </div>

      {summary && summary.stepsBenchmarked > 0 && (
        <div className="tui-workflow__benchmark-strip">
          <span>{summary.stepsBenchmarked}/{summary.stepsTotal} steps benchmarked</span>
          {summary.aggregatePassRate && <span>Pass {summary.aggregatePassRate}</span>}
          {summary.aggregateQuality && <span>Quality {summary.aggregateQuality}</span>}
        </div>
      )}

      {/* Main body */}
      <div className="tui-workflow__body">
        {/* Left: step area */}
        <div className="tui-workflow__step-area">
          <div className="tui-workflow__transcript" aria-label={`${workflow.title} transcript`}>
            {revealedSteps.map((step, index) => {
              const isActiveStep = index === activeStep;
              const stagesActiveTurn = isActiveStep && index === revealedStep;
              const showProofBlocks = !stagesActiveTurn || activeTurnReady || reducedMotion;
              const agentBody = stagesActiveTurn && !reducedMotion
                ? activeAgentBodyDisplayed
                : step.replay.agent.body;
              const stepBenchmark: WorkflowStepBenchmark | undefined =
                summary?.stepBenchmarks[index];
              const hasBenchmarkReceipt =
                step.replay.receipt.state === "benchmark" && Boolean(stepBenchmark);
              const receiptTitle = hasBenchmarkReceipt
                ? "Benchmark receipt"
                : step.replay.receipt.label;
              const receiptStatus = hasBenchmarkReceipt
                ? "Persisted benchmark evidence"
                : step.replay.receipt.state === "benchmark"
                  ? "Benchmark receipt unavailable"
                  : "No persisted benchmark receipt";
              const receiptRows = hasBenchmarkReceipt && stepBenchmark
                ? [
                    ["Pass rate", stepBenchmark.passRate],
                    ["Quality", stepBenchmark.qualityScore],
                    ["Agent", stepBenchmark.demo?.agent],
                    ["Run", stepBenchmark.demo ? `#${stepBenchmark.demo.runIndex}` : null],
                    ["Report", stepBenchmark.demo?.reportPath],
                    ["Run artifact", stepBenchmark.demo?.runPath],
                  ].filter((row): row is [string, string] => Boolean(row[1]))
                : [];

              return (
                <article
                  className={`tui-workflow__step-card ${
                    isActiveStep ? "tui-workflow__step-card--active" : ""
                  }`}
                  key={`${activeKey}-${index}`}
                  ref={(node) => {
                    turnRefs.current[index] = node;
                  }}
                  data-workflow-turn={index + 1}
                  data-workflow-turn-active={isActiveStep ? "true" : "false"}
                >
                  <p className="tui-workflow__step-name">{step.title}</p>
                  <code className="tui-workflow__step-command">{step.command}</code>
                  <div className="tui-workflow__replay" aria-label={`${step.title} replay`}>
                    <div className="tui-workflow__replay-message tui-workflow__replay-message--user">
                      <span className="tui-workflow__demo-label">{step.replay.user.label}</span>
                      <p className="tui-workflow__step-desc">{step.replay.user.body}</p>
                    </div>
                    <div className="tui-workflow__replay-message tui-workflow__replay-message--agent">
                      <span className="tui-workflow__demo-label">{step.replay.agent.label}</span>
                      <p className="tui-workflow__step-desc">{agentBody}</p>
                    </div>
                    {showProofBlocks && (
                      <div className="tui-workflow__demo-content">
                        <span className="tui-workflow__demo-label">{step.replay.terminal.label}</span>
                        <pre className="tui-workflow__demo-pre">{step.replay.terminal.body}</pre>
                        <span className="tui-workflow__demo-label">{step.replay.artifact.label}</span>
                        <pre className="tui-workflow__demo-pre">{step.replay.artifact.body}</pre>
                        <div
                          className={`tui-workflow__receipt ${
                            hasBenchmarkReceipt ? "tui-workflow__receipt--benchmark" : ""
                          }`}
                          data-receipt-state={step.replay.receipt.state}
                          data-receipt-step={index + 1}
                        >
                          <div className="tui-workflow__receipt-header">
                            <span className="tui-workflow__demo-label">{receiptTitle}</span>
                            <span className="tui-workflow__receipt-status">{receiptStatus}</span>
                          </div>
                          {receiptRows.length > 0 ? (
                            <dl className="tui-workflow__receipt-grid">
                              {receiptRows.map(([label, value]) => (
                                <div className="tui-workflow__receipt-row" key={label}>
                                  <dt>{label}</dt>
                                  <dd>{value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="tui-workflow__receipt-empty">
                              {step.replay.receipt.body}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {stepBenchmark && (stepBenchmark.passRate || stepBenchmark.qualityScore) && (
                    <div className="tui-workflow__step-badge">
                      {stepBenchmark.passRate && (
                        <span className="tui-workflow__step-badge--pass">
                          {stepBenchmark.passRate} pass
                        </span>
                      )}
                      {stepBenchmark.qualityScore && (
                        <span className="tui-workflow__step-badge--quality">
                          {stepBenchmark.qualityScore} quality
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Dot indicators with connecting lines */}
          <div className="tui-workflow__dots">
            {workflow.steps.map((_, i) => (
              <div className="tui-workflow__dot-group" key={i}>
                <button
                  className={`tui-workflow__dot ${
                    i === activeStep ? "tui-workflow__dot--active" : ""
                  }`}
                  onClick={() => goToStep(i)}
                  aria-label={`Step ${i + 1}: ${workflow.steps[i].title}`}
                />
                {i < workflow.steps.length - 1 && (
                  <span className="tui-workflow__dot-line" />
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="tui-workflow__controls">
            <button
              className="tui-workflow__btn"
              onClick={prevStep}
              aria-label="Previous step"
            >
              Prev
            </button>
            <button
              className="tui-workflow__btn tui-workflow__btn--play"
              onClick={togglePlay}
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              className="tui-workflow__btn"
              onClick={nextStep}
              aria-label="Next step"
            >
              Next
            </button>
            <button
              className="tui-workflow__btn"
              onClick={restart}
              aria-label="Restart workflow"
            >
              Restart
            </button>
          </div>

          <p className="tui-workflow__counter">
            Step {activeStep + 1} / {totalSteps}
          </p>
        </div>

        {/* Right: lab notebook */}
        <aside className={`tui-workflow__notebook ${tiltClass}`}>
          <h2 className="tui-workflow__notebook-title">{workflow.title}</h2>
          <p className="tui-workflow__notebook-subtitle">{workflow.subtitle}</p>

          <div className="tui-workflow__notebook-section">
            <span className="tui-workflow__notebook-label">When</span>
            <p className="tui-workflow__notebook-text">{workflow.when}</p>
          </div>

          <div className="tui-workflow__notebook-section">
            <span className="tui-workflow__notebook-label">Changes</span>
            <ul className="tui-workflow__notebook-list">
              {workflow.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="tui-workflow__notebook-section">
            <span className="tui-workflow__notebook-label">Artifacts</span>
            <ul className="tui-workflow__notebook-list">
              {workflow.artifacts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="tui-workflow__notebook-section">
            <span className="tui-workflow__notebook-label">Failure</span>
            <p className="tui-workflow__notebook-text">{workflow.failure}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
