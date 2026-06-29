import { expect, test } from "@playwright/test";

// Light/dark surface theme: a header toggle that flips html[data-theme], persists
// the manual choice, respects OS prefers-color-scheme on first visit, and applies
// before first paint (no flash) via the inline script in app/layout.tsx.

test("the header toggle flips the theme and persists across reload", async ({
  page,
}) => {
  await page.goto("/");
  const html = page.locator("html");
  const initial = await html.getAttribute("data-theme");
  expect(initial === "light" || initial === "dark").toBe(true);
  const flipped = initial === "dark" ? "light" : "dark";

  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveAttribute("data-theme", flipped);

  // Persisted: a reload keeps the chosen theme (from localStorage).
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", flipped);
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(flipped);
});

test("no-flash: a stored theme is applied before first paint", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByTestId("theme-toggle")).toHaveAttribute(
    "data-theme-state",
    "light",
  );
});

test("respects OS prefers-color-scheme on first visit (no stored choice)", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the theme toggle works on a deck route too", async ({ page }) => {
  await page.goto("/deck/vard");
  const html = page.locator("html");
  const initial = await html.getAttribute("data-theme");
  const flipped = initial === "dark" ? "light" : "dark";
  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveAttribute("data-theme", flipped);
});
