import { expect, test } from "@playwright/test";

const TABLE_PATH = "/prototype/deck-routing-spike";
const SLUG = "market-intel";

test("pushState routing opens/closes the builder and keeps the shell mounted", async ({
  page,
}) => {
  await page.goto(TABLE_PATH);

  await expect(page.getByTestId("deck-pathname")).toHaveText(TABLE_PATH);
  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  // Mount id is assigned after hydration (the hydration-mismatch fix).
  await expect(page.getByTestId("deck-mount-id")).toHaveText(/^(?!\(hydrating\)).+/);
  const mountId = await page.getByTestId("deck-mount-id").textContent();
  expect(mountId).toBeTruthy();

  await page.getByTestId(`deck-blueprint-${SLUG}`).click();

  await expect(page).toHaveURL(new RegExp(`/deck/${SLUG}$`));
  await expect(page.getByTestId("deck-pathname")).toHaveText(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-active-slug")).toHaveText(SLUG);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-builder-panel")).toBeVisible();
  // Shell identity is stable across the shallow pushState.
  await expect(page.getByTestId("deck-mount-id")).toHaveText(mountId ?? "");

  // Browser Back via popstate returns to the table without a remount.
  await page.goBack();

  await expect(page).toHaveURL(new RegExp(`${TABLE_PATH}$`));
  await expect(page.getByTestId("deck-pathname")).toHaveText(TABLE_PATH);
  await expect(page.getByTestId("deck-active-slug")).toHaveText("(none)");
  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  await expect(page.getByTestId("deck-builder-panel")).toHaveCount(0);
  await expect(page.getByTestId("deck-mount-id")).toHaveText(mountId ?? "");
});

test("hard-loaded /deck/[slug] renders the builder in builder-open", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);

  await expect(page.getByTestId("deck-entry-mode")).toHaveText("hard-load");
  await expect(page.getByTestId("deck-pathname")).toHaveText(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-active-slug")).toHaveText(SLUG);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-builder-panel")).toBeVisible();
});
