import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

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

    // --- B. FPS 批次處理 Tab → Stripe Log ---
    const fpsTabBtn = page.locator("button", { hasText: "FPS 批次處理" });
    await fpsTabBtn.click();

    // Locate Stripe Log panel in FPS tab
    const fpsStripeLog = page.locator("div.bg-bg-card", {
      has: page.locator("h3", { hasText: "Stripe Log — 平台放款紀錄" }),
    }).last();
    await expect(fpsStripeLog).toBeVisible();

    // Table columns: Payout ID / 收款會員 / 金額 / 狀態 / 建立時間
    const fpsHeaders = fpsStripeLog.locator("thead tr th");
    const fpsHeaderTexts = await fpsHeaders.allInnerTexts();
    expect(fpsHeaderTexts).toEqual(["Payout ID", "收款會員", "金額", "狀態", "建立時間"]);

    // Page 1 rows count: 15
    const fpsRowsP1 = fpsStripeLog.locator("tbody tr");
    await expect(fpsRowsP1).toHaveCount(15);

    // Pagination text: "顯示第 1 - 15 筆，共 38 筆資料"
    const fpsPagingText = fpsStripeLog.locator("div", { hasText: "顯示第" }).first();
    await expect(fpsPagingText).toContainText("顯示第 1 - 15 筆，共 38 筆資料");

    // Time DESC verification: row 1 vs row 15
    const row1Time = await fpsRowsP1.nth(0).locator("td").nth(4).innerText();
    const row15Time = await fpsRowsP1.nth(14).locator("td").nth(4).innerText();

    const parseDate = (s: string) => new Date(s.replace(/\//g, "-")).getTime();
    console.log(`[FPS Stripe Log] Row 1 Time: ${row1Time}, Row 15 Time: ${row15Time}`);
    expect(parseDate(row1Time)).toBeGreaterThan(parseDate(row15Time));

    // Page 1: "上一頁" disabled
    const fpsPrevBtn = fpsStripeLog.locator("button", { hasText: "上一頁" });
    await expect(fpsPrevBtn).toBeDisabled();

    // Click "下一頁" -> Page 2
    const fpsNextBtn = fpsStripeLog.locator("button", { hasText: "下一頁" });
    await fpsNextBtn.click();

    await expect(fpsPagingText).toContainText("顯示第 16 - 30 筆，共 38 筆資料");
    await expect(fpsRowsP1).toHaveCount(15);

    // Click to Page 3
    const fpsPage3Btn = fpsStripeLog.locator("button", { hasText: "3" });
    await fpsPage3Btn.click();

    await expect(fpsPagingText).toContainText("顯示第 31 - 38 筆，共 38 筆資料");
    await expect(fpsRowsP1).toHaveCount(8);

    // Page 3: "下一頁" disabled
    await expect(fpsNextBtn).toBeDisabled();

    // Take screenshot of Desktop Payouts FPS tab
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-payouts-fps-tab.png"), fullPage: true });

    // --- C. 商戶流水 (Stripe) Tab → Stripe Log ---
    const stripeTabBtn = page.locator("button", { hasText: "商戶流水 (Stripe)" });
    await stripeTabBtn.click();

    const stripeLogPanel = page.locator("div.bg-bg-card", {
      has: page.locator("h3", { hasText: "Stripe Log — 商戶交易紀錄" }),
    }).last();
    await expect(stripeLogPanel).toBeVisible();

    // Table headers: Transfer ID / 商戶名稱 / 分賬金額 / 平台分成 / 狀態 / 建立時間
    const stripeHeaders = stripeLogPanel.locator("thead tr th");
    const stripeHeaderTexts = await stripeHeaders.allInnerTexts();
    expect(stripeHeaderTexts).toEqual(["Transfer ID", "商戶名稱", "分賬金額", "平台分成", "狀態", "建立時間"]);

    // Page 1 rows count: 15
    const stripeRows = stripeLogPanel.locator("tbody tr");
    await expect(stripeRows).toHaveCount(15);

    const stripePagingText = stripeLogPanel.locator("div", { hasText: "顯示第" }).first();
    await expect(stripePagingText).toContainText("顯示第 1 - 15 筆，共 38 筆資料");

    // Time DESC verification: row 1 vs row 15
    const sRow1Time = await stripeRows.nth(0).locator("td").nth(5).innerText();
    const sRow15Time = await stripeRows.nth(14).locator("td").nth(5).innerText();
    console.log(`[Merchant Stripe Log] Row 1 Time: ${sRow1Time}, Row 15 Time: ${sRow15Time}`);
    expect(parseDate(sRow1Time)).toBeGreaterThan(parseDate(sRow15Time));

    // Page 1: prev disabled
    const sPrevBtn = stripeLogPanel.locator("button", { hasText: "上一頁" });
    const sNextBtn = stripeLogPanel.locator("button", { hasText: "下一頁" });
    await expect(sPrevBtn).toBeDisabled();

    // Click Next -> Page 2
    await sNextBtn.click();
    await expect(stripePagingText).toContainText("顯示第 16 - 30 筆，共 38 筆資料");
    await expect(stripeRows).toHaveCount(15);

    // Click Page 3 -> 8 rows
    const sPage3Btn = stripeLogPanel.locator("button", { hasText: "3" });
    await sPage3Btn.click();
    await expect(stripePagingText).toContainText("顯示第 31 - 38 筆，共 38 筆資料");
    await expect(stripeRows).toHaveCount(8);
    await expect(sNextBtn).toBeDisabled();

    // Screenshot Desktop Payouts Stripe Tab
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-payouts-stripe-tab.png"), fullPage: true });

    // --- D. 狀態隔離與極致回歸測試 ---
    // Switch to FPS tab first
    await fpsTabBtn.click();

    // 1. In FPS tab, test upper FPS table search "KojiTCG"
    const fpsSearchInput = page.locator('input[placeholder*="搜尋用戶名稱"]');
    await fpsSearchInput.fill("KojiTCG");
    const upperFpsRows = page.locator("tbody").first().locator("tr");
    await expect(upperFpsRows).toHaveCount(1);

    // 2. Turn FPS Stripe Log to Page 3
    await fpsPage3Btn.click();
    await expect(fpsPagingText).toContainText("顯示第 31 - 38 筆，共 38 筆資料");

    // 3. Switch to Merchant Flow Tab
    await stripeTabBtn.click();

    // Verify Merchant Flow Stripe Log is independent (starts at Page 1, not affected by FPS Stripe Log being on Page 3)
    await expect(stripePagingText).toContainText("顯示第 1 - 15 筆");

    // 4. Switch back to FPS Tab
    await fpsTabBtn.click();

    // Confirm UPPER FPS table search state is still intact ("KojiTCG") and NOT affected
    await expect(fpsSearchInput).toHaveValue("KojiTCG");
    await expect(upperFpsRows).toHaveCount(1);

    // Reset search
    await fpsSearchInput.fill("");

    // Test filter chips on upper FPS table
    const allChip = page.locator("button", { hasText: "全部 (" });
    await allChip.click();
    const upperFpsPagingText = page.locator("div", { hasText: "顯示第" }).first();
    await expect(upperFpsPagingText).toContainText("共 20 筆資料");

    // Reset chip back to "未完成"
    const incompleteChip = page.locator("button", { hasText: "未完成 (" });
    await incompleteChip.click();

    // Checkbox select row
    const firstCheckbox = upperFpsRows.first().locator('input[type="checkbox"]');
    await firstCheckbox.check();

    const selectedCountBadge = page.locator("span", { hasText: "已選 1 筆" });
    await expect(selectedCountBadge).toBeVisible();

    const exportSelectedBtn = page.locator("button", { hasText: "導出已選" });
    await expect(exportSelectedBtn).toBeVisible();

    // Uncheck
    await firstCheckbox.uncheck();

    // Test Merchant Flow table regression on Stripe tab
    await stripeTabBtn.click();
    const stripeSearchInput = page.locator('input[placeholder*="搜尋商戶名稱"]');
    await stripeSearchInput.fill("HarutoCards");
    const upperStripeRows = page.locator("tbody").first().locator("tr");
    await expect(upperStripeRows).toHaveCount(3);
    await stripeSearchInput.fill(""); // reset search

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
