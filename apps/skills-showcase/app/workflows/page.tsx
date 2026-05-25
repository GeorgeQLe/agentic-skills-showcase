import type { Metadata } from "next";
import { TuiWorkflow } from "@/showcase/tui/TuiWorkflow";

export const metadata: Metadata = {
  title: "Workflow Lab / agentic-skills",
  description:
    "Seven AFPS phase walkthroughs showing alignment, design, prototype, specification, and production shipping with proof at every gate."
};

export default function WorkflowsPage() {
  return (
    <main className="page">
      <section className="section workflow-lab" aria-labelledby="workflow-title">
        <div className="workflow-lab__header">
          <div>
            <p className="eyebrow">Workflow Lab</p>
            <h1 id="workflow-title">
              Walk through every AFPS phase, from market alignment to production ship.
            </h1>
            <p className="lede">
              Seven phase walkthroughs run inside a single Playful Lab console:
              choose a phase, step through the command path, and inspect the
              artifacts, proof gates, and recovery routes at each boundary.
            </p>
          </div>
          <aside className="workflow-lab__manifest" aria-label="Lab manifest">
            <span className="tag">AFPS pipeline</span>
            <strong>Alignment-first phase walkthroughs</strong>
            <p>
              Each walkthrough maps to an AFPS phase boundary — from market
              evidence through validated prototype to shipped production code.
            </p>
          </aside>
        </div>

        <div className="workflow-lab__console">
          <TuiWorkflow />
        </div>
      </section>
    </main>
  );
}
