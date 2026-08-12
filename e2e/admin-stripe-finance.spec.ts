import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

// Optional: `bun run seed:fps-payout-e2e` seeds a ready payout row for deterministic 銷帳 dialog test.

const SCREENSHOT_DIR = path.join(process.cwd(), "test-results", "admin-stripe-finance-screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

// Helper for admin login
async function loginAsAdmin(page: Page) {
  await page.goto("/auth");
  await page.locator('input[name="email"]').fill("admin@t.com");
  await page.locator('input[name="password"]').fill("Password123!");
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 15000 });
}

test.describe("Admin Finance Stripe Phase 1 Acceptance", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Route 1: /admin/dashboard verification", async ({ page }) => {
    const consoleErrors: string[] = [];
    const hydrationWarnings: string[] = [];

    page.on("console", (msg: ConsoleMessage) => {
      const text = msg.text();
      if (msg.type() === "error") {
        consoleErrors.push(text);
      }
      if (text.includes("Hydration") || text.includes("did not match") || text.includes("hydration")) {
        hydrationWarnings.push(text);
      }
    });

    await loginAsAdmin(page);
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    // Screenshot Desktop Dashboard
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-dashboard.png"), fullPage: true });

    // Check no console error and no hydration mismatch warning
    expect(consoleErrors, `Console errors found: ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(hydrationWarnings, `Hydration warnings found: ${hydrationWarnings.join("\n")}`).toHaveLength(0);

    // Locate "平台淨營收統計" card
    const netRevenueCard = page.locator("div", { hasText: "平台淨營收統計" }).filter({
      has: page.locator("span", { hasText: "平台淨營收統計" }),
    }).first();

    await expect(netRevenueCard).toBeVisible();

    // Check for 3rd Row: "Stripe 平台帳戶餘額"
    const stripeBalanceRow = netRevenueCard.locator("div", { hasText: "Stripe 平台帳戶餘額" }).first();
    await expect(stripeBalanceRow).toBeVisible();

    // Check 3 fields: 可用餘額 (Available), 待結算 (Pending), 幣種
    const availableLabel = stripeBalanceRow.locator("text=可用餘額 (Available)");
    const pendingLabel = stripeBalanceRow.locator("text=待結算 (Pending)");
    const currencyLabel = stripeBalanceRow.locator("text=幣種");

    await expect(availableLabel).toBeVisible();
    await expect(pendingLabel).toBeVisible();
    await expect(currencyLabel).toBeVisible();

    // Check amounts are font-mono and have valid numeric text (not empty, not NaN, not undefined)
    const availableAmount = stripeBalanceRow.locator("span.font-mono", { hasText: "HK$" }).first();
    const pendingAmount = stripeBalanceRow.locator("span.font-mono", { hasText: "HK$" }).nth(1);
    const currencyValue = stripeBalanceRow.locator("span.font-mono", { hasText: "HKD" });

    const availableText = await availableAmount.innerText();
    const pendingText = await pendingAmount.innerText();
    const currencyText = await currencyValue.innerText();

    console.log(`[Dashboard] Available: "${availableText}", Pending: "${pendingText}", Currency: "${currencyText}"`);

    expect(availableText).toMatch(/HK\$\s*[\d,]+/);
    expect(pendingText).toMatch(/HK\$\s*[\d,]+/);
    expect(currencyText).toBe("HKD");
    expect(availableText).not.toContain("NaN");
    expect(availableText).not.toContain("undefined");
    expect(pendingText).not.toContain("NaN");
    expect(pendingText).not.toContain("undefined");
  });

  test("Route 2: /admin/payouts verification", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await loginAsAdmin(page);
    await page.goto("/admin/payouts");
    await page.waitForLoadState("networkidle");

    // --- A. Stripe 平台帳戶餘額 container ---
    const pageHeader = page.locator("h1", { hasText: "財務與結算管控台" });
    await expect(pageHeader).toBeVisible();

    const stripeContainer = page.locator("div", { hasText: "Stripe 平台帳戶餘額" }).filter({
      has: page.locator("h2", { hasText: "Stripe 平台帳戶餘額" }),
    }).first();
    await expect(stripeContainer).toBeVisible();

    // Check 3 columns: 可用餘額 (Available), 待結算 (Pending), 今日入賬 (Today In)
    await expect(stripeContainer.locator("text=可用餘額 (Available)")).toBeVisible();
    await expect(stripeContainer.locator("text=待結算 (Pending)")).toBeVisible();
    await expect(stripeContainer.locator("text=今日入賬 (Today In)")).toBeVisible();

    // "重新整理" button click -> toast "已重新整理 Stripe 帳戶餘額"
    const refreshBtn = stripeContainer.locator("button", { hasText: "重新整理" });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    const toastMsg = page.getByText("已重新整理 Stripe 帳戶餘額").first();
    await expect(toastMsg).toBeVisible();

    // --- B. FPS 批次處理 Tab — live ledger only (no Stripe log) ---
    const fpsTabBtn = page.locator("button", { hasText: "FPS 批次處理" });
    await fpsTabBtn.click();

    const fpsLedgerTable = page.locator("table").first();
    await expect(fpsLedgerTable).toBeVisible();

    const fpsLedgerHeaders = fpsLedgerTable.locator("thead tr th");
    const fpsLedgerHeaderTexts = await fpsLedgerHeaders.allInnerTexts();
    expect(fpsLedgerHeaderTexts).toContain("提現單號");
    expect(fpsLedgerHeaderTexts).toContain("訂單號");
    expect(fpsLedgerHeaderTexts).toContain("用戶名稱");
    expect(fpsLedgerHeaderTexts).toContain("FPS ID");
    expect(fpsLedgerHeaderTexts).toContain("狀態");
    expect(fpsLedgerHeaderTexts).toContain("FPS 參考");

    await expect(
      page.locator("h3", { hasText: "Stripe Log — 平台放款紀錄" }),
    ).toHaveCount(0);

    const fpsLedgerRows = fpsLedgerTable.locator("tbody tr");
    const fpsLedgerRowCount = await fpsLedgerRows.count();
    expect(fpsLedgerRowCount).toBeLessThanOrEqual(10);

    const fpsLedgerPagingText = page
      .locator("div", { hasText: "顯示第" })
      .filter({ hasText: "筆資料" })
      .first();
    if (fpsLedgerRowCount > 0) {
      await expect(fpsLedgerPagingText).toContainText("顯示第 1 -");
      await expect(fpsLedgerPagingText).toContainText("筆資料");
    }

    const completeBtn = page.locator("button", { hasText: "✓ 銷帳" }).first();
    if ((await completeBtn.count()) > 0) {
      await completeBtn.click();
      const referenceInput = page.locator('input[name="adminFpsReference"]');
      await expect(referenceInput).toBeVisible();
      await referenceInput.fill("E2E-FPS-REF-001");
      await page.locator("button", { hasText: "確認銷帳" }).click();
      await expect(page.getByText("手動銷帳成功").first()).toBeVisible({
        timeout: 15000,
      });
    }

    const pendingHint = page.getByText("待賣家補 FPS");
    if ((await pendingHint.count()) > 0) {
      const pendingRow = pendingHint.first().locator("xpath=ancestor::tr");
      await expect(pendingRow.locator("button", { hasText: "✓ 銷帳" })).toHaveCount(
        0,
      );
    }

    // Take screenshot of Desktop Payouts FPS tab
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-payouts-fps-tab.png"), fullPage: true });

    // --- C. 商戶流水 (Stripe) Tab — main ledger table ---
    const stripeTabBtn = page.locator("button", { hasText: "商戶流水 (Stripe)" });
    await stripeTabBtn.click();

    const merchantTable = page.locator("table").first();
    await expect(merchantTable).toBeVisible();

    const merchantHeaders = merchantTable.locator("thead tr th");
    const merchantHeaderTexts = await merchantHeaders.allInnerTexts();
    expect(merchantHeaderTexts).toContain("Stripe 流水號");
    expect(merchantHeaderTexts).toContain("商戶實收 (Transfer)");
    expect(merchantHeaderTexts).toContain("撥款狀態");
    expect(merchantHeaderTexts).not.toContain("帳戶餘額");

    await expect(
      page.locator("h3", { hasText: "Stripe Log — 商戶交易紀錄" }),
    ).toHaveCount(0);

    const merchantRows = merchantTable.locator("tbody tr");
    const merchantRowCount = await merchantRows.count();
    expect(merchantRowCount).toBeLessThanOrEqual(10);

    const merchantPagingText = page
      .locator("div", { hasText: "顯示第" })
      .filter({ hasText: "筆資料" })
      .first();
    if (merchantRowCount > 0) {
      await expect(merchantPagingText).toContainText("顯示第 1 -");
      await expect(merchantPagingText).toContainText("筆資料");
    }

    const sPrevBtn = page.locator("button", { hasText: "上一頁" }).last();
    if (merchantRowCount > 0) {
      await expect(sPrevBtn).toBeDisabled();
    }

    // Screenshot Desktop Payouts Stripe Tab
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-payouts-stripe-tab.png"), fullPage: true });

    // --- D. 狀態隔離與極致回歸測試 ---
    // Switch to FPS tab first
    await fpsTabBtn.click();

    // 1. FPS ledger search input is present and accepts text
    const fpsSearchInput = page.locator('input[placeholder*="搜尋提現單號"]');
    await fpsSearchInput.fill("test-search-token");
    await expect(fpsSearchInput).toHaveValue("test-search-token");
    await page.waitForTimeout(500);

    // 2. Switch to Merchant Flow Tab
    await stripeTabBtn.click();

    // Merchant main table pagination is independent of FPS ledger search
    if (merchantRowCount > 0) {
      await expect(merchantPagingText).toContainText("顯示第 1 -");
    }

    // 3. Switch back to FPS Tab
    await fpsTabBtn.click();

    // Confirm FPS ledger search state is still intact
    await expect(fpsSearchInput).toHaveValue("test-search-token");

    // Reset search
    await fpsSearchInput.fill("");

    // Test filter chips on FPS ledger table
    const allChip = page.locator("button", { hasText: "全部 (" });
    await allChip.click();
    const upperFpsPagingText = page
      .locator("div", { hasText: "顯示第" })
      .filter({ hasText: "筆資料" })
      .first();
    await expect(upperFpsPagingText).toContainText("筆資料");

    // Reset chip back to "未完成"
    const incompleteChip = page.locator("button", { hasText: "未完成 (" });
    await incompleteChip.click();

    // Checkbox select row (if any ledger rows exist)
    const upperFpsRows = fpsLedgerTable.locator("tbody tr");
    const upperFpsRowCount = await upperFpsRows.count();
    if (upperFpsRowCount > 0) {
      const firstCheckbox = upperFpsRows.first().locator('input[type="checkbox"]');
      await firstCheckbox.check();

      const selectedCountBadge = page.locator("span", { hasText: "已選 1 筆" });
      await expect(selectedCountBadge).toBeVisible();

      const exportSelectedBtn = page.locator("button", { hasText: "導出已選" });
      await expect(exportSelectedBtn).toBeVisible();

      await firstCheckbox.uncheck();
    }

    // Test Merchant Flow table search (live DB rows)
    await stripeTabBtn.click();
    const stripeSearchInput = page.locator('input[placeholder*="搜尋商戶名稱"]');
    const upperStripeRows = merchantTable.locator("tbody tr");
    const initialMerchantRowCount = await upperStripeRows.count();
    if (initialMerchantRowCount > 0) {
      const firstMerchantName = await upperStripeRows
        .first()
        .locator("td")
        .nth(3)
        .innerText();
      const searchToken = firstMerchantName.trim().slice(0, 6);
      await stripeSearchInput.fill(searchToken);
      await page.waitForTimeout(500);
      const filteredCount = await upperStripeRows.count();
      expect(filteredCount).toBeGreaterThan(0);
      await stripeSearchInput.fill("");
    }

    expect(consoleErrors, `Console errors found on payouts: ${consoleErrors.join("\n")}`).toHaveLength(0);
  });

  test("Mobile (390x844 iPhone 14) Visual & Responsiveness Verification", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    // 1. Mobile Dashboard
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-dashboard.png"), fullPage: true });

    const dashboardScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const dashboardInnerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`[Mobile Dashboard] scrollWidth: ${dashboardScrollWidth}, innerWidth: ${dashboardInnerWidth}`);
    expect(dashboardScrollWidth).toBeLessThanOrEqual(dashboardInnerWidth);

    // 2. Mobile Payouts FPS Tab
    await page.goto("/admin/payouts");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-payouts-fps-tab.png"), fullPage: true });

    const payoutsScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const payoutsInnerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`[Mobile Payouts] scrollWidth: ${payoutsScrollWidth}, innerWidth: ${payoutsInnerWidth}`);
    expect(payoutsScrollWidth).toBeLessThanOrEqual(payoutsInnerWidth);

    // 3. Mobile Payouts Stripe Tab
    const stripeTabBtn = page.locator("button", { hasText: "商戶流水 (Stripe)" });
    await stripeTabBtn.click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-payouts-stripe-tab.png"), fullPage: true });

    // Check color scheme: ensure no blue elements
    const blueElementsCount = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("*"));
      return elements.filter((el) => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        // Check for strong blue color in RGB like rgb(0, 0, 255) or rgb(59, 130, 246)
        const isBlue = (c: string) => {
          const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!match) return false;
          const [, r, g, b] = match.map(Number);
          return b > 180 && b > r + 50 && b > g + 50;
        };
        return isBlue(bg) || isBlue(color);
      }).length;
    });

    console.log(`[Color Check] Strong blue elements count: ${blueElementsCount}`);
    expect(blueElementsCount).toBe(0);
  });
});
