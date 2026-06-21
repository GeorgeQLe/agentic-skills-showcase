import { expect, test } from "@playwright/test";

// The landing is a guided three-stage journey:
//   Stage 1 SELECT  pick a project/goal → its starter deck
//   Stage 2 OPEN    tear that deck's domain pack allotment (inspect mode)
//   Stage 3 BUILD   the deck blueprint table (DeckDebugHarness → DeckTableShell)
// Stages 1/2 mount-and-animate; Stage 3 is the always-mounted, visibility-
// toggled table (its routing/morph contract is covered by deck-table-shell.spec).

// Real tear gesture on a Stage-2 shelf SealedPack's drag zone (top third).
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

// Drive Select → Build through the bridge to reveal the always-mounted table.
async function revealTable(page: import("@playwright/test").Page, slug: string) {
  await page.waitForFunction(() =>
    Boolean((window as unknown as { __landing?: unknown }).__landing),
  );
  await page.evaluate((s) => {
    const bridge = (window as unknown as {
      __landing?: { select: (x: string) => void; build: () => void };
    }).__landing;
    bridge?.select(s);
    bridge?.build();
  }, slug);
}

test("Stage 1 SELECT shows a project per starter deck", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("landing")).toHaveAttribute("data-stage", "1");
  await expect(page.getByTestId("landing-project-vard")).toBeVisible();
  await expect(page.getByTestId("landing-project-ord")).toBeVisible();
  await expect(page.getByTestId("landing-project-game-afps")).toBeVisible();
});

test("selecting a project advances to Stage 2 OPEN with its pack allotment", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("landing-project-vard").click();

  await expect(page.getByTestId("landing")).toHaveAttribute("data-stage", "2");
  await expect(page.getByTestId("landing-pack-shelf")).toBeVisible();
  await expect(page.getByTestId("landing-counter")).toContainText("Pack 0 of");
  await expect(page.getByTestId("landing-pack-vard")).toBeVisible();

  // Tear the VARD pack — autoOpenOnTear fans it into the bottom sheet in inspect
  // mode: bare flip cards, NO collect affordance (those exist only in builder).
  await tearPack(page, "vard");
  await expect(page.locator(".max-w-4xl .perspective-\\[800px\\]").first()).toBeVisible();
  await expect(page.locator("[data-card-id]")).toHaveCount(0);
  await expect(page.locator(".deck-fan-card")).toHaveCount(0);
  await expect(page.getByTestId("landing-counter")).toContainText("Pack 1 of");
});

test("back nav steps Stage 2 → Stage 1", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("landing-project-vard").click();
  await expect(page.getByTestId("landing")).toHaveAttribute("data-stage", "2");

  await page.getByTestId("landing-stage-back").click();
  await expect(page.getByTestId("landing")).toHaveAttribute("data-stage", "1");
  await expect(page.getByTestId("landing-project-vard")).toBeVisible();
});

test("opening the whole allotment surfaces the hand-off → /deck/<slug>", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("landing-project-vard").click();
  await expect(page.getByTestId("landing-pack-shelf")).toBeVisible();

  // Tearing every pack by hand is slow/flaky; drive the opened set via the bridge.
  await page.evaluate(() => {
    (window as unknown as { __landing?: { openAll: () => void } }).__landing?.openAll();
  });

  await expect(page.getByTestId("landing-handoff")).toBeVisible();
  await expect(page.getByTestId("landing-handoff-starter")).toHaveAttribute(
    "href",
    "/deck/vard",
  );

  // Following the starter hard-loads the builder for that deck.
  await page.getByTestId("landing-handoff-starter").click();
  await expect(page).toHaveURL(/\/deck\/vard$/);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-entry-mode")).toHaveText("hard-load");
});

test("'build in place' goes to Stage 3 BUILD without leaving the page", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("landing-project-vard").click();
  await page.evaluate(() => {
    (window as unknown as { __landing?: { openAll: () => void } }).__landing?.openAll();
  });

  await page.getByTestId("landing-handoff-build").click();
  await expect(page.getByTestId("landing")).toHaveAttribute("data-stage", "3");
  await expect(page.getByTestId("landing-build-stage")).toHaveAttribute(
    "data-stage-active",
    "true",
  );
  await expect(page.getByTestId("deck-blueprint-vard")).toBeVisible();
});

test("the Stage 3 table is the same surface the deck morph uses", async ({
  page,
}) => {
  await page.goto("/");
  await revealTable(page, "vard");
  await expect(page.getByTestId("deck-blueprint-vard")).toBeVisible();

  // The in-place pushState morph works at `/` (full contract in deck-table-shell).
  await page.getByTestId("deck-blueprint-vard").click();
  await expect(page).toHaveURL(/\/deck\/vard$/);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
});
