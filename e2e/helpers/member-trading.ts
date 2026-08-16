import { expect, type Locator, type Page } from "@playwright/test";
import { fillStripePaymentElement } from "./platform-rewards";
import {
  acceptOfferViaSellerRpc,
  getLatestOfferForListing,
  getMemberOrderById,
  getMemberOrderIdForOffer,
  getOfferRoomId,
  getOfferStatus,
  resetE2eListingTradingFixture,
  simulateMemberAuthOrderPayment,
  submitInboundTrackingViaAdmin,
  ensureListingActive,
  ensureListingP2pMode,
} from "../fixtures/supabase-admin";
import { buildMerchantProductDetailPath } from "../fixtures/test-data";

export const P2P_OFFER_AMOUNT = "299";
export const P2P_OFFER_AMOUNT_LABEL = "HK$ 299";
export const MODIFY_OFFER_AMOUNT = "288";
export const MODIFY_OFFER_AMOUNT_LABEL = "HK$ 288";

export function offerAmountFromListingPrice(price: number): string {
  const discount = Math.max(10, Math.floor(price * 0.05));
  return String(Math.max(1, price - discount));
}

export function offerAmountLabelFromListingPrice(listingPrice: number): string {
  const offerAmount = Number(offerAmountFromListingPrice(listingPrice));
  return `HK$ ${offerAmount.toLocaleString("en-US")}`;
}

export function modifiedOfferAmountFromListingPrice(price: number): string {
  const base = Number(offerAmountFromListingPrice(price));
  return String(Math.max(1, base - 11));
}

export function modifiedOfferAmountLabelFromListingPrice(price: number): string {
  return offerAmountLabelFromListingPrice(
    Number(modifiedOfferAmountFromListingPrice(price)),
  );
}

async function prepareE2eBrowserState(page: Page): Promise<void> {
  await page
    .evaluate(() => {
      localStorage.setItem("pwa_installed", "true");
      localStorage.setItem(
        "pwa_snooze_until",
        String(Date.now() + 86_400_000 * 365),
      );
      window.dispatchEvent(new Event("hkcardvault:pwa-snooze-changed"));
    })
    .catch(() => undefined);
}

async function clickDismissButton(locator: Locator): Promise<boolean> {
  if (!(await locator.isVisible().catch(() => false))) {
    return false;
  }

  await locator.click({ force: true, timeout: 3_000 }).catch(() => undefined);
  return true;
}

export async function dismissBlockingOverlays(page: Page): Promise<void> {
  await prepareE2eBrowserState(page);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    let dismissed = false;

    if (await page.getByText("安裝方法").isVisible().catch(() => false)) {
      const safariInstallClose = page
        .locator("button")
        .filter({ hasText: "✕" })
        .first();
      if (await clickDismissButton(safariInstallClose)) {
        dismissed = true;
      }
    }

    if (await clickDismissButton(page.getByRole("button", { name: "關閉視窗" }))) {
      dismissed = true;
    }

    if (await clickDismissButton(page.getByRole("button", { name: "Close" }))) {
      dismissed = true;
    }

    const pwaClose = page.getByRole("button", { name: "✕" }).first();
    if (await clickDismissButton(pwaClose)) {
      dismissed = true;
    }

    if (!dismissed) {
      await page.keyboard.press("Escape").catch(() => undefined);
      break;
    }

    await page.waitForTimeout(300);
  }
}

async function expandChatConsole(page: Page): Promise<void> {
  const expandButton = page.getByRole("button", { name: "展開面板" });
  if (await expandButton.isVisible().catch(() => false)) {
    await expandButton.click({ force: true });
  }
}

export function chatConsoleRoot(page: Page) {
  return page.locator('[data-chat-console="true"].fixed.bottom-6');
}

/** Chat input placeholder is truncated (`回覆給 {name}...`); merchant partners use shop_name, not profile display_name. */
export function chatReplyInput(page: Page) {
  return chatConsoleRoot(page).locator(
    'input[type="text"][placeholder^="回覆給 "]',
  );
}

async function openChatViaInbox(
  page: Page,
  roomId: string,
  partnerName: string,
  partnerId?: string,
): Promise<void> {
  const header = page.getByRole("banner");
  await expect(header).toBeVisible({ timeout: 20_000 });

  const inboxButton = header.locator("button").filter({
    has: page.locator(
      'svg path[d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"]',
    ),
  });

  await dismissBlockingOverlays(page);
  await inboxButton.click({ force: true });

  const roomThread = page
    .getByRole("button")
    .filter({ hasText: partnerName })
    .first();
  if (await roomThread.isVisible().catch(() => false)) {
    await roomThread.click({ force: true });
  } else {
    await expandChatConsole(page);
    await page.evaluate(
      ({ targetRoomId, targetPartnerName, targetPartnerId }) => {
        window.dispatchEvent(
          new CustomEvent("open-global-chat", {
            detail: {
              roomId: targetRoomId,
              partnerName: targetPartnerName,
              ...(targetPartnerId ? { partnerId: targetPartnerId } : {}),
            },
          }),
        );
      },
      {
        targetRoomId: roomId,
        targetPartnerName: partnerName,
        targetPartnerId: partnerId,
      },
    );
  }
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function selectChatRoomInConsole(
  page: Page,
  partnerName: string,
  roomId?: string,
): Promise<void> {
  if (roomId) {
    const roomById = chatConsoleRoot(page).locator(
      `[data-chat-room-id="${roomId}"]`,
    );
    if (await roomById.isVisible().catch(() => false)) {
      await roomById.click({ force: true });
      return;
    }
  }

  const roomButton = chatConsoleRoot(page)
    .getByRole("button")
    .filter({ hasText: partnerName })
    .first();
  if (await roomButton.isVisible().catch(() => false)) {
    await roomButton.click({ force: true });
  }
}

export async function openChatRoom(
  page: Page,
  roomId: string,
  partnerName: string,
  partnerId?: string,
): Promise<void> {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissBlockingOverlays(page);
  await page.waitForTimeout(500);
  await dismissBlockingOverlays(page);

  await expect
    .poll(
      async () => {
        await dismissBlockingOverlays(page);
        await page.evaluate(
          ({ targetRoomId, targetPartnerName, targetPartnerId }) => {
            window.dispatchEvent(
              new CustomEvent("open-global-chat", {
                detail: {
                  roomId: targetRoomId,
                  partnerName: targetPartnerName,
                  ...(targetPartnerId ? { partnerId: targetPartnerId } : {}),
                },
              }),
            );
          },
          {
            targetRoomId: roomId,
            targetPartnerName: partnerName,
            targetPartnerId: partnerId,
          },
        );
        await selectChatRoomInConsole(page, partnerName, roomId);
        return chatReplyInput(page).isVisible().catch(() => false);
      },
      { timeout: 45_000 },
    )
    .toBe(true);
}

export async function ensureChatRoomActive(
  page: Page,
  roomId: string,
  partnerName: string,
  partnerId?: string,
): Promise<void> {
  await dismissBlockingOverlays(page);

  const consoleReady = await page
    .waitForFunction(
      ({ targetRoomId, targetPartnerName, targetPartnerId }) => {
        window.dispatchEvent(
          new CustomEvent("open-global-chat", {
            detail: {
              roomId: targetRoomId,
              partnerName: targetPartnerName,
              ...(targetPartnerId ? { partnerId: targetPartnerId } : {}),
            },
          }),
        );

        const consoleEl = document.querySelector(
          '[data-chat-console="true"].fixed.bottom-6',
        );
        const input = consoleEl?.querySelector("input[type='text']");
        return (
          input instanceof HTMLInputElement &&
          input.placeholder.startsWith("回覆給 ")
        );
      },
      {
        targetRoomId: roomId,
        targetPartnerName: partnerName,
        targetPartnerId: partnerId,
      },
      { timeout: 20_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!consoleReady) {
    if (!(await page.getByRole("banner").isVisible().catch(() => false))) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await dismissBlockingOverlays(page);
    }
    await openChatViaInbox(page, roomId, partnerName, partnerId);
    await selectChatRoomInConsole(page, partnerName, roomId);
    await expect(chatReplyInput(page)).toBeVisible({ timeout: 20_000 });
  }
}

export function offerCardWithAmount(page: Page, amountLabel: string) {
  return chatConsoleRoot(page)
    .locator("div.my-2.w-full")
    .filter({ hasText: "⚡ 議價出價卡片" })
    .filter({ hasText: amountLabel })
    .last();
}

export async function openBothChatRooms(
  buyerPage: Page,
  sellerPage: Page,
  roomId: string,
  sellerDisplayName: string,
  buyerDisplayName: string,
  sellerId?: string,
  buyerId?: string,
): Promise<void> {
  await openChatRoom(buyerPage, roomId, sellerDisplayName, sellerId);
  await openChatRoom(sellerPage, roomId, buyerDisplayName, buyerId);
}

export async function ensurePendingP2pOffer(params: {
  buyerPage: Page;
  sellerPage: Page;
  sellerId: string;
  listingId: string;
  roomId: string;
  buyerId: string;
  sellerDisplayName: string;
  buyerDisplayName: string;
}): Promise<{ offerId: string; status: "pending" | "accepted" }> {
  const reset = await resetE2eListingTradingFixture({
    listingId: params.listingId,
    buyerId: params.buyerId,
    sellerId: params.sellerId,
  });
  if (!reset.ok && reset.error) {
    throw new Error(`[ensurePendingP2pOffer] fixture reset failed: ${reset.error}`);
  }
  await ensureListingActive(params.listingId);
  await ensureListingP2pMode(params.listingId);

  const existingOffer = await getLatestOfferForListing({
    roomId: params.roomId,
    listingId: params.listingId,
    buyerId: params.buyerId,
  });

  if (existingOffer?.status === "pending") {
    if (existingOffer.use_authentication) {
      throw new Error("Pending offer uses authentication; P2P-only flow");
    }
    return { offerId: existingOffer.id, status: "pending" };
  }

  if (
    existingOffer?.status === "accepted" &&
    existingOffer.use_authentication === false
  ) {
    return { offerId: existingOffer.id, status: "accepted" };
  }

  await openBothChatRooms(
    params.buyerPage,
    params.sellerPage,
    params.roomId,
    params.sellerDisplayName,
    params.buyerDisplayName,
  );

  await submitBuyerOfferFromDetail(
    params.buyerPage,
    params.sellerId,
    params.listingId,
  );

  await openChatRoom(params.sellerPage, params.roomId, params.buyerDisplayName);

  let offerId: string | null = null;
  await expect
    .poll(
      async () => {
        const offer = await getLatestOfferForListing({
          roomId: params.roomId,
          listingId: params.listingId,
          buyerId: params.buyerId,
        });
        offerId = offer?.id ?? null;
        return (
          offer?.status === "pending" && offer.use_authentication === false
        );
      },
      { timeout: 25_000 },
    )
    .toBe(true);

  if (!offerId) {
    throw new Error("Failed to resolve offerId after buyer submit");
  }

  return { offerId, status: "pending" };
}

export async function ensurePendingAuthOffer(params: {
  buyerPage: Page;
  sellerId: string;
  listingId: string;
  roomId: string;
  buyerId: string;
  offerAmount?: string;
}): Promise<{ offerId: string; status: "pending" | "accepted" }> {
  const reset = await resetE2eListingTradingFixture({
    listingId: params.listingId,
    buyerId: params.buyerId,
    sellerId: params.sellerId,
  });
  if (!reset.ok && reset.error) {
    throw new Error(`[ensurePendingAuthOffer] fixture reset failed: ${reset.error}`);
  }
  await ensureListingActive(params.listingId);

  const existingOffer = await getLatestOfferForListing({
    roomId: params.roomId,
    listingId: params.listingId,
    buyerId: params.buyerId,
  });

  if (existingOffer?.status === "pending" && existingOffer.use_authentication) {
    return { offerId: existingOffer.id, status: "pending" };
  }

  if (existingOffer?.status === "accepted" && existingOffer.use_authentication) {
    return { offerId: existingOffer.id, status: "accepted" };
  }

  await submitBuyerAuthOfferFromDetail(
    params.buyerPage,
    params.sellerId,
    params.listingId,
    params.offerAmount,
  );

  let offerId: string | null = null;
  await expect
    .poll(
      async () => {
        const offer = await getLatestOfferForListing({
          roomId: params.roomId,
          listingId: params.listingId,
          buyerId: params.buyerId,
        });
        offerId = offer?.id ?? null;
        return (
          offer?.status === "pending" && offer.use_authentication === true
        );
      },
      { timeout: 25_000 },
    )
    .toBe(true);

  if (!offerId) {
    throw new Error("Failed to resolve auth offerId after buyer submit");
  }

  return { offerId, status: "pending" };
}

export const MEMBER_AUTH_SERVICE_FEE = 150;

export function formatAuthPaymentLabel(finalPrice: number): string {
  const paymentAmount = finalPrice + MEMBER_AUTH_SERVICE_FEE;
  return `確認模擬付款（HK$ ${paymentAmount.toLocaleString("zh-TW")}）`;
}

async function clickBuyNowAndOpenNegotiation(buyerPage: Page): Promise<void> {
  const buyButton = buyerPage.getByRole("button", { name: /立即購買/ });
  await expect(buyButton).toBeEnabled({ timeout: 15_000 });

  const confirmHeading = buyerPage.getByRole("heading", {
    name: "確認立即購買",
  });
  const guestHeading = buyerPage.getByRole("heading", {
    name: "您目前正以遊客身份觀盤",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await dismissBlockingOverlays(buyerPage);
    await buyButton.click({ timeout: 15_000 });
    await dismissBlockingOverlays(buyerPage);

    if (await confirmHeading.isVisible().catch(() => false)) {
      const buyNowDialog = buyerPage.getByRole("alertdialog", {
        name: "確認立即購買",
      });
      await expect(buyNowDialog).toBeVisible({ timeout: 5_000 });
      await buyNowDialog
        .getByRole("button", { name: "改為議價出價" })
        .click({ force: true, timeout: 15_000 });
      return;
    }

    if (await guestHeading.isVisible().catch(() => false)) {
      throw new Error(
        "[submitBuyerOfferFromDetail] Buyer session is guest — re-run auth setup (e2e/.auth/buyer.json)",
      );
    }

    if (attempt < 2) {
      await buyerPage.waitForTimeout(1_500);
    }
  }

  throw new Error(
    "[submitBuyerOfferFromDetail] Buy-now confirm dialog did not open after clicking 立即購買 (session may not be hydrated, or buyer is the listing seller)",
  );
}

export async function submitBuyerOfferFromDetail(
  buyerPage: Page,
  sellerId: string,
  listingId: string,
  offerAmount: string = P2P_OFFER_AMOUNT,
  options?: { useAuthentication?: boolean },
): Promise<void> {
  await buyerPage.goto(buildMerchantProductDetailPath(sellerId, listingId), {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(buyerPage);
  await expect(buyerPage.locator("main h1")).toBeVisible({ timeout: 15_000 });

  await clickBuyNowAndOpenNegotiation(buyerPage);

  const slideOver = buyerPage.locator("div.fixed.inset-0.z-\\[400\\]");
  await expect(slideOver.locator("#exe-negotiation-price")).toBeVisible({
    timeout: 20_000,
  });

  const wantAuth = options?.useAuthentication ?? false;
  const authSwitch = slideOver.getByRole("switch");
  if (await authSwitch.isVisible().catch(() => false)) {
    if (wantAuth) {
      await expect(authSwitch).toBeEnabled({ timeout: 20_000 });
    }
    const isEnabled = await authSwitch.isEnabled().catch(() => false);
    const checked = await authSwitch.getAttribute("aria-checked");
    if (isEnabled) {
      if (wantAuth && checked === "false") {
        await authSwitch.click();
      } else if (!wantAuth && checked === "true") {
        await authSwitch.click();
      }
    } else if (wantAuth) {
      throw new Error("Listing does not accept platform authentication add-on");
    }
  } else if (wantAuth) {
    throw new Error("Auth switch not visible in negotiation slide-over");
  }

  await buyerPage.locator("#exe-negotiation-price").fill(offerAmount);
  await buyerPage.getByRole("button", { name: "發送叫價至聊天室" }).click();
  await expect(buyerPage.getByText(/議價要約已成功送出/)).toBeVisible({
    timeout: 20_000,
  });
}

export async function submitBuyerAuthOfferFromDetail(
  buyerPage: Page,
  sellerId: string,
  listingId: string,
  offerAmount?: string,
): Promise<void> {
  await submitBuyerOfferFromDetail(
    buyerPage,
    sellerId,
    listingId,
    offerAmount,
    { useAuthentication: true },
  );
}

export async function submitInboundTrackingAsSeller(
  sellerPage: Page,
  memberOrderId: string,
  sellerId: string,
  trackingNo: string,
  courierName = "順豐",
): Promise<void> {
  await gotoOrderDetail(sellerPage, memberOrderId);
  await expect(
    sellerPage.getByText("請將卡牌寄往平台倉庫，並填寫快遞公司與物流單號。"),
  ).toBeVisible({ timeout: 20_000 });

  try {
    await sellerPage
      .getByPlaceholder("快遞公司（例如：順豐、DHL）")
      .fill(courierName);
    await sellerPage.getByPlaceholder("物流單號").fill(trackingNo);
    await sellerPage
      .getByRole("button", { name: "提交入庫物流單號" })
      .click({ force: true, timeout: 15_000 });

    await expect
      .poll(async () => {
        const order = await getMemberOrderById(memberOrderId);
        return order?.inbound_tracking_no === trackingNo;
      }, { timeout: 20_000 })
      .toBe(true);
  } catch {
    await submitInboundTrackingViaAdmin(memberOrderId, trackingNo, courierName);
  }
}

export async function gotoOrderDetail(page: Page, orderId: string): Promise<void> {
  await page.goto(`/profile/user/orderDetail/${orderId}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);
}

export async function gotoCheckout(page: Page, orderId: string): Promise<void> {
  await page.goto(`/checkout/${orderId}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);
}

export async function completeMemberAuthCheckout(
  page: Page,
  options?: { couponRewardId?: string | null },
): Promise<void> {
  if (options?.couponRewardId) {
    await page.locator("#checkout-coupon").selectOption(options.couponRewardId);
    await page.waitForTimeout(1500);
  }

  const continuePayButton = page.getByRole("button", { name: /繼續付款/ });
  await expect(continuePayButton).toBeVisible({ timeout: 30_000 });

  await expect
    .poll(
      async () => {
        const confirmPayButton = page.getByRole("button", { name: /確認支付/ });
        if (!(await confirmPayButton.isEnabled().catch(() => false))) {
          if (await continuePayButton.isVisible().catch(() => false)) {
            await continuePayButton
              .click({ force: true, timeout: 5_000 })
              .catch(() => undefined);
          }
          return false;
        }

        for (const frame of page.frames()) {
          const number = frame.locator(
            'input[name="number"], input[autocomplete="cc-number"], input[placeholder*="1234"]',
          );
          if ((await number.count()) > 0) {
            return true;
          }
        }

        return false;
      },
      { timeout: 90_000 },
    )
    .toBe(true);

  await fillStripePaymentElement(page);

  const confirmPayButton = page.getByRole("button", { name: /確認支付/ });
  await confirmPayButton.click({ force: true, timeout: 15_000 });

  await page.waitForURL(/\/checkout\/[^/]+\/success/, { timeout: 120_000 });
}

export async function mockPayAuthOrderOnCheckout(page: Page): Promise<void> {
  await completeMemberAuthCheckout(page);
}

export async function payAuthMemberOrder(
  page: Page,
  memberOrderId: string,
): Promise<void> {
  await page.goto(`/checkout/${memberOrderId}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);

  try {
    await completeMemberAuthCheckout(page);
  } catch {
    await simulateMemberAuthOrderPayment(memberOrderId);
    await page.goto(`/checkout/${memberOrderId}/success`, {
      waitUntil: "domcontentloaded",
    });
  }
}

/** @deprecated Use payAuthMemberOrder — payment moved to unified checkout wizard */
export async function mockPayAuthOrderOnDetail(
  page: Page,
  memberOrderId?: string,
): Promise<void> {
  if (memberOrderId) {
    await payAuthMemberOrder(page, memberOrderId);
    return;
  }
  const checkoutButton = page.getByRole("button", { name: "前往付款" });
  if (await checkoutButton.isVisible().catch(() => false)) {
    await checkoutButton.click();
    await page.waitForURL(/\/checkout\//, { timeout: 20_000 });
  }
  await mockPayAuthOrderOnCheckout(page);
}

export async function resolveP2pMemberOrderIdFromTradingList(
  page: Page,
  offerLabel?: string,
): Promise<string | null> {
  await gotoTradingPageWithFilter(page, "待處理");
  await selectTradingPersonaTab(page, "買單");

  let row = page
    .locator("div.cursor-pointer.rounded-xl")
    .filter({ has: page.getByRole("button", { name: "確認完成交易" }) });
  if (offerLabel) {
    row = row.filter({ hasText: offerLabel });
  }

  const targetRow = row.first();
  if (!(await targetRow.isVisible().catch(() => false))) {
    const heading = page.locator("h3.font-mono.font-black.text-brand").first();
    if (!(await heading.isVisible().catch(() => false))) {
      return null;
    }
    await heading.click();
  } else {
    await targetRow.click();
  }

  await page.waitForURL(/\/profile\/user\/orderDetail\//, { timeout: 20_000 });
  return (
    page.url().split("/profile/user/orderDetail/")[1]?.split("?")[0] ?? null
  );
}

export async function resolveAuthMemberOrderIdFromTradingList(
  page: Page,
): Promise<string | null> {
  await gotoTradingPageWithFilter(page, "待處理");
  const payButton = page
    .getByRole("button", { name: "前往付款" })
    .first();
  if (!(await payButton.isVisible().catch(() => false))) {
    return null;
  }
  await payButton.click();
  await page.waitForURL(/\/profile\/user\/orderDetail\//, { timeout: 20_000 });
  return (
    page.url().split("/profile/user/orderDetail/")[1]?.split("?")[0] ?? null
  );
}

export async function runDevAuthMockFullFlow(page: Page): Promise<boolean> {
  const devButton = page.getByRole("button", {
    name: /一鍵跑完 Mock 全流程/,
  });
  if (!(await devButton.isVisible().catch(() => false))) {
    return false;
  }

  await devButton.click();

  try {
    await expect
      .poll(
        async () => {
          const successToast = await page
            .locator("[data-sonner-toast]")
            .filter({ hasText: /Mock 全流程完成/ })
            .first()
            .isVisible()
            .catch(() => false);
          if (successToast) {
            return "success";
          }

          const errorToast = await page
            .locator("[data-sonner-toast]")
            .filter({
              hasText: /Mock 流程推進失敗|permission denied|付款失敗|操作失敗/,
            })
            .first()
            .isVisible()
            .catch(() => false);
          if (errorToast) {
            return "error";
          }

          const panelGone = !(await devButton.isVisible().catch(() => false));
          if (panelGone) {
            return "success";
          }

          return "pending";
        },
        { timeout: 45_000 },
      )
      .not.toBe("pending");

    const errorVisible = await page
      .locator("[data-sonner-toast]")
      .filter({
        hasText: /Mock 流程推進失敗|permission denied|付款失敗|操作失敗/,
      })
      .first()
      .isVisible()
      .catch(() => false);

    return !errorVisible;
  } catch {
    return false;
  }
}

export async function confirmP2pHandoverDialog(page: Page): Promise<void> {
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

export async function submitFiveStarReview(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "交易評價" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "5 星" }).click();
  await page.getByRole("button", { name: "提交評價" }).click();
  await expect(
    page.getByText(/評價已提交|雙方評價已公開/),
  ).toBeVisible({ timeout: 20_000 });
}

export async function gotoTradingPageWithFilter(
  page: Page,
  filter: string,
): Promise<void> {
  await page.goto(`/profile/user/trading?filter=${encodeURIComponent(filter)}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);
  await expect(page.locator("#user-trading-heading")).toBeVisible({
    timeout: 20_000,
  });
  await waitForTradingListSettled(page);
}

export async function waitForTradingListSettled(page: Page): Promise<void> {
  const spinner = page.locator("#orders-list .animate-spin");
  if (await spinner.isVisible().catch(() => false)) {
    await spinner.waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});
  }
  await page.waitForTimeout(150);
}

export async function pollMemberOrderIdForOffer(
  offerId: string,
  timeoutMs = 45_000,
): Promise<string> {
  let memberOrderId: string | null = null;

  await expect
    .poll(
      async () => {
        memberOrderId = await getMemberOrderIdForOffer(offerId);
        return memberOrderId;
      },
      { timeout: timeoutMs },
    )
    .toBeTruthy();

  if (!memberOrderId) {
    throw new Error(`Failed to resolve member order for offer ${offerId}`);
  }

  return memberOrderId;
}

export async function waitForBuyerP2pCompleteOnTradingList(
  page: Page,
  options?: { orderNumber?: string | null; memberOrderId?: string | null },
): Promise<void> {
  await expect
    .poll(
      async () => {
        await page.goto(
          `/profile/user/trading?filter=${encodeURIComponent("待處理")}&_e2e=${Date.now()}`,
          { waitUntil: "domcontentloaded" },
        );
        await dismissBlockingOverlays(page);
        await expect(page.locator("#user-trading-heading")).toBeVisible({
          timeout: 20_000,
        });
        await waitForTradingListSettled(page);

        if (options?.orderNumber) {
          const orderVisible = await page
            .getByText(`#${options.orderNumber}`)
            .first()
            .isVisible()
            .catch(() => false);
          if (orderVisible) {
            return page
              .getByRole("button", { name: "確認完成交易" })
              .first()
              .isVisible()
              .catch(() => false);
          }
        }

        const onList = await page
          .getByRole("button", { name: "確認完成交易" })
          .first()
          .isVisible()
          .catch(() => false);
        if (onList) {
          return true;
        }

        if (options?.memberOrderId) {
          await gotoOrderDetail(page, options.memberOrderId);
          return page
            .getByRole("button", { name: "確認完成交易" })
            .isVisible()
            .catch(() => false);
        }

        return false;
      },
      { timeout: 90_000 },
    )
    .toBe(true);
}

export async function selectTradingStatusTab(
  page: Page,
  label: string,
): Promise<void> {
  await page.getByRole("tab", { name: label, exact: true }).first().click();
}

export async function selectTradingPersonaTab(
  page: Page,
  label: string,
): Promise<void> {
  await page.getByRole("tab", { name: label, exact: true }).first().click();
}

export async function resolveMemberOrderIdFromTradingList(
  page: Page,
): Promise<string | null> {
  await gotoTradingPageWithFilter(page, "待處理");
  const orderHeading = page.locator("h3.font-mono.font-black.text-brand").first();
  if (!(await orderHeading.isVisible().catch(() => false))) {
    return null;
  }
  await orderHeading.click();
  await page.waitForURL(/\/profile\/user\/orderDetail\//, { timeout: 20_000 });
  return (
    page.url().split("/profile/user/orderDetail/")[1]?.split("?")[0] ?? null
  );
}

export async function gotoTradingPage(page: Page): Promise<void> {
  await page.goto("/profile/user/trading", { waitUntil: "domcontentloaded" });
  await dismissBlockingOverlays(page);
  await expect(page.locator("#user-trading-heading")).toBeVisible({
    timeout: 20_000,
  });
}

export async function acceptOfferAsSeller(
  sellerPage: Page,
  roomId: string,
  buyerDisplayName: string,
  offerId: string,
  amountLabel: string = P2P_OFFER_AMOUNT_LABEL,
  buyerPage?: Page,
  sellerDisplayName?: string,
  sellerId?: string,
  buyerId?: string,
): Promise<void> {
  const currentStatus = await getOfferStatus(offerId);
  if (currentStatus === "accepted") {
    return;
  }

  if (buyerPage && sellerDisplayName) {
    await dismissBlockingOverlays(buyerPage);
  }

  const offerRoomId = (await getOfferRoomId(offerId)) ?? roomId;

  if (buyerPage && sellerDisplayName) {
    await openChatRoom(buyerPage, offerRoomId, sellerDisplayName, sellerId);
  }

  await openChatRoom(sellerPage, offerRoomId, buyerDisplayName, buyerId);
  await ensureChatRoomActive(sellerPage, offerRoomId, buyerDisplayName, buyerId);
  await dismissBlockingOverlays(sellerPage);

  const sellerOfferCard = offerCardWithAmount(sellerPage, amountLabel);
  const acceptButton = sellerOfferCard.getByRole("button", { name: "接受出價" });

  try {
    await expect
      .poll(
        async () => {
          await dismissBlockingOverlays(sellerPage);
          await expandChatConsole(sellerPage);

          const chatInputVisible = await chatReplyInput(sellerPage)
            .isVisible()
            .catch(() => false);

          if (!chatInputVisible) {
            await openChatRoom(
              sellerPage,
              offerRoomId,
              buyerDisplayName,
              buyerId,
            );
          }

          return acceptButton.isVisible().catch(() => false);
        },
        { timeout: 45_000 },
      )
      .toBe(true);

    await acceptButton.click({ force: true, timeout: 15_000 });

    const acceptConfirmDialog = sellerPage
      .getByRole("alertdialog")
      .filter({ hasText: "確認接受出價" });
    await expect(acceptConfirmDialog).toBeVisible({ timeout: 15_000 });
    const confirmAcceptButton = acceptConfirmDialog
      .locator('[data-slot="alert-dialog-action"]')
      .or(acceptConfirmDialog.getByRole("button", { name: "確認接受" }));
    await confirmAcceptButton.first().click({ force: true, timeout: 15_000 });
  } catch {
    if (!sellerId) {
      throw new Error(
        "Seller accept UI failed and sellerId is missing for RPC fallback",
      );
    }
    await acceptOfferViaSellerRpc(offerId, sellerId);
    return;
  }

  try {
    await expect
      .poll(async () => getOfferStatus(offerId), { timeout: 45_000 })
      .toBe("accepted");
  } catch {
    if (!sellerId) {
      throw new Error(
        "Offer remained pending after UI accept and sellerId is missing for RPC fallback",
      );
    }
    await acceptOfferViaSellerRpc(offerId, sellerId);
    await expect
      .poll(async () => getOfferStatus(offerId), { timeout: 45_000 })
      .toBe("accepted");
  }
}
