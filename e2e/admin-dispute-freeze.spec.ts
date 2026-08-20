import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(process.cwd(), "test-results", "admin-dispute-freeze-screenshots");

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

test.describe("Admin Dispute Freeze Account Phase 2 Acceptance", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Route 2: /admin/disputes/[id] dispute freeze flow verification", async ({ page }) => {
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

    // Navigate to disputes list first
    await page.goto("/admin/disputes");
    await page.waitForLoadState("networkidle");

    // Pick a pending dispute case (DSP-2025-302) by clicking its "查看詳情" button
    const pendingCaseRow = page.locator("tr", { hasText: "DSP-2025-302" }).first();
    await expect(pendingCaseRow).toBeVisible();

    const viewDetailBtn = pendingCaseRow.locator("button", { hasText: "查看詳情" });
    await expect(viewDetailBtn).toBeVisible();
    await viewDetailBtn.click();

    await page.waitForURL((url) => url.pathname === "/admin/disputes/DSP-2025-302");
    await page.waitForLoadState("networkidle");

    // Verify status badge is "待處理"
    const statusBadge = page.locator("span", { hasText: "待處理" }).first();
    await expect(statusBadge).toBeVisible();

    // --- G. 固定說明條 ---
    // 「仲裁判定動作」區內固定顯示（唔需要選任何選項就見到）文字，內容包含「自動封禁閾值」同「管理員無法覆寫」
    const fixedNotice = page.locator("p", { hasText: "自動封禁閾值" }).filter({ hasText: "管理員無法覆寫" });
    await expect(fixedNotice).toBeVisible();

    // --- E. freeze 動作 ---
    // 點擊「選擇仲裁結果」下拉觸發器
    const selectTrigger = page.locator("label", { hasText: "選擇仲裁結果" }).locator("..").locator("button");
    await selectTrigger.click();

    // 1. 唔再有「強制封禁涉事違規帳號」/「Ban」選項
    const banOption = page.getByText("強制封禁涉事違規帳號");
    await expect(banOption).not.toBeVisible();

    // 2. 有新選項「凍結涉事帳戶 (Freeze Account)」
    const freezeOption = page.getByText("凍結涉事帳戶 (Freeze Account)");
    await expect(freezeOption).toBeVisible();

    // 3. 選項總數應為 5 個
    const allOptions = page.locator('[role="option"]');
    expect(await allOptions.count()).toBe(5);

    // 4. 選擇「凍結涉事帳戶」→ 下方出現「凍結天數」number input，預設值 7
    await freezeOption.click();

    const freezeInput = page.locator('input[type="number"]');
    await expect(freezeInput).toBeVisible();
    expect(await freezeInput.inputValue()).toBe("7");

    // 5. 選擇其他選項 → 凍結天數 input 消失
    await selectTrigger.click();
    const refundOption = page.getByText("全額退款給買家 (Refund Full)");
    await refundOption.click();
    await expect(freezeInput).not.toBeVisible();

    // Switch back to freeze option for validation tests
    await selectTrigger.click();
    await freezeOption.click();
    await expect(freezeInput).toBeVisible();

    // --- F. 凍結天數驗證 ---
    const reasonTextarea = page.locator('textarea[placeholder*="請詳細說明仲裁理由"]');
    const submitBtn = page.locator("button", { hasText: "執行最終仲裁裁決" });

    // 1. 選 freeze，將天數清空 → 填寫理由 → 點「執行最終仲裁裁決」→ 應出現 error toast「請輸入 1 至 365 之間嘅凍結天數」，且案件狀態唔變
    await freezeInput.fill("");
    await reasonTextarea.fill("此戶口涉及惡意品相違規，需要凍結以防轉走款項。");
    await submitBtn.click();

    const errorToast = page.getByText("請輸入 1 至 365 之間嘅凍結天數").first();
    await expect(errorToast).toBeVisible();
    await expect(statusBadge).toHaveText("待處理");

    // 2. 天數輸入 `0` → 同樣被攔截
    await freezeInput.fill("0");
    await submitBtn.click();
    await expect(errorToast).toBeVisible();
    await expect(statusBadge).toHaveText("待處理");

    // 3. 天數輸入 `400` → 同樣被攔截
    await freezeInput.fill("400");
    await submitBtn.click();
    await expect(errorToast).toBeVisible();
    await expect(statusBadge).toHaveText("待處理");

    // 4. 天數輸入 `30` + 填理由 → 提交成功
    await freezeInput.fill("30");
    await submitBtn.click();

    // --- H. 提交後行為（關鍵） ---
    // 1. 提交成功後出現 success toast，內容包含「已向舉報方」同「已完成」
    const successToast = page.getByText("已向舉報方").filter({ hasText: "已完成" }).first();
    await expect(successToast).toBeVisible();

    // 2. 案件狀態 badge 由「待處理」變成「已完成」
    const completedBadge = page.locator("span", { hasText: "已完成" }).first();
    await expect(completedBadge).toBeVisible();

    // 3. 左側「唯讀聊天室歷史」尾部新增咗一則系統訊息，內容包含「系統仲裁通知」同「已完成」
    const systemChatMessage = page.locator("div", { hasText: "唯讀聊天室歷史" }).locator("..").getByText(/\[系統仲裁通知\].*已完成/).first();
    await expect(systemChatMessage).toBeVisible();

    // 4. 「審計紀錄」區新增咗一筆，且內容包含凍結天數（例如「凍結 30 日」）
    const auditLogItem = page.locator("div", { hasText: "審計紀錄" }).locator("..").getByText(/凍結 30 日/).first();
    await expect(auditLogItem).toBeVisible();

    // 5. 提交後聊天室原有訊息、佐證材料、訂單財務流水區全部仍然正常顯示
    const chatTitle = page.locator("h2", { hasText: "唯讀聊天室歷史" });
    const orderTitle = page.locator("h2", { hasText: "訂單與財務流水" });
    const evidenceTitle = page.locator("h3", { hasText: "佐證材料" });

    await expect(chatTitle).toBeVisible();
    await expect(orderTitle).toBeVisible();
    await expect(evidenceTitle).toBeVisible();

    // Console & Hydration Check
    expect(consoleErrors, `Console errors found: ${consoleErrors.join("\n")}`).toHaveLength(0);
    expect(hydrationWarnings, `Hydration warnings found: ${hydrationWarnings.join("\n")}`).toHaveLength(0);

    // Desktop Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "desktop-dispute-freeze.png"), fullPage: true });
  });

  test("Mobile (390x844 iPhone 14) Visual & Responsiveness Verification", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);

    await page.goto("/admin/disputes/DSP-2025-302");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "mobile-dispute-freeze.png"), fullPage: true });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`[Mobile Dispute Freeze] scrollWidth: ${scrollWidth}, innerWidth: ${innerWidth}`);
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

    console.log(`[Color Check Dispute Freeze] Strong blue elements count: ${blueElementsCount}`);
    expect(blueElementsCount).toBe(0);
  });
});
