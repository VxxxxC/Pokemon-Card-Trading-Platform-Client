import { test, expect, type Page } from "@playwright/test";
import { getProfileIdByEmail } from "./fixtures/supabase-admin";
import { hasBuyerAuthFixtures } from "./fixtures/test-data";
import {
  findLatestUserRewardForTemplate,
  getRewardTemplateIdByTitle,
  gotoMemberRewardsPage,
  publishRewardActivityViaAdmin,
  seedBuyerPointsForE2e,
  waitForPointsRedemptionSectionReady,
} from "./helpers/platform-rewards";

function readEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

function hasAdminAuthFixtures(): boolean {
  return Boolean(readEnv("E2E_ADMIN_EMAIL") && readEnv("E2E_ADMIN_PASSWORD"));
}

async function loginAsAdmin(page: Page): Promise<void> {
  const email = readEnv("E2E_ADMIN_EMAIL");
  const password = readEnv("E2E_ADMIN_PASSWORD");
  if (!email || !password) {
    throw new Error("Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
  }
  await page.goto("/auth");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 30_000,
  });
}

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Platform rewards Phase 4 E2E", () => {
  const templateTitle = `E2E Phase4 Catalog ${Date.now()}`;
  let templateId: string | null = null;
  let buyerUserId: string | null = null;

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(180_000);
    if (testInfo.project.name !== "buyer") {
      return;
    }
    if (!hasAdminAuthFixtures() || !hasBuyerAuthFixtures()) {
      throw new Error("Missing E2E admin/buyer env for Phase 4 bootstrap");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for DB assertions");
    }

    const buyerEmail = readEnv("E2E_BUYER_EMAIL");
    if (!buyerEmail) {
      throw new Error("Missing E2E_BUYER_EMAIL");
    }
    buyerUserId = await getProfileIdByEmail(buyerEmail);
    if (!buyerUserId) {
      throw new Error("Could not resolve buyer profile id");
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAdmin(page);
    await publishRewardActivityViaAdmin(page, {
      title: templateTitle,
      type: "discount_coupon",
      amount: 10,
      minSpend: 0,
      trigger: { kind: "trade_count", role: "buyer", count: 1 },
      redemptionCatalog: { pointsCost: 200, stock: 5 },
    });
    templateId = await getRewardTemplateIdByTitle(templateTitle);
    expect(templateId).toBeTruthy();
    await context.close();
  });

  test("C4.1 member redeems catalog item from rewards page", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only Phase 4");
    if (!buyerUserId || !templateId) {
      throw new Error("Phase 4 bootstrap missing template or buyer");
    }

    await seedBuyerPointsForE2e(buyerUserId, 500);
    await gotoMemberRewardsPage(page);
    await waitForPointsRedemptionSectionReady(page);

    const pointsSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "🪙 積分商城" }),
    });
    const catalogCard = pointsSection
      .locator("div.rounded-2xl")
      .filter({ has: page.getByText(templateTitle, { exact: true }) });
    await expect(catalogCard).toBeVisible({ timeout: 20_000 });
    await expect(catalogCard.getByText("200 PTS")).toBeVisible();

    await catalogCard.getByRole("button", { name: "兌換" }).click();

    await expect
      .poll(
        async () =>
          findLatestUserRewardForTemplate({
            userId: buyerUserId!,
            templateId: templateId!,
          }),
        { timeout: 30_000 },
      )
      .toBeTruthy();
  });

  test("C4.2 redeemed coupon appears in wallet", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only Phase 4");
    if (!buyerUserId || !templateId) {
      throw new Error("Phase 4 bootstrap missing template or buyer");
    }

    const userRewardId = await findLatestUserRewardForTemplate({
      userId: buyerUserId,
      templateId,
    });
    expect(userRewardId).toBeTruthy();

    await gotoMemberRewardsPage(page);
    await expect(page.getByText("可領取 / 可使用")).toBeVisible({
      timeout: 20_000,
    });

    await expect
      .poll(async () => {
        const tabLabel = await page
          .getByRole("button", { name: /可領取 \/ 可使用/ })
          .textContent();
        const match = tabLabel?.match(/\((\d+)\)/);
        return Number(match?.[1] ?? 0);
      })
      .toBeGreaterThan(0);

    const redeemList = page.locator("#redeem-list");
    const hasVoucher = await redeemList
      .getByText("VOUCHER TOKEN")
      .first()
      .isVisible()
      .catch(() => false);
    const hasTitle = await redeemList
      .getByText(templateTitle)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasVoucher || hasTitle).toBe(true);
  });
});
