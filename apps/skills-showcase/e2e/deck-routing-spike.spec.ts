import { expect, test } from "@playwright/test";

test("native pushState updates usePathname without remounting the shell", async ({
  page,
}) => {
  await page.goto("/prototype/deck-routing-spike");

  await expect(page.getByTestId("spike-pathname")).toHaveText(
    "/prototype/deck-routing-spike",
  );
  await expect(page.getByTestId("spike-phase")).toHaveText("table");
  await expect(page.getByTestId("spike-mount-id")).toHaveText(
    /^(?!\(hydrating\)).+/,
  );

  const mountId = await page.getByTestId("spike-mount-id").textContent();
  expect(mountId).toBeTruthy();

  await page.getByTestId("spike-open-deck").click();

  await expect(page).toHaveURL(/\/deck\/devtool-afps$/);
  await expect(page.getByTestId("spike-pathname")).toHaveText(
    "/deck/devtool-afps",
  );
  await expect(page.getByTestId("spike-route-deck")).toHaveText(
    "devtool-afps",
  );
  await expect(page.getByTestId("spike-active-deck")).toHaveText(
    "devtool-afps",
  );
  await expect(page.getByTestId("spike-phase")).toHaveText("builder-open");
  await expect(page.getByTestId("spike-mount-id")).toHaveText(mountId ?? "");

  await page.getByTestId("spike-browser-back").click();

  await expect(page).toHaveURL(/\/prototype\/deck-routing-spike$/);
  await expect(page.getByTestId("spike-pathname")).toHaveText(
    "/prototype/deck-routing-spike",
  );
  await expect(page.getByTestId("spike-active-deck")).toHaveText("(none)");
  await expect(page.getByTestId("spike-phase")).toHaveText("table");
  await expect(page.getByTestId("spike-pop-count")).toHaveText("1");
  await expect(page.getByTestId("spike-mount-id")).toHaveText(mountId ?? "");
});

test("hard-loaded deck route initializes the builder-open phase", async ({
  page,
}) => {
  await page.goto("/deck/devtool-afps");

  await expect(page.getByTestId("spike-entry-mode")).toHaveText("hard-load");
  await expect(page.getByTestId("spike-pathname")).toHaveText(
    "/deck/devtool-afps",
  );
  await expect(page.getByTestId("spike-route-deck")).toHaveText(
    "devtool-afps",
  );
  await expect(page.getByTestId("spike-active-deck")).toHaveText(
    "devtool-afps",
  );
  await expect(page.getByTestId("spike-phase")).toHaveText("builder-open");
});
