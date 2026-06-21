import { expect, test } from "@playwright/test";

// /library is the dedicated catalog: a Skills tab (filterable card grid whose
// tiles soft-nav to the /card/[id] modal) and a Decks tab (cards that hard-load
// the builder). It is a new, non-legacy route — it resolves 200, not a 308.

test("loads the Skills grid with a live count", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByTestId("library")).toBeVisible();
  await expect(page.getByTestId("library-tab-skills")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("library-skill-grid")).toBeVisible();
  await expect(page.getByTestId("library-count")).toContainText("skills");
});

test("search narrows the grid", async ({ page }) => {
  await page.goto("/library");
  const countBefore = await page.getByTestId("library-count").textContent();
  await page.getByTestId("library-search").fill("glossary");
  // The count text changes as the grid filters live.
  await expect(page.getByTestId("library-count")).not.toHaveText(countBefore ?? "");
  await expect(page.getByTestId("library-skill-grid").locator("a")).not.toHaveCount(0);
});

test("a skill tile opens the /card/[id] modal and Escape returns to /library", async ({ page }) => {
  await page.goto("/library");
  const firstTile = page.getByTestId("library-skill-grid").locator("a").first();
  const href = await firstTile.getAttribute("href");
  expect(href).toMatch(/^\/card\//);
  await firstTile.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByTestId("card-modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByTestId("card-modal")).toHaveCount(0);
});

test("the empty state offers a clear-all that restores the grid", async ({ page }) => {
  await page.goto("/library");
  await page.getByTestId("library-search").fill("zzzznomatchxyz");
  await expect(page.getByTestId("library-empty")).toBeVisible();
  await page.getByTestId("library-empty").getByRole("button").click();
  await expect(page.getByTestId("library-skill-grid")).toBeVisible();
});

test("the Decks tab hard-loads the builder", async ({ page }) => {
  await page.goto("/library");
  await page.getByTestId("library-tab-decks").click();
  const deckCard = page.getByTestId("library-deck-grid").locator("a").first();
  const href = await deckCard.getAttribute("href");
  expect(href).toMatch(/^\/deck\//);
  await deckCard.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByTestId("deck-entry-mode")).toHaveText("hard-load");
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
});

test("the header Library link routes to /library", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByTestId("library")).toBeVisible();
});
