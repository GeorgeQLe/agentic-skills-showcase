"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { scaleTransition } from "./manualClock";
import { stepIndex } from "./steps";
import {
  DEFAULT_ANIMATION_MACHINE_RUNTIME,
  DEFAULT_ANIMATION_MACHINE_SNAPSHOT,
  buildAnimationMachineSnapshot,
  mergeAnimationMachineRuntime,
  type AnimationMachineRuntimePatch,
  type AnimationMachineRuntimeState,
  type AnimationMachineSnapshot,
} from "./animationMachine";

export type DebugMode = "auto" | "stepped";

export interface DebugReadout {
  cardElevated: boolean;
  cardZIndex: number | "unset";
  isClosingFromDrawer: boolean;
  isDrawerOpen: boolean;
  machine: AnimationMachineSnapshot;
}

export type DebugReportPatch = Partial<Omit<DebugReadout, "machine">> & {
  machine?: AnimationMachineRuntimePatch;
};

export interface DebugDrivers {
  openClick?: () => void;
  openTear?: () => void;
  close?: () => void;
  /** Deck-builder blueprint-morph drivers (animation-plan-deck-builder.md §F). */
  openDeck?: () => void;
  dismissDeck?: () => void;
  reset?: () => void;
}

export interface DebugContextValue {
  // reactive state (drives the panel)
  enabled: boolean;
  speed: number;
  mode: DebugMode;
  pausedAtStep: string | null;
  reachedSteps: string[];
  currentStepIndex: number;
  readout: DebugReadout;

  // primitives used by the animation components
  gate: (id: string) => Promise<void>;
  /** Non-blocking timeline marker for synchronous boundaries. */
  mark: (id: string) => void;
  scaleT: <T>(transition: T) => T;
  report: (patch: DebugReportPatch) => void;
  isStepping: () => boolean;

  // actions used by the panel
  setEnabled: (b: boolean) => void;
  setSpeed: (n: number) => void;
  setMode: (m: DebugMode) => void;
  advance: () => void;
  replayStep: () => void;
  reset: () => void;

  // imperative drivers (registered by the page)
  registerDrivers: (d: DebugDrivers) => void;
  drive: (name: keyof DebugDrivers) => void;
}

const DEFAULT_READOUT: DebugReadout = {
  cardElevated: false,
  cardZIndex: "unset",
  isClosingFromDrawer: false,
  isDrawerOpen: false,
  machine: DEFAULT_ANIMATION_MACHINE_SNAPSHOT,
};

/**
 * Inert default — when no provider is present (any page other than /prototype,
 * or before mount), gate resolves synchronously, scaleT is identity, and
 * report is a no-op. This keeps the animation components usable everywhere and
 * guarantees debug-off behavior is unchanged.
 */
const NOOP_CONTEXT: DebugContextValue = {
  enabled: false,
  speed: 1,
  mode: "auto",
  pausedAtStep: null,
  reachedSteps: [],
  currentStepIndex: -1,
  readout: DEFAULT_READOUT,
  gate: () => Promise.resolve(),
  scaleT: (t) => t,
  report: () => {},
  isStepping: () => false,
  mark: () => {},
  setEnabled: () => {},
  setSpeed: () => {},
  setMode: () => {},
  advance: () => {},
  replayStep: () => {},
  reset: () => {},
  registerDrivers: () => {},
  drive: () => {},
};

const DebugContext = createContext<DebugContextValue>(NOOP_CONTEXT);

export function useDebug(): DebugContextValue {
  return useContext(DebugContext);
}

export function DebugProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [mode, setModeState] = useState<DebugMode>("auto");
  const [pausedAtStep, setPausedAtStep] = useState<string | null>(null);
  const [reachedSteps, setReachedSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [legacyReadout, setLegacyReadout] = useState<
    Omit<DebugReadout, "machine">
  >({
    cardElevated: DEFAULT_READOUT.cardElevated,
    cardZIndex: DEFAULT_READOUT.cardZIndex,
    isClosingFromDrawer: DEFAULT_READOUT.isClosingFromDrawer,
    isDrawerOpen: DEFAULT_READOUT.isDrawerOpen,
  });
  const [machineRuntime, setMachineRuntime] =
    useState<AnimationMachineRuntimeState>(DEFAULT_ANIMATION_MACHINE_RUNTIME);

  // Refs mirror the latest values so gate()/scaleT(), which run inside
  // animation callbacks (outside React render), never read stale closures.
  const enabledRef = useRef(enabled);
  const modeRef = useRef(mode);
  const speedRef = useRef(speed);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Single-slot gate resolver — animation chains are sequential, so at most one
  // boundary is parked at a time.
  const pendingResolve = useRef<null | (() => void)>(null);
  const driversRef = useRef<DebugDrivers>({});
  const lastDriverRef = useRef<keyof DebugDrivers | null>(null);

  const isStepping = useCallback(
    () => enabledRef.current && modeRef.current === "stepped",
    []
  );

  const markReached = useCallback((id: string) => {
    setReachedSteps((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const idx = stepIndex(id);
    if (idx >= 0) setCurrentStepIndex(idx);
  }, []);

  const gate = useCallback(
    (id: string): Promise<void> => {
      markReached(id);
      if (!enabledRef.current || modeRef.current !== "stepped") {
        return Promise.resolve();
      }
      // If something is already parked (shouldn't happen in a sequential chain
      // but can during rapid resets), release it to avoid a deadlock before
      // parking the new boundary.
      if (pendingResolve.current) {
        const prev = pendingResolve.current;
        pendingResolve.current = null;
        prev();
      }
      setPausedAtStep(id);
      return new Promise<void>((resolve) => {
        pendingResolve.current = () => resolve();
      });
    },
    [markReached]
  );

  const advance = useCallback(() => {
    const r = pendingResolve.current;
    pendingResolve.current = null;
    setPausedAtStep(null);
    if (r) r();
  }, []);

  const scaleT = useCallback(<T,>(transition: T): T => {
    if (!enabledRef.current) return transition;
    return scaleTransition(transition as never, speedRef.current);
  }, []);

  const report = useCallback((patch: DebugReportPatch) => {
    const { machine, ...legacyPatch } = patch;

    if (Object.keys(legacyPatch).length > 0) {
      setLegacyReadout((prev) => {
        // Avoid churn when nothing actually changed.
        let changed = false;
        for (const k of Object.keys(legacyPatch) as (keyof Omit<
          DebugReadout,
          "machine"
        >)[]) {
          if (prev[k] !== legacyPatch[k]) {
            changed = true;
            break;
          }
        }
        return changed ? { ...prev, ...legacyPatch } : prev;
      });
    }

    if (machine) {
      setMachineRuntime((prev) => mergeAnimationMachineRuntime(prev, machine));
    }
  }, []);

  const setEnabled = useCallback(
    (b: boolean) => {
      enabledRef.current = b;
      setEnabledState(b);
      if (!b) {
        // Releasing debug: unpark any frozen chain and clear timeline.
        const r = pendingResolve.current;
        pendingResolve.current = null;
        setPausedAtStep(null);
        if (r) r();
      }
    },
    []
  );

  const setSpeed = useCallback((n: number) => {
    speedRef.current = n;
    setSpeedState(n);
  }, []);

  const setMode = useCallback((m: DebugMode) => {
    modeRef.current = m;
    setModeState(m);
    if (m === "auto") {
      // Leaving stepped mode resumes any frozen chain.
      const r = pendingResolve.current;
      pendingResolve.current = null;
      setPausedAtStep(null);
      if (r) r();
    }
  }, []);

  const reset = useCallback(() => {
    const r = pendingResolve.current;
    pendingResolve.current = null;
    if (r) r();
    setPausedAtStep(null);
    setReachedSteps([]);
    setCurrentStepIndex(-1);
    setLegacyReadout({
      cardElevated: DEFAULT_READOUT.cardElevated,
      cardZIndex: DEFAULT_READOUT.cardZIndex,
      isClosingFromDrawer: DEFAULT_READOUT.isClosingFromDrawer,
      isDrawerOpen: DEFAULT_READOUT.isDrawerOpen,
    });
    setMachineRuntime(DEFAULT_ANIMATION_MACHINE_RUNTIME);
    driversRef.current.reset?.();
  }, []);

  const registerDrivers = useCallback((d: DebugDrivers) => {
    driversRef.current = { ...driversRef.current, ...d };
  }, []);

  const drive = useCallback((name: keyof DebugDrivers) => {
    if (
      name === "openClick" ||
      name === "openTear" ||
      name === "close" ||
      name === "openDeck" ||
      name === "dismissDeck"
    ) {
      lastDriverRef.current = name;
      setReachedSteps([]);
      setCurrentStepIndex(-1);
    }
    driversRef.current[name]?.();
  }, []);

  const replayStep = useCallback(() => {
    // Best-effort: deepen the slow-mo and re-run the last driven phase so the
    // just-finished motion can be watched again, slower. (Re-running a single
    // mid-chain step in isolation isn't possible without re-driving the phase.)
    const deeper = Math.max(0.05, speedRef.current / 2);
    setSpeed(deeper);
    const last = lastDriverRef.current;
    reset();
    if (last) {
      // Let reset() flush before re-driving.
      Promise.resolve().then(() => driversRef.current[last]?.());
    }
  }, [reset, setSpeed]);

  // The --debug-speed CSS variable drives the compositor keyframes (shimmer /
  // arrow), which run off framer's clock and need their own lever. Set on the
  // prototype root only while enabled; unset restores the `,1` fallback.
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty("--debug-speed", String(speed));
    } else {
      root.style.removeProperty("--debug-speed");
    }
    return () => {
      root.style.removeProperty("--debug-speed");
    };
  }, [enabled, speed]);

  const machineSnapshot = useMemo(
    () =>
      buildAnimationMachineSnapshot(machineRuntime, {
        enabled,
        mode,
        pausedAtStep,
        reachedSteps,
        currentStepIndex,
      }),
    [machineRuntime, enabled, mode, pausedAtStep, reachedSteps, currentStepIndex]
  );

  const readout = useMemo<DebugReadout>(
    () => ({ ...legacyReadout, machine: machineSnapshot }),
    [legacyReadout, machineSnapshot]
  );

  const value = useMemo<DebugContextValue>(
    () => ({
      enabled,
      speed,
      mode,
      pausedAtStep,
      reachedSteps,
      currentStepIndex,
      readout,
      gate,
      mark: markReached,
      scaleT,
      report,
      isStepping,
      setEnabled,
      setSpeed,
      setMode,
      advance,
      replayStep,
      reset,
      registerDrivers,
      drive,
    }),
    [
      enabled,
      speed,
      mode,
      pausedAtStep,
      reachedSteps,
      currentStepIndex,
      readout,
      gate,
      markReached,
      scaleT,
      report,
      isStepping,
      setEnabled,
      setSpeed,
      setMode,
      advance,
      replayStep,
      reset,
      registerDrivers,
      drive,
    ]
  );

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
}
