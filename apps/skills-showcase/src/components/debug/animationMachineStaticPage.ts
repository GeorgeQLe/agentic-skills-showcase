/**
 * animationMachineStaticPage.ts - self-contained HTML reference page generator.
 *
 * Reads the same AnimationMachineModel used by the live debug panel so the
 * static docs can never drift from the code. Tests compare the embedded JSON
 * blob with the TypeScript export to enforce this invariant.
 */
import {
  ANIMATION_MACHINE_MODEL,
  type AnimationMachineModel,
  type AnimationMachineNode,
  type AnimationMachineTransition,
} from "./animationMachine";

const NODE_W = 116;
const NODE_H = 42;
const VIEWBOX_W = 1600;
const VIEWBOX_H = 620;

export function renderAnimationStateMachineReferencePage(
  model: AnimationMachineModel = ANIMATION_MACHINE_MODEL
): string {
  const stepRows = [...model.openSteps, ...model.closeSteps]
    .map(
      (step) => `<tr>
        <td><code>${escapeHtml(step.id)}</code></td>
        <td>${escapeHtml(step.label)}</td>
        <td>${escapeHtml(step.phase)}</td>
        <td>${step.apex ? '<span class="badge apex">apex</span>' : ""}</td>
        <td>${escapeHtml(step.boundary)}</td>
      </tr>`
    )
    .join("\n");
  const transitionRows = model.transitions
    .map(
      (transition) => `<tr>
        <td><code>${escapeHtml(transition.id)}</code></td>
        <td><code>${escapeHtml(transition.from)}</code> -> <code>${escapeHtml(transition.to)}</code></td>
        <td>${escapeHtml(transition.trigger)}</td>
        <td>${escapeHtml(transition.source)}</td>
        <td>${escapeHtml(transition.guard ?? "")}</td>
        <td>${escapeHtml(transition.effect ?? "")}</td>
      </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Animation State Machine - Pack Drawer Prototype</title>
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text: #c9d1d9;
    --text-muted: #8b949e;
    --accent: #58a6ff;
    --green: #3fb950;
    --red: #f85149;
    --orange: #d29922;
    --purple: #bc8cff;
    --code-bg: #1c2128;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  main { max-width: 1180px; margin: 0 auto; padding: 28px 22px 80px; overflow-wrap: break-word; }
  h1, h2, h3 { color: #fff; line-height: 1.2; }
  h1 { font-size: 2rem; margin: 0 0 8px; }
  h2 { color: var(--accent); margin-top: 34px; }
  a { color: var(--accent); }
  code { background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; color: #e6edf3; }
  .muted { color: var(--text-muted); }
  .toc, .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; }
  .toc ul { columns: 2; padding-left: 20px; margin: 8px 0 0; }
  .graph-shell { border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; background: #0b1017; }
  svg { display: block; max-width: none; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { border: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: var(--surface); color: #fff; }
  tr:nth-child(even) td { background: #11161d; }
  .table-wrap { overflow-x: auto; }
  .badge { display: inline-block; border: 1px solid var(--border); border-radius: 999px; padding: 1px 8px; font-size: 0.75rem; color: var(--text-muted); }
  .badge.apex { color: var(--orange); border-color: var(--orange); }
  .legend { display: flex; flex-wrap: wrap; gap: 8px 14px; color: var(--text-muted); font-size: 0.85rem; margin-top: 10px; }
  .dot { width: 9px; height: 9px; border-radius: 999px; display: inline-block; margin-right: 5px; }
  @media (max-width: 860px) {
    .toc ul { columns: 1; }
    main { padding: 22px 14px 64px; }
  }
</style>
</head>
<body>
<main>
  <header>
    <p class="muted">Static reference generated from <code>src/components/debug/animationMachine.ts</code>.</p>
    <h1>Animation State Machine - Pack Drawer Prototype</h1>
    <p>The live <code>/prototype</code> debug panel and this static page share the same canonical model export. The model maps page state, SealedPack refs and motion values, BottomSheet state, PackOpener collapse internals, and every existing debug gate from <code>OPEN_STEPS</code> / <code>CLOSE_STEPS</code>.</p>
  </header>

  <section class="toc" id="toc">
    <strong>Table of Contents</strong>
    <ul>
      <li><a href="#graph">State Machine Graph</a></li>
      <li><a href="#steps">Debug Step Boundaries</a></li>
      <li><a href="#transitions">Transitions</a></li>
      <li><a href="#model-data">Embedded Model Data</a></li>
      <li><a href="animation-audit-pack-drawer.html">Animation Audit</a></li>
    </ul>
  </section>

  <section id="graph">
    <h2>State Machine Graph</h2>
    <p class="muted">Lanes match runtime owners: Page, SealedPack, BottomSheet, PackOpener, and Debug Gates. Purple nodes are apex gates; orange transition labels identify close-path boundaries that can be paused in stepped mode.</p>
    <div class="graph-shell">
      ${renderSvg(model)}
    </div>
    <div class="legend">
      <span><span class="dot" style="background:var(--accent)"></span>runtime state</span>
      <span><span class="dot" style="background:var(--green)"></span>debug step</span>
      <span><span class="dot" style="background:var(--orange)"></span>close transition</span>
      <span><span class="dot" style="background:var(--purple)"></span>apex</span>
      <span><span class="dot" style="background:var(--text-muted)"></span>reset</span>
    </div>
  </section>

  <section id="steps">
    <h2>Debug Step Boundaries</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Step id</th><th>Label</th><th>Phase</th><th>Apex</th><th>Boundary</th></tr></thead>
        <tbody>
${stepRows}
        </tbody>
      </table>
    </div>
  </section>

  <section id="transitions">
    <h2>Transitions</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Transition id</th><th>Endpoints</th><th>Trigger</th><th>Source</th><th>Guard</th><th>Effect</th></tr></thead>
        <tbody>
${transitionRows}
        </tbody>
      </table>
    </div>
  </section>

  <section id="model-data">
    <h2>Embedded Model Data</h2>
    <p class="muted">Tests compare this JSON with the TypeScript export to prevent static/live drift.</p>
    <script id="animation-machine-data" type="application/json" data-model-source="src/components/debug/animationMachine.ts">${escapeScriptJson(JSON.stringify(model, null, 2))}</script>
    <pre><code>${escapeHtml(JSON.stringify(model, null, 2))}</code></pre>
  </section>
</main>
</body>
</html>
`;
}

function renderSvg(model: AnimationMachineModel): string {
  const nodeById = new Map(model.nodes.map((node) => [node.id, node]));
  const lanes = model.lanes
    .map(
      (lane) => `<g>
        <rect x="12" y="${lane.y}" width="${VIEWBOX_W - 24}" height="92" rx="8" fill="#111827" stroke="#30363d" />
        <text x="24" y="${lane.y + 20}" fill="#8b949e" font-size="13" font-weight="700">${escapeHtml(lane.label)}</text>
      </g>`
    )
    .join("\n");
  const transitions = model.transitions
    .map((transition) => {
      const from = nodeById.get(transition.from);
      const to = nodeById.get(transition.to);
      if (!from || !to) return "";
      return renderTransition(transition, from, to);
    })
    .join("\n");
  const nodes = model.nodes.map(renderNode).join("\n");

  return `<svg viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" width="${VIEWBOX_W}" height="${VIEWBOX_H}" role="img" aria-label="Pack drawer animation state machine">
  <defs>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#8b949e" /></marker>
    <marker id="arrow-close" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#d29922" /></marker>
  </defs>
  <rect width="${VIEWBOX_W}" height="${VIEWBOX_H}" fill="#0d1117" />
  ${lanes}
  ${transitions}
  ${nodes}
</svg>`;
}

function renderTransition(
  transition: AnimationMachineTransition,
  from: AnimationMachineNode,
  to: AnimationMachineNode
): string {
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
  const close = transition.stepId?.startsWith("collapse") ||
    transition.stepId === "close-trigger" ||
    transition.stepId === "drawer-teardown" ||
    transition.stepId === "sheet-exit" ||
    transition.stepId === "layout-morph-out" ||
    transition.stepId === "drop-elevation";
  const color = close ? "#d29922" : "#8b949e";

  return `<g>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${close ? 1.9 : 1.1}" stroke-opacity="${close ? 0.82 : 0.44}" marker-end="url(#${close ? "arrow-close" : "arrow"})" />
    ${close ? `<text x="${midX + 6}" y="${curveY - 6}" fill="${color}" font-size="10" font-weight="700">${escapeHtml(transition.id)}</text>` : ""}
  </g>`;
}

function renderNode(node: AnimationMachineNode): string {
  const fill = node.apex ? "#241c33" : node.kind === "gate" ? "#102818" : "#161b22";
  const stroke = node.apex ? "#bc8cff" : node.phase === "reset" ? "#8b949e" : node.kind === "gate" ? "#3fb950" : "#58a6ff";
  return `<g>
    <rect x="${node.x}" y="${node.y}" width="${NODE_W}" height="${NODE_H}" rx="8" fill="${fill}" stroke="${stroke}" />
    <text x="${node.x + 8}" y="${node.y + 17}" fill="#fff" font-size="11" font-weight="700">${escapeHtml(node.label)}</text>
    <text x="${node.x + 8}" y="${node.y + 31}" fill="#8b949e" font-size="9">${escapeHtml(node.kind)}${node.apex ? " - apex" : ""}</text>
  </g>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeScriptJson(value: string): string {
  return value.replace(/</g, "\\u003c");
}
