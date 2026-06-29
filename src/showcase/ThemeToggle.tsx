"use client";

/**
 * ThemeToggle — header control that flips and persists the light/dark surface
 * theme (landing-redesign Phase 1). The live theme lives on <html data-theme>,
 * set before paint by the no-flash script in app/layout.tsx; this button reads
 * that attribute on mount (avoiding a hydration mismatch — the server has no way
 * to know the user's stored/OS choice) and toggles it thereafter.
 */

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { getTheme, setTheme, type Theme } from "@/showcase/theme";

export default function ThemeToggle() {
  // Start null so the first client render matches the server (which renders
  // nothing theme-specific); resolve the real attribute in a mount effect.
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const toggle = () => {
    const next: Theme = (theme ?? getTheme()) === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      data-testid="theme-toggle"
      data-theme-state={theme ?? "unset"}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      onClick={toggle}
    >
      {/* Render both icons until mounted to keep markup stable; CSS shows one. */}
      {theme === null ? (
        <Moon size={18} aria-hidden="true" />
      ) : isDark ? (
        <Moon size={18} aria-hidden="true" />
      ) : (
        <Sun size={18} aria-hidden="true" />
      )}
    </button>
  );
}
