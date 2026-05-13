"use client";

import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import { VariationNav } from "@/showcase/tui/shared/VariationNav";
import "./playful.css";

export function TuiPlayful() {
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
  const tiltClass = `tui-playful__sticky--tilt-${workflowIndex % 7}`;

  return (
    <div className="tui-playful">
      <VariationNav />

      {/* Chip row */}
      <div className="tui-playful__chips">
        {workflows.map((wf) => (
          <button
            key={wf.key}
            className={`tui-playful__chip ${
              activeKey === wf.key ? "tui-playful__chip--active" : ""
            }`}
            onClick={() => selectWorkflow(wf.key)}
            aria-current={activeKey === wf.key ? "true" : undefined}
          >
            {wf.title}
          </button>
        ))}
      </div>

      {/* Main body */}
      <div className="tui-playful__body">
        {/* Left: step area */}
        <div className="tui-playful__step-area">
          <div
            className="tui-playful__step-card"
            key={`${activeKey}-${activeStep}`}
          >
            <p className="tui-playful__step-name">{step[0]}</p>
            <code className="tui-playful__step-command">{step[1]}</code>
            <p className="tui-playful__step-desc">{step[2]}</p>
          </div>

          {/* Dot indicators with connecting lines */}
          <div className="tui-playful__dots">
            {workflow.steps.map((_, i) => (
              <div className="tui-playful__dot-group" key={i}>
                <button
                  className={`tui-playful__dot ${
                    i === activeStep ? "tui-playful__dot--active" : ""
                  }`}
                  onClick={() => goToStep(i)}
                  aria-label={`Step ${i + 1}: ${workflow.steps[i][0]}`}
                />
                {i < workflow.steps.length - 1 && (
                  <span className="tui-playful__dot-line" />
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="tui-playful__controls">
            <button className="tui-playful__btn" onClick={prevStep}>
              Prev
            </button>
            <button
              className="tui-playful__btn tui-playful__btn--play"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button className="tui-playful__btn" onClick={nextStep}>
              Next
            </button>
            <button className="tui-playful__btn" onClick={restart}>
              Restart
            </button>
          </div>

          <p className="tui-playful__counter">
            Step {activeStep + 1} / {totalSteps}
          </p>
        </div>

        {/* Right: sticky note */}
        <aside className={`tui-playful__sticky ${tiltClass}`}>
          <h2 className="tui-playful__sticky-title">{workflow.title}</h2>
          <p className="tui-playful__sticky-subtitle">{workflow.subtitle}</p>

          <div className="tui-playful__sticky-section">
            <span className="tui-playful__sticky-label">When</span>
            <p className="tui-playful__sticky-text">{workflow.when}</p>
          </div>

          <div className="tui-playful__sticky-section">
            <span className="tui-playful__sticky-label">Changes</span>
            <ul className="tui-playful__sticky-list">
              {workflow.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="tui-playful__sticky-section">
            <span className="tui-playful__sticky-label">Artifacts</span>
            <ul className="tui-playful__sticky-list">
              {workflow.artifacts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          <div className="tui-playful__sticky-section">
            <span className="tui-playful__sticky-label">Failure</span>
            <p className="tui-playful__sticky-text">{workflow.failure}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
