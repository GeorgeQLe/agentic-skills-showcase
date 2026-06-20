import { expect, test } from "@playwright/test";

// A real deduped (claude-variant) card id — the first suggested card of the
// VARD deck, so it is also present in that deck's torn-pack fan.
const CARD_ID = "pack-vard-claude-vard-scan";
const SLUG = "vard";

async function openPackViaBridge(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => Boolean((window as unknown as { __deckPack?: unknown }).__deckPack));
  await page.evaluate(() => {
    (window as unknown as { __deckPack?: { open: () => void } }).__deckPack?.open();
  });
  await expect(page.locator("[data-card-id]").first()).toBeVisible();
}

test("standalone /card/[id] renders the card detail with stats and deck chips", async ({ page }) => {
  await page.goto(`/card/${CARD_ID}`);

  const detail = page.getByTestId("card-detail");
  await expect(detail).toBeVisible();
  await expect(detail).toHaveAttribute("data-card-id", CARD_ID);

  // Full back-face stats are present in the DOM (indexable, flip-independent).
  await expect(page.getByTestId("card-detail-benchmark")).toBeVisible();
  await expect(page.getByTestId("card-detail-decks")).toBeVisible();
  // VARD card → links back to its deck.
  await expect(page.getByTestId(`card-detail-deck-${SLUG}`)).toHaveAttribute("href", `/deck/${SLUG}`);
});

test("unknown /card/[id] returns a 404", async ({ page }) => {
  const response = await page.goto("/card/this-card-does-not-exist");
  expect(response?.status()).toBe(404);
});

test("non-deduped (codex-variant) /card/[id] 404s — only the deduped set is indexed", async ({ page }) => {
  // dynamicParams=false: the codex mirror of a card is not in generateStaticParams,
  // so it must 404 rather than render a duplicate-content page.
  const response = await page.goto("/card/base-codex-afps-status");
  expect(response?.status()).toBe(404);
});

test("fan-card expand opens the intercept modal over the builder, Back dismisses it", async ({ page }) => {
  await page.goto(`/deck/${SLUG}`);

  await expect(page.getByTestId("deck-mount-id")).toHaveText(/^(?!\(hydrating\)).+/);
  const mountId = await page.getByTestId("deck-mount-id").textContent();
  expect(mountId).toBeTruthy();

  await openPackViaBridge(page);

  // The explicit expand control routes to the card detail — intercepted as a
  // modal overlay — without collecting the card.
  const expand = page.getByTestId(`deck-card-expand-${CARD_ID}`);
  await expand.scrollIntoViewIfNeeded();
  await expand.click();

  await expect(page).toHaveURL(new RegExp(`/card/${CARD_ID}$`));
  await expect(page.getByTestId("card-modal")).toBeVisible();
  await expect(page.getByTestId("card-detail")).toHaveAttribute("data-card-id", CARD_ID);

  // The builder stays mounted underneath — the modal renders in a separate slot
  // subtree and never remounts the deck shell.
  await expect(page.getByTestId("deck-builder-panel")).toBeVisible();
  await expect(page.getByTestId("deck-mount-id")).toHaveText(mountId ?? "");
  // Expand is info, not collect: the card did not settle into its slot.
  await expect(page.getByTestId(`deck-slot-card-${CARD_ID}`)).toHaveCount(0);

  // Back dismisses the modal and restores the builder unchanged.
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/deck/${SLUG}$`));
  await expect(page.getByTestId("card-modal")).toHaveCount(0);
  await expect(page.getByTestId("deck-builder-panel")).toBeVisible();
  await expect(page.getByTestId("deck-mount-id")).toHaveText(mountId ?? "");
});
