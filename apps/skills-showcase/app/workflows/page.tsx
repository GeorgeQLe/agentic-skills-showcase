import type { Metadata } from "next";
import { TuiWorkflow } from "@/showcase/tui/TuiWorkflow";

export const metadata: Metadata = {
  title: "Workflow Lab / agentic-skills",
  description:
    "Eight curated walkthroughs showing when to use each workflow, what changes in the repo, and how recovery works."
};

export default function WorkflowsPage() {
  return (
    <main className="page">
      <section className="section workflow-lab" aria-labelledby="workflow-title">
        <div className="workflow-lab__header">
          <div>
            <p className="eyebrow">Workflow Lab</p>
            <h1 id="workflow-title">
              Watch the system move from intent to shipped work.
            </h1>
            <p className="lede">
              Eight curated walkthroughs run inside a single Playful Lab
              console: choose a workflow, step through the command path, and
              inspect the artifacts, repo changes, and recovery route without
              dropping into a separate legacy panel.
            </p>
          </div>
          <aside className="workflow-lab__manifest" aria-label="Lab manifest">
            <span className="tag">pilot refactor</span>
            <strong>Playful blueprint interface</strong>
            <p>
              This is the reference pattern for replacing card-heavy generated
              surfaces across catalog, packs, benchmarks, proof, and follow.
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
