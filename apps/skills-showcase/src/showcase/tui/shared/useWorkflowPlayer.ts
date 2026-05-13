"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { workflows, workflowByKey } from "../workflow-data";
import type { Workflow } from "../workflow-data";

interface WorkflowPlayerState {
  activeKey: string;
  activeStep: number;
  playing: boolean;
  workflow: Workflow;
}

export function useWorkflowPlayer(autoAdvanceMs = 3200) {
  const [state, setState] = useState<WorkflowPlayerState>(() => {
    const wf = workflows[0];
    return { activeKey: wf.key, activeStep: 0, playing: true, workflow: wf };
  });

  const reducedMotion = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    reducedMotion.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion.current) {
      setState((s) => ({ ...s, playing: false }));
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const selectWorkflow = useCallback(
    (key: string) => {
      const wf = workflowByKey[key] || workflows[0];
      stopTimer();
      setState({
        activeKey: wf.key,
        activeStep: 0,
        playing: !reducedMotion.current,
        workflow: wf,
      });
    },
    [stopTimer]
  );

  const goToStep = useCallback((step: number) => {
    setState((s) => {
      const clamped = Math.max(0, Math.min(step, s.workflow.steps.length - 1));
      return { ...s, activeStep: clamped };
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => {
      const next = (s.activeStep + 1) % s.workflow.steps.length;
      return { ...s, activeStep: next };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => {
      if (s.activeStep <= 0) return s;
      return { ...s, activeStep: s.activeStep - 1 };
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (reducedMotion.current) return;
    setState((s) => ({ ...s, playing: !s.playing }));
  }, []);

  const restart = useCallback(() => {
    setState((s) => ({
      ...s,
      activeStep: 0,
      playing: !reducedMotion.current,
    }));
  }, []);

  useEffect(() => {
    stopTimer();
    if (!state.playing || reducedMotion.current) return;
    timerRef.current = setInterval(() => {
      setState((s) => {
        const next = (s.activeStep + 1) % s.workflow.steps.length;
        return { ...s, activeStep: next };
      });
    }, autoAdvanceMs);
    return stopTimer;
  }, [state.playing, state.activeKey, autoAdvanceMs, stopTimer]);

  return {
    ...state,
    workflows,
    reducedMotion: reducedMotion.current,
    selectWorkflow,
    goToStep,
    nextStep,
    prevStep,
    togglePlay,
    restart,
  };
}
