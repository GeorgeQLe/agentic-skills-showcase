"use client";

import "./hacker.css";
import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import { useTypewriter } from "@/showcase/tui/shared/useTypewriter";
import { VariationNav } from "@/showcase/tui/shared/VariationNav";

const PROMPT = "george@skillpacks:~$ ";

export function TuiHacker() {
  const {
    activeKey,
    activeStep,
    playing,
    workflow,
    workflows,
    selectWorkflow,
    togglePlay,
  } = useWorkflowPlayer();

  const currentStepTuple = workflow.steps[activeStep];
  const typewriterText = currentStepTuple
    ? `${currentStepTuple[1]}  # ${currentStepTuple[2]}`
    : "";
  const { displayed, done } = useTypewriter(typewriterText);

  const workflowIndex = workflows.findIndex((w) => w.key === activeKey);

  return (
    <div className="tui-hacker">
      <VariationNav />

      <div className="tui-hacker__body">
        {/* ---- Sidebar: workflow list ---- */}
        <div className="tui-hacker__sidebar">
          {workflows.map((wf, i) => {
            const isActive = wf.key === activeKey;
            return (
              <button
                key={wf.key}
                className={`tui-hacker__wf-item${isActive ? " tui-hacker__wf-item--active" : ""}`}
                onClick={() => selectWorkflow(wf.key)}
              >
                {isActive ? "> " : "  "}
                [{i + 1}] {wf.title}
              </button>
            );
          })}
        </div>

        {/* ---- Main content ---- */}
        <div className="tui-hacker__main">
          {/* MAIN panel: step history */}
          <div className="tui-hacker__panel-header">MAIN</div>
          <div className="tui-hacker__steps">
            {workflow.steps.map((step, i) => {
              if (i > activeStep) return null;
              const isPast = i < activeStep;
              const isCurrent = i === activeStep;
              return (
                <div
                  key={i}
                  className={`tui-hacker__step${isPast ? " tui-hacker__step--past" : ""}`}
                >
                  <div>
                    <span className="tui-hacker__prompt">
                      <span className="tui-hacker__prompt-user">{PROMPT}</span>
                    </span>
                    {isCurrent ? (
                      <>
                        {displayed}
                        {!done && <span className="tui-hacker__cursor" />}
                      </>
                    ) : (
                      `${step[1]}  # ${step[2]}`
                    )}
                  </div>
                  <div className="tui-hacker__step-desc">
                    [{step[0]}] {step[2]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* OUTPUT panel: metadata log */}
          <div className="tui-hacker__panel-header">OUTPUT</div>
          <div className="tui-hacker__output">
            <div>
              <span className="tui-hacker__log-tag tui-hacker__log-tag--info">
                [INFO]
              </span>{" "}
              {workflow.title} &mdash; {workflow.subtitle}
            </div>
            <div>
              <span className="tui-hacker__log-tag tui-hacker__log-tag--info">
                [INFO]
              </span>{" "}
              {workflow.copy}
            </div>
            <div>
              <span className="tui-hacker__log-tag tui-hacker__log-tag--info">
                [INFO]
              </span>{" "}
              when: {workflow.when}
            </div>
            {workflow.changes.map((c, i) => (
              <div key={`c-${i}`}>
                <span className="tui-hacker__log-tag tui-hacker__log-tag--changes">
                  [CHANGES]
                </span>{" "}
                {c}
              </div>
            ))}
            {workflow.artifacts.map((a, i) => (
              <div key={`a-${i}`}>
                <span className="tui-hacker__log-tag tui-hacker__log-tag--artifacts">
                  [ARTIFACTS]
                </span>{" "}
                {a}
              </div>
            ))}
            {workflow.failure && (
              <div>
                <span className="tui-hacker__log-tag tui-hacker__log-tag--warn">
                  [WARN]
                </span>{" "}
                {workflow.failure}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Status bar ---- */}
      <div className="tui-hacker__status">
        <span>
          WORKFLOW {workflowIndex + 1}/{workflows.length} | STEP{" "}
          {activeStep + 1}/{workflow.steps.length} |{" "}
          {playing ? "AUTO" : "PAUSED"}
        </span>
        <span>
          <button
            onClick={togglePlay}
            style={{
              background: "none",
              border: "none",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              padding: 0,
            }}
          >
            [{playing ? "PAUSE" : "PLAY"}]
          </button>
        </span>
      </div>
    </div>
  );
}
