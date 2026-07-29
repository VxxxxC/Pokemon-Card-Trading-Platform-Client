import { test, expect, type Page } from "@playwright/test";
import {
  buildMerchantProductDetailPath,
  getMerchantProductDetailFixtures,
  hasCoreMerchantFixtures,
  hasListingDisplayIdFixture,
  hasListingProductIdFixture,
  hasSellerUsernameFixture,
  hasWrongSellerFixture,
} from "./fixtures/test-data";

const FAKE_LISTING_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

async function gotoAndExpectNotFound(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "networkidle" });

  const notFoundUi = page
    .getByRole("heading", { name: "找不到頁面", exact: true })
    .or(page.getByText("Error 404", { exact: true }));

  if (await notFoundUi.first().isVisible().catch(() => false)) {
    return;
  }

  // Next.js App Router may return HTTP 200 for notFound() — assert absence of detail UI.
  await expect(
    page.getByText("店主獨立出讓一口價"),
    `Expected missing listing UI for ${path}`,
  ).toHaveCount(0);
  await expect(page.locator("main h1")).toHaveCount(0);
}

async function expectDetailPageLoaded(page: Page): Promise<string> {
  const title = page.locator("main h1");
  await expect(title).toBeVisible();
  await expect(page.getByText("店主獨立出讓一口價")).toBeVisible();
  return (await title.textContent())?.trim() ?? "";
}

async function openCoreDetailPage(page: Page): Promise<string> {
  const { sellerId, listingId } = getMerchantProductDetailFixtures();
  await page.goto(
    buildMerchantProductDetailPath(sellerId!, listingId!),
    { waitUntil: "domcontentloaded" },
  );
  return expectDetailPageLoaded(page);
}

test.describe("A. Route resolution", () => {
  test("A1 resolves listing UUID for seller profile UUID", async ({ page }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    const { sellerId, listingId } = getMerchantProductDetailFixtures();
    await page.goto(
      buildMerchantProductDetailPath(sellerId!, listingId!),
    );

    const title = await expectDetailPageLoaded(page);
    expect(title.length).toBeGreaterThan(0);
    await expect(page.getByText(/HK\$\s*[\d,]+/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /查看實物特寫角度 1/ }),
    ).toBeVisible();
  });

  test("A2 resolves listing UUID for seller username", async ({ page }) => {
    if (!hasSellerUsernameFixture()) {
      test.skip(true, "Missing E2E_SELLER_USERNAME or E2E_LISTING_ID");
    }

    const { sellerUsername, listingId } = getMerchantProductDetailFixtures();
    await page.goto(
      buildMerchantProductDetailPath(sellerUsername!, listingId!),
    );

    await expectDetailPageLoaded(page);
  });

  test("A3 resolves catalog display_id for the same seller listing", async ({
    page,
  }) => {
    if (!hasListingDisplayIdFixture()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_DISPLAY_ID");
    }

    const { sellerId, listingDisplayId } = getMerchantProductDetailFixtures();
    const baselineTitle = await openCoreDetailPage(page);

    await page.goto(
      buildMerchantProductDetailPath(sellerId!, listingDisplayId!),
    );

    const resolvedTitle = await expectDetailPageLoaded(page);
    expect(resolvedTitle).toBe(baselineTitle);
  });

  test("A4 resolves catalog product_id for the same seller listing", async ({
    page,
  }) => {
    if (!hasListingProductIdFixture()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_PRODUCT_ID");
    }

    const { sellerId, listingProductId } = getMerchantProductDetailFixtures();
    const baselineTitle = await openCoreDetailPage(page);

    await page.goto(
      buildMerchantProductDetailPath(sellerId!, listingProductId!),
    );

    const resolvedTitle = await expectDetailPageLoaded(page);
    expect(resolvedTitle).toBe(baselineTitle);
  });
});

test.describe("B. Negative and edge cases", () => {
  test("B1 returns 404 for an invalid seller UUID", async ({ page }) => {
    const { invalidSellerId, listingId } = getMerchantProductDetailFixtures();
    if (!listingId) {
      test.skip(true, "Missing E2E_LISTING_ID");
    }

    await gotoAndExpectNotFound(
      page,
      buildMerchantProductDetailPath(invalidSellerId!, listingId!),
    );
  });

  test("B2 returns 404 for a valid seller with a non-existent listing UUID", async ({
    page,
  }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    await gotoAndExpectNotFound(
      page,
      buildMerchantProductDetailPath(sellerId!, FAKE_LISTING_ID),
    );
  });

  test("B3 returns 404 when listing UUID belongs to a different seller", async ({
    page,
  }) => {
    if (!hasWrongSellerFixture()) {
      test.skip(true, "Missing E2E_WRONG_SELLER_ID or E2E_LISTING_ID");
    }

    const { wrongSellerId, listingId } = getMerchantProductDetailFixtures();
    await gotoAndExpectNotFound(
      page,
      buildMerchantProductDetailPath(wrongSellerId!, listingId!),
    );
  });

  test("B4 returns 404 for an extremely long malformed product segment", async ({
    page,
  }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    const malformedProductId = "x".repeat(512);
    await gotoAndExpectNotFound(
      page,
      buildMerchantProductDetailPath(sellerId!, malformedProductId),
    );
  });
});

test.describe("C. UI interactions", () => {
  test("C1 switches the hero image when a gallery thumbnail is selected", async ({
    page,
  }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);

    const secondThumb = page.getByRole("button", {
      name: "查看實物特寫角度 2",
    });
    const thumbCount = await secondThumb.count();
    if (thumbCount === 0) {
      test.skip(true, "Fixture listing has fewer than 2 gallery photos");
    }

    await secondThumb.click();
    await expect(secondThumb).toHaveClass(/border-brand/);
    await expect(secondThumb).toHaveClass(/ring-brand/);
  });

  test("C2 navigates to the public marketplace product page", async ({
    page,
  }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);

    const publicMarketLink = page.getByRole("link", {
      name: /進入公開大盤商品市場/,
    });
    await expect(publicMarketLink).toBeVisible();

    const href = await publicMarketLink.getAttribute("href");
    expect(href).toMatch(/^\/marketplace\/product\/.+/);

    await publicMarketLink.click();
    await page.waitForURL(/\/marketplace\/product\/.+/);
    expect(page.url()).toContain(href!);
  });

  test("C3 returns to the storefront via the back button", async ({ page }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    const { sellerId } = getMerchantProductDetailFixtures();
    await page.goto(`/marketplace/${sellerId}`, {
      waitUntil: "domcontentloaded",
    });

    const detailLink = page
      .locator(`a[href*="/marketplace/${sellerId}/product/"]`)
      .first();
    await expect(detailLink).toBeVisible({ timeout: 30_000 });
    await detailLink.click();

    await expect(page).toHaveURL(
      new RegExp(`/marketplace/${sellerId}/product/.+`),
    );
    await expectDetailPageLoaded(page);

    await page.locator("main").getByRole("button").first().click();
    await expect(page).toHaveURL(new RegExp(`/marketplace/${sellerId}$`));
  });
});

test.describe("D. BuyButton interactions", () => {
  test("D1 guest sees the locked slide-over when clicking buy", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "guest",
      "Guest-only BuyButton interaction",
    );

    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);
    await page.getByRole("button", { name: /立即購買/ }).click();

    await expect(page.getByText("您目前正以遊客身份觀盤")).toBeVisible();
    const guestLockPanel = page
      .getByText("請先登入會員以活化平台第三方雙向鑑定與託管出價機制。")
      .locator("..");
    await expect(
      guestLockPanel.getByRole("link", { name: "登入 / 註冊" }),
    ).toBeVisible();
  });

  test("D2 buyer opens the buy-now confirm dialog without guest lock", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "buyer",
      "Buyer-only BuyButton interaction",
    );

    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);
    await page.getByRole("button", { name: /立即購買/ }).click();

    await expect(page.getByText("您目前正以遊客身份觀盤")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "確認立即購買" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "確認立即購買" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "改為議價出價" }),
    ).toBeVisible();
  });

  test("D3 buyer can close the buy-now confirm dialog", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "buyer",
      "Buyer-only BuyButton interaction",
    );

    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);
    await page.getByRole("button", { name: /立即購買/ }).click();
    await expect(
      page.getByRole("heading", { name: "確認立即購買" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "取消" }).click();

    await expect(
      page.getByRole("heading", { name: "確認立即購買" }),
    ).toHaveCount(0);
  });
});

test.describe("E. Content integrity", () => {
  test("shows seller, grading, and escrow metadata on a valid listing", async ({
    page,
  }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);

    await expect(page.getByText("實物鑑定品品相評級")).toBeVisible();
    await expect(page.getByText("筆歷史交割")).toBeVisible();
    await expect(page.getByText("中介託管狀態")).toBeVisible();

    const escrowLocked = page.getByText("平台官方安全中介存證已鎖定");
    const escrowC2c = page.getByText("C2C 直接交割模式");
    await expect(escrowLocked.or(escrowC2c)).toBeVisible();

    const galleryThumbs = page.getByRole("button", {
      name: /查看實物特寫角度/,
    });
    const thumbCount = await galleryThumbs.count();
    expect(thumbCount).toBeGreaterThan(0);
    expect(thumbCount).toBeLessThanOrEqual(4);
  });
});

test.describe("F. Known suspicious behaviors", () => {
  test("F1 buyer can open buy-now confirm dialog immediately after hard reload without guest lock", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "buyer",
      "Buyer-only race regression for mockRole hydration",
    );

    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    const { sellerId, listingId } = getMerchantProductDetailFixtures();
    const path = buildMerchantProductDetailPath(sellerId!, listingId!);

    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: /立即購買/ }).click();

    await expect(page.getByText("您目前正以遊客身份觀盤")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "確認立即購買" }),
    ).toBeVisible();
  });

  test("F2 product_id route resolves to the same canonical listing as listing UUID", async ({
    page,
  }) => {
    if (!hasListingProductIdFixture() || !hasCoreMerchantFixtures()) {
      test.skip(
        true,
        "Missing E2E_SELLER_ID, E2E_LISTING_ID, or E2E_LISTING_PRODUCT_ID",
      );
    }

    const { sellerId, listingId, listingProductId } =
      getMerchantProductDetailFixtures();

    await page.goto(buildMerchantProductDetailPath(sellerId!, listingId!));
    await expectDetailPageLoaded(page);
    const listingUuidPrice = await page
      .locator("main")
      .getByText(/HK\$\s*[\d,]+/)
      .first()
      .textContent();

    await page.goto(
      buildMerchantProductDetailPath(sellerId!, listingProductId!),
    );
    await expectDetailPageLoaded(page);
    const productIdPrice = await page
      .locator("main")
      .getByText(/HK\$\s*[\d,]+/)
      .first()
      .textContent();

    expect(productIdPrice).toBe(listingUuidPrice);
  });

  test("F3 shows canonical spec table or SSOT pending warning", async ({
    page,
  }) => {
    if (!hasCoreMerchantFixtures()) {
      test.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
    }

    await openCoreDetailPage(page);

    const specTable = page.getByText("官方標準資產規格數據");
    const ssotPending = page.getByText("SSOT Alignment Pending");
    await expect(specTable.or(ssotPending)).toBeVisible();
  });
});
