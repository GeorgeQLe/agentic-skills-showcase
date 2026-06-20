"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ShowcaseHeader() {
  const currentPath = usePathname();

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="G Skillpacks home">
          <img
            className="brand-mark"
            src="/icon.png"
            alt=""
            width={40}
            height={40}
            aria-hidden="true"
          />
          <span className="brand-copy">
            <strong>G Skillpacks</strong>
            <span>gskillpacks.com</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Primary navigation">
          <Link
            href="/"
            aria-current={currentPath === "/" ? "page" : undefined}
          >
            Cards
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
