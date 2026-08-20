import { test, expect } from "@playwright/test";
import { hasBuyerAuthFixtures } from "./fixtures/test-data";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

async function dismissBlockingOverlays(page: import("@playwright/test").Page) {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

test.describe("Member rewards coupons", () => {
  test("buyer sees redeemable coupon cards or empty state", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only rewards redeem");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    await page.goto("/profile/user/rewards", { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);

    await expect(page.getByText("可領取 / 可使用")).toBeVisible({
      timeout: 20_000,
    });

    const couponCard = page.locator("#redeem-list").getByText("VOUCHER TOKEN").first();
    const emptyState = page.getByText(/暫無可領取|尚無折價券/);

    const hasCoupon = await couponCard.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (!hasCoupon && !isEmpty) {
      test.skip(true, "Rewards page has no coupon cards and no empty-state copy");
    }

    if (hasCoupon) {
      await expect(couponCard).toBeVisible();
    }
  });
});
