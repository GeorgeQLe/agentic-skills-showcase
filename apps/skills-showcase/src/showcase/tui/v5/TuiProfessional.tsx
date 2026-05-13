"use client";

import { useState } from "react";
import { useWorkflowPlayer } from "@/showcase/tui/shared/useWorkflowPlayer";
import { VariationNav } from "@/showcase/tui/shared/VariationNav";
import "./professional.css";

type SectionKey = "trigger" | "changes" | "artifacts" | "recovery";

export function TuiProfessional() {
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

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    {
      trigger: true,
      changes: true,
      artifacts: false,
      recovery: false,
    },
  );

  const toggleSection = (key: SectionKey) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const step = workflow.steps[activeStep];
  const totalSteps = workflow.steps.length;

  return (
    <div className="tui-professional">
      <VariationNav />

      {/* Breadcrumb */}
      <div className="tui-professional__breadcrumb">
        Workflows / <span>{workflow.coordinate}</span> / Step{" "}
        {activeStep + 1}
      </div>

      <div className="tui-professional__layout">
        {/* ── Left: Compact index ──────────────────────────── */}
        <aside className="tui-professional__index">
          {workflows.map((wf) => (
            <button
              key={wf.key}
              className={`tui-professional__index-item${
                activeKey === wf.key
                  ? " tui-professional__index-item--active"
                  : ""
              }`}
              onClick={() => selectWorkflow(wf.key)}
              aria-current={activeKey === wf.key ? "true" : undefined}
            >
              <span className="tui-professional__index-coord">
                {wf.coordinate}
              </span>
              <span className="tui-professional__index-title">{wf.title}</span>
              <span className="tui-professional__index-badge">{wf.badge}</span>
            </button>
          ))}
        </aside>

        {/* ── Center: Timeline ─────────────────────────────── */}
        <div className="tui-professional__center">
          {/* Mini toolbar */}
          <div className="tui-professional__toolbar">
            <button onClick={prevStep} aria-label="Previous step">
              Prev
            </button>
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={nextStep} aria-label="Next step">
              Next
            </button>
            <button onClick={restart} aria-label="Restart">
              Restart
            </button>
            <span className="tui-professional__toolbar-counter">
              Step {activeStep + 1} / {totalSteps}
            </span>
            <span className="tui-professional__toolbar-speed">
              {playing ? "auto-advancing" : "paused"}
            </span>
          </div>

          {/* Timeline */}
          <div className="tui-professional__timeline">
            {workflow.steps.map((s, i) => {
              const isPast = i < activeStep;
              const isCurrent = i === activeStep;
              const isFuture = i > activeStep;

              const dotClass = isPast
                ? "tui-professional__timeline-dot--past"
                : isCurrent
                  ? "tui-professional__timeline-dot--current"
                  : "tui-professional__timeline-dot--future";

              const nameClass = isPast
                ? "tui-professional__timeline-name--past"
                : isCurrent
                  ? "tui-professional__timeline-name--current"
                  : "";

              const isLast = i === totalSteps - 1;

              return (
                <div
                  key={`${activeKey}-${i}`}
                  className="tui-professional__timeline-step"
                  role="button"
                  tabIndex={0}
                  onClick={() => goToStep(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") goToStep(i);
                  }}
                >
                  {/* Connector column */}
                  <div className="tui-professional__timeline-connector">
                    <div
                      className={`tui-professional__timeline-dot ${dotClass}`}
                    >
                      {isPast ? "✓" : ""}
                    </div>
                    {!isLast && (
                      <div
                        className={`tui-professional__timeline-line${
                          playing && isCurrent
                            ? " tui-professional__timeline-line--pulse"
                            : ""
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="tui-professional__timeline-content">
                    <div
                      className={`tui-professional__timeline-name ${nameClass}`}
                    >
                      {s[0]}
                    </div>

                    {isCurrent && (
                      <div className="tui-professional__timeline-detail">
                        <code className="tui-professional__timeline-command">
                          $ {s[1]}
                        </code>
                        <p className="tui-professional__timeline-desc">
                          {s[2]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Context panel ─────────────────────────── */}
        <aside className="tui-professional__context">
          <h3 className="tui-professional__context-title">Context</h3>

          {/* Trigger */}
          <div className="tui-professional__section">
            <button
              className="tui-professional__section-header"
              onClick={() => toggleSection("trigger")}
              aria-expanded={openSections.trigger}
            >
              <span className="tui-professional__section-dot tui-professional__section-dot--green" />
              Trigger
              <span
                className={`tui-professional__section-chevron${
                  openSections.trigger
                    ? " tui-professional__section-chevron--open"
                    : ""
                }`}
              >
                &#9654;
              </span>
            </button>
            {openSections.trigger && (
              <div className="tui-professional__section-body">
                {workflow.when}
              </div>
            )}
          </div>

          {/* Changes */}
          <div className="tui-professional__section">
            <button
              className="tui-professional__section-header"
              onClick={() => toggleSection("changes")}
              aria-expanded={openSections.changes}
            >
              <span className="tui-professional__section-dot tui-professional__section-dot--blue" />
              Changes
              <span
                className={`tui-professional__section-chevron${
                  openSections.changes
                    ? " tui-professional__section-chevron--open"
                    : ""
                }`}
              >
                &#9654;
              </span>
            </button>
            {openSections.changes && (
              <div className="tui-professional__section-body">
                <ul>
                  {workflow.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Artifacts */}
          <div className="tui-professional__section">
            <button
              className="tui-professional__section-header"
              onClick={() => toggleSection("artifacts")}
              aria-expanded={openSections.artifacts}
            >
              <span className="tui-professional__section-dot tui-professional__section-dot--amber" />
              Artifacts
              <span
                className={`tui-professional__section-chevron${
                  openSections.artifacts
                    ? " tui-professional__section-chevron--open"
                    : ""
                }`}
              >
                &#9654;
              </span>
            </button>
            {openSections.artifacts && (
              <div className="tui-professional__section-body">
                <ul>
                  {workflow.artifacts.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recovery */}
          <div className="tui-professional__section">
            <button
              className="tui-professional__section-header"
              onClick={() => toggleSection("recovery")}
              aria-expanded={openSections.recovery}
            >
              <span className="tui-professional__section-dot tui-professional__section-dot--red" />
              Recovery
              <span
                className={`tui-professional__section-chevron${
                  openSections.recovery
                    ? " tui-professional__section-chevron--open"
                    : ""
                }`}
              >
                &#9654;
              </span>
            </button>
            {openSections.recovery && (
              <div className="tui-professional__section-body">
                {workflow.failure}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
