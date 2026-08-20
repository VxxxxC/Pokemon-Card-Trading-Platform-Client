import { test, expect } from "@playwright/test";
import { getChatRealtimeFixtures } from "./fixtures/chat-test-data";
import {
  ensureDbChatRoom,
  ensureListingAcceptsAuthentication,
  getListingAcceptsAuthentication,
  getMemberOrderById,
  getProfileDisplayName,
  getProfileIdByEmail,
  resolveE2eMarketplaceFixture,
} from "./fixtures/supabase-admin";
import { hasMemberTradingFixtures } from "./fixtures/test-data";
import {
  acceptOfferAsSeller,
  ensurePendingAuthOffer,
  gotoOrderDetail,
  mockPayAuthOrderOnDetail,
  offerAmountFromListingPrice,
  offerAmountLabelFromListingPrice,
  pollMemberOrderIdForOffer,
} from "./helpers/member-trading";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Member auth escrow inbound", () => {
  test("seller submits inbound tracking after buyer mock pay", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "member-trading",
      "Auth inbound runs on member-trading project",
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
    const trackingNo = `SF-E2E-${Date.now().toString().slice(-8)}`;

    const authEnabled = await ensureListingAcceptsAuthentication(listingId);
    const acceptsAuth = await getListingAcceptsAuthentication(listingId);
    if (!authEnabled && acceptsAuth === false) {
      test.skip(true, "E2E listing does not accept platform authentication");
      return;
    }

    const fixtures = getChatRealtimeFixtures();
    const buyerEmail = fixtures.buyerEmail!;
    const buyerId = await getProfileIdByEmail(buyerEmail);
    if (!buyerId) {
      test.skip(true, `Could not resolve buyer profile for ${buyerEmail}`);
      return;
    }

    const roomId = await ensureDbChatRoom(buyerId, sellerId);
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
      const offerState = await ensurePendingAuthOffer({
        buyerPage,
        sellerId,
        listingId,
        roomId,
        buyerId,
        offerAmount,
      });
      await acceptOfferAsSeller(
        sellerPage,
        roomId,
        buyerDisplayName,
        offerState.offerId,
        offerLabel,
        buyerPage,
        sellerDisplayName,
      );

      const memberOrderId = await pollMemberOrderIdForOffer(offerState.offerId);
      await gotoOrderDetail(buyerPage, memberOrderId);
      await mockPayAuthOrderOnDetail(buyerPage);

      await gotoOrderDetail(sellerPage, memberOrderId);
      await expect(
        sellerPage.getByText("請將卡牌寄往平台倉庫，並填寫順豐物流單號。"),
      ).toBeVisible({ timeout: 20_000 });

      await sellerPage.getByPlaceholder("寄往平台的順豐單號").fill(trackingNo);
      await sellerPage
        .getByRole("button", { name: "提交入庫物流單號" })
        .click();

      await expect(sellerPage.getByText(`已提交單號：${trackingNo}`)).toBeVisible({
        timeout: 20_000,
      });

      const order = await getMemberOrderById(memberOrderId);
      if (order?.inbound_tracking_no) {
        expect(order.inbound_tracking_no).toBe(trackingNo);
      }
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });
});
