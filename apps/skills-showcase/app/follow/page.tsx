import type { Metadata } from "next";
import Link from "next/link";
import CatalogClient from "@/showcase/catalog";
import NewsletterFormClient from "@/showcase/newsletter-form";

export const metadata: Metadata = {
  title: "Follow / agentic-skills",
  description:
    "Track the operating system behind the builds. Follow G's open-source workflow library, LexCorp War Room direction, and community routes."
};

export default function FollowPage() {
  return (
    <main className="page">
      <section
        className="section grid-12 follow-hero"
        aria-labelledby="follow-title"
      >
        <div className="span-7">
          <p className="eyebrow">Follow the work</p>
          <h1 id="follow-title">
            Track the operating system behind the builds.
          </h1>
          <p className="lede">
            George &ldquo;G&rdquo; Le publishes the open-source workflow
            library, LexCorp War Room direction, build notes, and community
            routes from one static launch surface.
          </p>
          <div className="cta-row">
            <a className="button" href="https://www.youtube.com/@georgele">
              Watch on YouTube
            </a>
            <a
              className="button secondary"
              href="https://leexperimental.com"
            >
              Enter LexCorp
            </a>
            <a
              className="button secondary"
              href="https://discord.gg/TC6STUc5rT"
            >
              Join Discord
            </a>
          </div>
        </div>
        <aside
          className="span-5 follow-proof-panel"
          aria-label="Static proof summary"
        >
          <span className="coordinate">OSS-AGENTIC-01</span>
          <h2>Proof before follow.</h2>
          <p>
            This route points to public repository evidence and generated
            static receipts. LexCorp links are funnel destinations, not live
            product metric claims.
          </p>
          <div className="follow-proof-stats" data-follow-proof-stats="">
            <div>
              <strong>static</strong>
              <span>proof data</span>
            </div>
            <div>
              <strong>public</strong>
              <span>GitHub route</span>
            </div>
            <div>
              <strong>no live</strong>
              <span>LexCorp metrics</span>
            </div>
          </div>
        </aside>
      </section>

      <section
        className="section grid-12"
        aria-labelledby="conversion-title"
      >
        <div className="span-12">
          <p className="eyebrow">Conversion paths</p>
          <h2 id="conversion-title">
            Choose the channel that matches your intent.
          </h2>
        </div>
        <article className="follow-card span-4">
          <span className="coordinate">G</span>
          <h3>Follow G</h3>
          <p>
            Watch the build-in-public engineering work and inspect the
            open-source system behind it.
          </p>
          <div className="link-row" aria-label="G links">
            <a href="https://www.youtube.com/@georgele">YouTube</a>
            <a href="https://x.com/gkingofboston">X / Twitter</a>
            <a href="https://github.com/GeorgeQLe/agentic-skills">GitHub</a>
          </div>
        </article>
        <article className="follow-card span-4">
          <span className="coordinate">LX</span>
          <h3>Enter LexCorp</h3>
          <p>
            Connect the skills library to the broader War Room portfolio and
            product-building narrative.
          </p>
          <div className="link-row" aria-label="LexCorp links">
            <a href="https://leexperimental.com">Visit LexCorp</a>
            <Link href="/inspect">Inspect proof</Link>
          </div>
        </article>
        <article className="follow-card span-4">
          <span className="coordinate">COMM</span>
          <h3>Join the community</h3>
          <p>
            Use Discord for the community loop, then return to the catalog and
            workflow lab for the source system.
          </p>
          <div className="link-row" aria-label="Community links">
            <a href="https://discord.gg/TC6STUc5rT">Discord</a>
            <Link href="/catalog">Browse skills</Link>
          </div>
        </article>
      </section>

      <section
        className="section grid-12"
        aria-labelledby="proof-funnel-title"
      >
        <div className="span-5">
          <p className="eyebrow">Proof funnel</p>
          <h2 id="proof-funnel-title">
            Receipts route visitors to the right next action.
          </h2>
          <p className="lede">
            Generated data can show repository artifacts, validation scripts,
            route freshness, GitHub fallback status, and recent shipped work.
            It does not report visitor analytics, newsletter performance,
            private LexCorp performance, or live product metrics.
          </p>
          <div className="cta-row">
            <Link className="button secondary" href="/inspect">
              Inspect all receipts
            </Link>
            <a
              className="button secondary"
              href="https://github.com/GeorgeQLe/agentic-skills"
            >
              Open GitHub
            </a>
          </div>
        </div>
        <div
          className="span-7 follow-receipt-grid"
          data-follow-receipts=""
        ></div>
      </section>

      <section
        className="section grid-12"
        aria-labelledby="newsletter-title"
      >
        <form
          className="form-panel span-12 newsletter-form"
          aria-labelledby="newsletter-title"
          data-newsletter-form=""
          data-provider-endpoint=""
        >
          <div>
            <p className="eyebrow">Newsletter</p>
            <h2 id="newsletter-title">Get the next workflow drop.</h2>
            <p className="lede">
              The form can submit to a configured static provider endpoint.
              With no endpoint configured, it stays non-collecting and routes
              visitors to public follow/community channels.
            </p>
          </div>
          <div className="newsletter-controls" data-newsletter-controls="">
            <label>
              <span className="eyebrow">Email</span>
              <input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="email@example.com"
                aria-describedby="newsletter-status"
              />
            </label>
            <button className="button secondary" type="submit">
              Join the list
            </button>
          </div>
          <div
            className="newsletter-state-row"
            aria-label="Newsletter form states"
          >
            <span className="tag" data-newsletter-state="provider-missing">
              provider missing
            </span>
            <span className="tag" data-newsletter-state="invalid-email">
              invalid email
            </span>
            <span className="tag" data-newsletter-state="pending">
              pending
            </span>
            <span className="tag" data-newsletter-state="success">
              success
            </span>
            <span className="tag" data-newsletter-state="error">
              error
            </span>
          </div>
          <p
            className="notice newsletter-status"
            id="newsletter-status"
            role="status"
            aria-live="polite"
            data-newsletter-status=""
          >
            Provider endpoint missing. This static page is not collecting
            email addresses yet.
          </p>
          <p className="coordinate">
            Configure by setting <code>data-provider-endpoint</code> on this
            form to the static form provider URL.
          </p>
        </form>
      </section>
      <CatalogClient />
      <NewsletterFormClient />
    </main>
  );
}
