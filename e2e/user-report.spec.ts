import { test, expect, type Page } from "@playwright/test";
import {
  buildPublicProfilePath,
  getMerchantProductDetailFixtures,
  hasBuyerAuthFixtures,
  hasPublicProfileFixtures,
} from "./fixtures/test-data";
import {
  deletePendingReports,
  ensureDbChatRoom,
  getBuyerProfileIdFromEnv,
  getLatestReport,
  getProfileDisplayName,
} from "./fixtures/supabase-admin";
import {
  chatConsoleRoot,
  dismissBlockingOverlays,
  openChatRoom,
} from "./helpers/member-trading";

const REPORT_CATEGORY = "惡意欺詐 / 虛假交易";
const CHAT_REPORT_DETAILS = "E2E chat report details";
const PROFILE_REPORT_DETAILS = "E2E profile report details";

test.describe.configure({ mode: "serial" });

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(120_000);

async function fillAndSubmitReportDialog(
  page: Page,
  details: string,
): Promise<void> {
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });

  await dialog.getByRole("combobox").click();
  await page
    .getByRole("option", { name: /惡意欺詐 \/ 虛假交易/ })
    .click();

  await dialog.locator("textarea").fill(details);

  await dialog
    .getByRole("button", { name: /確認提交安全審查/ })
    .click();

  await expect(page.getByText("舉報信號已受理")).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("User report submission", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only report E2E");
    if (!hasBuyerAuthFixtures() || !hasPublicProfileFixtures()) {
      test.skip(true, "Missing E2E buyer auth or seller profile fixtures");
    }
  });

  test("buyer submits report from chat console", async ({ page }) => {
    const { sellerId } = getMerchantProductDetailFixtures();
    const buyerId = await getBuyerProfileIdFromEnv();

    if (!sellerId || !buyerId) {
      test.skip(true, "Missing buyer or seller profile id");
      return;
    }

    const roomId = await ensureDbChatRoom(buyerId, sellerId);
    const partnerName = await getProfileDisplayName(sellerId);

    await deletePendingReports({ reporterId: buyerId, targetId: sellerId });

    await openChatRoom(page, roomId, partnerName);
    await expect(
      chatConsoleRoot(page).getByRole("button", { name: "舉報" }),
    ).toBeVisible({ timeout: 20_000 });
    await chatConsoleRoot(page).getByRole("button", { name: "舉報" }).click();
    await fillAndSubmitReportDialog(page, CHAT_REPORT_DETAILS);

    await expect.poll(
      async () => {
        const report = await getLatestReport({
          reporterId: buyerId,
          targetId: sellerId,
        });
        return report?.reason ?? null;
      },
      { timeout: 15_000 },
    ).toContain("[SOURCE] chat_room");

    const report = await getLatestReport({
      reporterId: buyerId,
      targetId: sellerId,
    });

    expect(report).not.toBeNull();
    expect(report?.target_type).toBe("user");
    expect(report?.status).toBe("pending");
    expect(report?.reason).toContain(`[ROOM_ID] ${roomId}`);
    expect(report?.reason).toContain(`[CATEGORY] ${REPORT_CATEGORY}`);
    expect(report?.reason).toContain(CHAT_REPORT_DETAILS);

    await deletePendingReports({ reporterId: buyerId, targetId: sellerId });
  });

  test("buyer submits report from public profile page", async ({ page }) => {
    const { sellerId } = getMerchantProductDetailFixtures();
    const buyerId = await getBuyerProfileIdFromEnv();

    if (!sellerId || !buyerId) {
      test.skip(true, "Missing buyer or seller profile id");
      return;
    }

    await deletePendingReports({ reporterId: buyerId, targetId: sellerId });

    await page.goto(buildPublicProfilePath(sellerId), {
      waitUntil: "domcontentloaded",
    });
    await dismissBlockingOverlays(page);
    await expect(page.getByText("總完成交易")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /舉報用戶/ }).click();
    await fillAndSubmitReportDialog(page, PROFILE_REPORT_DETAILS);

    await expect.poll(
      async () => {
        const report = await getLatestReport({
          reporterId: buyerId,
          targetId: sellerId,
        });
        return report?.reason ?? null;
      },
      { timeout: 15_000 },
    ).toContain("[SOURCE] profile");

    const report = await getLatestReport({
      reporterId: buyerId,
      targetId: sellerId,
    });

    expect(report).not.toBeNull();
    expect(report?.target_type).toBe("user");
    expect(report?.status).toBe("pending");
    expect(report?.reason).not.toContain("[ROOM_ID]");
    expect(report?.reason).toContain(`[CATEGORY] ${REPORT_CATEGORY}`);
    expect(report?.reason).toContain(PROFILE_REPORT_DETAILS);

    await deletePendingReports({ reporterId: buyerId, targetId: sellerId });
  });
});
