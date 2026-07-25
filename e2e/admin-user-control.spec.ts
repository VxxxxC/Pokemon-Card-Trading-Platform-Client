import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-results", "admin-user-control-screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

async function loginAsAdmin(page: Page) {
  await page.goto("/auth");
  await page.locator('input[name="email"]').fill("admin@t.com");
  await page.locator('input[name="password"]').fill("Password123!");
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 15000 });
}

test.describe("Admin User Control Phase 2 Acceptance", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Route 1: /admin/user_control full checklist verification", async ({ page }) => {
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

    // --- A. 路由與標題 ---
    await page.goto("/admin/user_control");
    await page.waitForLoadState("networkidle");

    // 1. 無 console error、無 hydration warning
    expect(consoleErrors, `Console errors found: ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(hydrationWarnings, `Hydration warnings found: ${hydrationWarnings.join("\n")}`).toHaveLength(0);

    // 2. H1 顯示「用戶管理」
    const h1 = page.locator("h1", { hasText: "用戶管理" });
    await expect(h1).toBeVisible();

    // 3. 副標顯示「管理全平台會員與認證商戶帳號、Stripe KYC 認證狀態」
    const subTitle = page.locator("p", { hasText: "管理全平台會員與認證商戶帳號、Stripe KYC 認證狀態" });
    await expect(subTitle).toBeVisible();

    // 4. 舊路由 `/admin/merchants` 應該回 404
    const response = await page.goto("/admin/merchants");
    expect(response?.status()).toBe(404);

    // 回到 user_control
    await page.goto("/admin/user_control");
    await page.waitForLoadState("networkidle");

    // 5. 左側 AdminSidebar 導航項顯示「用戶管理」，且 href 指向 `/admin/user_control`
    const sidebarLink = page.locator('a[href="/admin/user_control"]', { hasText: "用戶管理" });
    await expect(sidebarLink).toBeVisible();

    // 6. 由 `/admin/dashboard` 點擊「前往審核商戶」按鈕 → 應跳去 `/admin/user_control`
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");
    const auditBtn = page.locator("button", { hasText: "前往審核商戶" });
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();
    await page.waitForURL((url) => url.pathname === "/admin/user_control");
    await expect(page).toHaveURL("/admin/user_control");

    // --- B. Table 結構 ---
    // 預設狀態 (kycStatus === 'pending') 下包含 3 筆待審核商戶同 3 筆待審核會員
    // 1. Table Head 恰好 6 欄，順序為：名稱 / Handle / 電郵 / Stripe ID / Stripe KYC 狀態 / Last Update
    const tableHeaders = page.locator("table thead tr th");
    const headerTexts = await tableHeaders.allInnerTexts();
    expect(headerTexts).toEqual(["名稱", "Handle", "電郵", "Stripe ID", "Stripe KYC 狀態", "Last Update"]);

    // 2. 每一 row 嘅「名稱」欄內，名稱前面有一個 type chip，文字係「會員」或「商戶」
    // 3. 存在至少一個「會員」chip 同至少一個「商戶」chip
    const rows = page.locator("table tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    const memberChips = page.locator("table tbody tr span", { hasText: /^會員$/ });
    const merchantChips = page.locator("table tbody tr span", { hasText: /^商戶$/ });
    expect(await memberChips.count()).toBeGreaterThan(0);
    expect(await merchantChips.count()).toBeGreaterThan(0);

    // 4. 會員 row 嘅 Stripe ID 欄顯示 `—`，Stripe KYC 狀態顯示「未申請」/「待審核」
    const firstMemberRow = page.locator("table tbody tr", { has: page.locator("span", { hasText: /^會員$/ }) }).first();
    const memberStripeId = await firstMemberRow.locator("td").nth(3).innerText();
    const memberKycStatus = await firstMemberRow.locator("td").nth(4).innerText();
    expect(memberStripeId.trim()).toBe("—");
    expect(["未申請", "待審核"]).toContain(memberKycStatus.trim());

    // 5. 商戶 row 嘅 Stripe ID 顯示 acct_ 開頭字串，KYC 狀態顯示「已認證」/「待審核」/「已拒絕」之一
    const firstMerchantRow = page.locator("table tbody tr", { has: page.locator("span", { hasText: /^商戶$/ }) }).first();
    const merchantStripeId = await firstMerchantRow.locator("td").nth(3).innerText();
    const merchantKycStatus = await firstMerchantRow.locator("td").nth(4).innerText();
    expect(merchantStripeId.trim()).toMatch(/^acct_/);
    expect(["已認證", "待審核", "已拒絕"]).toContain(merchantKycStatus.trim());

    // --- C. userType checkbox filter（核心） ---
    // 1. 存在兩個 checkbox：「會員」同「商戶」，label 後有數量
    const memberCheckboxBtn = page.locator("button", { hasText: "會員 (" });
    const merchantCheckboxBtn = page.locator("button", { hasText: "商戶 (" });
    await expect(memberCheckboxBtn).toBeVisible();
    await expect(merchantCheckboxBtn).toBeVisible();

    const memberBtnText = await memberCheckboxBtn.innerText();
    const merchantBtnText = await merchantCheckboxBtn.innerText();
    expect(memberBtnText).toMatch(/會員\s*\(\d+\)/);
    expect(merchantBtnText).toMatch(/商戶\s*\(\d+\)/);

    // 2. 初始狀態兩個都係已勾選，從 table rows 可看出來（既有會員又有商戶）
    // 3. 只勾「會員」（uncheck 商戶）→ table 內只剩會員 row，零個「商戶」chip
    await merchantCheckboxBtn.click(); // uncheck 商戶
    expect(await merchantChips.count()).toBe(0);
    expect(await memberChips.count()).toBeGreaterThan(0);

    // 4. 只勾「商戶」（uncheck 會員）→ table 內只剩商戶 row，零個「會員」chip
    await memberCheckboxBtn.click(); // uncheck 會員
    await merchantCheckboxBtn.click(); // check 商戶
    expect(await memberChips.count()).toBe(0);
    expect(await merchantChips.count()).toBeGreaterThan(0);

    // 5. 兩個都 uncheck → 顯示 empty state 文字「請至少選擇一種用戶類型以顯示名單。」
    await merchantCheckboxBtn.click(); // uncheck 商戶 (both unchecked)
    const emptyStateText = page.locator("text=請至少選擇一種用戶類型以顯示名單。");
    await expect(emptyStateText).toBeVisible();

    // 6. 重新勾返兩個 → 完整名單回復
    await memberCheckboxBtn.click(); // check 會員
    await merchantCheckboxBtn.click(); // check 商戶
    await expect(emptyStateText).not.toBeVisible();
    expect(await memberChips.count()).toBeGreaterThan(0);
    expect(await merchantChips.count()).toBeGreaterThan(0);

    // --- D. 三層 filter AND 組合 + 分頁邊界 ---
    // 切換至 KYC「全部」以測試多頁分頁
    const allKycBtn = page.locator("button", { hasText: "全部 (" });
    await allKycBtn.click();

    // 1. 先揭到第 2 頁，然後切換 checkbox → 分頁應 reset 回第 1 頁
    const page2Btn = page.locator("button", { hasText: /^2$/ }).first();
    await page2Btn.click();
    // 切換 checkbox
    await merchantCheckboxBtn.click(); // uncheck merchant
    // 驗證當前頁碼 reset 為 1 號按鈕為 active
    const activePage1Btn = page.locator("button.bg-brand", { hasText: /^1$/ });
    await expect(activePage1Btn).toBeVisible();

    // Restore merchant checkbox
    await merchantCheckboxBtn.click();

    // 2. 先揭到最後一頁，然後 uncheck 一個 type 令資料大減 → 唔可以出現空白 table（分頁邊界防禦）
    const totalPagesBtn = page.locator("div", { hasText: "顯示第" }).locator("..").locator("button").filter({ hasText: /^\d+$/ }).last();
    await totalPagesBtn.click();

    // uncheck 商戶令資料大減
    await merchantCheckboxBtn.click();
    // 驗證畫面沒有出現空白 table
    const updatedRows = page.locator("table tbody tr");
    expect(await updatedRows.count()).toBeGreaterThan(0);

    // Restore merchant checkbox
    await merchantCheckboxBtn.click();

    // 3. 輸入搜尋關鍵字 + 只勾一種 type + 選一個 KYC 狀態 pill → 三者 AND 生效，結果數量合理
    const pendingKycBtn = page.locator("button", { hasText: "待審核 (" });
    await pendingKycBtn.click(); // KYC: pending
    await merchantCheckboxBtn.click(); // uncheck merchant (UserType: member only)

    const searchInput = page.locator('input[placeholder*="搜尋名稱"]');
    await searchInput.fill("鄭穎琳"); // member U-012 has pending KYC

    expect(await rows.count()).toBe(1);
    const rowName = await rows.first().locator("td").nth(0).innerText();
    expect(rowName).toContain("鄭穎琳");

    // Clear search and reset filters
    await searchInput.fill("");
    await merchantCheckboxBtn.click(); // re-check merchant
    await allKycBtn.click();

    // 4. KYC 狀態 pill 上嘅 count 數字會隨 userType 勾選改變
    const countPendingAll = await pendingKycBtn.innerText();

    // 只勾會員
    await merchantCheckboxBtn.click();
    const countPendingMemberOnly = await pendingKycBtn.innerText();

    console.log(`[KYC Pill Count Test] All: "${countPendingAll}", MemberOnly: "${countPendingMemberOnly}"`);
    expect(countPendingAll).not.toEqual(countPendingMemberOnly);

    // Re-check merchant
    await merchantCheckboxBtn.click();

    // 5. 搜尋一個 member 嘅名，確認搜到；搜尋一個 `acct_` Stripe ID，確認搜到對應商戶（驗證 null stripeAccountId 唔會 crash）
    await searchInput.fill("陳子健");
    expect(await rows.count()).toBe(1);
    expect(await rows.first().innerText()).toContain("陳子健");

    await searchInput.fill("acct_1NfG82H");
    expect(await rows.count()).toBe(1);
    expect(await rows.first().innerText()).toContain("HarutoCards Premium");

    await searchInput.fill(""); // clear search

    // --- Desktop Screenshot ---
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-user-control.png"), fullPage: true });
  });

  test("Mobile (390x844 iPhone 14) Visual & Responsiveness Verification", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    await page.goto("/admin/user_control");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-user-control.png"), fullPage: true });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`[Mobile User Control] scrollWidth: ${scrollWidth}, innerWidth: ${innerWidth}`);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    // Check color scheme: ensure no blue elements
    const blueElementsCount = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("*"));
      return elements.filter((el) => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        const isBlue = (c: string) => {
          const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (!match) return false;
          const [, r, g, b] = match.map(Number);
          return b > 180 && b > r + 50 && b > g + 50;
        };
        return isBlue(bg) || isBlue(color);
      }).length;
    });

    console.log(`[Color Check User Control] Strong blue elements count: ${blueElementsCount}`);
    expect(blueElementsCount).toBe(0);
  });
});
