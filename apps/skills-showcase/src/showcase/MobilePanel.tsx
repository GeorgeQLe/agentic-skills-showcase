import Link from "next/link";

export default function MobilePanel() {
  return (
    <div className="mobile-panel" data-mobile-panel="" data-open="false">
      <nav aria-label="Mobile navigation">
        <Link href="/">Cards</Link>
        <Link href="/library">Library</Link>
        <a href="https://leexperimental.com">LexCorp</a>
        <Link href="/follow">Follow</Link>
      </nav>
    </div>
  );
}
