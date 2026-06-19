import { expect, test } from "@playwright/test";

const TABLE_PATH = "/prototype/deck-routing-spike";
const SLUG = "market-intel";

// The card-flight source is now the torn-pack fan. The adapted flight specs fan
// the pack through the window bridge BuilderPackFlow exposes (the same hook the
// Vitest suite uses), then wait for the fanned cards to mount.
async function openPackViaBridge(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => Boolean((window as unknown as { __deckPack?: unknown }).__deckPack));
  await page.evaluate(() => {
    (window as unknown as { __deckPack?: { open: () => void } }).__deckPack?.open();
  });
  await expect(page.locator("[data-card-id]").first()).toBeVisible();
}

// Real tear gesture on the SealedPack drag zone (top third), dragging past the
// 120 px threshold so completeTear fires and (autoOpenOnTear) the fan opens.
async function tearPack(page: import("@playwright/test").Page) {
  const pack = page.locator(".deck-pack-flow .w-48.h-64").first();
  // The builder sits below the table grid, so the pack starts below the fold —
  // scroll it into the viewport before the mouse can reach its drag zone.
  await pack.scrollIntoViewIfNeeded();
  const box = await pack.boundingBox();
  if (!box) throw new Error("SealedPack not found");
  const y = box.y + box.height * 0.16; // inside the top-33% drag zone
  await page.mouse.move(box.x + 6, y);
  await page.mouse.down();
  for (let x = 6; x <= box.width + 30; x += 12) {
    await page.mouse.move(box.x + x, y);
  }
  await page.mouse.up();
}

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
      const shelf = document.querySelector('[data-testid="deck-pack-flow"]');

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
  await expect(page.getByTestId("deck-pack-flow")).toHaveCSS("opacity", "1");
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

  await openPackViaBridge(page);
  const firstCard = page.locator('.deck-fan-card[data-collected="false"]').first();
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

  await openPackViaBridge(page);
  const firstCard = page.locator('.deck-fan-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");
  const sameCard = page.locator(`[data-card-id="${id}"]`);

  await sameCard.click(); // commit + launch
  await sameCard.click(); // re-tap (collected/in-flight): ignored

  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);
  // The card appears in exactly one slot.
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toHaveCount(1);
});

test("card-flight: collect then close persists the optimistic commit, no orphan clones", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  await openPackViaBridge(page);
  const firstCard = page.locator('.deck-fan-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");

  await firstCard.click(); // commit + launch (lands fast)
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);

  // The fan sheet's scrim covers the builder, so dismiss the pack before Back is
  // reachable; closeDeck then runs finishAllFlightsImmediately() before dismiss.
  await page.evaluate(() => {
    (window as unknown as { __deckPack?: { close: () => void } }).__deckPack?.close();
  });
  await expect(page.getByTestId("deck-pack-phase")).toHaveText("sealed");
  await page.getByTestId("deck-back").click();

  await expect(page.getByTestId("deck-phase")).toHaveText("table");
  // No orphaned clones survive.
  await expect(page.locator(".deck-flight-clone")).toHaveCount(0);

  // The optimistic commit persisted (localStorage) — reopening shows it collected.
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await openPackViaBridge(page);
  await expect(page.locator(`[data-card-id="${id}"]`)).toHaveAttribute("data-collected", "true");
});

test("card-flight: add-all commits every card and lands the whole batch", async ({ page }) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  await openPackViaBridge(page);
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

  await openPackViaBridge(page);
  const firstCard = page.locator('.deck-fan-card[data-collected="false"]').first();
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

  await openPackViaBridge(page);
  const total = await page.locator("[data-card-id]").count();
  await page.getByTestId("debug-open").click();

  // flyCard taps the first uncollected fan card through its real handler.
  await page.getByTestId("drive-flyCard").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);

  // flyAll launches the staggered batch for the rest.
  await page.getByTestId("drive-flyAll").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(
    new RegExp(`^${total} / ${total} `),
  );
  await expect(page.locator(".deck-flight-clone")).toHaveCount(0);
});

test("pack ritual: tear the pack -> fan opens -> tapping a card flies it to its slot", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("deck-pack-phase")).toHaveText("sealed");

  // Real drag tear of the SealedPack — the signature ritual, end to end.
  await tearPack(page);

  // autoOpenOnTear fans the deck into the BottomSheet; the fanned cards mount.
  await expect(page.getByTestId("deck-pack-phase")).toHaveText("drawer-open");
  const firstCard = page.locator('.deck-fan-card[data-collected="false"]').first();
  await expect(firstCard).toBeVisible();
  const id = await firstCard.getAttribute("data-card-id");
  expect(id).toBeTruthy();

  // Tap a fanned card: optimistic commit + a clone flies to its phase slot.
  await firstCard.click();
  await expect(page.locator(`[data-card-id="${id}"]`)).toHaveAttribute("data-collected", "true");
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(/^1 \//);
  await expect(page.locator(".deck-flight-clone")).toHaveCount(0);
});

test("wanted rim: empty-phase card glows; rim is gone once it is collected", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  await openPackViaBridge(page);
  const firstCard = page.locator('.deck-fan-card[data-wanted="true"]').first();
  await expect(firstCard).toBeVisible();
  const id = await firstCard.getAttribute("data-card-id");
  expect(id).toBeTruthy();
  // The rim is a real teal box-shadow, not just the data flag.
  await expect(firstCard).not.toHaveCSS("box-shadow", "none");

  // Collecting it clears the rim: a collected card never glows.
  await firstCard.click();
  await expect(page.getByTestId(`deck-slot-card-${id}`)).toBeVisible();
  await expect(page.locator(`[data-card-id="${id}"]`)).toHaveAttribute("data-wanted", "false");
  await expect(page.locator(`.deck-fan-card[data-card-id="${id}"]`)).toHaveCSS(
    "box-shadow",
    "none",
  );
});

test("overlay row: visible in the builder with the fan closed, updates after a collect", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  // The row is present before the pack is ever torn open — its empty state shows.
  await expect(page.getByTestId("deck-overlay-row")).toBeVisible();
  await expect(page.getByTestId("deck-overlay-empty")).toBeVisible();

  await openPackViaBridge(page);
  const firstCard = page.locator('.deck-fan-card[data-collected="false"]').first();
  const id = await firstCard.getAttribute("data-card-id");
  expect(id).toBeTruthy();

  await firstCard.click();
  // The chip lands once the flight settles, mirroring the slot fill.
  await expect(page.getByTestId(`deck-overlay-chip-${id}`)).toBeVisible();
  await expect(page.getByTestId("deck-overlay-empty")).toHaveCount(0);

  // Collapse the fan: the overlay row persists as the always-on deck readout.
  await page.evaluate(() => {
    (window as unknown as { __deckPack?: { close: () => void } }).__deckPack?.close();
  });
  await expect(page.getByTestId("deck-pack-phase")).toHaveText("sealed");
  await expect(page.getByTestId("deck-overlay-row")).toBeVisible();
  await expect(page.getByTestId(`deck-overlay-chip-${id}`)).toBeVisible();
});

test("CLI panel: visible locked in the builder, unlocks with a copy affordance after collect-all", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  // The destination is visible from the first frame in a locked state: command
  // shown, copy affordance withheld behind a "N more to unlock" hint.
  const panel = page.getByTestId("deck-cli-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-unlocked", "false");
  await expect(page.getByTestId("deck-cli-command")).toHaveText(
    `npx skillpacks install-deck ${SLUG}`,
  );
  await expect(page.getByTestId("deck-cli-lock")).toBeVisible();
  await expect(page.getByTestId("deck-cli-copy")).toHaveCount(0);

  // Collect every card: the whole batch lands and the panel unlocks.
  await openPackViaBridge(page);
  const total = await page.locator("[data-card-id]").count();
  await page.getByTestId("deck-collect-all").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(
    new RegExp(`^${total} / ${total} `),
  );

  await expect(panel).toHaveAttribute("data-unlocked", "true");
  await expect(page.getByTestId("deck-cli-lock")).toHaveCount(0);
  await expect(page.getByTestId("deck-cli-copy")).toBeVisible();
});

test("completion: collecting every card reveals the deck-complete output panel", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  // No completion panel while the deck is incomplete.
  await expect(page.getByTestId("deck-completion")).toHaveCount(0);

  await openPackViaBridge(page);
  const total = await page.locator("[data-card-id]").count();
  await page.getByTestId("deck-collect-all").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(
    new RegExp(`^${total} / ${total} `),
  );

  // The deck completes: the panel gathers + flips to reveal the output back.
  const completion = page.getByTestId("deck-completion");
  await expect(completion).toBeVisible();
  await expect(completion).toHaveAttribute("data-revealed", "true");
  await expect(page.getByTestId("deck-completion-command")).toHaveText(
    `npx skillpacks install-deck ${SLUG}`,
  );
  await expect(page.getByTestId("deck-completion-download")).toBeVisible();
  await expect(page.getByTestId("deck-completion-share")).toBeVisible();

  // Collapse the fan so its sheet scrim no longer covers the builder, then dismiss
  // the celebration via keep editing; the always-on CLI panel remains.
  await page.evaluate(() => {
    (window as unknown as { __deckPack?: { close: () => void } }).__deckPack?.close();
  });
  await expect(page.getByTestId("deck-pack-phase")).toHaveText("sealed");
  await page.getByTestId("deck-completion-keep").click();
  await expect(page.getByTestId("deck-completion")).toHaveCount(0);
  await expect(page.getByTestId("deck-cli-panel")).toBeVisible();
});

test("completion gather: settled slot cards fly into the stack, then the stack flips to reveal", async ({
  page,
}) => {
  await page.goto(`/deck/${SLUG}`);
  await expect(page.getByTestId("deck-phase")).toHaveText("builder-open");

  await openPackViaBridge(page);
  const total = await page.locator("[data-card-id]").count();

  // Sample over every rAF for gather clones painting (.deck-flight-clone with a
  // gather-* id) and whether the stack ever revealed before any gather clone was
  // seen (the flip must follow the gather, not precede it).
  await page.evaluate(() => {
    const w = window as unknown as {
      __gather?: { cloneFrames: number; revealedBeforeClone: number; frames: number };
      __gatherSampling?: boolean;
    };
    w.__gather = { cloneFrames: 0, revealedBeforeClone: 0, frames: 0 };
    w.__gatherSampling = true;
    let everSawClone = false;
    const sample = () => {
      if (!w.__gatherSampling) return;
      const g = w.__gather!;
      g.frames++;
      const clone = document.querySelector('.deck-flight-clone[data-testid^="deck-flight-clone-gather-"]');
      const completion = document.querySelector('[data-testid="deck-completion"]');
      const revealed = completion?.getAttribute("data-revealed") === "true";
      if (clone) {
        g.cloneFrames++;
        everSawClone = true;
      }
      if (revealed && !everSawClone) g.revealedBeforeClone++;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  // Complete the deck — the gather launches, then the stack flips.
  await page.getByTestId("deck-collect-all").click();
  await expect(page.getByTestId("deck-collected-count")).toHaveText(
    new RegExp(`^${total} / ${total} `),
  );

  const completion = page.getByTestId("deck-completion");
  await expect(completion).toBeVisible();
  // The flip follows the gather: the stack reveals the output back.
  await expect(completion).toHaveAttribute("data-revealed", "true");
  await expect(page.getByTestId("deck-completion-command")).toHaveText(
    `npx skillpacks install-deck ${SLUG}`,
  );

  const result = await page.evaluate(() => {
    const w = window as unknown as {
      __gather: { cloneFrames: number; revealedBeforeClone: number; frames: number };
      __gatherSampling: boolean;
    };
    w.__gatherSampling = false;
    return w.__gather;
  });
  expect(result.frames).toBeGreaterThan(0);
  // The gather clones painted...
  expect(result.cloneFrames).toBeGreaterThan(0);
  // ...and the reveal never preceded the gather.
  expect(result.revealedBeforeClone).toBe(0);
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
