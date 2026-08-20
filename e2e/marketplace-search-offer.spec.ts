import { test, expect, type Page } from "@playwright/test";
import {
  getMerchantProductDetailFixtures,
  hasBuyerAuthFixtures,
  hasCoreMerchantFixtures,
} from "./fixtures/test-data";
import {
  ensureDbChatRoom,
  getLatestOfferForListing,
  getProfileIdByEmail,
  resolveE2eMarketplaceFixture,
  type ListingMarketplaceFixture,
} from "./fixtures/supabase-admin";
import { dismissBlockingOverlays } from "./helpers/overlays";

// AML: E2E buyer is <14 days old (HK$300 cap) and fixture listing has no market price.
// Use $299 to pass rpc_make_offer guards; raise after fixture buyer ages or listing auth changes.
const OFFER_AMOUNT = "299";

test.describe("Marketplace search + make offer", () => {
  test.describe.configure({ mode: "serial" });

  test.use({ viewport: { width: 1280, height: 900 } });

  test.setTimeout(120_000);

  function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function formatHkd(amount: number): string {
    return `HK$ ${amount.toLocaleString("en-HK")}`;
  }

  function fixtureGridCardLink(page: Page, fixture: ListingMarketplaceFixture) {
    return page
      .locator(`a[href="/marketplace/product/${fixture.productId}"]`)
      .filter({
        hasText: new RegExp(escapeRegex(formatHkd(fixture.lowestPrice))),
      });
  }

  async function searchFixtureProduct(page: Page, fixture: ListingMarketplaceFixture) {
    const searchInput = page.getByPlaceholder("搜尋官方卡牌名稱、編號...");
    await searchInput.fill(fixture.searchKeyword);
    await page.getByRole("heading", { name: "大盤市場" }).click();

    const cardLink = fixtureGridCardLink(page, fixture);
    await expect(cardLink).toHaveCount(1, { timeout: 20_000 });
    await expect(cardLink).toBeVisible({ timeout: 20_000 });
    return cardLink;
  }

  async function resolveFixtureOrSkip(
    testInstance: typeof test,
  ): Promise<ListingMarketplaceFixture | null> {
    if (!hasCoreMerchantFixtures()) {
      testInstance.skip(true, "Missing E2E_SELLER_ID or E2E_LISTING_ID");
      return null;
    }

    const { listingId } = getMerchantProductDetailFixtures();
    const result = await resolveE2eMarketplaceFixture();
    if (!result.ok) {
      testInstance.skip(true, result.skipReason);
      return null;
    }

    return result.fixture;
  }

  test("guest smoke — search, grid price, and public product navigation", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "guest",
      "Guest-only marketplace search smoke",
    );

    const fixture = await resolveFixtureOrSkip(test);
    if (!fixture) return;

    await test.step("Search marketplace and verify grid price", async () => {
      await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
      await dismissBlockingOverlays(page);
      await searchFixtureProduct(page, fixture);
    });

    await test.step("Open public product page without triggering buy flow", async () => {
      const productLink = fixtureGridCardLink(page, fixture);
      await productLink.click();

      await expect(page).toHaveURL(
        new RegExp(
          `/marketplace/product/${escapeRegex(fixture.productId)}(?:\\?.*)?$`,
        ),
      );
      await expect(page.locator("#live-order-book-panel")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("button", { name: /立即購買/ })).toHaveCount(
        0,
      );
    });
  });

  test("buyer journey — search → order book → slide-over → makeOffer", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "buyer",
      "Buyer-only marketplace offer funnel",
    );

    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    const fixture = await resolveFixtureOrSkip(test);
    if (!fixture) return;

    const { buyerEmail } = getMerchantProductDetailFixtures();
    const buyerId = await getProfileIdByEmail(buyerEmail!);
    if (!buyerId) {
      test.skip(true, `Could not resolve buyer profile for ${buyerEmail}`);
      return;
    }

    const roomId = await ensureDbChatRoom(buyerId, fixture.sellerId);

    await test.step("Step 1 — preflight fixture alignment", async () => {
      expect(fixture.listingId.length).toBeGreaterThan(0);
      expect(fixture.searchKeyword.length).toBeGreaterThan(0);
      expect(fixture.lowestPrice).toBeGreaterThan(0);
      expect(fixture.listingPrice).toBeGreaterThan(0);
    });

    await test.step("Step 2 — open marketplace", async () => {
      await page.goto("/marketplace", { waitUntil: "domcontentloaded" });
      await dismissBlockingOverlays(page);
      await expect(
        page.getByPlaceholder("搜尋官方卡牌名稱、編號..."),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Step 3 — keyword search triggers filtered grid", async () => {
      await searchFixtureProduct(page, fixture);
    });

    await test.step("Step 4 — grid card shows lowest marketplace price", async () => {
      await expect(fixtureGridCardLink(page, fixture)).toContainText(
        new RegExp(escapeRegex(formatHkd(fixture.lowestPrice))),
      );
    });

    await test.step("Step 5 — navigate via card link to public product page", async () => {
      const cardLink = fixtureGridCardLink(page, fixture);
      const productHref = await cardLink.getAttribute("href");
      expect(productHref).toMatch(
        new RegExp(`/marketplace/product/${escapeRegex(fixture.productId)}`),
      );
      await page.goto(productHref!, { waitUntil: "domcontentloaded" });

      await expect(page).toHaveURL(
        new RegExp(
          `/marketplace/product/${escapeRegex(fixture.productId)}(?:\\?.*)?$`,
        ),
        { timeout: 15_000 },
      );
    });

    await test.step("Step 6 — order book lists fixture seller", async () => {
      await expect(page.locator("#live-order-book-panel")).toBeVisible({
        timeout: 20_000,
      });
      const sellerRow = page
        .locator("#live-order-book-panel [role='button']")
        .filter({ hasText: fixture.sellerName })
        .filter({ hasText: formatHkd(fixture.listingPrice) })
        .first();
      await expect(sellerRow).toBeVisible({ timeout: 20_000 });
    });

    await test.step("Step 7 — open execution slide-over from seller row", async () => {
      const sellerRow = page
        .locator("#live-order-book-panel [role='button']")
        .filter({ hasText: fixture.sellerName })
        .filter({ hasText: formatHkd(fixture.listingPrice) })
        .first();
      await expect(sellerRow).toBeVisible({ timeout: 15_000 });
      await sellerRow.click();

      const slideOver = page.locator("div.fixed.inset-0.z-\\[400\\]");
      await expect(slideOver).toBeVisible({ timeout: 15_000 });
      await expect(slideOver.getByText("對接賣家商號")).toBeVisible();
      await expect(
        slideOver
          .getByText(new RegExp(escapeRegex(formatHkd(fixture.listingPrice))))
          .first(),
      ).toBeVisible();
      await expect(slideOver.locator("#exe-negotiation-price")).toBeVisible();
    });

    await test.step("Step 8 — submit AML-safe offer from slide-over", async () => {
      await page.locator("#exe-negotiation-price").fill(OFFER_AMOUNT);
      await page.getByRole("button", { name: "發送叫價至聊天室" }).click();

      await expect(page.locator("[data-sonner-toast]").filter({
        hasText: "議價要約已成功送出",
      })).toBeVisible({ timeout: 20_000 });
    });

    await test.step("Step 9 — DB offer row is pending", async () => {
      await expect
        .poll(
          async () => {
            const offer = await getLatestOfferForListing({
              roomId,
              listingId: fixture.listingId,
              buyerId,
            });
            return offer?.status === "pending";
          },
          { timeout: 25_000 },
        )
        .toBe(true);
    });
  });
});
