import { expect, test } from "@playwright/test";

// Phase 4: `/` is the pack-first landing — domain picker + CTA that deals the
// picked domain's sealed-pack allotment, runs each through the PackFlow ritual in
// inspect mode (tap = flip, no collect), then surfaces the hand-off chooser. The
// deck blueprint table is mounted below as the hand-off destination (its routing
// contract is covered by deck-table-shell.spec.ts, which now starts here).

// Real tear gesture on a landing-shelf SealedPack's drag zone (top third).
async function tearPack(
  page: import("@playwright/test").Page,
  slug: string,
) {
  const pack = page.locator(`[data-testid="landing-pack-${slug}"] .w-48.h-64`).first();
  await pack.scrollIntoViewIfNeeded();
  const box = await pack.boundingBox();
  if (!box) throw new Error("landing SealedPack not found");
  const y = box.y + box.height * 0.16; // inside the top-33% drag zone
  await page.mouse.move(box.x + 6, y);
  await page.mouse.down();
  for (let x = 6; x <= box.width + 30; x += 12) {
    await page.mouse.move(box.x + x, y);
  }
  await page.mouse.up();
}

test("picker defaults to business and the CTA reflects the picked allotment", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("landing-domain-business")).toHaveAttribute(
    "data-picked",
    "true",
  );
  await expect(page.getByTestId("landing-cta")).toContainText(
    "Open your Business starter packs",
  );

  // Picking another domain updates the CTA label + sub-label live.
  await page.getByTestId("landing-domain-game").click();
  await expect(page.getByTestId("landing-domain-game")).toHaveAttribute(
    "data-picked",
    "true",
  );
  await expect(page.getByTestId("landing-cta")).toContainText("Open your Game starter packs");
  await expect(page.getByTestId("landing-cta-sub")).toContainText("1 packs");
});

test("CTA deals the allotment, a pack tears open in inspect mode (no collect)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("landing-cta").click();

  // The business allotment is dealt as a shelf of sealed packs; counter at 0/N.
  await expect(page.getByTestId("landing-pack-shelf")).toBeVisible();
  await expect(page.getByTestId("landing-counter")).toContainText("Pack 0 of");
  await expect(page.getByTestId("landing-pack-vard")).toBeVisible();

  // Tear the VARD pack — autoOpenOnTear fans it into the bottom sheet.
  await tearPack(page, "vard");

  // Inspect mode: the fan renders bare flip cards. Crucially there is NO collect
  // affordance — `[data-card-id]` / `.deck-fan-card` only exist in builder mode.
  await expect(page.locator(".max-w-4xl .perspective-\\[800px\\]").first()).toBeVisible();
  await expect(page.locator("[data-card-id]")).toHaveCount(0);
  await expect(page.locator(".deck-fan-card")).toHaveCount(0);

  // The torn pack counts as opened.
  await expect(page.getByTestId("landing-counter")).toContainText("Pack 1 of");
});

test("opening the whole allotment surfaces the hand-off chooser → /deck/<slug>", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("landing-cta").click();
  await expect(page.getByTestId("landing-pack-shelf")).toBeVisible();

  // Tearing every pack by hand is slow/flaky; drive the opened set via the same
  // bridge the journey exposes for tests, then assert the real hand-off UI.
  await page.evaluate(() => {
    (window as unknown as { __landing?: { openAll: () => void } }).__landing?.openAll();
  });

  const handoff = page.getByTestId("landing-handoff");
  await expect(handoff).toBeVisible();
  // Starter = the curated non-AFPS business deck (VARD).
  await expect(page.getByTestId("landing-handoff-starter")).toHaveAttribute(
    "href",
    "/deck/vard",
  );

  // Following the starter lands the hard-loaded builder for that deck.
  await page.getByTestId("landing-handoff-starter").click();
  await expect(page).toHaveURL(/\/deck\/vard$/);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-entry-mode")).toHaveText("hard-load");
});

test("the hand-off 'build a deck' table is the same surface the deck morph uses", async ({
  page,
}) => {
  await page.goto("/");
  // The blueprint table is mounted below the journey from first paint, so a deck
  // blueprint is reachable and its in-place pushState morph works at `/` (the
  // full morph contract is asserted in deck-table-shell.spec.ts).
  await expect(page.getByTestId("landing-table")).toBeVisible();
  await page.getByTestId("deck-blueprint-vard").click();
  await expect(page).toHaveURL(/\/deck\/vard$/);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
});
