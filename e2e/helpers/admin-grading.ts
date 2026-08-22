import { expect, type Page } from "@playwright/test";

const GRADING_SEARCH_PLACEHOLDER =
  "搜尋訂單號、買家、賣家、物流單號";

export async function openAdminGradingTab(
  page: Page,
  tabLabel: string,
): Promise<void> {
  await page.getByRole("button", { name: tabLabel }).click();
  await expect(page.getByRole("button", { name: "搜尋" })).toBeEnabled({
    timeout: 30_000,
  });
}

export async function searchAdminGradingQueue(
  page: Page,
  keyword: string,
): Promise<void> {
  const searchInput = page.getByPlaceholder(GRADING_SEARCH_PLACEHOLDER);
  await searchInput.fill(keyword);
  await expect(searchInput).toHaveValue(keyword);
  await page.getByRole("button", { name: "搜尋" }).click();
  await expect(page.getByRole("button", { name: "搜尋" })).toBeEnabled({
    timeout: 30_000,
  });
}

export function adminGradingOrderRow(page: Page, orderNumber: string) {
  return page.locator("tr", { hasText: orderNumber }).first();
}
