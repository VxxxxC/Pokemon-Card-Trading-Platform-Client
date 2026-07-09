import { test, expect } from "@playwright/test";
import { hasMemberTradingFixtures } from "./fixtures/test-data";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

test.describe("Merchant trading dashboard", () => {
  test("seller merchant trading page loads tabs and search", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "seller", "Seller-only merchant trading");
    if (!hasMemberTradingFixtures()) {
      test.skip(true, "Missing seller auth or trading fixtures");
    }

    await page.goto("/profile/merchant/trading", {
      waitUntil: "domcontentloaded",
    });

    for (const label of ["全部", "待處理", "已完成", "已取消"]) {
      await expect(page.getByRole("button", { name: label }).first()).toBeVisible({
        timeout: 20_000,
      });
    }

    await expect(
      page.getByPlaceholder("輸入卡牌名稱、卡號、交易對手姓名或訂單ID..."),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
