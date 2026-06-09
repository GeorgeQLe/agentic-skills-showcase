import type { Metadata } from "next";
import BenchmarksClient from "@/showcase/benchmarks";

export const metadata: Metadata = {
  title: "Benchmarks / agentic-skills",
  description:
    "Aggregated benchmark results from skills with persisted evaluated run data, pass rates, and quality scores."
};

export default function BenchmarksPage() {
  return (
    <main className="page">
      <section className="section" aria-labelledby="benchmarks-title">
        <p className="eyebrow">Benchmark Results</p>
        <h1 id="benchmarks-title">
          Evaluated benchmark evidence from persisted runs.
        </h1>
        <p className="lede">
          Skills used within AFPS phases with completed benchmark runs and
          evaluated results. Benchmark data comes from persisted run
          reports — see the{" "}
          <a href="https://github.com/GeorgeQLe/agentic-skills/blob/master/docs/benchmark-results-matrix.md">
            benchmark results matrix
          </a>{" "}
          for the full generated source of truth.
        </p>
        <p className="coordinate" aria-live="polite">
          <span data-benchmarks-count="">0</span> skills with benchmark evidence
        </p>
        <div className="notice" data-benchmarks-missing="" hidden>
          Benchmark data is missing or malformed. Run{" "}
          <code>pnpm --dir apps/skills-showcase generate:data</code> and{" "}
          <code>pnpm --dir apps/skills-showcase validate:data</code>.
        </div>
        <div data-benchmarks-list=""></div>
      </section>
      <BenchmarksClient />
    </main>
  );
}
