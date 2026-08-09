import { test, expect } from "@playwright/test";
import { getChatRealtimeFixtures } from "./fixtures/chat-test-data";
import {
  advanceAuthOrderToCustody,
  ensureDbChatRoom,
  ensureListingAcceptsAuthentication,
  getLatestMemberOrderForListing,
  getListingAcceptsAuthentication,
  getProfileDisplayName,
  getProfileIdByEmail,
  guardAuthMemberOrder,
  resolveE2eMarketplaceFixture,
} from "./fixtures/supabase-admin";
import { hasMemberTradingFixtures } from "./fixtures/test-data";
import {
  acceptOfferAsSeller,
  ensurePendingAuthOffer,
  gotoOrderDetail,
  offerAmountFromListingPrice,
  offerAmountLabelFromListingPrice,
  payAuthMemberOrder,
} from "./helpers/member-trading";
import { hasStripeReconcileEnv } from "./helpers/stripe-reconcile";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(300_000);

test.describe("Member order detail — auth escrow", () => {
  test("auth order at payment shows checkout CTA, not P2P handover", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "member-trading",
      "Order detail auth CTA runs on member-trading project",
    );
    test.skip(!hasStripeReconcileEnv(), "Missing Stripe keys for member auth checkout");
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

    const authEnabled = await ensureListingAcceptsAuthentication(listingId);
    const acceptsAuth = await getListingAcceptsAuthentication(listingId);
    if (!authEnabled && acceptsAuth === false) {
      test.skip(
        true,
        "E2E listing does not accept platform authentication (enable use_authentication or grant service role)",
      );
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

    let memberOrderId: string | null = null;

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
        sellerId,
        buyerId,
      );

      const order = await getLatestMemberOrderForListing({ listingId, buyerId });
      if (order) {
        memberOrderId = order.id;
        const guard = guardAuthMemberOrder(order);
        if (!guard.ok) {
          test.skip(true, guard.skipReason);
        }
      }

      if (!memberOrderId) {
        await buyerPage.goto("/profile/user/trading?filter=待處理", {
          waitUntil: "domcontentloaded",
        });
        const payButton = buyerPage
          .getByRole("button", { name: "前往付款" })
          .first();
        await expect(payButton).toBeVisible({ timeout: 30_000 });
        await payButton.click();
        await buyerPage.waitForURL(/\/profile\/user\/orderDetail\//, {
          timeout: 20_000,
        });
        memberOrderId =
          buyerPage.url().split("/profile/user/orderDetail/")[1]?.split("?")[0] ??
          null;
      } else {
        await gotoOrderDetail(buyerPage, memberOrderId);
      }

      await expect(
        buyerPage.getByRole("button", { name: "前往付款" }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        buyerPage.getByText(/尚未完成託管付款/),
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        buyerPage.getByRole("button", { name: "確認完成交易" }),
      ).toHaveCount(0);
      await expect(
        buyerPage.getByRole("link", { name: "返回交易管理" }),
      ).toBeVisible();

      if (!memberOrderId) {
        throw new Error("Missing member order id before stripe checkout");
      }

      await payAuthMemberOrder(buyerPage, memberOrderId);

      const advanced = await advanceAuthOrderToCustody(memberOrderId);
      if (!advanced) {
        test.info().annotations.push({
          type: "note",
          description:
            "Skipped seller inbound form — service role lacks member_orders grant to seed custody",
        });
        return;
      }

      await sellerPage.reload({ waitUntil: "domcontentloaded" });
      await gotoOrderDetail(sellerPage, memberOrderId);
      await expect(
        sellerPage.getByText("請將卡牌寄往平台倉庫，並填寫快遞公司與物流單號。"),
      ).toBeVisible({ timeout: 20_000 });
      await expect(
        sellerPage.getByPlaceholder("快遞公司（例如：順豐、DHL）"),
      ).toBeVisible();
      await expect(sellerPage.getByPlaceholder("物流單號")).toBeVisible();
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });
});
