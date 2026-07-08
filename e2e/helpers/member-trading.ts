import { expect, type Page } from "@playwright/test";
import {
  getLatestOfferForListing,
  getOfferStatus,
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
  sellerId: string;
  listingId: string;
  roomId: string;
  buyerId: string;
}): Promise<{ offerId: string; status: "pending" | "accepted" }> {
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

  if (existingOffer?.status === "accepted") {
    return { offerId: existingOffer.id, status: "accepted" };
  }

  await submitBuyerOfferFromDetail(
    params.buyerPage,
    params.sellerId,
    params.listingId,
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

export async function submitBuyerOfferFromDetail(
  buyerPage: Page,
  sellerId: string,
  listingId: string,
  offerAmount: string = P2P_OFFER_AMOUNT,
): Promise<void> {
  await buyerPage.goto(buildMerchantProductDetailPath(sellerId, listingId), {
    waitUntil: "domcontentloaded",
  });
  await dismissBlockingOverlays(buyerPage);
  await expect(buyerPage.locator("main h1")).toBeVisible({ timeout: 15_000 });
  await buyerPage.getByRole("button", { name: /立即購買/ }).click();
  await dismissBlockingOverlays(buyerPage);

  const slideOver = buyerPage.locator("div.fixed.inset-0.z-\\[400\\]");
  await expect(slideOver.locator("#exe-negotiation-price")).toBeVisible({
    timeout: 15_000,
  });

  const authSwitch = slideOver.getByRole("switch");
  if (await authSwitch.isVisible().catch(() => false)) {
    const checked = await authSwitch.getAttribute("aria-checked");
    if (checked === "true") {
      await authSwitch.click();
    }
  }

  await buyerPage.locator("#exe-negotiation-price").fill(offerAmount);
  await buyerPage.getByRole("button", { name: "發送叫價至聊天室" }).click();
  await expect(buyerPage.getByText(/議價要約已成功送出/)).toBeVisible({
    timeout: 20_000,
  });
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
): Promise<void> {
  const currentStatus = await getOfferStatus(offerId);
  if (currentStatus === "accepted") {
    return;
  }

  await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);
  const sellerOfferCard = pendingSellerOfferCard(sellerPage, amountLabel);
  await expect(sellerOfferCard).toBeVisible({ timeout: 45_000 });
  await sellerOfferCard.getByRole("button", { name: "接受出價" }).click();
  await sellerPage.getByRole("button", { name: "確認接受" }).click();

  await expect
    .poll(async () => getOfferStatus(offerId), { timeout: 45_000 })
    .toBe("accepted");
}
