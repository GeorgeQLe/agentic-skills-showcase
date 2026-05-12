import type { Metadata } from "next";
import CatalogClient from "@/showcase/catalog";

export const metadata: Metadata = {
  title: "Catalog / agentic-skills",
  description:
    "Search the committed static catalog generated from every source skill. Counts, commands, platform labels, and source paths."
};

export default function CatalogPage() {
  return (
    <main className="page">
      <section className="section" aria-labelledby="catalog-title">
        <p className="eyebrow">Generated Catalog</p>
        <h1 id="catalog-title">
          Every source skill gets an inspectable row.
        </h1>
        <p className="lede">
          Search the committed static catalog generated from every source
          skill. Counts, commands, platform labels, and source paths come from{" "}
          <code>skills-data.js</code>.
        </p>
        <div className="catalog-tools" role="search">
          <label>
            <span className="eyebrow">Search</span>
            <input
              type="search"
              data-catalog-search=""
              placeholder="Search skills, commands, paths"
            />
          </label>
          <label>
            <span className="eyebrow">Platform</span>
            <select data-catalog-platform="">
              <option value="all">All platforms</option>
              <option value="claude">Claude</option>
              <option value="codex">Codex</option>
            </select>
          </label>
          <label>
            <span className="eyebrow">Type</span>
            <select data-catalog-type="">
              <option value="all">All types</option>
            </select>
          </label>
          <label>
            <span className="eyebrow">Scope</span>
            <select data-catalog-scope="">
              <option value="all">All scopes</option>
              <option value="global">Global</option>
              <option value="pack">Packs</option>
            </select>
          </label>
        </div>
        <p className="coordinate" aria-live="polite">
          <span data-catalog-count="">0</span> of{" "}
          <span data-catalog-total="">0</span> generated rows visible
        </p>
        <div className="notice" data-catalog-missing="" hidden>
          Generated catalog data is missing or malformed. Run{" "}
          <code>node scripts/generate-skills-showcase-data.mjs</code> and{" "}
          <code>scripts/validate-skills-showcase-data.sh</code>.
        </div>
        <div className="catalog-list" data-catalog-list=""></div>
      </section>
      <CatalogClient />
    </main>
  );
}
