import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workflow Lab / agentic-skills",
  description:
    "Eight curated walkthroughs showing when to use each workflow, what changes in the repo, and how recovery works."
};

export default function WorkflowsPage() {
  return (
    <main className="page">
      <section className="section grid-12" aria-labelledby="workflow-title">
        <div className="span-12">
          <p className="eyebrow">Workflow Lab</p>
          <h1 id="workflow-title">
            Watch the system move from intent to shipped work.
          </h1>
          <p className="lede">
            Eight curated walkthroughs show when to use each workflow, what
            changes in the repo, what artifacts you get, and how recovery
            works when validation catches drift.
          </p>
        </div>
        <div
          className="span-4 workflow-list"
          aria-label="Workflow selector"
          data-workflow-list=""
        >
          <button
            className="workflow-item"
            type="button"
            data-workflow="first"
          >
            <span className="tag">setup</span>
            <strong>First Successful Cycle</strong>
            <span>Install, select, validate, ship.</span>
          </button>
          <button
            className="workflow-item"
            type="button"
            data-workflow="packs"
          >
            <span className="tag">planning</span>
            <strong>Pack Selection</strong>
            <span>Load only the workflows a project needs.</span>
          </button>
          <button
            className="workflow-item"
            type="button"
            data-workflow="ship"
          >
            <span className="tag">shipping</span>
            <strong>Plan -&gt; Run -&gt; Ship</strong>
            <span>Turn one roadmap step into committed work.</span>
          </button>
          <button
            className="workflow-item"
            type="button"
            data-workflow="spec"
          >
            <span className="tag">planning</span>
            <strong>Spec -&gt; Roadmap -&gt; Implementation</strong>
            <span>Move from idea to executable tasks.</span>
          </button>
        </div>
        <article className="blueprint-panel workflow-panel span-8">
          <div className="panel-header">
            <strong data-workflow-title="">First Successful Cycle</strong>
            <span className="coordinate" data-workflow-coordinate="">
              LAB-01
            </span>
          </div>
          <p className="lede" data-workflow-copy=""></p>
          <div
            className="workflow-stage"
            data-workflow-stage=""
            aria-live="polite"
          ></div>
          <div
            className="workflow-progress"
            data-workflow-progress=""
            aria-label="Workflow progress"
          ></div>
          <div className="workflow-controls" aria-label="Animation controls">
            <button
              className="icon-button"
              type="button"
              data-workflow-prev=""
              aria-label="Previous step"
            >
              Prev
            </button>
            <button
              className="icon-button"
              type="button"
              data-workflow-toggle=""
              aria-label="Pause animation"
            >
              Pause
            </button>
            <button
              className="icon-button"
              type="button"
              data-workflow-next=""
              aria-label="Next step"
            >
              Next
            </button>
            <button
              className="icon-button"
              type="button"
              data-workflow-restart=""
              aria-label="Restart workflow"
            >
              Reset
            </button>
          </div>
          <div className="workflow-columns">
            <section>
              <h3>When to use this</h3>
              <p data-workflow-when=""></p>
            </section>
            <section>
              <h3>What changes</h3>
              <ul className="artifact-list" data-workflow-changes=""></ul>
            </section>
            <section>
              <h3>What you get</h3>
              <ul className="artifact-list" data-workflow-artifacts=""></ul>
            </section>
            <section>
              <h3>Failure / recovery path</h3>
              <p data-workflow-failure=""></p>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
