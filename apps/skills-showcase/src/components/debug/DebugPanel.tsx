/**
 * DebugPanel.tsx - fixed-position debug overlay for /prototype.
 *
 * Controls animation speed, stepping mode, and displays live state from the
 * animation machine. Designed to stay out of the way during normal use (a
 * single gear button) and expand into a full instrumentation panel on demand.
 */
"use client";

import { useState } from "react";
import { useDebug } from "./DebugController";
import { ALL_STEPS, OPEN_STEPS, CLOSE_STEPS, type StepDef } from "./steps";
// Surfaced in the panel so the chosen slow-mo approach is visible at a glance
// and future devs know the manual clock was evaluated and rejected - see
// manualClock.ts for the full investigation log.
import { SLOWMO_MECHANISM } from "./manualClock";
import AnimationMachineGraph from "./AnimationMachineGraph";

const SPEED_PRESETS = [1, 0.5, 0.25, 0.1];

const PANEL_BG = "#0d1117";
const SURFACE = "#161b22";
const BORDER = "#30363d";
const TEXT = "#c9d1d9";
const MUTED = "#8b949e";
const ACCENT = "#58a6ff";
const GREEN = "#3fb950";
const ORANGE = "#d29922";
const PURPLE = "#bc8cff";

export default function DebugPanel() {
  const dbg = useDebug();
  const [machineExpanded, setMachineExpanded] = useState(() =>
    typeof window === "undefined" || typeof window.matchMedia !== "function"
      ? true
      : !window.matchMedia("(max-width: 640px)").matches
  );

  if (!dbg.enabled) {
    return (
      <button
        onClick={() => dbg.setEnabled(true)}
        title="Open animation debug harness"
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 100,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          background: SURFACE,
          color: MUTED,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ⚙
      </button>
    );
  }

  const parked = dbg.pausedAtStep !== null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 100,
        width: "min(92vw, 460px)",
        maxHeight: "85vh",
        overflowY: "auto",
        borderRadius: 12,
        border: `1px solid ${BORDER}`,
        background: PANEL_BG,
        color: TEXT,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: `1px solid ${BORDER}`,
          background: SURFACE,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <strong style={{ color: ACCENT }}>Animation Debug</strong>
        <button
          onClick={() => dbg.setEnabled(false)}
          title="Close (disable harness)"
          style={iconBtn}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Speed */}
        <Section title="Speed">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SPEED_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => dbg.setSpeed(s)}
                style={{
                  ...chip,
                  background: dbg.speed === s ? ACCENT : SURFACE,
                  color: dbg.speed === s ? "#0d1117" : TEXT,
                  borderColor: dbg.speed === s ? ACCENT : BORDER,
                }}
              >
                {s}x
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={dbg.speed}
            onChange={(e) => dbg.setSpeed(Number(e.target.value))}
            style={{ width: "100%", marginTop: 8, accentColor: ACCENT }}
          />
          <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>
            {dbg.speed}x · slow-mo via {SLOWMO_MECHANISM}
          </div>
        </Section>

        {/* Mode */}
        <Section title="Mode">
          <div style={{ display: "flex", gap: 6 }}>
            {(["auto", "stepped"] as const).map((m) => (
              <button
                key={m}
                onClick={() => dbg.setMode(m)}
                style={{
                  ...chip,
                  flex: 1,
                  background: dbg.mode === m ? PURPLE : SURFACE,
                  color: dbg.mode === m ? "#0d1117" : TEXT,
                  borderColor: dbg.mode === m ? PURPLE : BORDER,
                }}
              >
                {m === "auto" ? "▶ Auto" : "⏸ Stepped"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              onClick={() => dbg.advance()}
              disabled={!parked}
              style={{
                ...chip,
                flex: 1,
                opacity: parked ? 1 : 0.4,
                cursor: parked ? "pointer" : "not-allowed",
                background: parked ? GREEN : SURFACE,
                color: parked ? "#0d1117" : MUTED,
                borderColor: parked ? GREEN : BORDER,
              }}
            >
              Step ⏭
            </button>
            <button onClick={() => dbg.replayStep()} style={{ ...chip, flex: 1 }}>
              Replay ↻
            </button>
            <button onClick={() => dbg.reset()} style={{ ...chip, flex: 1 }}>
              Reset ⟲
            </button>
          </div>
        </Section>

        {/* Drivers */}
        <Section title="Drive sequence (pack 0)">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => dbg.drive("openClick")} style={{ ...chip, flex: 1 }}>
              Open (click)
            </button>
            <button onClick={() => dbg.drive("openTear")} style={{ ...chip, flex: 1 }}>
              Open (tear)
            </button>
            <button onClick={() => dbg.drive("close")} style={{ ...chip, flex: 1 }}>
              Close
            </button>
          </div>
        </Section>

        {/* Live readout */}
        <Section title="Live state">
          <Readout label="step" value={dbg.pausedAtStep ?? "(running)"} highlight={parked} />
          <Readout label="cardElevated" value={String(dbg.readout.cardElevated)} highlight={dbg.readout.cardElevated} />
          <Readout
            label="card zIndex"
            value={String(dbg.readout.cardZIndex)}
            highlight={dbg.readout.cardZIndex === 60}
          />
          <Readout
            label="isClosingFromDrawer"
            value={String(dbg.readout.isClosingFromDrawer)}
            highlight={dbg.readout.isClosingFromDrawer}
          />
          <Readout label="isDrawerOpen" value={String(dbg.readout.isDrawerOpen)} />
          <Readout label="speed" value={`${dbg.speed}x`} />
        </Section>

        {/* State machine */}
        <Section title="State machine">
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button
              onClick={() => setMachineExpanded((value) => !value)}
              style={{ ...chip, flex: 1 }}
            >
              {machineExpanded ? "Hide graph" : "Show graph"}
            </button>
            <span
              style={{
                ...chip,
                cursor: "default",
                color: dbg.pausedAtStep ? ORANGE : MUTED,
              }}
            >
              {dbg.pausedAtStep ?? "running"}
            </span>
          </div>
          <Readout
            label="reached"
            value={`${dbg.reachedSteps.length}/${ALL_STEPS.length}`}
            highlight={dbg.reachedSteps.length > 0}
          />
          <Readout
            label="active nodes"
            value={String(dbg.readout.machine.activeNodeIds.length)}
            highlight={dbg.readout.machine.activeNodeIds.length > 0}
          />
          <Readout
            label="active transitions"
            value={String(dbg.readout.machine.activeTransitionIds.length)}
            highlight={dbg.readout.machine.activeTransitionIds.length > 0}
          />
          {machineExpanded && (
            <div style={{ marginTop: 8 }}>
              <AnimationMachineGraph snapshot={dbg.readout.machine} />
            </div>
          )}
        </Section>

        {/* Timeline */}
        <Section title="Step timeline">
          <Timeline title="OPEN" steps={OPEN_STEPS} dbg={dbg} />
          <Timeline title="CLOSE" steps={CLOSE_STEPS} dbg={dbg} />
        </Section>
      </div>
    </div>
  );
}

function Timeline({
  title,
  steps,
  dbg,
}: {
  title: string;
  steps: StepDef[];
  dbg: ReturnType<typeof useDebug>;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: MUTED, fontSize: 10, letterSpacing: 0.5, marginBottom: 4 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {steps.map((s) => {
          const reached = dbg.reachedSteps.includes(s.id);
          const isPaused = dbg.pausedAtStep === s.id;
          return (
            <div
              key={s.id}
              title={s.boundary}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 6px",
                borderRadius: 4,
                background: isPaused ? "#1c2333" : "transparent",
                border: isPaused ? `1px solid ${ORANGE}` : "1px solid transparent",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isPaused ? ORANGE : reached ? GREEN : BORDER,
                }}
              />
              <span
                style={{
                  color: s.apex ? ORANGE : isPaused ? "#fff" : reached ? TEXT : MUTED,
                  fontWeight: s.apex || isPaused ? 700 : 400,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ color: ACCENT, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

function Readout({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: highlight ? ORANGE : TEXT, fontWeight: highlight ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}

const chip: React.CSSProperties = {
  padding: "5px 8px",
  borderRadius: 6,
  border: `1px solid ${BORDER}`,
  background: SURFACE,
  color: TEXT,
  cursor: "pointer",
  fontSize: 11,
  fontFamily: "inherit",
};

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: MUTED,
  cursor: "pointer",
  fontSize: 14,
};
