import { test, expect, type Page } from "@playwright/test";
import {
  buildMerchantProductDetailPath,
} from "./fixtures/test-data";
import {
  getChatRealtimeFixtures,
  hasChatRealtimeFixtures,
} from "./fixtures/chat-test-data";
import {
  ensureDbChatRoom,
  getLatestChatMessage,
  getLatestOfferForListing,
  getListingSellerId,
  getOfferStatus,
  getProfileDisplayName,
  getProfileIdByEmail,
} from "./fixtures/supabase-admin";

const SENSITIVE_CHAT_MESSAGE = "你好，可唔可以私下過數？";
// AML: E2E buyer is <14 days old (HK$300 cap) and fixture listing has no market price.
// Use $299 to pass rpc_make_offer guards; raise after fixture buyer ages or enable listing auth for $4500.
const OFFER_AMOUNT = "299";
const OFFER_AMOUNT_LABEL = "HK$ 299";

test.describe.configure({ mode: "serial" });

test.use({ viewport: { width: 1280, height: 900 } });

test.setTimeout(300_000);

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

function chatReplyInput(page: Page) {
  return chatConsoleRoot(page).locator(
    'input[type="text"][placeholder^="回覆給 "]',
  );
}

async function selectChatRoomById(page: Page, roomId: string): Promise<boolean> {
  const roomById = chatConsoleRoot(page).locator(
    `[data-chat-room-id="${roomId}"]`,
  );
  if (await roomById.isVisible().catch(() => false)) {
    await roomById.click({ force: true });
    return true;
  }
  return false;
}

async function openChatRoom(
  page: Page,
  roomId: string,
  partnerName: string,
): Promise<void> {
  await page.goto("/", { waitUntil: "networkidle" });
  await dismissBlockingOverlays(page);

  const header = page.getByRole("banner");
  await expect(header).toBeVisible({ timeout: 20_000 });

  const inboxButton = header.locator("button").filter({
    has: page.locator('svg path[d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"]'),
  });
  await inboxButton.click();
  await page.getByRole("button", { name: "展開面板" }).click();

  await expect(chatConsoleRoot(page)).toBeVisible({
    timeout: 20_000,
  });

  const lobbyPartnerButton = chatConsoleRoot(page)
    .getByRole("button")
    .filter({ hasText: partnerName });

  if (await selectChatRoomById(page, roomId)) {
    // room selected by id
  } else if ((await lobbyPartnerButton.count()) > 0) {
    await lobbyPartnerButton.first().click();
  } else {
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

  await expect(chatReplyInput(page)).toBeVisible({
    timeout: 20_000,
  });
}

function chatComposer(page: Page) {
  return chatConsoleRoot(page)
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "發送 ⚡" }) });
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
    await expect(chatReplyInput(page)).toBeVisible({ timeout: 15_000 });
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

async function sendChatMessage(page: Page, text: string): Promise<void> {
  const composer = chatComposer(page);
  await composer.locator('input[type="text"]').fill(text);
  await composer.getByRole("button", { name: "發送 ⚡" }).click();
}

test.describe("Global Chat realtime — dual browser journey", () => {
  test("AML filter → realtime OfferCard → seller accept sync", async ({
    browser,
  }) => {
    if (!hasChatRealtimeFixtures()) {
      test.skip(
        true,
        "Missing Global Chat E2E env (seller/buyer auth, listing, or SUPABASE_SERVICE_ROLE_KEY)",
      );
    }

    const fixtures = getChatRealtimeFixtures();
    const sellerId = fixtures.sellerId!;
    const listingId = fixtures.listingId!;
    const buyerEmail = fixtures.buyerEmail!;

    const listingOwnerId = await getListingSellerId(listingId);
    if (!listingOwnerId || listingOwnerId !== sellerId) {
      test.skip(
        true,
        `Fixture mismatch: E2E_LISTING_ID owner is ${listingOwnerId ?? "unknown"} but E2E_SELLER_ID is ${sellerId}. Align seller credentials with listing owner.`,
      );
    }

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
      await openChatRoom(buyerPage, roomId, sellerDisplayName);
      await openChatRoom(sellerPage, roomId, buyerDisplayName);

      // ── Step 1: AML / sensitive-word filter ──────────────────────────────
      await test.step("Step 1 — AML sensitive message + realtime warning", async () => {
        await sendChatMessage(buyerPage, SENSITIVE_CHAT_MESSAGE);

        await expect
          .poll(
            async () => {
              const row = await getLatestChatMessage(roomId, "私下過數");
              return row?.is_system_warning === true;
            },
            { timeout: 15_000 },
          )
          .toBe(true);

        const systemWarningBubble = (page: Page) =>
          chatConsoleRoot(page)
            .locator("span.font-mono")
            .filter({ hasText: SENSITIVE_CHAT_MESSAGE });

        await expect(systemWarningBubble(buyerPage).first()).toBeVisible({
          timeout: 15_000,
        });
        await expect(systemWarningBubble(sellerPage).first()).toBeVisible({
          timeout: 15_000,
        });

        await expect(
          chatConsoleRoot(buyerPage).getByText("🛡️ 安全聲明："),
        ).toBeVisible();
        await expect(
          chatConsoleRoot(sellerPage).getByText("🛡️ 安全聲明："),
        ).toBeVisible();
      });

      // ── Step 2: Realtime OfferCard ($4,500) ────────────────────────────
      let offerId: string | null = null;

      await test.step("Step 2 — buyer submits offer; seller sees OfferCard", async () => {
        await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);

        const existingOffer = await getLatestOfferForListing({
          roomId,
          listingId,
          buyerId,
        });

        if (existingOffer?.status === "pending") {
          offerId = existingOffer.id;
        } else {
          await buyerPage.goto(
            buildMerchantProductDetailPath(sellerId, listingId),
            { waitUntil: "networkidle" },
          );
          await dismissBlockingOverlays(buyerPage);
          await expect(
            buyerPage.getByRole("heading", { name: "找不到頁面", exact: true }),
          ).toHaveCount(0);
          await expect(buyerPage.locator("main h1")).toBeVisible({
            timeout: 15_000,
          });
          await buyerPage.getByRole("button", { name: /立即購買/ }).click();
          await buyerPage
            .getByRole("button", { name: "改為議價出價" })
            .click();
          await expect(buyerPage.locator("#exe-negotiation-price")).toBeVisible({
            timeout: 15_000,
          });

          await buyerPage.locator("#exe-negotiation-price").fill(OFFER_AMOUNT);
          await buyerPage
            .getByRole("button", { name: "發送叫價至聊天室" })
            .click();

          await expect(buyerPage.getByText("議價要約已成功送出")).toBeVisible({
            timeout: 20_000,
          });

          await expect
            .poll(
              async () => {
                const offer = await getLatestOfferForListing({
                  roomId,
                  listingId,
                  buyerId,
                });
                offerId = offer?.id ?? null;
                return offer?.status === "pending";
              },
              { timeout: 25_000 },
            )
            .toBe(true);
        }

        await ensureChatRoomActive(sellerPage, roomId, buyerDisplayName);

        const sellerOfferCard = offerCardWithAmount(sellerPage, OFFER_AMOUNT_LABEL);
        await expect(sellerOfferCard).toBeVisible({ timeout: 30_000 });
        await expect(
          sellerOfferCard.getByRole("button", { name: "接受出價" }),
        ).toBeVisible({ timeout: 30_000 });
      });

      // ── Step 3: Seller accept → buyer CTA sync ───────────────────────────
      await test.step("Step 3 — seller accepts; buyer sees accepted state", async () => {
        if (!offerId) {
          throw new Error("Step 2 did not capture offerId for accept flow");
        }

        const sellerOfferCard = offerCardWithAmount(sellerPage, OFFER_AMOUNT_LABEL);
        await sellerOfferCard.getByRole("button", { name: "接受出價" }).click();
        await sellerPage.getByRole("button", { name: "確認接受" }).click();

        await expect
          .poll(async () => getOfferStatus(offerId!), { timeout: 30_000 })
          .toBe("accepted");

        await ensureChatRoomActive(buyerPage, roomId, sellerDisplayName);

        const buyerOfferCard = offerCardWithAmount(buyerPage, OFFER_AMOUNT_LABEL);
        await expect(buyerOfferCard.getByText("● 已接受")).toBeVisible({
          timeout: 30_000,
        });
        await expect(
          buyerOfferCard.getByText("✅ 賣家已接受出價，商品已成功鎖定（Hold 貨）"),
        ).toBeVisible({ timeout: 30_000 });
        await expect(buyerOfferCard.getByText("⏳ 等待賣家回應中...")).toHaveCount(0);
      });
    } finally {
      await buyerContext.close();
      await sellerContext.close();
    }
  });
});
