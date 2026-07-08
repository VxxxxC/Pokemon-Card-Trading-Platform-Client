import { test, expect, type Page } from "@playwright/test";
import {
  buildMerchantProductDetailPath,
  hasMemberTradingFixtures,
} from "./fixtures/test-data";
import {
  getChatRealtimeFixtures,
} from "./fixtures/chat-test-data";
import {
  ensureDbChatRoom,
  getLatestMemberOrderForListing,
  getLatestOfferForListing,
  getMemberOrderById,
  getOfferStatus,
  getProfileDisplayName,
  getProfileIdByEmail,
  getReviewForMemberOrder,
  guardP2pMemberOrder,
} from "./fixtures/supabase-admin";

const OFFER_AMOUNT = "299";
const OFFER_AMOUNT_LABEL = "HK$ 299";

test.describe.configure({ mode: "serial" });
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(240_000);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function dismissBlockingOverlays(page: Page): Promise<void> {
  const pwaClose = page.getByRole("button", { name: "✕" }).first();
  if (await pwaClose.isVisible().catch(() => false)) {
    await pwaClose.click();
  }
}

function chatConsoleRoot(page: Page) {
  return page.locator('[data-chat-console="true"].hidden.lg\\:flex');
}

async function openChatRoom(
  page: Page,
  roomId: string,
  partnerName: string,
): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissBlockingOverlays(page);

  const header = page.getByRole("banner");
  await expect(header).toBeVisible({ timeout: 20_000 });

  const inboxButton = header.locator("button").filter({
    has: page.locator('svg path[d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"]'),
  });
  await inboxButton.click();
  await page.getByRole("button", { name: "展開面板" }).click();
  await expect(chatConsoleRoot(page)).toBeVisible({ timeout: 20_000 });

  await page.evaluate(
    ({ targetRoomId, targetPartnerName }) => {
      window.dispatchEvent(
        new CustomEvent("open-global-chat", {
          detail: {
            roomId: targetRoomId,
            partnerName: targetPartnerName,
          },
        }),
      );
    },
    { targetRoomId: roomId, targetPartnerName: partnerName },
  );

  await expect(
    chatConsoleRoot(page).getByPlaceholder(
      new RegExp(`回覆給 ${escapeRegex(partnerName)}`),
    ),
  ).toBeVisible({ timeout: 20_000 });
}

async function ensureChatRoomActive(
  page: Page,
  roomId: string,
  partnerName: string,
): Promise<void> {
  await dismissBlockingOverlays(page);
  if (await chatConsoleRoot(page).isVisible().catch(() => false)) {
    await page.evaluate(
      ({ targetRoomId, targetPartnerName }) => {
        window.dispatchEvent(
          new CustomEvent("open-global-chat", {
            detail: {
              roomId: targetRoomId,
              partnerName: targetPartnerName,
            },
          }),
        );
      },
      { targetRoomId: roomId, targetPartnerName: partnerName },
    );
    await expect(
      chatConsoleRoot(page).getByPlaceholder(
        new RegExp(`回覆給 ${escapeRegex(partnerName)}`),
      ),
    ).toBeVisible({ timeout: 15_000 });
    return;
  }

  await openChatRoom(page, roomId, partnerName);
}

function offerCardWithAmount(page: Page, amountLabel: string) {
  return chatConsoleRoot(page)
    .locator("div.my-2.w-full")
    .filter({ hasText: "⚡ 議價出價卡片" })
    .filter({ hasText: amountLabel })
    .last();
}

async function submitBuyerOfferFromDetail(
  buyerPage: Page,
  sellerId: string,
  listingId: string,
): Promise<void> {
  await buyerPage.goto(buildMerchantProductDetailPath(sellerId, listingId), {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(buyerPage);
  await expect(buyerPage.locator("main h1")).toBeVisible({ timeout: 15_000 });
  await buyerPage.getByRole("button", { name: /立即購買/ }).click();
  await expect(buyerPage.locator("#exe-negotiation-price")).toBeVisible({
    timeout: 15_000,
  });

  const slideOver = buyerPage.locator("div.fixed.inset-0.z-\\[400\\]");
  const authSwitch = slideOver.getByRole("switch");
  if (await authSwitch.isVisible().catch(() => false)) {
    const checked = await authSwitch.getAttribute("aria-checked");
    if (checked === "true") {
      await authSwitch.click();
    }
  }

  await buyerPage.locator("#exe-negotiation-price").fill(OFFER_AMOUNT);
  await buyerPage.getByRole("button", { name: "發送叫價至聊天室" }).click();
  await expect(buyerPage.getByText("議價要約已成功送出")).toBeVisible({
    timeout: 20_000,
  });
}

async function confirmHandoverDialog(page: Page): Promise<void> {
  const completeButton = page
    .getByRole("button", { name: "確認完成交易" })
    .first();
  await expect(completeButton).toBeVisible({ timeout: 15_000 });
  await completeButton.click();
  await expect(
    page.getByRole("heading", { name: "確認完成交收" }),
  ).toBeVisible({ timeout: 15_000 });

  for (const label of [
    "官方卡牌編號與稀有度標籤（如 SAR/UR/SR）",
    "實物表面狀態（卡角、刮痕等細節）",
    "確信此卡為正品",
  ]) {
    await page.getByText(label).click();
  }

  await page.getByRole("button", { name: "確認完成交收" }).click();
}

async function submitFiveStarReview(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "交易評價" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "5 星" }).click();
  await page.getByRole("button", { name: "提交評價" }).click();
  await expect(
    page.getByText(/評價已提交|雙方評價已公開/),
  ).toBeVisible({ timeout: 20_000 });
}

test.describe("Member P2P trading closure", () => {
  test("offer accept → trading list → complete → review", async ({ browser }) => {
    if (!hasMemberTradingFixtures()) {
      test.skip(
        true,
        "Missing member trading E2E env (seller/buyer auth, listing, or SUPABASE_SERVICE_ROLE_KEY)",
      );
    }

    const fixtures = getChatRealtimeFixtures();
    const sellerId = fixtures.sellerId!;
    const listingId = fixtures.listingId!;
    const buyerEmail = fixtures.buyerEmail!;

    const buyerId = await getProfileIdByEmail(buyerEmail);
    if (!buyerId) {
      test.skip(true, `Could not resolve buyer profile for ${buyerEmail}`);
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
    let memberOrderId: string | null = null;

    try {
      await test.step("Step 1 — buyer submits P2P offer without authentication", async () => {
        const existingOffer = await getLatestOfferForListing({
          roomId,
          listingId,
          buyerId,
        });

        if (existingOffer?.status === "pending") {
          if (existingOffer.use_authentication) {
            test.skip(true, "Pending offer uses authentication; P2P-only spec");
          }
          offerId = existingOffer.id;
        } else if (existingOffer?.status === "accepted") {
          offerId = existingOffer.id;
        } else {
          await submitBuyerOfferFromDetail(buyerPage, sellerId, listingId);
          await expect
            .poll(
              async () => {
                const offer = await getLatestOfferForListing({
                  roomId,
                  listingId,
                  buyerId,
                });
                offerId = offer?.id ?? null;
                return (
                  offer?.status === "pending" &&
                  offer.use_authentication === false
                );
              },
              { timeout: 25_000 },
            )
            .toBe(true);
        }
      });

      await test.step("Step 2 — seller accepts offer in chat", async () => {
        if (!offerId) {
          throw new Error("Missing offerId after Step 1");
        }

        const currentStatus = await getOfferStatus(offerId);
        if (currentStatus === "accepted") {
          return;
        }

        await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);
        const sellerOfferCard = offerCardWithAmount(
          sellerPage,
          OFFER_AMOUNT_LABEL,
        );
        await expect(sellerOfferCard).toBeVisible({ timeout: 45_000 });
        await sellerOfferCard.getByRole("button", { name: "接受出價" }).click();
        await sellerPage.getByRole("button", { name: "確認接受" }).click();

        await expect
          .poll(async () => getOfferStatus(offerId!), { timeout: 45_000 })
          .toBe("accepted");
      });

      await test.step("Step 3 — member_orders row is P2P pending (optional DB)", async () => {
        const order = await getLatestMemberOrderForListing({
          listingId,
          buyerId,
        });

        if (!order) {
          return;
        }

        memberOrderId = order.id;
        const guard = guardP2pMemberOrder(order);
        if (!guard.ok) {
          test.skip(true, guard.skipReason);
        }
        expect(order.status).toBe("pending");
      });

      await test.step("Step 4 — buyer sees order on trading list", async () => {
        await buyerPage.goto("/profile/user/trading?filter=待處理", {
          waitUntil: "domcontentloaded",
        });
        await dismissBlockingOverlays(buyerPage);

        const completeButton = buyerPage
          .getByRole("button", { name: "確認完成交易" })
          .first();
        await expect(completeButton).toBeVisible({ timeout: 30_000 });
        await expect(buyerPage.getByRole("button", { name: "前往付款" })).toHaveCount(
          0,
        );

        if (!memberOrderId) {
          const orderHeading = buyerPage
            .locator("h3.font-mono.font-black.text-brand")
            .first();
          await expect(orderHeading).toBeVisible();
        } else {
          const order = await getMemberOrderById(memberOrderId);
          if (order?.order_number) {
            await expect(
              buyerPage.getByText(`#${order.order_number}`),
            ).toBeVisible({ timeout: 20_000 });
          }
        }
      });

      await test.step("Step 5 — order detail shows P2P meetup path", async () => {
        if (memberOrderId) {
          await buyerPage.goto(`/profile/user/orderDetail/${memberOrderId}`, {
            waitUntil: "domcontentloaded",
          });
        } else {
          await buyerPage
            .locator("h3.font-mono.font-black.text-brand")
            .first()
            .click();
          await buyerPage.waitForURL(/\/profile\/user\/orderDetail\//, {
            timeout: 20_000,
          });
          memberOrderId =
            buyerPage.url().split("/profile/user/orderDetail/")[1]?.split("?")[0] ??
            null;
        }

        await dismissBlockingOverlays(buyerPage);

        await expect(
          buyerPage.getByRole("button", { name: "確認完成交易" }),
        ).toBeVisible({ timeout: 15_000 });
        await expect(buyerPage.getByRole("button", { name: "前往付款" })).toHaveCount(
          0,
        );
      });

      await test.step("Step 6 — buyer completes handover from trading list", async () => {
        if (memberOrderId) {
          await buyerPage.goto(`/profile/user/orderDetail/${memberOrderId}`, {
            waitUntil: "domcontentloaded",
          });
        } else {
          await buyerPage.goto("/profile/user/trading?filter=待處理", {
            waitUntil: "domcontentloaded",
          });
        }
        await dismissBlockingOverlays(buyerPage);

        const completeButton = buyerPage.getByRole("button", {
          name: "確認完成交易",
        });
        if ((await completeButton.count()) === 0) {
          test.skip(
            true,
            "No pending P2P order to complete — fixture listing may need a fresh accept",
          );
        }

        await confirmHandoverDialog(buyerPage);
        await expect(buyerPage.getByText("交易已確認完成！")).toBeVisible({
          timeout: 20_000,
        });
      });

      await test.step("Step 7 — buyer submits review", async () => {
        await submitFiveStarReview(buyerPage);

        const review = memberOrderId
          ? await getReviewForMemberOrder({
              memberOrderId,
              reviewerId: buyerId,
            })
          : null;

        if (review) {
          expect(review.rating).toBe(5);
          return;
        }

        await expect(
          buyerPage.getByText(/評價已提交|雙方評價已公開/),
        ).toBeVisible({ timeout: 20_000 });
      });
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });
});
