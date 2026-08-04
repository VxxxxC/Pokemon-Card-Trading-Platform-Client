import { test, expect, type Page } from "@playwright/test";
import {
  countModerationAuditLogsForCase,
  deleteAccountSanctionsForUser,
  deleteAllModerationDataForSubject,
  getBuyerProfileIdFromEnv,
  getLatestModerationCaseDetailForSubject,
  getLatestModerationCaseForSubject,
  getLatestModerationCaseWithChatRoom,
  getLatestOpenModerationCaseForSubject,
  getModerationCaseStatus,
  insertAccountSanctionForE2e,
  insertChatMessageForE2e,
  seedSubjectHistoryE2ePair,
} from "./fixtures/supabase-admin";
import { getMerchantProductDetailFixtures } from "./fixtures/test-data";

const E2E_ADMIN_CHAT_PROBE = "E2E admin moderation chat probe";

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
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
    timeout: 20_000,
  });
}

test.describe("Admin moderation — access control", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(120_000);

  test("guest is redirected to auth from disputes queue", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only unauthenticated redirect");

    await page.goto("/admin/disputes");
    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
    expect(page.url()).not.toContain("/admin/disputes");
  });

  test("member is redirected from disputes queue", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only member redirect");

    await page.goto("/admin/disputes");
    await expect(page).not.toHaveURL(/\/admin\/disputes/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/profile\/user/);
  });

  test("merchant is redirected from disputes queue", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "seller", "Seller-only merchant redirect");

    await page.goto("/admin/disputes");
    await expect(page).not.toHaveURL(/\/admin\/disputes/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/profile\/(merchant|user)/);
  });
});

test.describe("Admin moderation — admin flows", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(120_000);

  test("admin opens live disputes queue and case detail", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only: admin logs in via /auth");
    if (!hasAdminAuthFixtures()) {
      test.skip(true, "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
      return;
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    if (!sellerId) {
      test.skip(true, "Missing E2E_SELLER_ID");
      return;
    }

    const latestCase = await getLatestModerationCaseForSubject(sellerId);
    if (!latestCase) {
      test.skip(true, "No moderation case for seller fixture — run user-report E2E first");
      return;
    }

    await loginAsAdmin(page);
    await page.goto("/admin/disputes?status=pending");
    await expect(
      page.getByRole("heading", { name: "舉報與爭議仲裁工作台" }),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(latestCase.case_number)).toBeVisible({
      timeout: 20_000,
    });

    await page.getByText(latestCase.case_number).click();
    await expect(page).toHaveURL(
      new RegExp(`/admin/disputes/${latestCase.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    );
    await expect(page.getByText(latestCase.case_number)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("舉報摘要")).toBeVisible();
    await expect(page.getByText("風控分數明細")).toBeVisible();
  });

  test("admin loads chat thread and writes view_chat audit", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only: admin logs in via /auth");
    if (!hasAdminAuthFixtures()) {
      test.skip(true, "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
      return;
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    const buyerId = await getBuyerProfileIdFromEnv();
    if (!sellerId || !buyerId) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_BUYER_EMAIL");
      return;
    }

    const chatCase = await getLatestModerationCaseWithChatRoom(sellerId);
    if (!chatCase) {
      test.skip(
        true,
        "No chat-linked moderation case — run user-report chat E2E first",
      );
      return;
    }

    await insertChatMessageForE2e({
      roomId: chatCase.chatRoomId,
      senderId: buyerId,
      content: E2E_ADMIN_CHAT_PROBE,
    });

    const auditBefore = await countModerationAuditLogsForCase(
      chatCase.id,
      "view_chat",
    );

    await loginAsAdmin(page);
    await page.goto(`/admin/disputes/${chatCase.id}`);
    await expect(page.getByText("唯讀聊天室歷史")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(E2E_ADMIN_CHAT_PROBE)).toBeVisible({
      timeout: 20_000,
    });

    await expect
      .poll(
        async () =>
          countModerationAuditLogsForCase(chatCase.id, "view_chat"),
        { timeout: 15_000 },
      )
      .toBeGreaterThan(auditBefore);

    await expect(page.getByText("調閱聊天紀錄")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("admin dismisses open case", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only: admin logs in via /auth");
    if (!hasAdminAuthFixtures()) {
      test.skip(true, "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
      return;
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    if (!sellerId) {
      test.skip(true, "Missing E2E_SELLER_ID");
      return;
    }

    const openCase = await getLatestOpenModerationCaseForSubject(sellerId);
    if (!openCase) {
      test.skip(
        true,
        "No open moderation case for seller fixture — run user-report E2E first",
      );
      return;
    }

    await loginAsAdmin(page);
    await page.goto(`/admin/disputes/${openCase.id}`);
    await expect(page.getByText("仲裁判定動作")).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("combobox").filter({ hasText: /請選擇一項仲裁判定動作/ }).click();
    await page.getByRole("option", { name: "駁回舉報" }).click();
    await page.getByRole("button", { name: "執行最終仲裁裁決" }).click();

    await expect(page).toHaveURL(/\/admin\/disputes\?status=completed/, {
      timeout: 20_000,
    });

    await expect
      .poll(async () => getModerationCaseStatus(openCase.id), { timeout: 15_000 })
      .toMatchObject({ status: "dismissed", resolution: "dismissed" });

    const resolveAuditCount = await countModerationAuditLogsForCase(
      openCase.id,
      "resolve",
    );
    expect(resolveAuditCount).toBeGreaterThan(0);
  });

  test("admin sees related orders panel for fraud or offline_trade case", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only: admin logs in via /auth");
    if (!hasAdminAuthFixtures()) {
      test.skip(true, "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
      return;
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    if (!sellerId) {
      test.skip(true, "Missing E2E_SELLER_ID");
      return;
    }

    const latestCase = await getLatestModerationCaseDetailForSubject(sellerId);
    if (!latestCase) {
      test.skip(true, "No moderation case for seller fixture");
      return;
    }

    if (
      latestCase.primary_category !== "fraud" &&
      latestCase.primary_category !== "offline_trade"
    ) {
      test.skip(true, "Latest case is not fraud/offline_trade — no order panel expected");
      return;
    }

    await loginAsAdmin(page);
    await page.goto(`/admin/disputes/${latestCase.id}`);
    await expect(page.getByRole("heading", { name: "關聯訂單" })).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("Admin moderation — subject history (G5)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(180_000);

  test("detail shows prior upheld case and list shows repeat-offender badge", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "guest", "Guest-only: admin logs in via /auth");
    if (!hasAdminAuthFixtures()) {
      test.skip(true, "Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD");
      return;
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    const buyerId = await getBuyerProfileIdFromEnv();
    if (!sellerId || !buyerId) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_BUYER_EMAIL");
      return;
    }

    await deleteAllModerationDataForSubject(sellerId);

    let seed: Awaited<ReturnType<typeof seedSubjectHistoryE2ePair>>;
    try {
      seed = await seedSubjectHistoryE2ePair({
        subjectUserId: sellerId,
        reporterId: buyerId,
      });

      await loginAsAdmin(page);
      await page.goto(`/admin/disputes/${seed.currentCase.id}`, {
        waitUntil: "domcontentloaded",
      });

      const historyPanel = page
        .locator("details")
        .filter({ hasText: "被舉報人歷史檔案" });
      await expect(historyPanel).toBeVisible({ timeout: 20_000 });
      await expect(historyPanel.getByText("歷史案件", { exact: true })).toBeVisible();
      await expect(
        historyPanel.getByRole("link", { name: seed.priorCase.case_number }),
      ).toBeVisible({ timeout: 15_000 });

      await page.goto("/admin/disputes?status=pending", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: "舉報與爭議仲裁工作台" }),
      ).toBeVisible({ timeout: 20_000 });

      await page
        .getByPlaceholder("搜尋案件單號、被舉報人、舉報人、類別...")
        .fill(seed.currentCase.case_number);

      const caseRow = page
        .getByRole("row")
        .filter({ hasText: seed.currentCase.case_number });

      await expect
        .poll(async () => caseRow.count(), { timeout: 20_000 })
        .toBeGreaterThan(0);
      await expect(caseRow.getByText("曾有違規")).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteAllModerationDataForSubject(sellerId);
    }
  });
});

test.describe("Admin moderation — enforcement", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.setTimeout(120_000);

  test("suspended user is redirected to /auth/suspended", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only suspended redirect");

    const buyerId = await getBuyerProfileIdFromEnv();
    if (!buyerId) {
      test.skip(true, "Missing E2E_BUYER_EMAIL");
      return;
    }

    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await deleteAccountSanctionsForUser(buyerId);
    await insertAccountSanctionForE2e({
      userId: buyerId,
      type: "suspend",
      endsAt,
    });

    try {
      await page.goto("/profile/user");
      await expect(page).toHaveURL(/\/auth\/suspended/, { timeout: 20_000 });
      await expect(page.getByText("帳戶已暫停")).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteAccountSanctionsForUser(buyerId);
    }
  });
});
