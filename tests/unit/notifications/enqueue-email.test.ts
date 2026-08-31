import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}));

import { enqueueTransactionalEmail } from "@/lib/notifications/enqueue-email";

function buildInsertChain(result: {
  data: { id: string } | null;
  error: { code?: string; message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ maybeSingle });
  insertMock.mockReturnValue({ select });
  fromMock.mockReturnValue({ insert: insertMock });
}

describe("enqueueTransactionalEmail", () => {
  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockReset();
  });

  it("inserts a rendered template row into outbox", async () => {
    buildInsertChain({ data: { id: "outbox-1" }, error: null });

    const result = await enqueueTransactionalEmail({
      eventId: "E-ACC-04",
      templateKey: "acc.password_changed",
      toEmail: "user@example.com",
      idempotencyKey: "E-ACC-04:user-1:1",
    });

    expect(result).toEqual({
      success: true,
      data: { id: "outbox-1", duplicate: false },
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "E-ACC-04",
        template_key: "acc.password_changed",
        to_email: "user@example.com",
        subject: "您的密碼已更新",
      }),
    );
  });

  it("treats unique violations as duplicate enqueue", async () => {
    buildInsertChain({
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    });

    const result = await enqueueTransactionalEmail({
      eventId: "E-ACC-04",
      templateKey: "acc.password_changed",
      toEmail: "user@example.com",
      idempotencyKey: "E-ACC-04:user-1:1",
    });

    expect(result).toEqual({
      success: true,
      data: { id: "E-ACC-04:user-1:1", duplicate: true },
    });
  });
});
