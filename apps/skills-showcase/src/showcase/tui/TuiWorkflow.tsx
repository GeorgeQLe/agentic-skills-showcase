"use client";

import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import "./workflow.css";

export function TuiWorkflow() {
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

  const step = workflow.steps[activeStep];
  const totalSteps = workflow.steps.length;
  const workflowIndex = workflows.findIndex((w) => w.key === activeKey);
  const tiltClass = `tui-workflow__notebook--tilt-${workflowIndex % 7}`;

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

      {/* Main body */}
      <div className="tui-workflow__body">
        {/* Left: step area */}
        <div className="tui-workflow__step-area">
          <div
            className="tui-workflow__step-card"
            key={`${activeKey}-${activeStep}`}
          >
            <p className="tui-workflow__step-name">{step[0]}</p>
            <code className="tui-workflow__step-command">{step[1]}</code>
            <p className="tui-workflow__step-desc">{step[2]}</p>
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
                  aria-label={`Step ${i + 1}: ${workflow.steps[i][0]}`}
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
