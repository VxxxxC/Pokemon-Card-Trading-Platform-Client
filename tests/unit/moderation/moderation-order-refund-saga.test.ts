import { beforeEach, describe, expect, it, vi } from "vitest";

const stripeMocks = vi.hoisted(() => ({
  retrieve: vi.fn(),
  refundsCreate: vi.fn(),
  refundsRetrieve: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    paymentIntents: {
      retrieve: stripeMocks.retrieve,
    },
    refunds: {
      create: stripeMocks.refundsCreate,
      retrieve: stripeMocks.refundsRetrieve,
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { runModerationOrderRefundSaga } from "@/lib/payments/moderation-order-refund-saga";

describe("moderation-order-refund-saga", () => {
  const finalizeRpc = vi.fn();
  const markFailedRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const rpcClient = {
      rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
        if (fn === "rpc_finalize_moderation_order_refund") {
          finalizeRpc(args);
          return Promise.resolve({ data: { success: true }, error: null });
        }
        if (fn === "rpc_mark_moderation_order_refund_failed") {
          markFailedRpc(args);
          return Promise.resolve({ data: { success: true }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    vi.mocked(createClient).mockResolvedValue(rpcClient as never);
    vi.mocked(createAdminClient).mockReturnValue(rpcClient as never);

    stripeMocks.retrieve.mockResolvedValue({
      amount_received: 10000,
      latest_charge: {
        balance_transaction: { fee: 350 },
      },
    });
    stripeMocks.refundsCreate.mockResolvedValue({ id: "re_test_123" });
    stripeMocks.refundsRetrieve.mockResolvedValue({
      balance_transaction: { fee: 350 },
    });
  });

  it("creates stripe refund and finalizes with capped cents", async () => {
    const result = await runModerationOrderRefundSaga({
      caseId: "case-1",
      prepared: {
        success: true,
        orderKind: "merchant_direct",
        orderId: "order-1",
        paymentIntentId: "pi_test",
        refundCents: 10000,
        settlementRequired: true,
        faultParty: "seller",
        adminId: "admin-1",
      },
    });

    expect(result).toEqual({ ok: true });
    expect(stripeMocks.refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: "pi_test",
        amount: 10000,
      }),
      expect.objectContaining({
        idempotencyKey: "moderation-refund:case-1:order-1",
      }),
    );
    expect(finalizeRpc).toHaveBeenCalledWith(
      expect.objectContaining({
        p_refund_id: "re_test_123",
        p_refund_cents: 10000,
        p_case_id: "case-1",
      }),
    );
  });

  it("deducts stripe fee for buyer fault", async () => {
    const result = await runModerationOrderRefundSaga({
      caseId: "case-2",
      prepared: {
        success: true,
        orderKind: "merchant_direct",
        orderId: "order-2",
        paymentIntentId: "pi_test",
        refundCents: 10000,
        settlementRequired: false,
        faultParty: "buyer",
        adminId: "admin-1",
      },
    });

    expect(result).toEqual({ ok: true });
    expect(stripeMocks.refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 9650 }),
      expect.any(Object),
    );
  });
});
