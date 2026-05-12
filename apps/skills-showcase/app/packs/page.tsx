import type { Metadata } from "next";
import CatalogClient from "@/showcase/catalog";

export const metadata: Metadata = {
  title: "Pack Map / agentic-skills",
  description:
    "Install the workflow language your project needs. Packs separate global foundations, domain workflows, and overlays."
};

export default function PacksPage() {
  return (
    <main className="page">
      <section className="section" aria-labelledby="packs-title">
        <p className="eyebrow">Pack Map</p>
        <h1 id="packs-title">
          Install the workflow language your project actually needs.
        </h1>
        <p className="lede">
          Packs keep context focused by separating global foundations, domain
          workflows, and overlays. Pack names, platform coverage, and skill
          counts are generated from repository metadata.
        </p>
        <div className="pack-summary" data-pack-summary=""></div>
        <div
          className="pack-controls"
          aria-label="Project type highlighter"
          data-pack-controls=""
        >
          <button type="button" data-pack-filter="all" aria-pressed="true">
            All
          </button>
          <button type="button" data-pack-filter="business">
            Business
          </button>
          <button type="button" data-pack-filter="devtool">
            Devtool
          </button>
          <button type="button" data-pack-filter="game">
            Game
          </button>
          <button type="button" data-pack-filter="creator">
            Creator
          </button>
          <button type="button" data-pack-filter="monorepo">
            Monorepo
          </button>
          <button type="button" data-pack-filter="kanban">
            Kanban
          </button>
          <label className="pack-overlay-toggle">
            <input type="checkbox" data-pack-overlays="" defaultChecked />{" "}
            Show overlays
          </label>
        </div>
        <div className="notice" data-pack-missing="" hidden>
          Generated pack data is missing or malformed. Run{" "}
          <code>node scripts/generate-skills-showcase-data.mjs</code> and{" "}
          <code>scripts/validate-skills-showcase-data.sh</code>.
        </div>
        <div className="pack-layout">
          <div className="pack-band core" aria-label="Global core">
            <span className="tag">global core</span>
            <strong>Global foundations</strong>
            <p>
              Planning, execution, validation, review, hygiene, and shipping
              workflows stay available across projects.
            </p>
          </div>
          <div
            className="pack-map"
            data-pack-map=""
            aria-label="Generated pack map"
          ></div>
          <aside
            className="pack-detail"
            data-pack-detail=""
            aria-live="polite"
          ></aside>
          <div className="pack-band output" aria-label="Workflow outputs">
            <span className="tag">outputs</span>
            <strong>research/ specs/ tasks/ commits</strong>
            <p>
              Pack-specific workflows still end in inspectable artifacts and
              primary-branch shipping evidence.
            </p>
          </div>
        </div>
      </section>
      <CatalogClient />
    </main>
  );
}
