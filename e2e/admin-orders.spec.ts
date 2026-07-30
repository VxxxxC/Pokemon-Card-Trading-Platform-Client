import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "admin-orders-screenshots",
);

// E2E test credentials: dedicated sandbox admin account for E2E.
// NEVER reset or modify real admin passwords via API/SQL.
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@t.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Abcd1234!";

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

async function loginAsAdmin(page: Page) {
  await page.goto("/auth");
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(
    (url) => url.pathname.startsWith("/admin") || url.pathname === "/admin",
    { timeout: 15_000 },
  );
}

async function navigateToAdminOrders(page: Page) {
  await page.goto("/admin/orders");
  await page.waitForLoadState("networkidle");
  // Wait for the main heading to confirm the page rendered
  await expect(page.locator("h1", { hasText: "訂單與鑑定管理" })).toBeVisible();
}

function attachConsoleListeners(page: Page) {
  const consoleErrors: string[] = [];
  const hydrationWarnings: string[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    if (msg.type() === "error") {
      consoleErrors.push(text);
    }
    if (
      text.includes("Hydration") ||
      text.includes("did not match") ||
      text.includes("hydration")
    ) {
      hydrationWarnings.push(text);
    }
  });

  return { consoleErrors, hydrationWarnings };
}

/**
 * Select a date in the open react-day-picker calendar by matching its accessible aria-label.
 * react-day-picker v10 labels day buttons like "Wednesday, January 1st, 2026".
 */
async function clickCalendarDay(page: Page, year: number, month: number, day: number) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthName = monthNames[month - 1];
  const ordinal = (n: number) => {
    if (n > 3 && n < 21) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };
  const labelPattern = new RegExp(
    `^.*, ${monthName} ${ordinal(day)}, ${year}$`,
    "i",
  );

  // CSS attribute substring selector avoids Playwright filter hasAttribute typing issues.
  const selector = `[data-slot="popover-content"] button[aria-label*="${monthName} ${ordinal(day)}, ${year}"]`;
  const target = page.locator(selector).first();
  await expect(target).toBeVisible();
  await target.click();
}

async function openDateRangePicker(page: Page) {
  const trigger = page
    .locator("button")
    .filter({ has: page.locator('svg[class*="lucide-calendar"], svg') })
    .filter({ hasText: /選擇日期範圍|2026/ })
    .first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator('[data-slot="popover-content"]')).toBeVisible();
  return trigger;
}

async function selectDateRangeJanToMar2026(page: Page) {
  await openDateRangePicker(page);

  // Calendar opens at current month. Navigate to January 2026 (6 months back from July 2026).
  const prevButton = page.locator(
    '[data-slot="popover-content"] button[aria-label="Go to the Previous Month"]',
  );
  for (let i = 0; i < 6; i++) {
    await expect(prevButton).toBeVisible();
    await prevButton.click();
    await page.waitForTimeout(200);
  }

  // Select start date: 2026/01/01
  await clickCalendarDay(page, 2026, 1, 1);
  await page.waitForTimeout(200);

  // Navigate to March 2026 (2 months forward from Jan/Feb view)
  const nextButton = page.locator(
    '[data-slot="popover-content"] button[aria-label="Go to the Next Month"]',
  );
  for (let i = 0; i < 2; i++) {
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    await page.waitForTimeout(200);
  }

  // Select end date: 2026/03/31
  await clickCalendarDay(page, 2026, 3, 31);
  await page.waitForTimeout(200);

  // Close the popover by pressing Escape (some calendars close automatically)
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
}

async function getKpiValues(page: Page) {
  const kpiCards = page.locator(
    "div.rounded-2xl.border.border-\\[rgba\\(237\\,232\\,224\\,0\\.08\\)\\].bg-bg-card",
  );
  const totalOrders = await kpiCards
    .filter({ hasText: "全站總訂單數" })
    .locator("span.font-mono.font-bold")
    .textContent();
  const pendingGrading = await kpiCards
    .filter({ hasText: "待鑑定實物卡牌" })
    .locator("span.font-mono.font-bold")
    .textContent();
  const escrowHeld = await kpiCards
    .filter({ hasText: "待釋放 Escrow 總額" })
    .locator("span.font-mono.font-bold")
    .textContent();
  return { totalOrders, pendingGrading, escrowHeld };
}

async function switchToGradingTab(page: Page) {
  const gradingTab = page
    .locator("button")
    .filter({ hasText: "鑑定認證" })
    .first();
  await expect(gradingTab).toBeVisible();
  await gradingTab.click();
  await page.waitForLoadState("networkidle");
  // The segmented tabs use class-based active state (bg-brand) instead of aria-selected
  await expect(gradingTab).toHaveClass(/bg-brand/);
}

async function switchToPlatformTab(page: Page) {
  const platformTab = page
    .locator("button")
    .filter({ hasText: "平台訂單" })
    .first();
  await expect(platformTab).toBeVisible();
  await platformTab.click();
  await page.waitForLoadState("networkidle");
  await expect(platformTab).toHaveClass(/bg-brand/);
}

test.describe("Admin Orders Page Regression", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    // Override any inherited storageState (buyer/seller) because this spec logs in as admin.
    storageState: { cookies: [], origins: [] },
  });

  test("Date Range Filtering — platform orders, KPIs, and URL", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { consoleErrors, hydrationWarnings } = attachConsoleListeners(page);

    await loginAsAdmin(page);
    await navigateToAdminOrders(page);

    // Ensure we are on the platform tab (default)
    await expect(page.url()).toContain("/admin/orders");

    // Baseline KPI values (computed from full mock dataset, not the filtered subset)
    const kpisBefore = await getKpiValues(page);
    expect(kpisBefore.totalOrders).toContain("22");
    expect(kpisBefore.pendingGrading).toContain("6");
    expect(kpisBefore.escrowHeld).toContain("207,100");

    // Baseline order list: should show first page of all 22 orders
    const firstOrderBefore = page
      .locator("div.grid > div, [role=tabpanel] .group")
      .first()
      .locator("span.font-mono")
      .first();
    await expect(firstOrderBefore).toBeVisible();

    // Apply date range 2026/01/01 - 2026/03/31
    await selectDateRangeJanToMar2026(page);

    // Verify the date range trigger displays the selected range
    const trigger = page
      .locator("button")
      .filter({ hasText: /2026\/01\/01/ })
      .first();
    await expect(trigger).toHaveText(/2026\/01\/01\s*-\s*2026\/03\/31/);

    // The platform list should now contain only orders from Jan 1 to Mar 31, 2026 (10 orders)
    const platformCards = page.locator(
      "div.group.flex.flex-col.gap-3.rounded-xl",
    );
    await expect(platformCards).toHaveCount(10);

    // Verify the date range was applied correctly: first card should be ORD-2026-000010 (2026/03/22)
    // and last card should be ORD-2026-000001 (2026/01/08) when sorted by createdAt desc
    await expect(platformCards.first().locator("span.font-mono").first()).toHaveText(
      "ORD-2026-000010",
    );
    await expect(platformCards.last().locator("span.font-mono").first()).toHaveText(
      "ORD-2026-000001",
    );

    // KPIs should remain stable (global metrics)
    const kpisAfter = await getKpiValues(page);
    expect(kpisAfter.totalOrders).toBe(kpisBefore.totalOrders);
    expect(kpisAfter.pendingGrading).toBe(kpisBefore.pendingGrading);
    expect(kpisAfter.escrowHeld).toBe(kpisBefore.escrowHeld);

    expect(
      consoleErrors,
      `Console errors found: ${consoleErrors.join("\n")}`,
    ).toHaveLength(0);
    expect(
      hydrationWarnings,
      `Hydration warnings found: ${hydrationWarnings.join("\n")}`,
    ).toHaveLength(0);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "date-range-filter.png"),
      fullPage: true,
    });
  });

  test("Grading Table — row click does not navigate, text is selectable", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { consoleErrors, hydrationWarnings } = attachConsoleListeners(page);

    await loginAsAdmin(page);
    await navigateToAdminOrders(page);
    await switchToGradingTab(page);

    // Record baseline URL
    const baselineUrl = page.url();
    expect(baselineUrl).toContain("/admin/orders");

    // Find the first grading table row and click a non-interactive cell (tracking number)
    const trackingCell = page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .filter({ hasText: /SF\d+|—/ })
      .first();
    await expect(trackingCell).toBeVisible();
    await trackingCell.click();

    // URL must remain unchanged (no full-row onClick navigation)
    await expect(page).toHaveURL(baselineUrl);

    // Attempt to select text in the cell by dragging
    const box = await trackingCell.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 5, box.y + 5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 5, box.y + box.height - 5);
      await page.mouse.up();
    }
    const selectedText = await page.evaluate(() =>
      window.getSelection()?.toString().trim(),
    );
    // Either the cell text is selected, or the cell contains an em dash placeholder
    expect(selectedText?.length ?? 0).toBeGreaterThan(0);

    expect(
      consoleErrors,
      `Console errors found: ${consoleErrors.join("\n")}`,
    ).toHaveLength(0);
    expect(
      hydrationWarnings,
      `Hydration warnings found: ${hydrationWarnings.join("\n")}`,
    ).toHaveLength(0);
  });

  test("Grading Table — [查看訂單] button navigates to detail page", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { consoleErrors, hydrationWarnings } = attachConsoleListeners(page);

    await loginAsAdmin(page);
    await navigateToAdminOrders(page);
    await switchToGradingTab(page);

    // Find the first grading table row and its [查看訂單] button
    const firstRow = page.locator("table tbody tr").first();
    const viewButton = firstRow
      .locator("button")
      .filter({ hasText: "查看訂單" })
      .first();
    await expect(viewButton).toBeVisible();

    // Read the order number of the row we are about to view (second td, after checkbox)
    const orderNumber = await firstRow
      .locator("td")
      .nth(1)
      .locator("span.font-mono")
      .textContent();
    expect(orderNumber).toMatch(/^ORD-2026-\d{6}$/);

    await viewButton.click();

    // Verify navigation to the detail page
    await page.waitForURL((url) => /\/admin\/orders\/[^/]+/.test(url.pathname), {
      timeout: 10_000,
    });
    await expect(page).toHaveURL(new RegExp(`/admin/orders/${orderNumber}`));

    // Verify the detail page header/identifier loads
    await expect(page.locator("text=訂單詳情").first()).toBeVisible();

    expect(
      consoleErrors,
      `Console errors found: ${consoleErrors.join("\n")}`,
    ).toHaveLength(0);
    expect(
      hydrationWarnings,
      `Hydration warnings found: ${hydrationWarnings.join("\n")}`,
    ).toHaveLength(0);
  });

  test("Pagination — shared Pagination component, page change, scroll", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const { consoleErrors, hydrationWarnings } = attachConsoleListeners(page);

    await loginAsAdmin(page);
    await navigateToAdminOrders(page);
    // Ensure platform tab (default) with all 22 orders
    await expect(
      page.locator("button").filter({ hasText: "平台訂單" }).first(),
    ).toHaveClass(/bg-brand/);

    // Pagination should exist because there are 22 platform orders (> 15)
    const paginationInfo = page
      .locator("p.font-mono")
      .filter({ hasText: /筆平台訂單/ })
      .first();
    await expect(paginationInfo).toBeVisible();
    await expect(paginationInfo).toHaveText(/第 1 \/ 2 頁/);

    // Verify the shared Pagination component renders [上一頁] and [下一頁] buttons
    const nextButton = page.locator('button[aria-label="下一頁"]').first();
    const prevButton = page.locator('button[aria-label="上一頁"]').first();
    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();
    await expect(prevButton).toBeDisabled();

    // Record the first order number on page 1
    const firstPageFirstOrder = page
      .locator("div.group.flex.flex-col.gap-3.rounded-xl")
      .first()
      .locator("span.font-mono")
      .first();
    const firstPageOrderNumber = await firstPageFirstOrder.textContent();
    expect(firstPageOrderNumber).toBeTruthy();

    // Scroll down so the pagination is below the fold, making the scroll behavior meaningful
    const platformList = page.locator("#platform-orders-list");
    await platformList.evaluate((el) => el.scrollIntoView({ block: "end" }));
    await page.waitForTimeout(300);

    const topBefore = await platformList.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    await nextButton.click();
    await page.waitForTimeout(1500);

    // Page info should update to page 2
    await expect(paginationInfo).toHaveText(/第 2 \/ 2 頁/);
    await expect(paginationInfo).toHaveText(/顯示第 16 – 22 \/ 共 22 筆平台訂單/);

    // Verify the order list changed
    const secondPageFirstOrder = page
      .locator("div.group.flex.flex-col.gap-3.rounded-xl")
      .first()
      .locator("span.font-mono")
      .first();
    await expect(secondPageFirstOrder).toHaveText(/ORD-2026-/);
    const secondPageOrderNumber = await secondPageFirstOrder.textContent();
    expect(secondPageOrderNumber).not.toBe(firstPageOrderNumber);

    // Verify scroll behavior: Pagination's enableScroll should have moved the viewport
    // so the platform list section is now visible (ideally near the top).
    const topAfter = await platformList.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(topAfter).toBeLessThan(topBefore);
    expect(topAfter).toBeLessThanOrEqual(viewportHeight);
    // The absolute scroll position may change in either direction because the document
    // height shrinks when page 2 has fewer items, but the pagination section should be visible.
    expect(Math.abs(scrollAfter - scrollBefore)).toBeGreaterThan(0);

    expect(
      consoleErrors,
      `Console errors found: ${consoleErrors.join("\n")}`,
    ).toHaveLength(0);
    expect(
      hydrationWarnings,
      `Hydration warnings found: ${hydrationWarnings.join("\n")}`,
    ).toHaveLength(0);
  });
});
