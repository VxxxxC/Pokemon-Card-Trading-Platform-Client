import { test, expect, type Page } from "@playwright/test";
import { hasBuyerAuthFixtures } from "./fixtures/test-data";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

async function dismissBlockingOverlays(page: Page): Promise<void> {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

test.describe("Member dashboard and rewards", () => {
  test("overview loads member dashboard shell", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only dashboard smoke");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    await page.goto("/profile/user", { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);

    await expect(page.getByText("帳戶總積分餘額")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("heading", { name: "每日簽到" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("待處理訂單")).toBeVisible({ timeout: 20_000 });
  });

  test("check-in card reflects gamification stats", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only check-in smoke");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    await page.goto("/profile/user", { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);

    const checkInButton = page.getByRole("button", {
      name: /立即簽到打卡獲取積分|簽到中…|明日請繼續保持收藏習慣/,
    });
    await expect(checkInButton).toBeVisible({ timeout: 20_000 });

    const buttonLabel = (await checkInButton.textContent())?.trim() ?? "";
    if (buttonLabel.includes("明日請繼續保持收藏習慣")) {
      return;
    }

    await checkInButton.click();
    await expect(page.getByText("簽到成功")).toBeVisible({ timeout: 20_000 });
    await expect(checkInButton).toHaveText(/明日請繼續保持收藏習慣/, {
      timeout: 20_000,
    });
  });

  test("rewards page coupon tabs are navigable", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only rewards smoke");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    await page.goto("/profile/user/rewards", { waitUntil: "domcontentloaded" });
    await dismissBlockingOverlays(page);

    await expect(page.getByText("可領取 / 可使用")).toBeVisible({
      timeout: 20_000,
    });

    for (const tabLabel of [
      /可解鎖/,
      /歷史已使用/,
      /不可領用 \(已過期\)/,
    ]) {
      await page.getByRole("button", { name: tabLabel }).click();
      await expect(page.getByRole("button", { name: tabLabel }).first()).toBeVisible();
    }
  });
});
