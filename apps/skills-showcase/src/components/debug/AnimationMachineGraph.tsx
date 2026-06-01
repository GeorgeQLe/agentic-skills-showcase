"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  ANIMATION_MACHINE_MODEL,
  type AnimationMachineNode,
  type AnimationMachineSnapshot,
  type AnimationMachineTransition,
} from "./animationMachine";

export const STATE_MACHINE_GRAPH_MODEL = ANIMATION_MACHINE_MODEL;

const NODE_W = 116;
const NODE_H = 42;
const VIEWBOX_W = 1600;
const VIEWBOX_H = 620;

const COLORS = {
  bg: "#0d1117",
  surface: "#161b22",
  lane: "#111827",
  border: "#30363d",
  text: "#c9d1d9",
  muted: "#8b949e",
  active: "#58a6ff",
  reached: "#3fb950",
  paused: "#d29922",
  apex: "#bc8cff",
  blocked: "#f85149",
  reset: "#8b949e",
};

interface AnimationMachineGraphProps {
  snapshot: AnimationMachineSnapshot;
}

export default function AnimationMachineGraph({ snapshot }: AnimationMachineGraphProps) {
  const nodeById = useMemo(() => {
    return new Map(STATE_MACHINE_GRAPH_MODEL.nodes.map((node) => [node.id, node]));
  }, []);
  const reachedSteps = useMemo(
    () => new Set(snapshot.debug.reachedSteps),
    [snapshot.debug.reachedSteps]
  );
  const initialSelected =
    snapshot.activeNodeIds[0] ??
    snapshot.resetNodeIds[0] ??
    STATE_MACHINE_GRAPH_MODEL.nodes[0]?.id ??
    "";
  const [selectedNodeId, setSelectedNodeId] = useState(initialSelected);
  const selectedNode = nodeById.get(selectedNodeId) ?? STATE_MACHINE_GRAPH_MODEL.nodes[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        aria-label="Animation state machine graph"
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          background: "#0b1017",
          overflowX: "auto",
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width={VIEWBOX_W}
          height={VIEWBOX_H}
          style={{ display: "block", maxWidth: "none" }}
        >
          <defs>
            <marker
              id="machine-arrow"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0,0 L9,4.5 L0,9 z" fill={COLORS.muted} />
            </marker>
            <marker
              id="machine-arrow-active"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0,0 L9,4.5 L0,9 z" fill={COLORS.reached} />
            </marker>
            <marker
              id="machine-arrow-paused"
              markerWidth="9"
              markerHeight="9"
              refX="8"
              refY="4.5"
              orient="auto"
            >
              <path d="M0,0 L9,4.5 L0,9 z" fill={COLORS.paused} />
            </marker>
          </defs>

          <rect width={VIEWBOX_W} height={VIEWBOX_H} fill={COLORS.bg} />

          {STATE_MACHINE_GRAPH_MODEL.lanes.map((lane) => (
            <g key={lane.id}>
              <rect
                x={12}
                y={lane.y}
                width={VIEWBOX_W - 24}
                height={92}
                rx={8}
                fill={COLORS.lane}
                stroke={COLORS.border}
              />
              <text
                x={24}
                y={lane.y + 20}
                fill={COLORS.muted}
                fontSize={13}
                fontWeight={700}
              >
                {lane.label}
              </text>
            </g>
          ))}

          {STATE_MACHINE_GRAPH_MODEL.transitions.map((transition) => {
            const from = nodeById.get(transition.from);
            const to = nodeById.get(transition.to);
            if (!from || !to) return null;

            return (
              <TransitionPath
                key={transition.id}
                transition={transition}
                from={from}
                to={to}
                snapshot={snapshot}
                reachedSteps={reachedSteps}
              />
            );
          })}

          {STATE_MACHINE_GRAPH_MODEL.nodes.map((node) => (
            <MachineNode
              key={node.id}
              node={node}
              snapshot={snapshot}
              reachedSteps={reachedSteps}
              selected={selectedNode?.id === node.id}
              onSelect={() => setSelectedNodeId(node.id)}
            />
          ))}
        </svg>
      </div>

      <div style={legendStyle}>
        <LegendSwatch color={COLORS.active} label="active" />
        <LegendSwatch color={COLORS.reached} label="reached" />
        <LegendSwatch color={COLORS.paused} label="paused" />
        <LegendSwatch color={COLORS.apex} label="apex" />
        <LegendSwatch color={COLORS.blocked} label="blocked" />
        <LegendSwatch color={COLORS.reset} label="reset" />
      </div>

      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          snapshot={snapshot}
          transitions={STATE_MACHINE_GRAPH_MODEL.transitions}
        />
      )}
    </div>
  );
}

function TransitionPath({
  transition,
  from,
  to,
  snapshot,
  reachedSteps,
}: {
  transition: AnimationMachineTransition;
  from: AnimationMachineNode;
  to: AnimationMachineNode;
  snapshot: AnimationMachineSnapshot;
  reachedSteps: Set<string>;
}) {
  const fromX = from.x + NODE_W / 2;
  const fromY = from.y + NODE_H / 2;
  const toX = to.x + NODE_W / 2;
  const toY = to.y + NODE_H / 2;
  const midX = (fromX + toX) / 2;
  const curveY = fromY === toY ? fromY - 24 : (fromY + toY) / 2;
  const path =
    fromY === toY
      ? `M ${fromX} ${fromY} C ${midX} ${curveY}, ${midX} ${curveY}, ${toX} ${toY}`
      : `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  const paused = transition.stepId === snapshot.debug.pausedAtStep;
  const reached = transition.stepId ? reachedSteps.has(transition.stepId) : false;
  const active = snapshot.activeTransitionIds.includes(transition.id);
  const color = paused
    ? COLORS.paused
    : active || reached
      ? COLORS.reached
      : COLORS.muted;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={paused ? 3 : active || reached ? 2.4 : 1.2}
        strokeOpacity={paused || active || reached ? 0.95 : 0.42}
        markerEnd={
          paused
            ? "url(#machine-arrow-paused)"
            : active || reached
              ? "url(#machine-arrow-active)"
              : "url(#machine-arrow)"
        }
      />
      {(paused || active || reached) && (
        <text x={midX + 6} y={curveY - 6} fill={color} fontSize={10} fontWeight={700}>
          {transition.trigger}
        </text>
      )}
    </g>
  );
}

function MachineNode({
  node,
  snapshot,
  reachedSteps,
  selected,
  onSelect,
}: {
  node: AnimationMachineNode;
  snapshot: AnimationMachineSnapshot;
  reachedSteps: Set<string>;
  selected: boolean;
  onSelect: () => void;
}) {
  const paused = node.stepId === snapshot.debug.pausedAtStep;
  const reached = node.stepId ? reachedSteps.has(node.stepId) : false;
  const active = snapshot.activeNodeIds.includes(node.id);
  const blocked = snapshot.blockedNodeIds.includes(node.id);
  const reset = snapshot.resetNodeIds.includes(node.id);
  const stroke = blocked
    ? COLORS.blocked
    : paused
      ? COLORS.paused
      : node.apex
        ? COLORS.apex
        : active
          ? COLORS.active
          : reached
            ? COLORS.reached
            : reset
              ? COLORS.reset
              : COLORS.border;
  const fill = blocked
    ? "#2a1116"
    : paused
      ? "#30240f"
      : active
        ? "#10263a"
        : reached
          ? "#102818"
          : reset
            ? "#151b23"
            : COLORS.surface;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={node.label}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        fill={fill}
        stroke={selected ? "#ffffff" : stroke}
        strokeWidth={selected || paused || active || blocked ? 2 : 1}
      />
      <text x={node.x + 8} y={node.y + 17} fill="#ffffff" fontSize={11} fontWeight={700}>
        {node.label}
      </text>
      <text x={node.x + 8} y={node.y + 31} fill={COLORS.muted} fontSize={9}>
        {node.kind}
        {node.apex ? " · apex" : ""}
      </text>
    </g>
  );
}

function NodeDetails({
  node,
  snapshot,
  transitions,
}: {
  node: AnimationMachineNode;
  snapshot: AnimationMachineSnapshot;
  transitions: AnimationMachineTransition[];
}) {
  const relatedTransitions = transitions.filter(
    (transition) => transition.from === node.id || transition.to === node.id
  );

  return (
    <div style={detailStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong style={{ color: "#ffffff" }}>{node.label}</strong>
        <span style={{ color: node.apex ? COLORS.paused : COLORS.muted }}>{node.lane}</span>
      </div>
      <div style={{ color: COLORS.muted, marginTop: 4 }}>{node.description}</div>
      {node.trackedFields.length > 0 && (
        <div style={{ marginTop: 8, display: "grid", gap: 3 }}>
          {node.trackedFields.map((field) => (
            <div key={field} style={readoutRowStyle}>
              <span style={{ color: COLORS.muted }}>{field}</span>
              <span style={{ color: COLORS.text, textAlign: "right" }}>
                {formatValue(readSnapshotField(snapshot, field))}
              </span>
            </div>
          ))}
        </div>
      )}
      {relatedTransitions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: COLORS.muted, marginBottom: 3 }}>transitions</div>
          <div style={{ display: "grid", gap: 3 }}>
            {relatedTransitions.map((transition) => (
              <div key={transition.id} style={{ color: COLORS.text }}>
                <span style={{ color: COLORS.paused }}>{transition.trigger}</span>
                <span style={{ color: COLORS.muted }}> · {transition.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

function readSnapshotField(snapshot: AnimationMachineSnapshot, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, snapshot);
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const legendStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 10px",
  color: COLORS.muted,
  fontSize: 10,
};

const detailStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.surface,
  padding: 8,
  color: COLORS.text,
};

const readoutRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
};
