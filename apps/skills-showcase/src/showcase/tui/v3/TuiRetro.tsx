"use client";

import { useRef, useEffect, useState } from "react";
import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import { useTypewriter } from "@/showcase/tui/shared/useTypewriter";
import { VariationNav } from "@/showcase/tui/shared/VariationNav";
import "./retro.css";

const FK_LABELS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"];

export function TuiRetro() {
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
  const [stepName, stepCommand, stepDescription] = step;

  const { displayed, done } = useTypewriter(stepDescription, 2, 25);

  /* Flicker on workflow / step change */
  const screenRef = useRef<HTMLDivElement>(null);
  const [flicker, setFlicker] = useState(false);
  const prevKey = useRef(activeKey);
  const prevStepIdx = useRef(activeStep);

  useEffect(() => {
    if (prevKey.current !== activeKey || prevStepIdx.current !== activeStep) {
      setFlicker(true);
      const t = setTimeout(() => setFlicker(false), 300);
      prevKey.current = activeKey;
      prevStepIdx.current = activeStep;
      return () => clearTimeout(t);
    }
  }, [activeKey, activeStep]);

  return (
    <div className="tui-retro">
      <VariationNav />

      <div className="monitor">
        <div
          ref={screenRef}
          className={`screen${flicker ? " screen--flicker" : ""}`}
        >
          {/* Header */}
          <div className="header">GSKILLPACKS TERMINAL v3.0</div>

          {/* F-key tab row */}
          <div className="tabs">
            {workflows.map((wf, i) => (
              <button
                key={wf.key}
                className={`tab${wf.key === activeKey ? " tab--active" : ""}`}
                onClick={() => selectWorkflow(wf.key)}
              >
                {FK_LABELS[i] ?? `F${i + 1}`}:{wf.command}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="content">
            <div className="wf-title">{workflow.title}</div>
            <div className="wf-subtitle">{workflow.subtitle}</div>

            {/* Step box */}
            <div className="step-box">
              <div className="step-label">
                STEP {activeStep + 1} / {workflow.steps.length}
              </div>
              <div className="step-name">{stepName}</div>
              <div className="step-command">&gt; {stepCommand}</div>
              <div className="step-desc">
                {displayed}
                {!done && <span className="cursor-blink" />}
              </div>
            </div>

            {/* Step navigation */}
            <div className="step-nav">
              <button onClick={prevStep}>&laquo; PREV</button>
              <button className="play-btn" onClick={togglePlay}>
                {playing ? "[ PAUSE ]" : "[ PLAY ]"}
              </button>
              <button onClick={nextStep}>NEXT &raquo;</button>
              <button onClick={restart}>RESTART</button>
              <span style={{ marginLeft: "auto", color: "#b37b00" }}>
                {workflow.coordinate} / {workflow.badge}
              </span>
            </div>

            <hr className="divider" />

            {/* Metadata two-column */}
            <div className="meta">
              <div>
                <span className="meta-label">WHEN: </span>
                <span className="meta-value">{workflow.when}</span>
              </div>
              <div>
                <span className="meta-label">FAILURE: </span>
                <span className="meta-value">{workflow.failure}</span>
              </div>
              <div>
                <span className="meta-label">CHANGES: </span>
                <span className="meta-value">
                  {workflow.changes.join(", ")}
                </span>
              </div>
              <div>
                <span className="meta-label">ARTIFACTS: </span>
                <span className="meta-value">
                  {workflow.artifacts.join(", ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Power LED */}
        <div className="power-led" />
      </div>
    </div>
  );
}
