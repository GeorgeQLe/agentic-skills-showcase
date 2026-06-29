export interface BenchmarkAgent {
  agent: string;
  passRate: string;
  latencyP50?: string;
  totalCost?: string;
}

export interface BenchmarkQuality {
  agent: string;
  averageQualityScore: string;
}

export interface BenchmarkDemo {
  agent: string;
  runIndex: number;
  prompt: string;
  output: string;
  runPath: string;
  reportPath: string;
}

export interface BenchmarkSubjectiveReview {
  date?: string;
  reportPath?: string;
  medianScore?: string;
  scoreRange?: string;
  verdict?: string;
  nextCommand?: string;
}

export interface BenchmarkEvidence {
  date?: string;
  agents: BenchmarkAgent[];
  quality?: BenchmarkQuality[];
  reportPath?: string;
  demo?: BenchmarkDemo;
  subjectiveReview?: BenchmarkSubjectiveReview;
}

export interface Skill {
  name: string;
  title?: string;
  description?: string;
  type?: string;
  contextIntake?: string;
  visualTier?: string;
  platform: string;
  command?: string;
  scope?: string;
  pack?: string;
  path: string;
  mirrorKey?: string;
  tags?: string[];
  benchmarkEvidence?: BenchmarkEvidence;
}

export interface Pack {
  name: string;
  title?: string;
  description?: string;
  path?: string;
  skillCount?: number;
  platforms?: string[];
}

export interface WorkflowStepBenchmark {
  skill: string;
  passRate: string | null;
  qualityScore: string | null;
  demo: BenchmarkDemo | null;
}

export interface WorkflowBenchmarkSummary {
  workflowKey: string;
  stepsTotal: number;
  stepsBenchmarked: number;
  aggregatePassRate: string | null;
  aggregateQuality: string | null;
  stepBenchmarks: Record<number, WorkflowStepBenchmark>;
}

export interface ShowcaseData {
  skills?: Skill[];
  packs?: Pack[];
  skillCount?: number;
  packCount?: number;
  sourceCount?: number;
  workflowBenchmarks?: Record<string, WorkflowBenchmarkSummary>;
}
