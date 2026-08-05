import { test, expect, type Page } from "@playwright/test";
import {
  buildFlashCampaignScheduleForE2e,
  claimFlashCampaignForUser,
  countRewardCampaignClaims,
  ensureE2eFlashBuyer,
  getFlashCampaignIdByName,
  getRewardTemplateIdByTitle,
  gotoMemberRewardsPage,
  listActiveFlashCampaignRowsForE2e,
  listActiveFlashCampaignRowsForUser,
  openRewardTemplateWizard,
  waitForFlashCampaignSectionReady,
} from "./helpers/platform-rewards";
import {
  getMerchantProductDetailFixtures,
  hasBuyerAuthFixtures,
} from "./fixtures/test-data";

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

async function publishFlashCampaignTemplate(
  page: Page,
  params: {
    templateTitle: string;
    campaignName: string;
    maxClaims: number;
  },
): Promise<void> {
  const schedule = buildFlashCampaignScheduleForE2e({
    campaignName: params.campaignName,
    maxClaims: params.maxClaims,
    maxClaimsPerUser: 1,
  });

  const wizard = await openRewardTemplateWizard(page);
  await expect(wizard.getByText(/新增獎勵模板/)).toBeVisible();

  await wizard.locator("#template-title").fill(params.templateTitle);
  await wizard.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "折扣券" }).click();
  await wizard.locator("#reward-amount").fill("10");

  await wizard.getByRole("button", { name: "下一步" }).click();
  await wizard.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "限時搶領（需加檔期）" }).click();
  await wizard.getByRole("button", { name: "下一步" }).click();

  await wizard.locator("#campaign-name").fill(schedule.campaignName);
  await wizard.locator("#campaign-starts").fill(schedule.startsAt);
  await wizard.locator("#campaign-ends").fill(schedule.endsAt);
  await wizard.locator("#campaign-stock").fill(String(schedule.maxClaims));
  await wizard
    .locator("#campaign-per-user")
    .fill(String(schedule.maxClaimsPerUser));

  await wizard.getByRole("button", { name: "發布" }).click();
  await expect(page.getByText("已發布模板")).toBeVisible({ timeout: 30_000 });
  await expect(wizard).toBeHidden({ timeout: 15_000 });
}

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Platform rewards Phase 3 E2E", () => {
  const templateTitle = `E2E Phase3 Flash ${Date.now()}`;
  const campaignName = `E2E Phase3 Campaign ${Date.now()}`;
  let campaignId: string | null = null;
  let templateId: string | null = null;
  let buyerB: { email: string; password: string; userId: string } | null =
    null;
  let buyerC: { email: string; password: string; userId: string } | null =
    null;

  test.beforeAll(async ({ browser }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(testInfo.project.name !== "buyer", "Buyer project only");
    test.skip(
      !hasAdminAuthFixtures() || !hasBuyerAuthFixtures(),
      "Missing E2E admin/buyer env",
    );
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      test.skip(true, "Missing SUPABASE_SERVICE_ROLE_KEY for DB assertions");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      test.skip(true, "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY for flash RPC");
    }

    buyerB = await ensureE2eFlashBuyer({ suffix: "b" });
    buyerC = await ensureE2eFlashBuyer({ suffix: "c" });

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAdmin(page);
    await publishFlashCampaignTemplate(page, {
      templateTitle,
      campaignName,
      maxClaims: 2,
    });
    await context.close();

    templateId = await getRewardTemplateIdByTitle(templateTitle);
    campaignId = await getFlashCampaignIdByName(campaignName);

    if (!templateId || !campaignId) {
      throw new Error("Failed to bootstrap flash campaign for Phase 3 E2E");
    }

    const activeRows = await listActiveFlashCampaignRowsForE2e();
    if (!activeRows.some((row) => row.id === campaignId)) {
      throw new Error(
        `Flash campaign ${campaignId} not returned by rpc_list_active_flash_campaigns`,
      );
    }
  });

  test("C3.1 admin publishes flash_only template + campaign (stock=2)", async (
    {},
    testInfo,
  ) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer project only");
    expect(templateId).toBeTruthy();
    expect(campaignId).toBeTruthy();
  });

  test("C3.2 buyer A claims and wallet shows coupon", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");
    test.skip(!campaignId, "Campaign not created in setup");

    const fixtures = getMerchantProductDetailFixtures();

    const buyerCampaigns = await listActiveFlashCampaignRowsForUser({
      email: fixtures.buyerEmail!,
      password: fixtures.buyerPassword!,
    });
    expect(buyerCampaigns.some((row) => row.id === campaignId)).toBe(true);

    await claimFlashCampaignForUser({
      email: fixtures.buyerEmail!,
      password: fixtures.buyerPassword!,
      campaignId: campaignId!,
    });

    await gotoMemberRewardsPage(page);
    await waitForFlashCampaignSectionReady(page);
    await expect(
      page.locator("#redeem-list").getByText(templateTitle).first(),
    ).toBeVisible({ timeout: 20_000 });

    const claims = await countRewardCampaignClaims(campaignId!);
    expect(claims).toBe(1);
  });

  test("C3.5 buyer A second claim same day hits daily limit", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer auth required");
    test.skip(!campaignId, "Campaign not created in setup");

    const fixtures = getMerchantProductDetailFixtures();

    await expect(
      claimFlashCampaignForUser({
        email: fixtures.buyerEmail!,
        password: fixtures.buyerPassword!,
        campaignId: campaignId!,
      }),
    ).rejects.toThrow(/你已達今日搶券上限/);

    await gotoMemberRewardsPage(page);
    await waitForFlashCampaignSectionReady(page);
    const section = page.locator("section").filter({ hasText: "⚡ 限時搶券" });
    const card = section
      .locator("div.rounded-2xl")
      .filter({ hasText: campaignName! });
    const hasFlashCard = await card.isVisible().catch(() => false);
    if (hasFlashCard) {
      await expect(
        card.getByRole("button", { name: "今日已達上限" }),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("C3.3 buyer B claims successfully", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer project only");
    test.skip(!campaignId || !buyerB, "Campaign or buyer B not ready");

    const result = await claimFlashCampaignForUser({
      email: buyerB!.email,
      password: buyerB!.password,
      campaignId: campaignId!,
    });

    expect(result.userRewardId).toBeTruthy();
    const claims = await countRewardCampaignClaims(campaignId!);
    expect(claims).toBe(2);
  });

  test("C3.4 buyer C is rejected when sold out", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer project only");
    test.skip(!campaignId || !buyerC, "Campaign or buyer C not ready");

    await expect(
      claimFlashCampaignForUser({
        email: buyerC!.email,
        password: buyerC!.password,
        campaignId: campaignId!,
      }),
    ).rejects.toThrow(/優惠券已被搶光/);
  });
});
