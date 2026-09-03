import { beforeEach, describe, expect, it, vi } from "vitest";

const sendOneSignalPushMock = vi.hoisted(() => vi.fn());
const isUserPushTransactionalEnabledMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/notifications/onesignal/send", () => ({
  sendOneSignalPush: sendOneSignalPushMock,
}));

vi.mock("@/lib/notifications/push-prefs", () => ({
  isTransactionalPushEvent: (eventId: string) =>
    eventId.startsWith("P-OFF-") || eventId.startsWith("P-ORD-"),
  isUserPushTransactionalEnabled: isUserPushTransactionalEnabledMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}));

import { sendPushToUser } from "@/lib/notifications/push-delivery";

describe("push delivery prefs gate", () => {
  beforeEach(() => {
    sendOneSignalPushMock.mockReset();
    isUserPushTransactionalEnabledMock.mockReset();
    fromMock.mockReset();
    isUserPushTransactionalEnabledMock.mockResolvedValue(true);
    sendOneSignalPushMock.mockResolvedValue({
      success: true,
      skipped: true,
      reason: "no_targets",
    });

    const eqSecond = vi.fn().mockResolvedValue({ data: [], error: null });
    const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
    const select = vi.fn().mockReturnValue({ eq: eqFirst });
    fromMock.mockReturnValue({ select });
  });

  it("skips transactional push when user disabled push_transactional", async () => {
    isUserPushTransactionalEnabledMock.mockResolvedValue(false);

    await sendPushToUser({
      eventId: "P-OFF-01",
      userId: "seller-1",
      heading: "收到新出價",
      body: "test",
      path: "/profile/user/trading",
    });

    expect(sendOneSignalPushMock).not.toHaveBeenCalled();
  });

  it("still evaluates delivery for non-transactional events", async () => {
    await sendPushToUser({
      eventId: "P-WIS-01",
      userId: "user-1",
      heading: "願望清單價格提醒",
      body: "test",
      path: "/marketplace/product/abc",
    });

    expect(isUserPushTransactionalEnabledMock).not.toHaveBeenCalled();
    expect(sendOneSignalPushMock).toHaveBeenCalled();
  });
});
