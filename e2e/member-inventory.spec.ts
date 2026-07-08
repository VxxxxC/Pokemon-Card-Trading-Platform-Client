import { test, expect, type Page } from "@playwright/test";
import { hasChatRealtimeFixtures } from "./fixtures/chat-test-data";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

async function dismissBlockingOverlays(page: Page): Promise<void> {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

test.describe("Member inventory smoke", () => {
  test("seller inventory page lists active listings", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "seller", "Seller-only inventory smoke");
    if (!hasChatRealtimeFixtures()) {
      test.skip(
        true,
        "Missing seller auth, listing fixtures, or SUPABASE_SERVICE_ROLE_KEY",
      );
    }

    await page.goto("/profile/user/inventory", {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);

    await expect(page.locator("#listings-heading")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("所有商品")).toBeVisible();
    await expect(page.getByText(/款 卡牌/)).toBeVisible();
  });
});
