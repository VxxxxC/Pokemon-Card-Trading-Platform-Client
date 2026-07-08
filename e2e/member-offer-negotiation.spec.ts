import { test, expect } from "@playwright/test";
import { getChatRealtimeFixtures } from "./fixtures/chat-test-data";
import {
  ensureDbChatRoom,
  ensureListingActive,
  getLatestOfferForListing,
  getListingStatus,
  getOfferStatus,
  getProfileDisplayName,
  getProfileIdByEmail,
  resolveE2eMarketplaceFixture,
} from "./fixtures/supabase-admin";
import { hasMemberTradingFixtures } from "./fixtures/test-data";
import {
  ensureChatRoomActive,
  modifiedOfferAmountFromListingPrice,
  offerAmountFromListingPrice,
  offerAmountLabelFromListingPrice,
  offerCardWithAmount,
  openBothChatRooms,
  chatConsoleRoot,
  submitBuyerOfferFromDetail,
} from "./helpers/member-trading";

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Member offer negotiation", () => {
  test("seller can reject a pending offer", async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "member-trading",
      "Dual-browser negotiation runs on member-trading project",
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

    let offerId: string | null = null;

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
      await expect
        .poll(async () => {
          const offer = await getLatestOfferForListing({
            roomId,
            listingId,
            buyerId,
          });
          offerId = offer?.id ?? null;
          return offer?.status === "pending" && !offer.use_authentication;
        }, { timeout: 25_000 })
        .toBe(true);

      if (!offerId) {
        throw new Error("Missing offerId for reject flow");
      }

      await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);
      const sellerOfferCard = offerCardWithAmount(sellerPage, offerLabel).filter({
        has: sellerPage.getByRole("button", { name: "拒絕出價" }),
      });
      await expect(sellerOfferCard).toBeVisible({ timeout: 45_000 });
      await sellerOfferCard.getByRole("button", { name: "拒絕出價" }).click();
      await sellerPage.getByRole("button", { name: "確認拒絕" }).click();

      await expect
        .poll(async () => getOfferStatus(offerId!), { timeout: 30_000 })
        .toBe("rejected");

      await ensureChatRoomActive(buyerPage, roomId, sellerDisplayName);
      const buyerOfferCard = offerCardWithAmount(buyerPage, offerLabel);
      await expect(buyerOfferCard.getByText("● 已拒絕")).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });

  test("buyer can modify a pending offer once", async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "member-trading",
      "Dual-browser negotiation runs on member-trading project",
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
    const modifyAmount = modifiedOfferAmountFromListingPrice(listingPrice);

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

      const existingOffer = await getLatestOfferForListing({
        roomId,
        listingId,
        buyerId,
      });

      if (
        existingOffer?.status !== "pending" ||
        existingOffer.use_authentication
      ) {
        await ensureListingActive(listingId);
        await submitBuyerOfferFromDetail(
          buyerPage,
          sellerId,
          listingId,
          offerAmount,
        );
        await expect
          .poll(async () => {
            const offer = await getLatestOfferForListing({
              roomId,
              listingId,
              buyerId,
            });
            return offer?.status === "pending" && !offer.use_authentication;
          }, { timeout: 25_000 })
          .toBe(true);
      }

      await ensureChatRoomActive(buyerPage, roomId, sellerDisplayName);
      const buyerOfferCard = offerCardWithAmount(buyerPage, offerLabel).filter({
        has: buyerPage.getByRole("button", { name: "修改出價" }),
      });
      await expect(buyerOfferCard).toBeVisible({ timeout: 45_000 });
      await buyerOfferCard.getByRole("button", { name: "修改出價" }).click();
      await buyerPage.locator('input[type="number"]').last().fill(modifyAmount);
      await buyerPage.getByRole("button", { name: "確認送出" }).click();

      await expect(buyerPage.getByText("出價已修改").first()).toBeVisible({
        timeout: 20_000,
      });

      await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);
      const sellerOfferCard = chatConsoleRoot(sellerPage)
        .locator("div.my-2.w-full")
        .filter({ hasText: "⚡ 議價出價卡片" })
        .filter({
          has: sellerPage.getByRole("button", { name: "接受出價" }),
        })
        .last();
      await expect(sellerOfferCard).toBeVisible({ timeout: 45_000 });
      await expect(
        sellerOfferCard.getByRole("button", { name: "接受出價" }),
      ).toBeVisible();
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });
});
