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

// Per-frame sampler for the blueprint-morph contract (§A "never" items):
// installed in the page before the morph, it records over every rAF whether
// (a) two blueprint owners are visible AND spatially disjoint (double-vision —
// co-located owners during the chrome handoff are one rectangle, not two), and
// (b) builder content is visible before the morph lands (phase
// "blueprint-morphing"). Returns the tallies plus the frame count so the test
// can confirm it actually sampled the transition.
async function installMorphSampler(page: import("@playwright/test").Page) {
  await page.evaluate((slug) => {
    const w = window as unknown as {
      __morph?: { doubleVision: number; earlyContent: number; frames: number };
      __morphSampling?: boolean;
    };
    w.__morph = { doubleVision: 0, earlyContent: 0, frames: 0 };
    w.__morphSampling = true;

    const opacityOf = (el: Element | null) =>
      el ? parseFloat(getComputedStyle(el).opacity || "1") : 0;
    const overlaps = (a: DOMRect, b: DOMRect) => {
      const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const inter = ix * iy;
      const minArea = Math.min(a.width * a.height, b.width * b.height) || 1;
      return inter / minArea > 0.5;
    };

    const sample = () => {
      if (!w.__morphSampling) return;
      const m = w.__morph!;
      m.frames++;
      const phase =
        document.querySelector('[data-testid="deck-phase"]')?.textContent ?? null;
      const source = document.querySelector(`[data-testid="deck-blueprint-${slug}"]`);
      const panel = document.querySelector('[data-testid="deck-builder-panel"]');
      const shelf = document.querySelector('[data-testid="deck-shelf"]');

      // Double-vision: both the source blueprint and the builder panel painted
      // (opacity > 0.1) at disjoint positions in the same frame.
      if (source && panel && opacityOf(source) > 0.1 && opacityOf(panel) > 0.1) {
        if (!overlaps(source.getBoundingClientRect(), panel.getBoundingClientRect())) {
          m.doubleVision++;
        }
      }
      // Builder content must not be visible before the morph lands.
      if (shelf && phase === "blueprint-morphing" && opacityOf(shelf) > 0.5) {
        m.earlyContent++;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, SLUG);
}

test("blueprint-morph open/close never double-visions and gates content on builder-open", async ({
  page,
}) => {
  await page.goto(TABLE_PATH);
  await expect(page.getByTestId("deck-phase")).toHaveText("table");

  await installMorphSampler(page);

  // Open morph.
  await page.getByTestId(`deck-blueprint-${SLUG}`).click();
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-builder-panel")).toBeVisible();
  // Content staggers in only after the morph lands.
  await expect(page.getByTestId("deck-shelf")).toHaveCSS("opacity", "1");
  // The morph source stays mounted at opacity 0 — exactly one visible owner.
  await expect(page.getByTestId(`deck-blueprint-${SLUG}`)).toHaveCSS("opacity", "0");

  // Close morph via the dismiss affordance.
  await page.getByTestId("deck-back").click();
  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  await expect(page.getByTestId("deck-builder-panel")).toHaveCount(0);
  await expect(page.getByTestId(`deck-blueprint-${SLUG}`)).toHaveCSS("opacity", "1");

  const result = await page.evaluate(() => {
    const w = window as unknown as {
      __morph: { doubleVision: number; earlyContent: number; frames: number };
      __morphSampling: boolean;
    };
    w.__morphSampling = false;
    return w.__morph;
  });
  expect(result.frames).toBeGreaterThan(0);
  expect(result.doubleVision).toBe(0);
  expect(result.earlyContent).toBe(0);
});

test("blueprint-morph restores focus to the originating blueprint on close", async ({
  page,
}) => {
  // No frame sampler here: a perpetual rAF read-loop competes with the
  // post-commit focus restoration and masks it. The double-vision contract is
  // covered by the sampling test above; this isolates the §A focus guarantee.
  await page.goto(TABLE_PATH);
  await expect(page.getByTestId("deck-phase")).toHaveText("table");

  await page.getByTestId(`deck-blueprint-${SLUG}`).click();
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  await page.getByTestId("deck-back").click();
  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  // Focus returns to the originating blueprint (§A: no focus loss).
  await expect(page.getByTestId(`deck-blueprint-${SLUG}`)).toBeFocused();
});

test("debug harness drives the deck open/close morph via registered drivers (§F)", async ({
  page,
}) => {
  await page.goto(TABLE_PATH);
  await expect(page.getByTestId("deck-phase")).toHaveText("table");

  // The harness is mounted on the deck route (DebugProvider + DebugPanel).
  await page.getByTestId("debug-open").click();

  // openDeck driver taps the first blueprint and runs the real morph callbacks.
  await page.getByTestId("drive-openDeck").click();
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-builder-panel")).toBeVisible();
  await expect(page).toHaveURL(/\/deck\/[^/]+$/);

  // dismissDeck driver closes back to the table.
  await page.getByTestId("drive-dismissDeck").click();
  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  await expect(page.getByTestId("deck-builder-panel")).toHaveCount(0);
});

test("Back during/after open returns to the table", async ({ page }) => {
  await page.goto(TABLE_PATH);
  await expect(page.getByTestId("deck-phase")).toHaveText("table");

  await page.getByTestId(`deck-blueprint-${SLUG}`).click();
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page).toHaveURL(new RegExp(`/deck/${SLUG}$`));

  // Browser Back (popstate) reconciles straight to the table without a remount.
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${TABLE_PATH}$`));
  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  await expect(page.getByTestId("deck-builder-panel")).toHaveCount(0);
});
