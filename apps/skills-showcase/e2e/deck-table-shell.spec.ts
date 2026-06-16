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

// Per-frame sampler for the card-flight contract (§B "never" items). Records,
// over every rAF: whether a clone is painted, whether the FlightLayer keeps its
// fixed / pointer-events-none / z-70 / portaled-to-body invariant, whether any
// clone leaves the viewport (clip risk), and whether the target slot ever fills
// while a clone is still flying (slot must fill only on land).
async function installFlightSampler(
  page: import("@playwright/test").Page,
  slotTestId: string,
) {
  await page.evaluate((slotId) => {
    const w = window as unknown as {
      __flight?: {
        cloneFrames: number;
        clipped: number;
        slotBeforeLand: number;
        layerSeen: number;
        layerOk: number;
      };
      __flightSampling?: boolean;
    };
    w.__flight = { cloneFrames: 0, clipped: 0, slotBeforeLand: 0, layerSeen: 0, layerOk: 0 };
    w.__flightSampling = true;
    const sample = () => {
      if (!w.__flightSampling) return;
      const f = w.__flight!;
      const layer = document.querySelector('[data-testid="deck-flight-layer"]');
      const clone = document.querySelector(".deck-flight-clone");
      const slot = document.querySelector(`[data-testid="${slotId}"]`);
      if (layer) {
        f.layerSeen++;
        const cs = getComputedStyle(layer);
        if (
          cs.position === "fixed" &&
          cs.pointerEvents === "none" &&
          cs.zIndex === "70" &&
          layer.parentElement === document.body
        ) {
          f.layerOk++;
        }
      }
      if (clone) {
        f.cloneFrames++;
        const r = clone.getBoundingClientRect();
        if (r.left < -2 || r.top < -2 || r.right > innerWidth + 2 || r.bottom > innerHeight + 2) {
          f.clipped++;
        }
        if (slot) f.slotBeforeLand++;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, slotTestId);
}

test("card-flight: clone overlays above the sheet without clipping and fills the slot only on land", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  const firstCard = page.locator('.deck-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");
  expect(id).toBeTruthy();

  await installFlightSampler(page, `deck-slot-card-${id}`);

  await firstCard.click();

  // Commit is optimistic from the tap frame...
  await expect(page.locator(`[data-card-id="${id}"]`)).toHaveAttribute("data-collected", "true");
  // ...the slot fills and the counter ticks only once the clone lands.
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);

  const result = await page.evaluate(() => {
    const w = window as unknown as {
      __flight: { cloneFrames: number; clipped: number; slotBeforeLand: number; layerSeen: number; layerOk: number };
      __flightSampling: boolean;
    };
    w.__flightSampling = false;
    return w.__flight;
  });
  expect(result.cloneFrames).toBeGreaterThan(0);
  expect(result.clipped).toBe(0);
  expect(result.slotBeforeLand).toBe(0);
  expect(result.layerSeen).toBeGreaterThan(0);
  expect(result.layerOk).toBe(result.layerSeen);
});

test("card-flight: re-tap of a collected/in-flight card is a no-op", async ({ page }) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  const firstCard = page.locator('.deck-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");
  const sameCard = page.locator(`[data-card-id="${id}"]`);

  await sameCard.click(); // commit + launch
  await sameCard.click(); // re-tap (collected/in-flight): ignored

  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);
  // The card appears in exactly one slot.
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toHaveCount(1);
});

test("card-flight: close mid-flight flushes clones and persists the optimistic commit", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  const firstCard = page.locator('.deck-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");

  await firstCard.click(); // commit + launch
  await page.getByTestId("deck-back").click(); // finishAllFlightsImmediately() then dismiss

  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  // No orphaned clones survive the flush.
  await expect(page.locator(".deck-flight-clone")).toHaveCount(0);

  // The optimistic commit persisted (localStorage) — reopening shows it collected.
  await page.goto(`/deck/${SLUG}`);
  await expect(page.locator(`[data-card-id="${id}"]`)).toHaveAttribute("data-collected", "true");
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
});

test("card-flight: add-all commits every card and lands the whole batch", async ({ page }) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  const total = await page.locator("[data-card-id]").count();
  expect(total).toBeGreaterThan(1);

  await page.getByTestId("deck-collect-all").click();

  // Every card commits up front, so the batch button disables immediately.
  await expect(page.getByTestId("deck-collect-all")).toBeDisabled();
  // The staggered batch lands every clone; the counter reconciles to N / N.
  await expect(page.getByTestId("deck-collected-count")).toHaveText(
    new RegExp(`^${total} / ${total} `),
  );
  await expect(page.locator(".deck-flight-clone")).toHaveCount(0);
});

test("card-flight reduced motion: fills the slot with no clone, counter ticks at once", async ({
  page,
}) => {
  // page.emulateMedia drives the CDP override reliably (matchMedia reflects it);
  // the shell reads prefers-reduced-motion via matchMedia on mount.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  const firstCard = page.locator('.deck-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");

  // Sampler: prove no clone is ever painted (§E "card-flight mounts no clone").
  await page.evaluate(() => {
    const w = window as unknown as { __noClone?: number; __sampling?: boolean };
    w.__noClone = 0;
    w.__sampling = true;
    const sample = () => {
      if (!w.__sampling) return;
      if (document.querySelector(".deck-flight-clone")) w.__noClone!++;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  await firstCard.click();

  // Slot fills and the counter ticks in the same frame — no flight to wait on.
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);

  const cloneFrames = await page.evaluate(() => {
    const w = window as unknown as { __noClone: number; __sampling: boolean };
    w.__sampling = false;
    return w.__noClone;
  });
  expect(cloneFrames).toBe(0);
});

test("debug harness drives card-flight via flyCard/flyAll drivers (§F)", async ({ page }) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  const total = await page.locator("[data-card-id]").count();
  await page.getByTestId("debug-open").click();

  // flyCard taps the first uncollected shelf card through its real handler.
  await page.getByTestId("drive-flyCard").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);

  // flyAll launches the staggered batch for the rest.
  await page.getByTestId("drive-flyAll").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(
    new RegExp(`^${total} / ${total} `),
  );
  await expect(page.locator(".deck-flight-clone")).toHaveCount(0);
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
