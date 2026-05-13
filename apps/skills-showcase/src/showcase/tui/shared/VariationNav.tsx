"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const variations = [
  { href: "/workflows/v1", label: "V1", title: "Hacker Terminal" },
  { href: "/workflows/v2", label: "V2", title: "Clean Minimal" },
  { href: "/workflows/v3", label: "V3", title: "Retro CRT" },
  { href: "/workflows/v4", label: "V4", title: "Playful Lab" },
  { href: "/workflows/v5", label: "V5", title: "Professional" },
];

export function VariationNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="TUI Variations"
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0.3)",
        flexWrap: "wrap",
      }}
    >
      <Link
        href="/workflows"
        style={{
          fontSize: "0.75rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "4px",
          textDecoration: "none",
          color: "rgba(255,255,255,0.6)",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        ← All
      </Link>
      {variations.map((v) => {
        const active = pathname === v.href;
        return (
          <Link
            key={v.href}
            href={v.href}
            aria-current={active ? "page" : undefined}
            style={{
              fontSize: "0.75rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              textDecoration: "none",
              color: active ? "#fff" : "rgba(255,255,255,0.6)",
              background: active ? "rgba(255,255,255,0.15)" : "transparent",
              border: active
                ? "1px solid rgba(255,255,255,0.3)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {v.label}: {v.title}
          </Link>
        );
      })}
    </nav>
  );
}
