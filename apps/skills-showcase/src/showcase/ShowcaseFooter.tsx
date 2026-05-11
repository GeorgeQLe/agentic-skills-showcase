import Link from "next/link";

export default function ShowcaseFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>G</h3>
          <a href="https://www.youtube.com/@georgele">YouTube</a>
          <a href="https://x.com/gkingofboston">X / Twitter</a>
          <a href="https://github.com/GeorgeQLe/agentic-skills">GitHub</a>
          <a href="https://discord.gg/TC6STUc5rT">Discord</a>
        </div>
        <div>
          <h3>LexCorp</h3>
          <a href="https://leexperimental.com">Enter the War Room</a>
          <p>
            Build-in-public operating system for agentic product work.
          </p>
        </div>
        <div>
          <h3>Open Source</h3>
          <Link href="/catalog">Skills catalog</Link>
          <Link href="/inspect">Inspect the system</Link>
          <p>
            Open-source workflow library for Claude Code and Codex.
          </p>
        </div>
      </div>
    </footer>
  );
}
