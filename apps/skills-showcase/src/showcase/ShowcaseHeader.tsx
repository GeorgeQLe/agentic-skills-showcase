"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ShowcaseHeader() {
  const currentPath = usePathname();

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="G Skillmap home">
          <strong>G Skillmap</strong>
          <span>gskillmap.com</span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link
            href="/workflows"
            aria-current={currentPath === "/workflows" ? "page" : undefined}
          >
            Workflows
          </Link>
          <Link
            href="/packs"
            aria-current={currentPath === "/packs" ? "page" : undefined}
          >
            Packs
          </Link>
          <Link
            href="/catalog"
            aria-current={currentPath === "/catalog" ? "page" : undefined}
          >
            Catalog
          </Link>
          <Link
            href="/benchmarks"
            aria-current={currentPath === "/benchmarks" ? "page" : undefined}
          >
            Benchmarks
          </Link>
          <Link
            href="/inspect"
            aria-current={currentPath === "/inspect" ? "page" : undefined}
          >
            Inspect
          </Link>
        </nav>
        <div className="nav-actions">
          <a href="https://leexperimental.com">LexCorp</a>
          <Link
            className="button secondary"
            href="/follow"
            aria-current={currentPath === "/follow" ? "page" : undefined}
          >
            Follow
          </Link>
        </div>
        <button
          className="menu-button"
          type="button"
          aria-label="Open navigation"
          aria-expanded={false}
          data-menu-button=""
        >
          <span className="menu-icon" aria-hidden="true"></span>
        </button>
      </div>
    </header>
  );
}
