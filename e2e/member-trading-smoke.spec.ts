import { test, expect } from "@playwright/test";
import { getChatRealtimeFixtures } from "./fixtures/chat-test-data";
import {
  ensureDbChatRoom,
  getLatestOfferForListing,
  getListingStatus,
  getProfileDisplayName,
  getProfileIdByEmail,
  resolveE2eMarketplaceFixture,
  resetE2eListingTradingFixture,
} from "./fixtures/supabase-admin";
import { hasBuyerAuthFixtures, hasMemberTradingFixtures } from "./fixtures/test-data";
import {
  acceptOfferAsSeller,
  gotoTradingPage,
  offerAmountFromListingPrice,
  offerAmountLabelFromListingPrice,
  openBothChatRooms,
  submitBuyerOfferFromDetail,
} from "./helpers/member-trading";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Member trading list smoke", () => {
  test("buyer trading page loads shell", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "buyer", "Buyer-only trading smoke");
    if (!hasBuyerAuthFixtures()) {
      test.skip(true, "Missing E2E_BUYER_EMAIL or E2E_BUYER_PASSWORD");
    }

    await gotoTradingPage(page);
    await expect(page.locator("#user-trading-heading")).toContainText("交易管理");
    await expect(page.getByRole("tab", { name: "全部" }).first()).toBeVisible();
  });

  test("seller trading page loads shell", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "seller", "Seller-only trading smoke");
    if (!hasMemberTradingFixtures()) {
      test.skip(true, "Missing seller auth or trading fixtures");
    }

    await gotoTradingPage(page);
    await expect(page.locator("#user-trading-heading")).toContainText("交易管理");
    await expect(page.getByRole("tab", { name: "賣單" }).first()).toBeVisible();
  });
});

test.describe.serial("Member trading cancel pending order", () => {
  test("seller can cancel pending P2P order from trading list", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "member-trading",
      "Dual-browser cancel flow runs on member-trading project",
    );
    if (!hasMemberTradingFixtures()) {
      test.skip(true, "Missing member trading E2E env");
    }

    const fixtureResult = await resolveE2eMarketplaceFixture();
    if (!fixtureResult.ok) {
      test.skip(true, fixtureResult.skipReason);
      return;
    }
    const { listingId, sellerId, listingPrice } = fixtureResult.fixture;
    const offerAmount = offerAmountFromListingPrice(listingPrice);
    const offerLabel = offerAmountLabelFromListingPrice(listingPrice);

    const listingStatus = await getListingStatus(listingId);
    if (listingStatus && listingStatus !== "active") {
      test.skip(
        true,
        `Listing ${listingId} is ${listingStatus}; reset E2E_LISTING_ID to an active seller listing`,
      );
    }

    const fixtures = getChatRealtimeFixtures();
    const buyerEmail = fixtures.buyerEmail!;
    const buyerId = await getProfileIdByEmail(buyerEmail);
    if (!buyerId) {
      test.skip(true, `Could not resolve buyer profile for ${buyerEmail}`);
      return;
    }

    const roomId = await ensureDbChatRoom(buyerId, sellerId);
    await resetE2eListingTradingFixture({ listingId, buyerId, sellerId });
    const [sellerDisplayName, buyerDisplayName] = await Promise.all([
      getProfileDisplayName(sellerId),
      getProfileDisplayName(buyerId),
    ]);

    const buyerContext = await browser.newContext({
      storageState: "e2e/.auth/buyer.json",
    });
    const sellerContext = await browser.newContext({
      storageState: "e2e/.auth/seller.json",
    });

    const buyerPage = await buyerContext.newPage();
    const sellerPage = await sellerContext.newPage();

    try {
      await openBothChatRooms(
        buyerPage,
        sellerPage,
        roomId,
        sellerDisplayName,
        buyerDisplayName,
      );

      await submitBuyerOfferFromDetail(
        buyerPage,
        sellerId,
        listingId,
        offerAmount,
      );

      let offerId: string | null = null;
      await expect
        .poll(async () => {
          const offer = await getLatestOfferForListing({
            roomId,
            listingId,
            buyerId,
          });
          offerId = offer?.id ?? null;
          return (
            offer?.status === "pending" && offer.use_authentication === false
          );
        }, { timeout: 25_000 })
        .toBe(true);

      if (!offerId) {
        throw new Error("Failed to resolve offerId for cancel flow");
      }

      await acceptOfferAsSeller(
        sellerPage,
        roomId,
        buyerDisplayName,
        offerId,
        offerLabel,
        buyerPage,
        sellerDisplayName,
      );

      await gotoTradingPage(sellerPage);
      await sellerPage.getByRole("tab", { name: "賣單" }).first().click();

      const cancelButton = sellerPage
        .getByRole("button", { name: "取消交易" })
        .first();
      await expect(cancelButton).toBeVisible({ timeout: 30_000 });

      await cancelButton.click();
      await sellerPage.getByRole("button", { name: "確認取消" }).click();

      await expect(sellerPage.getByText("交易已取消，商品已重新上架")).toBeVisible({
        timeout: 20_000,
      });

      await gotoTradingPage(buyerPage);
      await expect(buyerPage.locator("#user-trading-heading")).toContainText(
        "交易管理",
      );
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });
});
