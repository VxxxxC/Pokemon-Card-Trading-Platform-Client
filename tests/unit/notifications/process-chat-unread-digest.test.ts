import { beforeEach, describe, expect, it, vi } from "vitest";

const sendOneSignalPushMock = vi.hoisted(() => vi.fn());
const loadSubscriptionsMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const eqMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/notifications/onesignal/send", () => ({
  sendOneSignalPush: sendOneSignalPushMock,
}));

vi.mock("@/lib/notifications/push-delivery", () => ({
  loadOptedInPushSubscriptionIds: loadSubscriptionsMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: rpcMock,
    from: fromMock,
  }),
}));

import { processChatUnreadDigest } from "@/lib/notifications/process-chat-unread-digest";

describe("processChatUnreadDigest", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
    sendOneSignalPushMock.mockReset();
    loadSubscriptionsMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();

    loadSubscriptionsMock.mockResolvedValue(["sub-1"]);
    sendOneSignalPushMock.mockResolvedValue({
      success: true,
      skipped: false,
      notificationId: "ntf-1",
      targeting: "subscription_ids",
    });
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ user_id: "user-1", onesignal_subscription_id: "sub-1" }],
            error: null,
          }),
        }),
      }),
      update: updateMock,
    });
  });

  it("sends digest and updates cooldown for unread users", async () => {
    rpcMock.mockResolvedValue({
      data: [{ user_id: "user-1", unread_count: 2 }],
      error: null,
    });

    const result = await processChatUnreadDigest();

    expect(result.sent).toBe(1);
    expect(sendOneSignalPushMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "P-CHT-01",
        path: "/profile/user/chat",
      }),
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        last_chat_digest_pushed_at: expect.any(String),
      }),
    );
  });

  it("skips users without push subscriptions", async () => {
    rpcMock.mockResolvedValue({
      data: [{ user_id: "user-1", unread_count: 2 }],
      error: null,
    });
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      update: updateMock,
    });

    const result = await processChatUnreadDigest();

    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
    expect(sendOneSignalPushMock).not.toHaveBeenCalled();
  });
});
