import { expect, type Page } from "@playwright/test";
import {
  getLatestOfferForListing,
  getMemberOrderIdForOffer,
  getOfferStatus,
  resetE2eListingTradingFixture,
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

export async function dismissBlockingOverlays(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const pwaClose = page.getByRole("button", { name: "✕" }).first();
    if (!(await pwaClose.isVisible().catch(() => false))) {
      break;
    }
    await pwaClose.click({ force: true });
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

async function openChatViaInbox(
  page: Page,
  roomId: string,
  partnerName: string,
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
  }
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function selectChatRoomInConsole(
  page: Page,
  partnerName: string,
): Promise<void> {
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
): Promise<void> {
  await page.goto("/", { waitUntil: "networkidle" });
  await dismissBlockingOverlays(page);

  await expect
    .poll(
      async () => {
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
        await selectChatRoomInConsole(page, partnerName);
        return chatConsoleRoot(page)
          .getByPlaceholder(new RegExp(`回覆給 ${escapeRegex(partnerName)}`))
          .isVisible()
          .catch(() => false);
      },
      { timeout: 45_000 },
    )
    .toBe(true);
}

export async function ensureChatRoomActive(
  page: Page,
  roomId: string,
  partnerName: string,
): Promise<void> {
  await dismissBlockingOverlays(page);

  const consoleReady = await page
    .waitForFunction(
      ({ targetRoomId, targetPartnerName }) => {
        window.dispatchEvent(
          new CustomEvent("open-global-chat", {
            detail: {
              roomId: targetRoomId,
              partnerName: targetPartnerName,
            },
          }),
        );

        const consoleEl = document.querySelector(
          '[data-chat-console="true"].fixed.bottom-6',
        );
        const input = consoleEl?.querySelector("input[type='text']");
        return (
          input instanceof HTMLInputElement &&
          input.placeholder.includes(targetPartnerName)
        );
      },
      { targetRoomId: roomId, targetPartnerName: partnerName },
      { timeout: 20_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!consoleReady) {
    if (!(await page.getByRole("banner").isVisible().catch(() => false))) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await dismissBlockingOverlays(page);
    }
    await openChatViaInbox(page, roomId, partnerName);
    await selectChatRoomInConsole(page, partnerName);
    await expect(
      chatConsoleRoot(page).getByPlaceholder(
        new RegExp(`回覆給 ${escapeRegex(partnerName)}`),
      ),
    ).toBeVisible({ timeout: 20_000 });
  }
}

export function offerCardWithAmount(page: Page, amountLabel: string) {
  return chatConsoleRoot(page)
    .locator("div.my-2.w-full")
    .filter({ hasText: "⚡ 議價出價卡片" })
    .filter({ hasText: amountLabel })
    .last();
}

export function pendingSellerOfferCard(page: Page, amountLabel: string) {
  return offerCardWithAmount(page, amountLabel).filter({
    has: page.getByRole("button", { name: "接受出價" }),
  });
}

export async function openBothChatRooms(
  buyerPage: Page,
  sellerPage: Page,
  roomId: string,
  sellerDisplayName: string,
  buyerDisplayName: string,
): Promise<void> {
  await openChatRoom(buyerPage, roomId, sellerDisplayName);
  await openChatRoom(sellerPage, roomId, buyerDisplayName);
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

  const buyButton = buyerPage.getByRole("button", { name: /立即購買/ });
  await expect(buyButton).toBeEnabled({ timeout: 15_000 });
  await buyButton.click();
  await dismissBlockingOverlays(buyerPage);

  await buyerPage.getByRole("button", { name: "改為議價出價" }).click();

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

export async function gotoOrderDetail(page: Page, orderId: string): Promise<void> {
  await page.goto(`/profile/user/orderDetail/${orderId}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(page);
}

export async function mockPayAuthOrderOnDetail(page: Page): Promise<void> {
  await expect(
    page.getByText("測試模式 — Stripe 尚未接入"),
  ).toBeVisible({ timeout: 15_000 });

  const payButton = page.getByRole("button", { name: /確認模擬付款（HK\$/ });
  await expect(payButton).toBeVisible({ timeout: 15_000 });
  await payButton.click();

  await expect(page.getByText("測試模式 — Stripe 尚未接入")).toHaveCount(0, {
    timeout: 20_000,
  });
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
): Promise<void> {
  const currentStatus = await getOfferStatus(offerId);
  if (currentStatus === "accepted") {
    return;
  }

  if (buyerPage && sellerDisplayName) {
    await openBothChatRooms(
      buyerPage,
      sellerPage,
      roomId,
      sellerDisplayName,
      buyerDisplayName,
    );
  } else {
    await openChatRoom(sellerPage, roomId, buyerDisplayName);
  }

  await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);

  const offerCardRoot = chatConsoleRoot(sellerPage)
    .locator("div.my-2.w-full")
    .filter({ hasText: "⚡ 議價出價卡片" })
    .filter({ has: sellerPage.getByRole("button", { name: "接受出價" }) });

  let sellerOfferCard = offerCardRoot.filter({ hasText: amountLabel }).last();
  if (!(await sellerOfferCard.isVisible().catch(() => false))) {
    sellerOfferCard = offerCardRoot.last();
  }

  await expect(sellerOfferCard).toBeVisible({ timeout: 45_000 });
  await sellerOfferCard.getByRole("button", { name: "接受出價" }).click();
  await sellerPage.getByRole("button", { name: "確認接受" }).click();

  await expect
    .poll(async () => getOfferStatus(offerId), { timeout: 45_000 })
    .toBe("accepted");
}
