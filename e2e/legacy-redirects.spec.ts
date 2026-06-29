import { expect, test } from "@playwright/test";

// Unified-experience Phase 6: the five legacy marketing routes are folded into
// `/` and 308-redirect there via next.config `redirects()`. The global nav is
// rebuilt to the game-metaphor set (Cards → /, Follow → /follow, external
// LexCorp). These specs lock both: the permanent redirects and that every nav
// link resolves to a surviving surface.

const LEGACY_ROUTES = [
  "/catalog",
  "/packs",
  "/workflows",
  "/benchmarks",
  "/inspect",
];

for (const route of LEGACY_ROUTES) {
  test(`${route} permanently redirects to /`, async ({ request }) => {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const location = response.headers()["location"];
    // Next emits an absolute or root-relative Location; normalise to a pathname.
    expect(new URL(location, "http://127.0.0.1").pathname).toBe("/");
  });

  test(`${route} lands on the / landing when followed`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("landing")).toBeVisible();
  });
}

test("the global nav links resolve to surviving surfaces", async ({ page }) => {
  await page.goto("/");

  const header = page.locator("header.site-header");
  // Brand → /
  await expect(header.locator("a.brand")).toHaveAttribute("href", "/");
  // Cards → /
  await expect(header.getByRole("link", { name: "Cards" })).toHaveAttribute(
    "href",
    "/",
  );
  // Follow → /follow
  await expect(header.getByRole("link", { name: "Follow" })).toHaveAttribute(
    "href",
    "/follow",
  );
  // LexCorp → external
  await expect(header.getByRole("link", { name: "LexCorp" })).toHaveAttribute(
    "href",
    "https://leexperimental.com",
  );

  // No nav link points at a folded legacy route.
  for (const legacy of LEGACY_ROUTES) {
    await expect(header.locator(`a[href="${legacy}"]`)).toHaveCount(0);
  }

  // Follow resolves without a 404.
  await header.getByRole("link", { name: "Follow", exact: true }).click();
  await expect(page).toHaveURL(/\/follow$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
