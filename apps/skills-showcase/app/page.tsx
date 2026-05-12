import type { Metadata } from "next";
import Link from "next/link";
import ShowcaseFooter from "@/showcase/ShowcaseFooter";
import WorkflowsClient from "@/showcase/workflows";

export const metadata: Metadata = {
  title: "G / agentic-skills",
  description:
    "Open-source agentic engineering systems by George Le. Explore the workflow library behind repeatable Claude Code and Codex planning, execution, validation, and shipping."
};

export default function HomePage() {
  return (
    <>
      <main className="page">
        <section className="hero" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow">Open-source agentic engineering</p>
            <h1 id="home-title">
              George &ldquo;G&rdquo; Le builds open-source agentic engineering
              systems.
            </h1>
            <p className="lede">
              Explore the workflow library behind repeatable Claude Code and
              Codex planning, execution, validation, and shipping.
            </p>
            <div className="cta-row">
              <Link className="button" href="/workflows">
                Explore the Library
              </Link>
              <Link className="button secondary" href="/follow">
                Follow G&rsquo;s Work
              </Link>
            </div>
            <div className="link-row" aria-label="External links">
              <a href="https://github.com/GeorgeQLe/agentic-skills">GitHub</a>
              <a href="https://leexperimental.com">LexCorp</a>
              <a href="https://www.youtube.com/@georgele">YouTube</a>
              <a href="https://discord.gg/TC6STUc5rT">Discord</a>
            </div>
          </div>
          <div className="hero-visual">
            <article
              className="blueprint-panel"
              aria-label="Prompt to ship workflow blueprint"
            >
              <div className="panel-header">
                <strong>
                  prompt -&gt; spec -&gt; roadmap -&gt; run -&gt; ship
                </strong>
                <span className="coordinate">X12/Y04</span>
              </div>
              <div className="state-machine">
                <div className="state-node">
                  <strong>Prompt</strong>
                  <span className="command">user intent</span>
                </div>
                <div className="state-node">
                  <strong>Spec</strong>
                  <span className="command">$spec-interview</span>
                </div>
                <div className="state-node">
                  <strong>Roadmap</strong>
                  <span className="command">tasks/*.md</span>
                </div>
                <div className="state-node">
                  <strong>Run</strong>
                  <span className="command">$run</span>
                </div>
                <div className="state-node">
                  <strong>Ship</strong>
                  <span className="command">history + commit</span>
                </div>
              </div>
              <div className="terminal" aria-label="Simulated validation output">
                <div>$run</div>
                <div>plan accepted: Step 32.1 static shell</div>
                <div>validation: route files, shared CSS, shared JS</div>
                <div>ship: tasks/history.md + direct-to-primary commit</div>
              </div>
            </article>
          </div>
          <div className="metrics" aria-label="Showcase facts">
            <div className="metric">
              <span className="metric-value">global + packs</span>
              <span className="metric-label">skill scopes</span>
            </div>
            <div className="metric">
              <span className="metric-value">Claude + Codex</span>
              <span className="metric-label">agent surfaces</span>
            </div>
            <div className="metric">
              <span className="metric-value" data-skill-count="">
                static catalog
              </span>
              <span className="metric-label">generated skills</span>
            </div>
            <div className="metric">
              <span className="metric-value">GitHub proof</span>
              <span className="metric-label">open source</span>
            </div>
          </div>
        </section>

        <section
          className="section grid-12"
          aria-labelledby="workflow-preview-title"
        >
          <div className="span-12">
            <p className="eyebrow">Workflow proof</p>
            <h2 id="workflow-preview-title">
              Eight ways work becomes inspectable.
            </h2>
            <p className="lede">
              The workflow lab turns agent sessions into visible state changes:
              commands, task files, validation gates, handoffs, and shipped
              history.
            </p>
          </div>
          <div
            className="span-12 workflow-preview-grid"
            data-workflow-preview=""
          ></div>
        </section>

        <section className="section grid-12" aria-labelledby="routes-title">
          <div className="span-12">
            <p className="eyebrow">Product surfaces</p>
            <h2 id="routes-title">
              A field manual with inspectable routes.
            </h2>
          </div>
          <Link className="route-card span-4" href="/workflows">
            <span className="coordinate">01</span>
            <h3>Workflow Lab</h3>
            <p>
              Curated walkthroughs for install, planning, shipping, research,
              handoff, authoring, and validation.
            </p>
          </Link>
          <Link className="route-card span-4" href="/packs">
            <span className="coordinate">02</span>
            <h3>Pack Map</h3>
            <p>
              Global core, domain packs, overlays, and compatibility aliases in
              a scan-friendly map.
            </p>
          </Link>
          <Link className="route-card span-4" href="/catalog">
            <span className="coordinate">03</span>
            <h3>Skill Catalog</h3>
            <p>
              A generated catalog will cover every tracked source skill without
              a runtime backend.
            </p>
          </Link>
        </section>
      </main>

      <ShowcaseFooter />
      <WorkflowsClient />
    </>
  );
}
