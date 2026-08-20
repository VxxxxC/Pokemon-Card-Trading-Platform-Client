import { test, expect } from "@playwright/test";
import {
  buildPublicProfilePath,
  getMerchantProductDetailFixtures,
  hasPublicProfileFixtures,
} from "./fixtures/test-data";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

async function dismissBlockingOverlays(page: import("@playwright/test").Page) {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

test.describe("Public rating list page", () => {
  test("guest sees rating list with sort controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only rating page");
    if (!hasPublicProfileFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    await page.goto(`${buildPublicProfilePath(sellerId!)}/rating`, {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await expect(page.getByText("全量信用評價歷史")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("combobox").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("buyer can open rating list from public profile", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only rating navigation");
    if (!hasPublicProfileFixtures()) {
      test.skip(true, "Missing public profile fixtures");
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    await page.goto(buildPublicProfilePath(sellerId!), {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await page.getByRole("link", { name: "查看更多評價 →" }).click();
    await expect(page).toHaveURL(/\/rating/);
    await expect(page.getByText("全量信用評價歷史")).toBeVisible({
      timeout: 20_000,
    });
  });
});
