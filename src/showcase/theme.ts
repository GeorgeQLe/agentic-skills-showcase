/**
 * Theme helpers for the light/dark surface system (landing-redesign Phase 1).
 *
 * The source of truth at runtime is the `data-theme` attribute on <html>, set
 * before first paint by the inline no-flash script in app/layout.tsx (reads
 * localStorage.theme → OS prefers-color-scheme → dark). These helpers read and
 * mutate that attribute and persist the manual choice; they are the only writers
 * after the initial no-flash script runs.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** The no-flash resolution order, mirrored as a string the layout can inline. */
export const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

/** Current theme from the live attribute; defaults to dark before the script. */
export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

/** Apply + persist a theme choice. */
export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode) — attribute still applies for the session */
  }
}
