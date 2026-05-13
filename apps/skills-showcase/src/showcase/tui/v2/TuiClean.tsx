"use client";

import { useState } from "react";
import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import { VariationNav } from "@/showcase/tui/shared/VariationNav";
import "./clean.css";

export function TuiClean() {
  const {
    activeKey,
    activeStep,
    playing,
    workflow,
    workflows,
    selectWorkflow,
    goToStep,
    nextStep,
    prevStep,
    togglePlay,
    restart,
  } = useWorkflowPlayer();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const step = workflow.steps[activeStep];
  const totalSteps = workflow.steps.length;

  return (
    <div className="tui-clean">
      <VariationNav />

      <div className="tui-clean__layout">
        {/* Left sidebar: workflow card stack */}
        <aside className="tui-clean__sidebar">
          <h2 className="tui-clean__sidebar-title">Workflows</h2>
          <ul className="tui-clean__card-stack">
            {workflows.map((wf) => (
              <li key={wf.key}>
                <button
                  className={`tui-clean__card ${
                    activeKey === wf.key ? "tui-clean__card--active" : ""
                  }`}
                  onClick={() => selectWorkflow(wf.key)}
                  aria-current={activeKey === wf.key ? "true" : undefined}
                >
                  <span className="tui-clean__card-title">{wf.title}</span>
                  <span className="tui-clean__card-subtitle">
                    {wf.subtitle}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right main area */}
        <main className="tui-clean__main">
          {/* Step card */}
          <div className="tui-clean__step-card" key={`${activeKey}-${activeStep}`}>
            <p className="tui-clean__step-name">{step[0]}</p>
            <code className="tui-clean__step-command">{step[1]}</code>
            <p className="tui-clean__step-description">{step[2]}</p>
          </div>

          {/* Progress bar */}
          <div className="tui-clean__progress">
            {workflow.steps.map((_, i) => (
              <button
                key={i}
                className={`tui-clean__progress-segment ${
                  i <= activeStep ? "tui-clean__progress-segment--filled" : ""
                } ${i === activeStep ? "tui-clean__progress-segment--current" : ""}`}
                onClick={() => goToStep(i)}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="tui-clean__controls">
            <button onClick={prevStep} aria-label="Previous step">
              Prev
            </button>
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={nextStep} aria-label="Next step">
              Next
            </button>
            <button onClick={restart} aria-label="Restart">
              Restart
            </button>
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label={drawerOpen ? "Close output" : "Open output"}
            >
              Output
            </button>
          </div>

          {/* Metadata */}
          <details className="tui-clean__meta">
            <summary>Metadata</summary>
            <div className="tui-clean__meta-grid">
              <div>
                <strong>When</strong>
                <p>{workflow.when}</p>
              </div>
              <div>
                <strong>Changes</strong>
                <ul>
                  {workflow.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Artifacts</strong>
                <ul>
                  {workflow.artifacts.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Failure</strong>
                <p>{workflow.failure}</p>
              </div>
            </div>
          </details>

          {/* Step counter */}
          <p className="tui-clean__counter">
            Step {activeStep + 1} / {totalSteps}
          </p>
        </main>

        {/* Output drawer */}
        <aside
          className={`tui-clean__drawer ${
            drawerOpen ? "tui-clean__drawer--open" : ""
          }`}
          aria-hidden={!drawerOpen}
        >
          <div className="tui-clean__drawer-header">
            <span>Output</span>
            <button onClick={() => setDrawerOpen(false)} aria-label="Close drawer">
              &times;
            </button>
          </div>
          <div className="tui-clean__drawer-body">
            <pre>
              <code>
                {`$ ${step[1]}\n\n`}
                {step[2]}
              </code>
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
