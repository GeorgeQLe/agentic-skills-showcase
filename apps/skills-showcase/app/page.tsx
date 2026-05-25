import type { Metadata } from "next";
import Link from "next/link";
import ShowcaseFooter from "@/showcase/ShowcaseFooter";
import WorkflowsClient from "@/showcase/workflows";

export const metadata: Metadata = {
  title: "G Skillpacks",
  description:
    "The AFPS pipeline and skill library for Claude Code and Codex — alignment, prototype, specification, and shipping workflows."
};

export default function HomePage() {
  return (
    <>
      <main className="page">
        <section className="hero" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow">G Skillpacks / gskillpacks.com</p>
            <h1 id="home-title">
              Alignment first. Prototype second. Ship with proof.
            </h1>
            <p className="lede">
              G Skillpacks is the open-source AFPS pipeline for Claude Code and
              Codex: market alignment and clickable prototypes before production
              infrastructure, with proof at every gate.
            </p>
            <div className="cta-row">
              <Link className="button" href="/workflows">
                See the Pipeline
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
              aria-label="AFPS pipeline blueprint"
            >
              <div className="panel-header">
                <strong>
                  align -&gt; prototype -&gt; validate -&gt; spec -&gt; ship
                </strong>
                <span className="coordinate">AFPS/v1</span>
              </div>
              <div className="state-machine">
                <div className="state-node">
                  <strong>Align</strong>
                  <span className="command">$concept-exploration</span>
                </div>
                <div className="state-node">
                  <strong>Prototype</strong>
                  <span className="command">$prototype</span>
                </div>
                <div className="state-node">
                  <strong>Validate</strong>
                  <span className="command">$uat</span>
                </div>
                <div className="state-node">
                  <strong>Spec</strong>
                  <span className="command">$spec-interview</span>
                </div>
                <div className="state-node">
                  <strong>Ship</strong>
                  <span className="command">$run + $ship</span>
                </div>
              </div>
              <div className="terminal" aria-label="Simulated AFPS output">
                <div>$concept-exploration</div>
                <div>alignment: ICP locked, competitive gaps mapped</div>
                <div>$prototype → $uat → validated reference build</div>
                <div>$spec-interview → $run → direct-to-primary ship</div>
              </div>
            </article>
          </div>
          <div className="metrics" aria-label="Showcase facts">
            <div className="metric">
              <span className="metric-value">7 phases</span>
              <span className="metric-label">alignment to ship</span>
            </div>
            <div className="metric">
              <span className="metric-value">proof gates</span>
              <span className="metric-label">every phase boundary</span>
            </div>
            <div className="metric">
              <span className="metric-value">prototype first</span>
              <span className="metric-label">validate before spec</span>
            </div>
            <div className="metric">
              <span className="metric-value">open source</span>
              <span className="metric-label">GitHub proof</span>
            </div>
          </div>
        </section>

        <section
          className="section grid-12"
          aria-labelledby="workflow-preview-title"
        >
          <div className="span-12">
            <p className="eyebrow">AFPS pipeline</p>
            <h2 id="workflow-preview-title">
              Seven phases from market alignment to production ship.
            </h2>
            <p className="lede">
              The workflow lab walks through every AFPS phase: market discovery,
              value strategy, go-to-market, UX design, prototype validation,
              specification, and production shipping.
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
              Walk through every AFPS phase from market alignment to production
              shipping with inspectable proof at each gate.
            </p>
          </Link>
          <Link className="route-card span-4" href="/packs">
            <span className="coordinate">02</span>
            <h3>Pack Map</h3>
            <p>
              Global AFPS pipeline, domain packs, overlays, and compatibility
              aliases in a scan-friendly map.
            </p>
          </Link>
          <Link className="route-card span-4" href="/catalog">
            <span className="coordinate">03</span>
            <h3>Skill Catalog</h3>
            <p>
              Every skill in the AFPS pipeline and domain packs, generated from
              source with benchmark evidence.
            </p>
          </Link>
        </section>
      </main>

      <ShowcaseFooter />
      <WorkflowsClient />
    </>
  );
}
