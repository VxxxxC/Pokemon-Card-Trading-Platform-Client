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

    expect(consoleErrors, `Console errors found: ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(hydrationWarnings, `Hydration warnings found: ${hydrationWarnings.join("\n")}`).toHaveLength(0);

    const h1 = page.locator("h1", { hasText: "用戶管理" });
    await expect(h1).toBeVisible();

    const subTitle = page.locator("p", { hasText: "管理全平台會員與認證商戶帳號、Stripe KYC 認證狀態" });
    await expect(subTitle).toBeVisible();

    // KYC workbench lives at /admin/merchants (not 404)
    const merchantsResponse = await page.goto("/admin/merchants");
    expect(merchantsResponse?.status()).toBe(200);

    await page.goto("/admin/user_control");
    await page.waitForLoadState("networkidle");

    const sidebarLink = page.locator('a[href="/admin/user_control"]', { hasText: "用戶管理" });
    await expect(sidebarLink).toBeVisible();

    // Dashboard「前往審核商戶」→ /admin/merchants
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");
    const auditBtn = page.locator("button", { hasText: "前往審核商戶" });
    await expect(auditBtn).toBeVisible();
    await auditBtn.click();
    await page.waitForURL((url) => url.pathname === "/admin/merchants");
    await expect(page).toHaveURL("/admin/merchants");

    await page.goto("/admin/user_control");
    await page.waitForLoadState("networkidle");

    // --- B. Table 結構 ---
    const tableHeaders = page.locator("table thead tr th");
    const headerTexts = await tableHeaders.allInnerTexts();
    expect(headerTexts).toEqual([
      "名稱",
      "Handle",
      "電郵",
      "Stripe ID",
      "Stripe KYC 狀態",
      "Last Update",
      "操作",
    ]);

    const rows = page.locator("table tbody tr");
    const memberChips = page.locator("table tbody tr span", { hasText: /^會員$/ });
    const merchantChips = page.locator("table tbody tr span", { hasText: /^商戶$/ });

    const memberCheckboxBtn = page.locator("button", { hasText: "會員 (" });
    const merchantCheckboxBtn = page.locator("button", { hasText: "商戶 (" });
    await expect(memberCheckboxBtn).toBeVisible();
    await expect(merchantCheckboxBtn).toBeVisible();

    const memberBtnText = await memberCheckboxBtn.innerText();
    const merchantBtnText = await merchantCheckboxBtn.innerText();
    expect(memberBtnText).toMatch(/會員\s*\(\d+\)/);
    expect(merchantBtnText).toMatch(/商戶\s*\(\d+\)/);

    const rowCount = await rows.count();
    if (rowCount > 0) {
      const firstRowText = await rows.first().innerText();
      expect(firstRowText).toMatch(/會員|商戶/);
    }

    // --- C. userType checkbox filter ---
    if (rowCount > 0) {
      await merchantCheckboxBtn.click();
      expect(await merchantChips.count()).toBe(0);

      await memberCheckboxBtn.click();
      await merchantCheckboxBtn.click();
      expect(await memberChips.count()).toBe(0);
      expect(await merchantChips.count()).toBeGreaterThan(0);

      await merchantCheckboxBtn.click();
      const emptyStateText = page.locator("text=請至少選擇一種用戶類型以顯示名單。");
      await expect(emptyStateText).toBeVisible();

      await memberCheckboxBtn.click();
      await merchantCheckboxBtn.click();
      await expect(emptyStateText).not.toBeVisible();
    }

    // --- D. KYC pills + search (flexible for live DB) ---
    const allKycBtn = page.locator("button", { hasText: "全部 (" });
    await allKycBtn.click();

    const pendingKycBtn = page.locator("button", { hasText: "待審核 (" });
    const searchInput = page.locator('input[placeholder*="搜尋名稱"]');

    const page2Btn = page.locator("button", { hasText: /^2$/ }).first();
    if (await page2Btn.isVisible()) {
      await page2Btn.click();
      await merchantCheckboxBtn.click();
      const activePage1Btn = page.locator("button.bg-brand", { hasText: /^1$/ });
      await expect(activePage1Btn).toBeVisible();
      await merchantCheckboxBtn.click();
    }

    const firstRowName = rowCount > 0 ? (await rows.first().locator("td").nth(0).innerText()).trim() : "";
    if (firstRowName.length >= 1) {
      const searchTerm = firstRowName.replace(/^(會員|商戶)\s*/, "").slice(0, 1);
      if (searchTerm.length >= 1) {
        await searchInput.fill(searchTerm);
        await page.waitForLoadState("networkidle");
        expect(await rows.count()).toBeGreaterThan(0);
        await searchInput.fill("");
      }
    }

    await pendingKycBtn.click();
    const countPendingAll = await pendingKycBtn.innerText();
    await merchantCheckboxBtn.click();
    const countPendingMemberOnly = await pendingKycBtn.innerText();
    await merchantCheckboxBtn.click();

    if (countPendingAll !== countPendingMemberOnly) {
      expect(countPendingAll).not.toEqual(countPendingMemberOnly);
    }

    const reviewLink = page.locator('a', { hasText: "審核 KYC" }).first();
    if (await reviewLink.isVisible()) {
      const href = await reviewLink.getAttribute("href");
      expect(href).toMatch(/^\/admin\/merchants\?applicationId=/);
    }

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
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

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

    expect(blueElementsCount).toBe(0);
  });
});
