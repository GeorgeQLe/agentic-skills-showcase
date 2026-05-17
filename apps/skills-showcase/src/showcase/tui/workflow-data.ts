export interface WorkflowReplayBlock {
  label: string;
  body: string;
}

export interface WorkflowReplayReceipt {
  state: "benchmark" | "curated";
  label: string;
  body: string;
}

export interface WorkflowReplay {
  user: WorkflowReplayBlock;
  agent: WorkflowReplayBlock;
  terminal: WorkflowReplayBlock;
  artifact: WorkflowReplayBlock;
  receipt: WorkflowReplayReceipt;
}

export interface WorkflowStep {
  title: string;
  command: string;
  summary: string;
  skill?: string;
  replay: WorkflowReplay;
}

export interface Workflow {
  key: string;
  coordinate: string;
  badge: string;
  command: string;
  title: string;
  subtitle: string;
  copy: string;
  when: string;
  changes: string[];
  artifacts: string[];
  failure: string;
  steps: WorkflowStep[];
}

function step(title: string, command: string, summary: string, skill?: string): WorkflowStep {
  return {
    title,
    command,
    summary,
    skill,
    replay: {
      user: {
        label: "User",
        body: command.startsWith("$") ? `${command} for this workflow step.` : `Run ${command}.`,
      },
      agent: {
        label: "Agent",
        body: summary,
      },
      terminal: {
        label: "Terminal",
        body: `${command}\n${summary}`,
      },
      artifact: {
        label: "Result",
        body: summary,
      },
      receipt: {
        state: skill ? "benchmark" : "curated",
        label: skill ? "Benchmark receipt pending render" : "Curated scenario",
        body: skill
          ? "Benchmark evidence is attached by workflowBenchmarks when generated data includes this skill."
          : "No persisted benchmark receipt is attached to this step yet.",
      },
    },
  };
}

export const workflows: Workflow[] = [
  {
    key: "first",
    coordinate: "LAB-01",
    badge: "setup",
    command: "./install.sh",
    title: "First Successful Cycle",
    subtitle: "Install, select, validate, ship.",
    copy: "A new checkout gets installed, scoped, verified, and closed with a history-backed commit.",
    when: "Use this when a project needs the agentic-skills operating model for the first time or after a stale local setup.",
    changes: ["global and project skill links", ".agents/project.json", "tasks/todo.md", "tasks/history.md"],
    artifacts: ["install output", "pack status", "validation transcript", "shipping commit"],
    failure: "If install or validation fails, rerun the failed script, inspect missing links, and ship only after the task history and generated references agree.",
    steps: [
      step("Install", "./install.sh", "Global skill links refresh."),
      step("Select pack", "./scripts/pack.sh", "Project context narrows loaded workflows."),
      step("Plan", "$roadmap", "Task docs describe the next phase.", "roadmap"),
      step("Run", "$run", "One step executes with validation.", "run"),
      step("Ship", "git push", "History and commit land on primary.")
    ]
  },
  {
    key: "packs",
    coordinate: "LAB-02",
    badge: "planning",
    command: "$pack",
    title: "Pack Selection",
    subtitle: "Load only the workflows a project needs.",
    copy: "Project type routes to global foundations, focused domain packs, and overlays without crowding every session.",
    when: "Use this before roadmap work when a repo needs business, devtool, game, creator, monorepo, or kanban-specific workflows.",
    changes: [".agents/project.json", "project-local skill pack links", "pack status docs", "task recommendations"],
    artifacts: ["enabled pack list", "pack-specific commands", "compatibility alias notes", "context hygiene boundary"],
    failure: "If a pack is unavailable or ambiguous, keep the global workflow active and record the pack decision as a task-doc follow-up.",
    steps: [
      step("Detect shape", "repo context", "Project evidence sets the lane."),
      step("Choose core", "global/codex", "Shared planning and shipping stay loaded."),
      step("Add pack", "packs/*", "Domain skills become local context."),
      step("Overlay", "kanban/monorepo", "Execution style adapts without replacing core."),
      step("Verify", "list-packs", "Recommendation text matches enabled packs.")
    ]
  },
  {
    key: "ship",
    coordinate: "LAB-03",
    badge: "shipping",
    command: "$run",
    title: "Plan -> Run -> Ship",
    subtitle: "Turn one roadmap step into committed work.",
    copy: "The active todo becomes an execution plan, source change, validation record, history note, and direct-to-primary push.",
    when: "Use this for the next incomplete implementation step when the roadmap already has enough detail.",
    changes: ["target source files", "tasks/todo.md", "tasks/history.md", "generated proof assets when stale"],
    artifacts: ["quality gate manifest", "validation output", "history entry", "primary branch commit"],
    failure: "If validation fails, fix the source issue and rerun the failing command; do not commit known regressions.",
    steps: [
      step("Read todo", "tasks/todo.md", "The next unchecked item sets scope."),
      step("Plan", "update_plan", "Files, trade-offs, and tests are explicit."),
      step("Execute", "source diff", "Only the scoped change lands."),
      step("Validate", "tests/checks", "Warnings are fixed or recorded."),
      step("Ship", "commit + push", "History and next work are ready.", "ship")
    ]
  },
  {
    key: "spec",
    coordinate: "LAB-04",
    badge: "planning",
    command: "$spec-interview",
    title: "Spec -> Roadmap -> Implementation",
    subtitle: "Move from idea to executable tasks.",
    copy: "A rough feature idea becomes assumptions, a spec, a phased roadmap, and concrete implementation steps.",
    when: "Use this when the desired product behavior is real but the file-level work is still ambiguous.",
    changes: ["specs/*.md", "tasks/roadmap.md", "tasks/todo.md", "assumption and evidence notes"],
    artifacts: ["interview log", "implementation-ready spec", "phase plan", "verification strategy"],
    failure: "If evidence contradicts the idea, update assumptions before writing roadmap tasks; do not encode speculative work as accepted scope.",
    steps: [
      step("Idea", "user brief", "Intent and unknowns are separated."),
      step("Interview", "$spec-interview", "Assumptions become explicit.", "spec-interview"),
      step("Spec", "specs/*.md", "Behavior and constraints are written."),
      step("Roadmap", "$roadmap", "The work becomes phases.", "roadmap"),
      step("Implement", "$run", "A single phase step executes.", "run")
    ]
  },
  {
    key: "research",
    coordinate: "LAB-05",
    badge: "research",
    command: "$research-roadmap",
    title: "Research Chains",
    subtitle: "Produce evidence before product decisions.",
    copy: "Devtool, business, creator, and game research lanes gather source-backed artifacts before implementation work starts.",
    when: "Use this when a project needs market, platform, user, technical, or content evidence before committing to a feature.",
    changes: ["research directories", "evidence registers", "decision notes", "roadmap candidates"],
    artifacts: ["capability matrix", "dossier", "research queue", "prioritized next action"],
    failure: "If sources are missing or private, mark the evidence gap and route to manual collection instead of fabricating certainty.",
    steps: [
      step("Scope", "research brief", "The question is bounded."),
      step("Collect", "sources", "Evidence gets archived."),
      step("Synthesize", "analysis", "Claims cite artifacts."),
      step("Prioritize", "queue", "Next research or build step is ranked."),
      step("Route", "$feature-interview", "Good candidates become product work.", "feature-interview")
    ]
  },
  {
    key: "handoff",
    coordinate: "LAB-06",
    badge: "hybrid",
    command: "$run --execute-approved",
    title: "Hybrid Handoff",
    subtitle: "Plan in Claude, execute in Codex.",
    copy: "A Claude planning packet can hand one approved step to Codex while preserving scope, validation, and integration ownership.",
    when: "Use this when planning and execution happen in different agent surfaces but the step still needs a single shipping boundary.",
    changes: [".agents/approved-plan.json", "tasks/todo.md", "source files", "tasks/history.md"],
    artifacts: ["approved packet", "consumed approval record", "validation transcript", "shipping commit"],
    failure: "If the packet is stale, mode-mismatched, or missing `jq`, stop and fall back to the standard `$run` planning path.",
    steps: [
      step("Plan", "Claude", "Scope is approved elsewhere."),
      step("Packet", "approved-plan.json", "One step becomes executable."),
      step("Consume", "$run --execute-approved", "Codex records the handoff.", "run"),
      step("Integrate", "main agent", "Conflicts and docs stay owned here."),
      step("Ship", "primary branch", "The result lands with evidence.", "ship")
    ]
  },
  {
    key: "authoring",
    coordinate: "LAB-07",
    badge: "authoring",
    command: "$create-agentic-skill",
    title: "Skill Authoring",
    subtitle: "Create or update workflow contracts.",
    copy: "New repo-managed skills are scaffolded, mirrored where needed, validated, installed, and reflected in showcase data.",
    when: "Use this when a repeated workflow deserves a durable skill instead of another ad hoc prompt.",
    changes: ["global/*/<skill>/SKILL.md", "agents/openai.yaml", "docs/skills-reference.md", "showcase generated assets"],
    artifacts: ["skill contract", "metadata", "routing docs", "fresh catalog/proof data"],
    failure: "If validation finds stale metadata or broken references, fix the skill contract before installing or shipping it.",
    steps: [
      step("Name", "workflow gap", "The repeated behavior is concrete."),
      step("Scaffold", "SKILL.md", "Contract and metadata are written."),
      step("Mirror", "Claude/Codex", "Surfaces stay aligned when needed."),
      step("Validate", "skill scripts", "References and routing pass."),
      step("Refresh", "showcase data", "Public catalog reflects the change.")
    ]
  },
  {
    key: "validation",
    coordinate: "LAB-08",
    badge: "validation",
    command: "$debug",
    title: "Validation / Troubleshooting",
    subtitle: "Stop drift before shipping.",
    copy: "A failed check becomes a bounded investigation, source fix, rerun, and documented residual risk.",
    when: "Use this when tests, generated-data freshness, skill audits, or browser checks expose a real regression.",
    changes: ["failing source boundary", "validation script output", "tasks/history.md", "tasks/lessons.md after corrections"],
    artifacts: ["root cause", "fixed diff", "passing rerun", "accepted residual risk if any"],
    failure: "If the failure cannot be fixed confidently, stop before commit and report the exact command output and next decision.",
    steps: [
      step("Fail", "check output", "The problem is reproduced."),
      step("Trace", "$debug", "Root cause is found.", "debug"),
      step("Fix", "minimal diff", "The behavior changes at the source."),
      step("Rerun", "failing command", "The proof is executable."),
      step("Record", "history/lessons", "The pattern is not lost.")
    ]
  }
];

export const workflowByKey = workflows.reduce<Record<string, Workflow>>((map, w) => {
  map[w.key] = w;
  return map;
}, {});
