import { test, expect } from "@playwright/test";
import {
  hasBuyerAuthFixtures,
  hasBunnyStorageFixtures,
  hasCoreMerchantFixtures,
} from "./fixtures/test-data";
import {
  clearListingsForSellerProduct,
  countActiveListingsForSellerProduct,
  countUserCollectionsForUserProduct,
  deleteUserCollectionsForUserProduct,
  getBuyerProfileIdFromEnv,
  getLatestActiveListingForSellerProduct,
  getLatestUserCollectionId,
  getListingSourceCollectionId,
  markUserCollectionAsSold,
  resolveE2eMarketplaceFixture,
  setListingStatusInactive,
  type ListingMarketplaceFixture,
} from "./fixtures/supabase-admin";
import {
  addHobbyHoldingForFixture,
  clickCollectionFilter,
  gotoCollectionPage,
  holdingsRow,
  holdingsRowByPurchasePrice,
  holdingsSection,
  openHoldingsRowMenu,
  sellPrefillModalForm,
  uploadSellPrefillPhotos,
} from "./helpers/collection-asset";

function uniquePurchasePrice(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  }
  return String(10_000 + ((hash * 97 + Date.now()) % 90_000));
}

async function waitForCollectionRefresh(page: import("@playwright/test").Page) {
  const wrapper = page
    .locator('section[aria-labelledby="cards-heading"]')
    .locator("xpath=..");
  await expect(wrapper).not.toHaveClass(/pointer-events-none/, {
    timeout: 30_000,
  });
}

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

async function loadMarketplaceFixture(): Promise<
  ListingMarketplaceFixture | { skipReason: string }
> {
  const fixtureResult = await resolveE2eMarketplaceFixture();
  if (!fixtureResult.ok) {
    return { skipReason: fixtureResult.skipReason };
  }

  return fixtureResult.fixture;
}

function skipUnlessBuyerFixtures(testInfo: { project: { name: string } }): void {
  test.skip(testInfo.project.name !== "buyer", "Buyer-only collection flow");
  if (!hasBuyerAuthFixtures() || !hasCoreMerchantFixtures()) {
    test.skip(true, "Missing buyer auth or core listing fixtures");
  }
}

test.describe("Member collection operations", () => {
  test("collection filter chips respond without error", async ({
    page,
  }, testInfo) => {
    skipUnlessBuyerFixtures(testInfo);

    await gotoCollectionPage(page);
    await expect(page.locator("#cards-heading")).toBeVisible({
      timeout: 20_000,
    });

    for (const label of ["全部", "已鑑定", "未鑑定", "已上架", "已售出"]) {
      await clickCollectionFilter(page, label);
      await expect(page.locator("#cards-heading")).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});

test.describe.serial("Member collection holdings mutations", () => {
  test("buyer can update holding grade", async ({ page }, testInfo) => {
    skipUnlessBuyerFixtures(testInfo);

    const loaded = await loadMarketplaceFixture();
    if ("skipReason" in loaded) {
      test.skip(true, loaded.skipReason);
      return;
    }
    const fixture = loaded;
    const buyerId = await getBuyerProfileIdFromEnv();

    if (buyerId) {
      await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
    }

    const purchasePrice = uniquePurchasePrice("grade");
    await addHobbyHoldingForFixture(page, fixture, purchasePrice, {
      gradingOptionLabel: "PSA 10",
    });
    const row = holdingsRowByPurchasePrice(
      page,
      fixture.productName,
      purchasePrice,
      { gradingLabel: "PSA" },
    );

    await row.getByLabel(`更改 ${fixture.productName} 鑑定規格`).click();
    await page.getByRole("menuitem", { name: "裸卡 A", exact: true }).click();
    await waitForCollectionRefresh(page);

    const updatedRow = holdingsRowByPurchasePrice(
      page,
      fixture.productName,
      purchasePrice,
      { gradingLabel: "RAW" },
    );
    await expect(
      updatedRow.getByRole("button", {
        name: `更改 ${fixture.productName} 鑑定規格`,
      }),
    ).toContainText("裸卡 A", { timeout: 20_000 });

    await clickCollectionFilter(page, "未鑑定");
    await expect(
      holdingsRowByPurchasePrice(page, fixture.productName, purchasePrice, {
        gradingLabel: "RAW",
      }),
    ).toBeVisible({
      timeout: 15_000,
    });

    if (buyerId) {
      await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
    }
  });

  test("buyer can remove holding from collection", async ({ page }, testInfo) => {
    skipUnlessBuyerFixtures(testInfo);

    const loaded = await loadMarketplaceFixture();
    if ("skipReason" in loaded) {
      test.skip(true, loaded.skipReason);
      return;
    }
    const fixture = loaded;
    const buyerId = await getBuyerProfileIdFromEnv();

    if (buyerId) {
      await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
    }

    const purchasePrice = uniquePurchasePrice("remove");
    await addHobbyHoldingForFixture(page, fixture, purchasePrice);
    const row = holdingsRowByPurchasePrice(
      page,
      fixture.productName,
      purchasePrice,
      { gradingLabel: "RAW" },
    );
    await row.getByRole("button").filter({ hasText: "⋯" }).click();
    await page.getByRole("menuitem", { name: "移除出資產庫" }).click();

    await expect(row).toHaveCount(0, {
      timeout: 30_000,
    });
  });

  test("buyer can sell holding from collection prefill", async ({
    page,
  }, testInfo) => {
    skipUnlessBuyerFixtures(testInfo);
    if (!hasBunnyStorageFixtures()) {
      test.skip(true, "Missing Bunny storage env for collection sell upload");
    }

    const loaded = await loadMarketplaceFixture();
    if ("skipReason" in loaded) {
      test.skip(true, loaded.skipReason);
      return;
    }
    const fixture = loaded;

    const buyerId = await getBuyerProfileIdFromEnv();
    if (!buyerId) {
      test.skip(true, "Unable to resolve buyer profile id");
      return;
    }

    await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
    await clearListingsForSellerProduct(buyerId, fixture.productId);
    await expect
      .poll(
        async () => countUserCollectionsForUserProduct(buyerId, fixture.productId),
        { timeout: 30_000 },
      )
      .toBe(0);
    await expect
      .poll(
        async () => countActiveListingsForSellerProduct(buyerId, fixture.productId),
        { timeout: 30_000 },
      )
      .toBe(0);
    const purchasePrice = uniquePurchasePrice("sell");
    await addHobbyHoldingForFixture(page, fixture, purchasePrice);
    await gotoCollectionPage(page);
    await waitForCollectionRefresh(page);
    let row = holdingsRowByPurchasePrice(
      page,
      fixture.productName,
      purchasePrice,
      { gradingLabel: "RAW" },
    );
    await expect(row).toBeVisible({ timeout: 20_000 });
    if (!(await row.getByText("持有中").isVisible().catch(() => false))) {
      await clearListingsForSellerProduct(buyerId, fixture.productId);
      await expect
        .poll(
          async () => countActiveListingsForSellerProduct(buyerId, fixture.productId),
          { timeout: 30_000 },
        )
        .toBe(0);
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForCollectionRefresh(page);
      row = holdingsRowByPurchasePrice(page, fixture.productName, purchasePrice, {
        gradingLabel: "RAW",
      });
      await expect(row.getByText("持有中")).toBeVisible({ timeout: 30_000 });
    }

    const collectionId = await getLatestUserCollectionId(
      buyerId,
      fixture.productId,
    );

    await row.getByRole("button").filter({ hasText: "⋯" }).click();
    await page.getByRole("menuitem", { name: "出售收藏品" }).click();

    await expect(page.getByText("上架出售收藏")).toBeVisible({
      timeout: 15_000,
    });
    const sellForm = sellPrefillModalForm(page);
    await expect(sellForm).toBeVisible({ timeout: 15_000 });
    await sellForm.getByPlaceholder("一口價放售金額...").fill("17777");
    await uploadSellPrefillPhotos(page);
    await page.getByRole("button", { name: "🚀 確認上架發售" }).click();

    await expect(sellForm).toBeHidden({ timeout: 120_000 });

    await gotoCollectionPage(page);
    await clickCollectionFilter(page, "已上架");
    await expect(
      holdingsRowByPurchasePrice(page, fixture.productName, purchasePrice, {
        gradingLabel: "RAW",
      }),
    ).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      holdingsRowByPurchasePrice(page, fixture.productName, purchasePrice, {
        gradingLabel: "RAW",
      }).getByText("已上架"),
    ).toBeVisible();

    let listingIdCreated: string | null = null;
    await expect
      .poll(async () => {
        listingIdCreated = await getLatestActiveListingForSellerProduct(
          buyerId,
          fixture.productId,
        );
        return listingIdCreated != null;
      }, { timeout: 30_000 })
      .toBe(true);

    if (collectionId && listingIdCreated) {
      const sourceCollectionId = await getListingSourceCollectionId(
        listingIdCreated,
      );
      if (sourceCollectionId) {
        expect(sourceCollectionId).toBe(collectionId);
      }
    }

    if (listingIdCreated) {
      await setListingStatusInactive(listingIdCreated);
    }
    await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
  });

  test("sold filter shows archived holding when sold_at is set", async ({
    page,
  }, testInfo) => {
    skipUnlessBuyerFixtures(testInfo);

    const loaded = await loadMarketplaceFixture();
    if ("skipReason" in loaded) {
      test.skip(true, loaded.skipReason);
      return;
    }
    const fixture = loaded;

    const buyerId = await getBuyerProfileIdFromEnv();
    if (!buyerId) {
      test.skip(true, "Unable to resolve buyer profile id");
      return;
    }

    await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
    const purchasePrice = uniquePurchasePrice("sold");
    await addHobbyHoldingForFixture(page, fixture, purchasePrice);
    const row = holdingsRowByPurchasePrice(
      page,
      fixture.productName,
      purchasePrice,
    );

    const collectionId = await getLatestUserCollectionId(
      buyerId,
      fixture.productId,
    );
    if (!collectionId) {
      test.skip(true, "Unable to resolve collection row for sold filter seed");
      return;
    }

    const markedSold = await markUserCollectionAsSold({
      userId: buyerId,
      collectionId,
      soldPrice: 15000,
    });
    if (!markedSold) {
      test.skip(true, "Service role cannot update user_collections for sold seed");
      return;
    }

    await gotoCollectionPage(page);
    await clickCollectionFilter(page, "全部");
    await expect(row).toHaveCount(0, {
      timeout: 15_000,
    });

    await clickCollectionFilter(page, "已售出");
    await expect(row).toBeVisible({
      timeout: 15_000,
    });
    await expect(row.getByText("已售出")).toBeVisible();

    await deleteUserCollectionsForUserProduct(buyerId, fixture.productId);
  });
});
