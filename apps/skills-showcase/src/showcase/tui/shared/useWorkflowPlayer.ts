"use client";

import { useState, useEffect, useCallback } from "react";
import { workflows, workflowByKey } from "../workflow-data";
import type { Workflow } from "../workflow-data";

interface WorkflowPlayerState {
  activeKey: string;
  activeStep: number;
  revealedStep: number;
  playing: boolean;
  workflow: Workflow;
}

export function useWorkflowPlayer(autoAdvanceMs = 900, canAutoAdvance = true) {
  const [state, setState] = useState<WorkflowPlayerState>(() => {
    const wf = workflows[0];
    return {
      activeKey: wf.key,
      activeStep: 0,
      revealedStep: 0,
      playing: true,
      workflow: wf,
    };
  });

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReducedMotion(prefersReducedMotion);
    if (prefersReducedMotion) {
      setState((s) => ({ ...s, playing: false }));
    }
  }, []);

  const selectWorkflow = useCallback(
    (key: string) => {
      const wf = workflowByKey[key] || workflows[0];
      setState({
        activeKey: wf.key,
        activeStep: 0,
        revealedStep: 0,
        playing: !reducedMotion,
        workflow: wf,
      });
    },
    [reducedMotion]
  );

  const goToStep = useCallback((step: number) => {
    setState((s) => {
      const clamped = Math.max(0, Math.min(step, s.workflow.steps.length - 1));
      return {
        ...s,
        activeStep: clamped,
        revealedStep: Math.max(s.revealedStep, clamped),
      };
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => {
      const next = (s.activeStep + 1) % s.workflow.steps.length;
      return {
        ...s,
        activeStep: next,
        revealedStep: Math.max(s.revealedStep, next),
      };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => {
      if (s.activeStep <= 0) return s;
      return { ...s, activeStep: s.activeStep - 1 };
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (reducedMotion) return;
    setState((s) => ({ ...s, playing: !s.playing }));
  }, [reducedMotion]);

  const restart = useCallback(() => {
    setState((s) => ({
      ...s,
      activeStep: 0,
      revealedStep: 0,
      playing: !reducedMotion,
    }));
  }, [reducedMotion]);

  useEffect(() => {
    if (!state.playing || reducedMotion || !canAutoAdvance) return;
    const id = window.setTimeout(() => {
      setState((s) => {
        const next = (s.activeStep + 1) % s.workflow.steps.length;
        return {
          ...s,
          activeStep: next,
          revealedStep: Math.max(s.revealedStep, next),
        };
      });
    }, autoAdvanceMs);
    return () => window.clearTimeout(id);
  }, [state.playing, state.activeKey, state.activeStep, autoAdvanceMs, canAutoAdvance, reducedMotion]);

  return {
    ...state,
    workflows,
    reducedMotion,
    selectWorkflow,
    goToStep,
    nextStep,
    prevStep,
    togglePlay,
    restart,
  };
}
