// @partner-id P-C03
// @features F-M-13
// @path Partner

import { test, expect } from "@playwright/test";
import { getChatRealtimeFixtures, hasChatRealtimeFixtures } from "../../fixtures/chat-test-data";
import {
  ensureDbChatRoom,
  getProfileDisplayName,
  getProfileIdByEmail,
  insertChatMessageForE2e,
} from "../../fixtures/supabase-admin";
import { chatConsoleRoot, openChatRoom } from "../../helpers/member-trading";
import {
  suppressTransientHomeOverlays,
  waitUntilNoBlockingOverlay,
} from "../../helpers/overlays";

test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(180_000);

const HISTORY_COUNT = 55;

test.describe("P-C03 chat history hydrate", () => {
  test("opening a long thread loads latest then older messages on scroll", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "seller",
      "Chat history uses seller project",
    );
    if (!hasChatRealtimeFixtures()) {
      test.skip(true, "Missing chat realtime fixtures");
    }

    const fixtures = getChatRealtimeFixtures();
    const sellerId = fixtures.sellerId!;
    const buyerEmail = fixtures.buyerEmail!;
    const buyerId = await getProfileIdByEmail(buyerEmail);
    if (!buyerId) {
      test.skip(true, `Could not resolve buyer profile for ${buyerEmail}`);
      return;
    }

    const buyerName = await getProfileDisplayName(buyerId);
    const roomId = await ensureDbChatRoom(buyerId, sellerId);
    const stamp = Date.now();
    const oldest = `P-C03-MSG-0001-${stamp}`;
    const newest = `P-C03-MSG-${String(HISTORY_COUNT).padStart(4, "0")}-${stamp}`;

    for (let i = 1; i <= HISTORY_COUNT; i += 1) {
      await insertChatMessageForE2e({
        roomId,
        senderId: i % 2 === 0 ? sellerId : buyerId,
        content: `P-C03-MSG-${String(i).padStart(4, "0")}-${stamp}`,
        createdAt: new Date(stamp - (HISTORY_COUNT - i) * 1000).toISOString(),
      });
    }

    await suppressTransientHomeOverlays(page);
    await waitUntilNoBlockingOverlay(page);
    await openChatRoom(page, roomId, buyerName, buyerId);

    const consoleRoot = chatConsoleRoot(page);
    await expect(consoleRoot.getByText("載入對話內容…")).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(consoleRoot.getByText(newest).first()).toBeVisible({
      timeout: 20_000,
    });

    const thread = consoleRoot.locator(".overflow-y-auto").last();
    await thread.evaluate((el) => {
      el.scrollTop = 0;
    });

    await expect(consoleRoot.getByText(oldest).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
