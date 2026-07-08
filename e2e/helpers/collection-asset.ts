import path from "node:path";
import { expect, type Page } from "@playwright/test";
import type { ListingMarketplaceFixture } from "../fixtures/supabase-admin";

export const LISTING_PHOTO_FIXTURE = path.resolve(
  __dirname,
  "../fixtures/listing-photo.png",
);

export async function dismissBlockingOverlays(page: Page): Promise<void> {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

export async function gotoCollectionPage(page: Page): Promise<void> {
  await page.goto("/profile/user/collection", { waitUntil: "domcontentloaded" });
  await dismissBlockingOverlays(page);
}

export function addAssetModalForm(page: Page) {
  return page.locator("form").filter({
    has: page.getByPlaceholder(
      /sv2a-182 或 Charizard ex SAR|151 Booster Box/,
    ),
  });
}

export async function openMerchAddAssetModal(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  const addButton = page.getByRole("button", { name: "新增商品" });
  await addButton.scrollIntoViewIfNeeded();
  await addButton.click();
  await expect(addAssetModalForm(page)).toBeVisible({ timeout: 15_000 });
}

export async function openHobbyAddAssetModal(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  const addButton = page.getByRole("button", { name: "收錄新卡" });
  await expect(addButton).toBeVisible({ timeout: 10_000 });
  await addButton.scrollIntoViewIfNeeded();
  await addButton.click();

  const modal = addAssetModalForm(page);
  if (await modal.isVisible().catch(() => false)) {
    return;
  }

  await addButton.click();
  await expect(modal).toBeVisible({ timeout: 15_000 });
}

export async function searchAndSelectCatalog(
  page: Page,
  keywords: string | string[],
  preferredMatch?: string,
): Promise<void> {
  const modal = addAssetModalForm(page);
  const searchInput = modal.getByPlaceholder(
    /sv2a-182 或 Charizard ex SAR|151 Booster Box/,
  );
  const keywordList = Array.isArray(keywords) ? keywords : [keywords];
  const catalogResults = modal.locator("div.absolute button:has(img)");

  for (const keyword of keywordList) {
    await searchInput.fill(keyword);
    await expect(searchInput).toHaveValue(keyword);
    await expect(catalogResults.first()).toBeVisible({ timeout: 25_000 });

    const matchText = preferredMatch ?? keyword;
    const preferred = catalogResults.filter({ hasText: matchText });
    const target =
      (await preferred.count()) > 0
        ? preferred.first()
        : catalogResults.first();

    await target.click();
    return;
  }

  throw new Error(
    `AddAssetModal catalog search returned no results for: ${keywordList.join(", ")}`,
  );
}

export async function searchAndSelectCatalogForFixture(
  page: Page,
  fixture: ListingMarketplaceFixture,
): Promise<void> {
  await searchAndSelectCatalog(
    page,
    [fixture.catalogModalKeyword, fixture.searchKeyword, fixture.productId],
    fixture.catalogModalKeyword,
  );
}

export async function uploadMerchPhotos(
  page: Page,
  photoPath: string = LISTING_PHOTO_FIXTURE,
  count = 4,
): Promise<void> {
  const modal = addAssetModalForm(page);
  const files = Array.from({ length: count }, () => photoPath);
  await modal.locator('input[type="file"]').setInputFiles(files);
  await expect(modal.getByText(`${count}/6`)).toBeVisible({ timeout: 10_000 });
}

export async function ensureProductInWishlist(
  page: Page,
  fixture: ListingMarketplaceFixture,
): Promise<void> {
  await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
  await dismissBlockingOverlays(page);

  const searchInput = page.getByPlaceholder("搜尋官方卡牌名稱、編號...");
  await searchInput.fill(fixture.searchKeyword);
  await page.getByRole("heading", { name: "大盤市場" }).click();

  const productLink = page
    .locator(`a[href="/marketplace/product/${fixture.productId}"]`)
    .first();
  await expect(productLink).toBeVisible({ timeout: 20_000 });

  const wishlistButton = productLink
    .locator("xpath=ancestor::article[1]")
    .getByRole("button", {
      name: /加入願望清單|從願望清單移除/,
    })
    .first();

  const wishlistLabel = (await wishlistButton.getAttribute("aria-label")) ?? "";
  if (wishlistLabel.includes("加入願望清單")) {
    await wishlistButton.click();
    await expect(page.getByText("已加入願望清單")).toBeVisible({
      timeout: 15_000,
    });
  }
}

export function wishlistSection(page: Page) {
  return page.locator("section").filter({ has: page.locator("#wishlist-heading") });
}

export function holdingsSection(page: Page) {
  return page.locator("section").filter({ has: page.locator("#cards-heading") });
}

export function sellPrefillModalForm(page: Page) {
  return page.locator("form").filter({
    has: page.getByText("卡牌與規格已從收藏庫帶入"),
  });
}

export function holdingsRow(page: Page, productName: string) {
  return holdingsSection(page)
    .locator("tbody tr")
    .filter({ hasText: productName })
    .first();
}

export function holdingsRowByPurchasePrice(
  page: Page,
  productName: string,
  purchasePrice: string | number,
): ReturnType<typeof holdingsRow> {
  const normalized = String(purchasePrice).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return holdingsSection(page)
    .locator("tbody tr")
    .filter({ hasText: productName })
    .filter({ hasText: normalized })
    .last();
}

export async function clickCollectionFilter(
  page: Page,
  label: string,
): Promise<void> {
  await holdingsSection(page)
    .getByRole("button", { name: label, exact: true })
    .click();
}

export async function openHoldingsRowMenu(
  page: Page,
  productName: string,
): Promise<void> {
  const row = holdingsRow(page, productName);
  await row.getByRole("button").filter({ hasText: "⋯" }).click();
}

export async function addHobbyHoldingForFixture(
  page: Page,
  fixture: ListingMarketplaceFixture,
  purchasePrice = "12345",
): Promise<string> {
  await gotoCollectionPage(page);
  await expect(page.locator("#cards-heading")).toBeVisible({
    timeout: 20_000,
  });
  await openHobbyAddAssetModal(page);
  await searchAndSelectCatalogForFixture(page, fixture);
  await addAssetModalForm(page).getByPlaceholder("0").fill(purchasePrice);
  await page.getByRole("button", { name: "★ 收錄至私藏愛好" }).click();
  await expect(
    page.getByText("已成功收錄進您的私藏愛好清單"),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    holdingsRowByPurchasePrice(page, fixture.productName, purchasePrice),
  ).toBeVisible({
    timeout: 20_000,
  });
  return purchasePrice;
}

export async function uploadSellPrefillPhotos(
  page: Page,
  photoPath: string = LISTING_PHOTO_FIXTURE,
  count = 4,
): Promise<void> {
  const modal = sellPrefillModalForm(page);
  const files = Array.from({ length: count }, () => photoPath);
  await modal.locator('input[type="file"]').setInputFiles(files);
  await expect(modal.getByText(`${count}/6`)).toBeVisible({ timeout: 10_000 });
}
