import type { Metadata } from "next";
import Link from "next/link";
import CatalogClient from "@/showcase/catalog";

export const metadata: Metadata = {
  title: "Inspect / agentic-skills",
  description:
    "Public repository receipts, local validation commands, GitHub fallback status, route freshness, and explicit claim boundaries."
};

export default function InspectPage() {
  return (
    <main className="page">
      <section className="section grid-12" aria-labelledby="inspect-title">
        <div className="span-8">
          <p className="eyebrow">Proof Surface</p>
          <h1 id="inspect-title">Receipts first, claims second.</h1>
          <p className="lede">
            Proof data is generated into a committed static file. This route
            shows public repository receipts, local validation commands,
            GitHub fallback status, route freshness, and explicit claim
            boundaries.
          </p>
          <div className="cta-row">
            <Link className="button secondary" href="/follow">
              Follow from proof
            </Link>
            <a
              className="button secondary"
              href="https://github.com/GeorgeQLe/agentic-skills"
            >
              Open GitHub
            </a>
          </div>
        </div>
        <aside
          className="span-4 proof-summary-panel"
          aria-label="Generated proof telemetry summary"
          data-proof-summary=""
        ></aside>
        <div className="notice span-12" data-proof-missing="" hidden>
          Generated proof data is missing or malformed. Run{" "}
          <code>node scripts/generate-skills-showcase-github-data.mjs</code>{" "}
          and <code>scripts/validate-skills-showcase-data.sh</code>.
        </div>
        <div className="notice span-12 proof-funnel-note">
          Static telemetry can prove repository artifacts, validation
          commands, generated-data freshness, and fallback behavior. It does
          not prove live LexCorp product adoption, community membership,
          visitor analytics, or newsletter performance.{" "}
          <Link href="/follow">Choose a follow/community path</Link>.
        </div>
        <div
          className="span-12 proof-grid"
          data-proof-artifacts=""
        ></div>
        <div
          className="span-12 proof-grid"
          data-proof-validation=""
        ></div>
        <div
          className="span-12 proof-grid"
          data-proof-history=""
        ></div>
        <div
          className="notice span-12"
          data-proof-boundaries=""
        ></div>
      </section>
      <CatalogClient />
    </main>
  );
}
