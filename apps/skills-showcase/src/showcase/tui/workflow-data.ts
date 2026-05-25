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
        label: "User goal",
        body: command.startsWith("$")
          ? `Use ${command} to move this workflow step from intent to evidence.`
          : `Use ${command} to complete this workflow step with visible proof.`,
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
    key: "market-discovery",
    coordinate: "LAB-01",
    badge: "alignment",
    command: "$concept-exploration",
    title: "Market Discovery",
    subtitle: "Gather market evidence before any design work.",
    copy: "A rough product idea becomes a bounded concept brief, ICP profile, competitive landscape, and user journey map — all before a single pixel is designed.",
    when: "Use this at the start of any new product or feature initiative when the market question is still open.",
    changes: ["concept briefs", "ICP profiles", "competitive analysis docs", "journey maps"],
    artifacts: ["concept brief", "ICP document", "competitive matrix", "journey map"],
    failure: "If sources are missing or contradictory, mark the evidence gap and route to manual research instead of fabricating market claims.",
    steps: [
      step("Explore concept", "$concept-exploration", "Rough idea becomes a bounded concept brief.", "concept-exploration"),
      step("Select pack", "$pack", "Business-discovery pack loads market workflows.", "pack"),
      step("Define ICP", "ICP interview", "Ideal customer profile crystallizes from evidence."),
      step("Analyze competition", "competitive scan", "Landscape gaps and positioning opportunities surface."),
      step("Map journey", "journey map", "User touchpoints and pain points become explicit.")
    ]
  },
  {
    key: "value-strategy",
    coordinate: "LAB-02",
    badge: "alignment",
    command: "$feature-interview",
    title: "Value & Strategy",
    subtitle: "Validate the business model before UX.",
    copy: "Value propositions, positioning, lean canvas, success metrics, and monetization strategy are locked before any interface work begins.",
    when: "Use this after market discovery confirms a real opportunity and before committing to UX exploration.",
    changes: ["value prop canvas", "positioning docs", "lean canvas", "metrics definitions", "monetization model"],
    artifacts: ["value proposition", "positioning statement", "lean canvas", "metric targets", "revenue model"],
    failure: "If value prop doesn't survive competitive positioning, loop back to market discovery rather than forcing a weak position into design.",
    steps: [
      step("Value prop", "value-prop canvas", "Core value articulated against ICP needs."),
      step("Positioning", "positioning statement", "Market slot claimed with evidence."),
      step("Lean canvas", "lean canvas", "Business model on one page with assumptions explicit."),
      step("Metrics", "success metrics", "Leading and lagging indicators defined."),
      step("Monetization", "revenue model", "Pricing and packaging validated against ICP willingness.")
    ]
  },
  {
    key: "go-to-market",
    coordinate: "LAB-03",
    badge: "alignment",
    command: "$research-roadmap",
    title: "Go-to-Market",
    subtitle: "Plan distribution and growth before building.",
    copy: "Hook model, go-to-market strategy, and growth loops are designed so the product ships with a distribution plan, not an afterthought.",
    when: "Use this after value and strategy lock when the question shifts from 'what to build' to 'how it reaches users'.",
    changes: ["hook model docs", "GTM strategy", "growth model"],
    artifacts: ["hook model", "GTM plan", "growth loop diagram"],
    failure: "If no viable distribution channel emerges, revisit positioning or ICP before proceeding to design.",
    steps: [
      step("Hook model", "hook analysis", "Trigger, action, reward, investment mapped."),
      step("GTM strategy", "GTM plan", "Launch channels and sequencing documented."),
      step("Growth model", "growth loops", "Organic and paid loops with metrics targets.")
    ]
  },
  {
    key: "ux-ui-design",
    coordinate: "LAB-04",
    badge: "design",
    command: "$ux-variations",
    title: "UX & UI Design",
    subtitle: "Explore layouts then lock a buildable spec.",
    copy: "Multiple UX layout explorations are generated, evaluated, and converged into a locked UI specification ready for prototype implementation.",
    when: "Use this after alignment phases confirm what to build and before any prototype code is written.",
    changes: ["UX variation docs", "UI interview transcript", "locked design spec"],
    artifacts: ["layout explorations", "UI specification", "component inventory", "responsive rules"],
    failure: "If no variation satisfies the ICP journey, generate additional explorations before locking rather than shipping a compromised layout.",
    steps: [
      step("UX variations", "$ux-variations", "Multiple layout approaches explored.", "ux-variations"),
      step("UI interview", "$ui-interview", "Page-by-page specification extracted.", "ui-interview"),
      step("Design lock", "spec freeze", "Buildable UI spec committed as implementation contract.")
    ]
  },
  {
    key: "prototype-test",
    coordinate: "LAB-05",
    badge: "prototype",
    command: "$prototype",
    title: "Prototype & Test",
    subtitle: "Build clickable proof then validate with users.",
    copy: "A clickable prototype is built from the locked design, tested with real users, and consolidated into a validated implementation reference.",
    when: "Use this after design lock when the UI spec needs real-world validation before production specification.",
    changes: ["prototype source", "UAT results", "variant evaluations", "consolidated prototype"],
    artifacts: ["working prototype", "test session recordings", "variant scores", "validated reference build"],
    failure: "If UAT reveals fundamental UX issues, loop back to design variations rather than patching the prototype into production.",
    steps: [
      step("Prototype", "$prototype", "Clickable implementation built from locked spec.", "prototype"),
      step("UAT", "$uat", "Real user acceptance testing against prototype.", "uat"),
      step("Evaluate variants", "$consolidate-variations", "Competing approaches scored and ranked.", "consolidate-variations"),
      step("Consolidate", "final build", "Validated prototype becomes the implementation reference.")
    ]
  },
  {
    key: "specification",
    coordinate: "LAB-06",
    badge: "spec",
    command: "$spec-interview",
    title: "Specification",
    subtitle: "Extract production specs from validated prototype.",
    copy: "The consolidated prototype is walked through screen by screen to produce implementation-ready production specifications and a research roadmap for remaining unknowns.",
    when: "Use this after prototype validation confirms the UX works and before writing production code.",
    changes: ["specs/*.md", "research roadmap", "tasks/roadmap.md"],
    artifacts: ["production spec", "post-prototype research queue", "post-spec research queue", "implementation roadmap"],
    failure: "If the spec interview reveals unvalidated assumptions, route them to research before encoding them as accepted scope.",
    steps: [
      step("Spec interview", "$spec-interview", "Prototype walked through screen by screen for production spec.", "spec-interview"),
      step("Post-prototype research", "$research-roadmap --post-prototype", "Unknowns surfaced during prototype become research tasks.", "research-roadmap"),
      step("Post-spec research", "$research-roadmap --post-spec", "Spec gaps become bounded research before implementation.", "research-roadmap")
    ]
  },
  {
    key: "production",
    coordinate: "LAB-07",
    badge: "shipping",
    command: "$run",
    title: "Production",
    subtitle: "Ship phased work from validated spec.",
    copy: "The validated specification becomes a phased roadmap, each phase is planned and executed with validation gates, and shipped commits land on the primary branch with proof.",
    when: "Use this after specification is complete and all research gaps are resolved.",
    changes: ["tasks/roadmap.md", "tasks/todo.md", "source files", "tasks/history.md"],
    artifacts: ["phase plan", "execution transcript", "validation output", "shipping commit", "history entry"],
    failure: "If validation fails during a phase, fix at source and rerun; do not commit known regressions or skip proof gates.",
    steps: [
      step("Roadmap", "$roadmap", "Spec becomes phased implementation plan.", "roadmap"),
      step("Plan phase", "$plan-phase", "Single phase broken into implementation steps."),
      step("Run", "$run", "One step executes with validation gates.", "run"),
      step("Ship", "$ship", "History, commit, and push land on primary.", "ship"),
      step("Close", "$ship-end", "Session wrapped, docs updated, next phase queued.")
    ]
  }
];

export const workflowByKey = workflows.reduce<Record<string, Workflow>>((map, w) => {
  map[w.key] = w;
  return map;
}, {});
