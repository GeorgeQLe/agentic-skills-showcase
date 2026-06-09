import type { Metadata } from "next";
import CatalogClient from "@/showcase/catalog";

export const metadata: Metadata = {
  title: "Pack Map / agentic-skills",
  description:
    "Packs tune which AFPS phases your project uses. Global core provides the full pipeline; domain packs specialize phase behavior."
};

export default function PacksPage() {
  return (
    <main className="page">
      <section className="section" aria-labelledby="packs-title">
        <p className="eyebrow">Pack Map</p>
        <h1 id="packs-title">
          Packs tune which AFPS phases your project uses.
        </h1>
        <p className="lede">
          Global core provides the full AFPS pipeline: alignment, design,
          prototype, spec, and shipping workflows. Domain packs specialize
          phase behavior for business, devtool, game, and creator contexts.
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
          <code>pnpm --dir apps/skills-showcase generate:data</code> and{" "}
          <code>pnpm --dir apps/skills-showcase validate:data</code>.
        </div>
        <div className="pack-layout">
          <div className="pack-band core" aria-label="Global core">
            <span className="tag">global core</span>
            <strong>The full AFPS pipeline</strong>
            <p>
              Alignment, design, prototype, spec, and shipping workflows stay
              available across projects as the default phase structure.
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
            <strong>alignment proof / prototype / specs / commits</strong>
            <p>
              Every AFPS phase produces inspectable artifacts — market evidence,
              validated prototypes, production specs, and shipping receipts.
            </p>
          </div>
        </div>
      </section>
      <CatalogClient />
    </main>
  );
}
