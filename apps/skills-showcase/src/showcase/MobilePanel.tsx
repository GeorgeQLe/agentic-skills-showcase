import Link from "next/link";

export default function MobilePanel() {
  return (
    <div className="mobile-panel" data-mobile-panel="" data-open="false">
      <nav aria-label="Mobile navigation">
        <Link href="/workflows">Workflows</Link>
        <Link href="/packs">Packs</Link>
        <Link href="/catalog">Catalog</Link>
        <Link href="/inspect">Inspect</Link>
        <a href="https://leexperimental.com">LexCorp</a>
        <Link href="/follow">Follow</Link>
      </nav>
    </div>
  );
}
