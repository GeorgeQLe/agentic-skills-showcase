"use client";

/**
 * StageProgress — the three-step indicator + back navigation that sits above the
 * staged journey (Select · Open · Build). Reflects the current stage, marks
 * completed steps, and exposes a Back affordance from stages 2 and 3.
 */

import type { Stage } from "./useStageMachine";

const STEPS: { n: Stage; label: string }[] = [
  { n: 1, label: "Select" },
  { n: 2, label: "Open" },
  { n: 3, label: "Build" },
];

export default function StageProgress({
  stage,
  onBack,
  contextLabel,
}: {
  stage: Stage;
  onBack: () => void;
  /** e.g. the selected deck name, shown beside the steps once chosen. */
  contextLabel?: string | null;
}) {
  return (
    <nav
      className="stage-progress"
      data-testid="landing-stage-progress"
      data-stage={stage}
      aria-label="Journey progress"
    >
      <button
        type="button"
        className="stage-back"
        data-testid="landing-stage-back"
        onClick={onBack}
        hidden={stage === 1}
        aria-hidden={stage === 1}
      >
        ← Back
      </button>
      <ol className="stage-steps">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="stage-step"
            data-current={String(step.n === stage)}
            data-complete={String(step.n < stage)}
            aria-current={step.n === stage ? "step" : undefined}
          >
            <span className="stage-step-num" aria-hidden="true">
              {step.n < stage ? "✓" : step.n}
            </span>
            <span className="stage-step-label">{step.label}</span>
          </li>
        ))}
      </ol>
      {contextLabel ? (
        <span className="stage-context" data-testid="landing-stage-context">
          {contextLabel}
        </span>
      ) : null}
    </nav>
  );
}
