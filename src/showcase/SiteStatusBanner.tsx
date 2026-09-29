/*
 * Site-wide retirement notice. The commercial GSkillPacks product was
 * retired on 2026-08-24; the open-source skill library stays maintained.
 * Owner-approved copy — do not edit without approval.
 */
export default function SiteStatusBanner() {
  return (
    <aside className="site-status-banner" aria-label="Site status">
      <p>
        <strong>
          The GSkillPacks product is retired; the open-source skills are not.
        </strong>{" "}
        The guided alignment workflow added more ceremony than value, so we
        stopped building the commercial product. The skillpacks package and
        the agentic-skills repository stay maintained and free.{" "}
        <a href="https://www.leexperimental.com/graveyard/gskillpacks">
          Read the post-mortem →
        </a>
      </p>
    </aside>
  );
}
