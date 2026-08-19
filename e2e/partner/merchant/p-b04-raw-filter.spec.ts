// @partner-id P-B04
// @features F-C-02
// @path Partner

import { test, expect } from "@playwright/test";
import { hasMemberTradingFixtures } from "../../fixtures/test-data";
import { ensureMerchantPersona } from "../../helpers/collection-asset";
import { dismissBlockingOverlays } from "../../helpers/overlays";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(90_000);

test.describe("P-B04 merchant trading RAW filter", () => {
  test("只顯示 RAW/裸卡 hides graded PSA/BGS/CGC rows", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "seller",
      "Seller-only merchant RAW filter",
    );
    test.skip(!hasMemberTradingFixtures(), "Missing seller auth");

    await ensureMerchantPersona(page);
    await page.goto("/profile/merchant/trading", {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await expect(
      page.getByRole("heading", { name: /交易管理/ }),
    ).toBeVisible({ timeout: 20_000 });
    const gradedRow = page
      .locator("a, div")
      .filter({ hasText: /\b(PSA|BGS|CGC|ARS)\s/ })
      .first();
    test.skip(
      !(await gradedRow.isVisible().catch(() => false)),
      "No graded merchant order in list to prove RAW filter",
    );

    await page.locator("label").filter({ hasText: "只顯示 RAW/裸卡" }).click();
    await expect(
      page.getByText(/\b(PSA|BGS|CGC|ARS)\s/).first(),
    ).toHaveCount(0);
  });
});
