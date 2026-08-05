import { test, expect, type Page } from "@playwright/test";
import {
  assertListingIsActiveMerchant,
  buyMerchantListingWithAuthAndReachCheckout,
  completeMerchantAuthCheckout,
  completeMerchantDirectCheckout,
  findActiveDiscountCouponTemplateId,
  findActiveFreeShippingTemplateId,
  findActiveMerchantListingForE2e,
  findPendingMerchantOrderForListing,
  getMerchantOrderCouponSnapshot,
  getRewardTemplateIdByTitle,
  getUserRewardRow,
  grantUserRewardForE2e,
  reactivateListingForE2e,
  setListingAuthenticationForE2e,
} from "./helpers/platform-rewards";
import { getProfileIdByEmail } from "./fixtures/supabase-admin";
import {
  buildMerchantProductDetailPath,
  getMerchantProductDetailFixtures,
  hasBuyerAuthFixtures,
  hasCoreMerchantFixtures,
} from "./fixtures/test-data";
import { dismissBlockingOverlays } from "./helpers/member-trading";

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

async function publishFreeShippingTemplate(
  page: Page,
  title: string,
): Promise<void> {
  await page.goto("/admin/campaigns", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "新增模板" })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "新增模板" }).click();

  const wizard = page.locator('[data-slot="dialog-content"]');
  await expect(wizard).toBeVisible({ timeout: 15_000 });
  await expect(wizard.getByText(/新增獎勵模板/)).toBeVisible();

  await wizard.locator("#template-title").fill(title);
  await wizard.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "免運券" }).click();
  await wizard.locator("#reward-max-subsidy").fill("30");

  await wizard.getByRole("button", { name: "下一步" }).click();
  await wizard.getByRole("button", { name: "下一步" }).click();
  await wizard.getByRole("button", { name: "發布" }).click();

  await expect(page.getByText("已發布模板")).toBeVisible({ timeout: 30_000 });
  await expect(wizard).toBeHidden({ timeout: 15_000 });
}

async function buyMerchantListingAndReachCheckout(
  page: Page,
  sellerId: string,
  listingId: string,
): Promise<string> {
  await page.goto(buildMerchantProductDetailPath(sellerId, listingId), {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);
  await expect(page.locator("main h1")).toBeVisible({ timeout: 15_000 });

  const buyButton = page.getByRole("button", { name: /立即購買/ });
  await expect(buyButton).toBeEnabled({ timeout: 15_000 });
  await buyButton.click();

  const dialog = page.getByRole("alertdialog", { name: "確認立即購買" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole("button", { name: "確認立即購買" }).click();

  const navigatedToCheckout = await page
    .waitForURL(/\/checkout\//, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedToCheckout) {
    let pendingOrderId: string | null = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      pendingOrderId = await findPendingMerchantOrderForListing(listingId);
      if (pendingOrderId) {
        break;
      }
      await page.waitForTimeout(500);
    }
    if (!pendingOrderId) {
      throw new Error(
        "Buy now did not navigate to checkout and no pending order was created",
      );
    }
    await page.goto(`/checkout/${pendingOrderId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  await page.waitForURL(/\/checkout\//, { timeout: 15_000 });
  const orderId =
    page.url().match(/\/checkout\/([^/?#]+)/)?.[1]?.trim() ?? "";
  expect(orderId.length).toBeGreaterThan(0);
  return orderId;
}

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Platform rewards Phase 2 E2E", () => {
  const templateTitle = `E2E Phase2 Free Ship ${Date.now()}`;
  let templateId: string | null = null;
  let couponRewardId: string | null = null;
  let orderId: string | null = null;

  test.beforeAll(async () => {
    test.skip(
      !hasAdminAuthFixtures() ||
        !hasBuyerAuthFixtures() ||
        !hasCoreMerchantFixtures(),
      "Missing E2E admin/buyer/merchant listing env",
    );
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip(true, "Missing SUPABASE_SERVICE_ROLE_KEY for DB assertions");
    }
    templateId = await findActiveFreeShippingTemplateId();
  });

  test("A1–A3 admin publishes free-shipping template via wizard", async ({
    browser,
  }) => {
    test.skip(!hasAdminAuthFixtures(), "Missing admin credentials");

    templateId = await findActiveFreeShippingTemplateId();
    if (templateId) {
      return;
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAdmin(page);
    await publishFreeShippingTemplate(page, templateTitle);
    templateId = await getRewardTemplateIdByTitle(templateTitle);
    expect(templateId).toBeTruthy();
    await context.close();
  });

  test("B1 free-shipping checkout applies platform subsidy", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");
    test.skip(!templateId, "Template not created in prior step");

    const fixtures = getMerchantProductDetailFixtures();
    const buyerEmail = fixtures.buyerEmail!;
    const buyerId = await getProfileIdByEmail(buyerEmail);
    expect(buyerId).toBeTruthy();

    const merchantListing = await findActiveMerchantListingForE2e({
      excludeSellerId: buyerId!,
    });
    const listingId = merchantListing.listingId;
    const sellerId = merchantListing.sellerId;
    await reactivateListingForE2e(listingId);
    await assertListingIsActiveMerchant(listingId);

    couponRewardId = await grantUserRewardForE2e({
      userId: buyerId!,
      templateId: templateId!,
    });

    orderId = await buyMerchantListingAndReachCheckout(
      page,
      sellerId,
      listingId,
    );

    await expect(page.locator("#checkout-coupon")).toBeVisible({
      timeout: 20_000,
    });
    await page.locator("#checkout-coupon").selectOption(couponRewardId!);
    await page.waitForTimeout(1500);
    await expect(page.getByText("平台優惠", { exact: true })).toBeVisible();
    await expect(page.getByText(/- HK\$ 30/)).toBeVisible();

    await completeMerchantDirectCheckout(page, {
      couponRewardId: couponRewardId!,
    });

    const snapshot = await getMerchantOrderCouponSnapshot(orderId!);
    expect(snapshot).toBeTruthy();
    expect(Number(snapshot!.platform_subsidy_amount)).toBeGreaterThan(0);
    expect(Number(snapshot!.buyer_total_amount)).toBeLessThan(
      Number(snapshot!.total_amount),
    );
    expect(snapshot!.coupon_user_reward_id).toBe(couponRewardId);

    const reward = await getUserRewardRow(couponRewardId!);
    expect(reward?.is_used).toBe(true);
    expect(reward?.used_at).toBeTruthy();
    expect(reward?.reserved_merchant_order_id).toBeNull();
  });

  test("B3.1 auth toggle keeps coupon picker visible and clears selection", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");
    test.skip(!templateId, "Template not created");

    const fixtures = getMerchantProductDetailFixtures();
    const buyerId = await getProfileIdByEmail(fixtures.buyerEmail!);
    const merchantListing = await findActiveMerchantListingForE2e({
      excludeSellerId: buyerId!,
    });
    const rewardId = await grantUserRewardForE2e({
      userId: buyerId!,
      templateId: templateId!,
    });

    await reactivateListingForE2e(merchantListing.listingId);
    await setListingAuthenticationForE2e(merchantListing.listingId, true);

    await buyMerchantListingAndReachCheckout(
      page,
      merchantListing.sellerId,
      merchantListing.listingId,
    );

    await expect(page.locator("#checkout-coupon")).toBeVisible({
      timeout: 20_000,
    });
    await page.locator("#checkout-coupon").selectOption(rewardId);
    await page.waitForTimeout(1000);

    const authSection = page.locator("section").filter({
      hasText: "啟用鑑定服務",
    });
    const authSwitch = authSection.getByRole("switch");
    await expect(authSwitch).toBeEnabled({ timeout: 10_000 });
    await authSwitch.click();

    await expect(page.locator("#checkout-coupon")).toBeVisible();
    await expect(page.locator("#checkout-coupon")).toHaveValue("");
  });

  test("B2b.1 merchant_auth checkout applies discount coupon subsidy", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");

    const discountTemplateId = await findActiveDiscountCouponTemplateId();
    test.skip(!discountTemplateId, "No active discount_coupon template in DB");

    const fixtures = getMerchantProductDetailFixtures();
    const buyerId = await getProfileIdByEmail(fixtures.buyerEmail!);
    const merchantListing = await findActiveMerchantListingForE2e({
      excludeSellerId: buyerId!,
    });
    await reactivateListingForE2e(merchantListing.listingId);
    await setListingAuthenticationForE2e(merchantListing.listingId, true);

    const rewardId = await grantUserRewardForE2e({
      userId: buyerId!,
      templateId: discountTemplateId!,
    });

    const authOrderId = await buyMerchantListingWithAuthAndReachCheckout(
      page,
      merchantListing.sellerId,
      merchantListing.listingId,
    );

    await expect(page.locator("#checkout-coupon")).toBeVisible({
      timeout: 20_000,
    });
    await page.locator("#checkout-coupon").selectOption(rewardId);
    await page.waitForTimeout(1500);
    await expect(page.getByText("平台優惠", { exact: true })).toBeVisible();

    await completeMerchantAuthCheckout(page, { couponRewardId: rewardId });

    const snapshot = await getMerchantOrderCouponSnapshot(authOrderId);
    expect(snapshot).toBeTruthy();
    expect(Number(snapshot!.platform_subsidy_amount)).toBeGreaterThan(0);
    expect(Number(snapshot!.buyer_total_amount)).toBeLessThan(
      Number(snapshot!.total_amount),
    );
    expect(snapshot!.coupon_user_reward_id).toBe(rewardId);
  });

  test("B2b.2 merchant_auth checkout applies free-shipping subsidy", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");
    test.skip(!templateId, "Template not created");

    const fixtures = getMerchantProductDetailFixtures();
    const buyerId = await getProfileIdByEmail(fixtures.buyerEmail!);
    const merchantListing = await findActiveMerchantListingForE2e({
      excludeSellerId: buyerId!,
    });
    await reactivateListingForE2e(merchantListing.listingId);
    await setListingAuthenticationForE2e(merchantListing.listingId, true);

    const rewardId = await grantUserRewardForE2e({
      userId: buyerId!,
      templateId: templateId!,
    });

    const authOrderId = await buyMerchantListingWithAuthAndReachCheckout(
      page,
      merchantListing.sellerId,
      merchantListing.listingId,
    );

    await expect(page.locator("#checkout-coupon")).toBeVisible({
      timeout: 20_000,
    });
    await page.locator("#checkout-coupon").selectOption(rewardId);
    await page.waitForTimeout(1500);
    await expect(page.getByText("平台優惠", { exact: true })).toBeVisible();

    await completeMerchantAuthCheckout(page, { couponRewardId: rewardId });

    const snapshot = await getMerchantOrderCouponSnapshot(authOrderId);
    expect(snapshot).toBeTruthy();
    expect(Number(snapshot!.platform_subsidy_amount)).toBeGreaterThan(0);
    expect(snapshot!.coupon_type).toBe("free_shipping");
    expect(snapshot!.coupon_user_reward_id).toBe(rewardId);
  });

  test("B3.3 meetup makes free-shipping coupon ineligible", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");
    test.skip(!templateId, "Template not created");

    const fixtures = getMerchantProductDetailFixtures();
    const buyerId = await getProfileIdByEmail(fixtures.buyerEmail!);
    const merchantListing = await findActiveMerchantListingForE2e({
      excludeSellerId: buyerId!,
    });
    await reactivateListingForE2e(merchantListing.listingId);
    await setListingAuthenticationForE2e(merchantListing.listingId, false);
    const rewardId = await grantUserRewardForE2e({
      userId: buyerId!,
      templateId: templateId!,
    });

    await buyMerchantListingAndReachCheckout(
      page,
      merchantListing.sellerId,
      merchantListing.listingId,
    );

    await expect(page.locator("#checkout-coupon")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "面交／自取" }).click();
    await page.waitForTimeout(2000);

    const option = page.locator(`#checkout-coupon option[value="${rewardId}"]`);
    await expect(option).toBeDisabled();
    const label = (await option.textContent()) ?? "";
    expect(label).toMatch(/面交|運費|順豐|配送|ineligible|不|無法/i);
  });
});
