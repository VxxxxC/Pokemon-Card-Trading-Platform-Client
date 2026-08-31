import { test, expect } from "@playwright/test";
import {
  buildMerchantProductDetailPath,
  getMerchantProductDetailFixtures,
  hasBuyerAuthFixtures,
  hasCoreMerchantFixtures,
} from "./fixtures/test-data";
import { resolveE2eMarketplaceFixture } from "./fixtures/supabase-admin";
import { dismissBlockingOverlays } from "./helpers/overlays";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

test.describe("Member auth redirect and settings", () => {
  test("guest buy lock redirects to auth and returns after login", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only auth redirect");
    if (!hasCoreMerchantFixtures() || !hasBuyerAuthFixtures()) {
      test.skip(true, "Missing listing or buyer auth fixtures for redirect flow");
    }

    const fixtureResult = await resolveE2eMarketplaceFixture();
    if (!fixtureResult.ok) {
      test.skip(true, fixtureResult.skipReason);
      return;
    }
    const { sellerId, listingId } = fixtureResult.fixture;
    const { buyerEmail, buyerPassword } = getMerchantProductDetailFixtures();
    const detailPath = buildMerchantProductDetailPath(sellerId, listingId);

    await page.goto(detailPath, { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);
    await expect(page.locator("main h1")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("店主獨立出讓一口價")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /立即購買/ }).click();

    await expect(page.getByText("登入後方可交易")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText("請先登入會員以活化平台第三方雙向鑑定與託管出價機制。"),
    ).toBeVisible();
    const loginLink = page.getByRole("alertdialog").getByText("登入 / 註冊");
    await expect(loginLink).toBeVisible();

    const href = await loginLink.evaluate((el) => {
      const anchor = el.closest("a");
      return anchor?.getAttribute("href") ?? el.getAttribute("href");
    });
    expect(href).toContain("/auth?redirect=");

    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(buyerEmail!);
    await page.locator('input[name="password"]').fill(buyerPassword!);
    await page.locator('form button[type="submit"]').click();

    await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
      timeout: 45_000,
    });

    await page.goto(detailPath, { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);
    await page.getByRole("button", { name: /立即購買/ }).click();
    await expect(page.getByText("登入後方可交易")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "確認立即購買" }),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("buyer can update profile settings", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only settings save");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    const uniqueSuffix = Date.now().toString().slice(-6);
    const nextDisplayName = `E2E Member ${uniqueSuffix}`;
    const nextShortDescription = `Automated settings check ${uniqueSuffix}`;

    await page.goto("/profile/user/settings", {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await page.locator('input[name="displayName"]').fill(nextDisplayName);
    await page.locator('textarea[name="shortDescription"]').fill(
      nextShortDescription,
    );
    await page.getByRole("button", { name: "儲存更改" }).click();

    await expect(page.locator("[data-sonner-toast]").filter({
      hasText: "個人資料及收款資料已更新",
    })).toBeVisible({ timeout: 20_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('input[name="displayName"]')).toHaveValue(
      nextDisplayName,
    );
    await expect(page.locator('textarea[name="shortDescription"]')).toHaveValue(
      nextShortDescription,
    );
  });
});
