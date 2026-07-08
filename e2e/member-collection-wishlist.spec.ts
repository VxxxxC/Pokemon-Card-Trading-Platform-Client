import { test, expect, type Page } from "@playwright/test";
import {
  getMerchantProductDetailFixtures,
  hasBuyerAuthFixtures,
  hasCoreMerchantFixtures,
} from "./fixtures/test-data";
import { getListingMarketplaceFixture } from "./fixtures/supabase-admin";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

async function dismissBlockingOverlays(page: Page): Promise<void> {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

test.describe("Member collection and wishlist", () => {
  test("buyer can star a product and see it on collection page", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only wishlist flow");
    if (!hasBuyerAuthFixtures() || !hasCoreMerchantFixtures()) {
      test.skip(true, "Missing buyer auth or core listing fixtures");
    }

    const { listingId } = getMerchantProductDetailFixtures();
    const fixtureResult = await getListingMarketplaceFixture(listingId!);
    if (!fixtureResult.ok) {
      test.skip(true, fixtureResult.skipReason);
    }
    const fixture = fixtureResult.fixture;

    await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);

    const searchInput = page.getByPlaceholder("搜尋官方卡牌名稱、編號...");
    await searchInput.fill(fixture.searchKeyword);
    await page.getByRole("heading", { name: "大盤市場" }).click();

    const productLink = page
      .locator(`a[href="/marketplace/product/${fixture.productId}"]`)
      .first();
    await expect(productLink).toBeVisible({ timeout: 20_000 });

    const wishlistButton = productLink
      .locator("xpath=ancestor::article[1]")
      .getByRole("button", {
        name: /加入願望清單|從願望清單移除/,
      })
      .first();

    const wishlistLabel = (await wishlistButton.getAttribute("aria-label")) ?? "";
    if (wishlistLabel.includes("加入願望清單")) {
      await wishlistButton.click();
      await expect(page.getByText("已加入願望清單")).toBeVisible({
        timeout: 15_000,
      });
    }

    await page.goto("/profile/user/collection", {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await expect(page.getByText("追蹤願望清單")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(fixture.productName).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("collection page loads holdings and wishlist sections", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only collection smoke");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    await page.goto("/profile/user/collection", {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await expect(page.getByText("追蹤願望清單")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "收錄新卡" })).toBeVisible();
  });
});
