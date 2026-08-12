import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  backdateMerchantPayoutHold,
  confirmMerchantBuyerReceipt,
  seedMerchantOrderReadyForBuyerConfirm,
} from "../merchant/helpers/merchant-order-fixture";
import {
  clearSessionCache,
  getAdminUserId,
  getBuyerUserId,
  warmSession,
} from "../shared/auth-context";
import { hasBaseIntegrationEnv } from "../shared/env";
import { createServiceRoleClient } from "../shared/supabase-admin";

async function seedHeldMerchantOrderReadyForPayout(
  runId: string,
  suffix: string,
): Promise<string> {
  const buyerId = getBuyerUserId();
  const { orderId } = await seedMerchantOrderReadyForBuyerConfirm({
    buyerId,
    suffix: `${runId}-${suffix}`,
  });
  await confirmMerchantBuyerReceipt(orderId);
  await backdateMerchantPayoutHold(orderId);
  return orderId;
}

const OPEN_MERCHANT_ESCROW_STATUSES = new Set([
  "pending_payment",
  "payment_held",
  "shipped",
  "authenticating",
  "authenticated",
]);

function isEligibleConnectPayoutRefundStatus(
  refundStatus: string | null,
): boolean {
  const normalized = refundStatus?.trim().toLowerCase() ?? "";
  return !normalized || normalized === "none";
}

async function assertOrderIsConnectPayoutCandidate(orderId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { data: row, error } = await admin
    .from("merchant_orders")
    .select(
      "payout_status, payout_hold_until, buyer_confirmed_at, stripe_transfer_id, merchant_payout_amount, stripe_payment_intent_id, escrow_status, refund_status",
    )
    .eq("id", orderId)
    .maybeSingle();

  expect(error).toBeNull();
  expect(row).not.toBeNull();

  expect(row?.payout_status).toBe("held");
  expect(row?.buyer_confirmed_at).toBeTruthy();
  expect(row?.payout_hold_until).toBeTruthy();
  expect(new Date(row!.payout_hold_until!).getTime()).toBeLessThanOrEqual(
    Date.now(),
  );
  expect(row?.stripe_transfer_id).toBeNull();
  expect(Number(row?.merchant_payout_amount ?? 0)).toBeGreaterThan(0);
  expect(row?.stripe_payment_intent_id?.trim()).toBeTruthy();
  expect(OPEN_MERCHANT_ESCROW_STATUSES.has(row!.escrow_status!)).toBe(true);
  expect(
    isEligibleConnectPayoutRefundStatus(row?.refund_status ?? null),
  ).toBe(true);
}

describe.skipIf(!hasBaseIntegrationEnv()).sequential(
  "Merchant Connect payout pipeline integration",
  () => {
    const runId = String(Date.now());
    const createdOrderIds: string[] = [];

    beforeAll(async () => {
      await warmSession("buyer");
      await warmSession("admin");
    });

    afterAll(async () => {
      const admin = createServiceRoleClient();
      for (const orderId of createdOrderIds) {
        await admin.from("merchant_orders").delete().eq("id", orderId);
      }
      await clearSessionCache();
    });

    it("M1 held expired order meets connect payout candidate criteria", async () => {
      const orderId = await seedHeldMerchantOrderReadyForPayout(runId, "m1");
      createdOrderIds.push(orderId);

      await assertOrderIsConnectPayoutCandidate(orderId);

      const admin = createServiceRoleClient();
      const { error } = await admin.rpc(
        "rpc_list_merchant_connect_payout_candidates",
        { p_limit: 50 },
      );
      expect(error).toBeNull();
    });

    it("M2 resets failed payout and allows prepare again", async () => {
      const orderId = await seedHeldMerchantOrderReadyForPayout(runId, "m2");
      createdOrderIds.push(orderId);

      const admin = createServiceRoleClient();
      const adminId = getAdminUserId();

      const { error: failError } = await admin.rpc(
        "rpc_mark_merchant_order_payout_failed",
        {
          p_order_id: orderId,
          p_error: "integration_test_failed",
        },
      );
      expect(failError).toBeNull();

      const { error: resetError } = await admin.rpc(
        "rpc_admin_reset_merchant_connect_payout_retry",
        {
          p_order_id: orderId,
          p_admin_id: adminId,
        },
      );
      expect(resetError).toBeNull();

      const { data: afterReset, error: afterResetError } = await admin
        .from("merchant_orders")
        .select("payout_status, payout_error")
        .eq("id", orderId)
        .maybeSingle();

      expect(afterResetError).toBeNull();
      expect(afterReset?.payout_status).toBe("held");
      expect(afterReset?.payout_error).toBeNull();

      const { data: preparePayload, error: prepareError } = await admin.rpc(
        "rpc_prepare_merchant_order_payout",
        { p_order_id: orderId },
      );

      expect(prepareError).toBeNull();
      expect(preparePayload).toMatchObject({ success: true });

      const { data: afterPrepare, error: afterPrepareError } = await admin
        .from("merchant_orders")
        .select("payout_status")
        .eq("id", orderId)
        .maybeSingle();

      expect(afterPrepareError).toBeNull();
      expect(afterPrepare?.payout_status).toBe("processing");
    });

    it("M2b recovers from processing after finalize_failed mark (P2.5)", async () => {
      const orderId = await seedHeldMerchantOrderReadyForPayout(runId, "m2b");
      createdOrderIds.push(orderId);

      const admin = createServiceRoleClient();
      const adminId = getAdminUserId();

      const { error: prepareError } = await admin.rpc(
        "rpc_prepare_merchant_order_payout",
        { p_order_id: orderId },
      );
      expect(prepareError).toBeNull();

      const { data: processingRow, error: processingError } = await admin
        .from("merchant_orders")
        .select("payout_status")
        .eq("id", orderId)
        .maybeSingle();
      expect(processingError).toBeNull();
      expect(processingRow?.payout_status).toBe("processing");

      const { error: failError } = await admin.rpc(
        "rpc_mark_merchant_order_payout_failed",
        {
          p_order_id: orderId,
          p_error: "finalize_failed: integration_simulated",
        },
      );
      expect(failError).toBeNull();

      const { error: resetError } = await admin.rpc(
        "rpc_admin_reset_merchant_connect_payout_retry",
        {
          p_order_id: orderId,
          p_admin_id: adminId,
        },
      );
      expect(resetError).toBeNull();

      const { error: rePrepareError } = await admin.rpc(
        "rpc_prepare_merchant_order_payout",
        { p_order_id: orderId },
      );
      expect(rePrepareError).toBeNull();

      const { data: afterRetry, error: afterRetryError } = await admin
        .from("merchant_orders")
        .select("payout_status, payout_error")
        .eq("id", orderId)
        .maybeSingle();

      expect(afterRetryError).toBeNull();
      expect(afterRetry?.payout_status).toBe("processing");
      expect(afterRetry?.payout_error).toBeNull();
    });

    it("M3 rejects reset when payout is frozen", async () => {
      const orderId = await seedHeldMerchantOrderReadyForPayout(runId, "m3-frozen");
      createdOrderIds.push(orderId);

      const admin = createServiceRoleClient();
      const { error: stateError } = await admin.rpc(
        "rpc_e2e_set_merchant_order_payout_retry_test_state",
        {
          p_order_id: orderId,
          p_scenario: "frozen",
        },
      );
      expect(stateError).toBeNull();

      const { error } = await admin.rpc(
        "rpc_admin_reset_merchant_connect_payout_retry",
        {
          p_order_id: orderId,
          p_admin_id: getAdminUserId(),
        },
      );

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/凍結/);
    });

    it("M3 rejects reset when hold has not elapsed", async () => {
      const buyerId = getBuyerUserId();
      const { orderId } = await seedMerchantOrderReadyForBuyerConfirm({
        buyerId,
        suffix: `${runId}-m3-hold`,
      });
      createdOrderIds.push(orderId);
      await confirmMerchantBuyerReceipt(orderId);

      const admin = createServiceRoleClient();
      await admin.rpc("rpc_mark_merchant_order_payout_failed", {
        p_order_id: orderId,
        p_error: "hold_not_elapsed_test",
      });

      const { error } = await admin.rpc(
        "rpc_admin_reset_merchant_connect_payout_retry",
        {
          p_order_id: orderId,
          p_admin_id: getAdminUserId(),
        },
      );

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/保留期/);
    });

    it("M3 rejects reset when stripe_transfer_id exists", async () => {
      const orderId = await seedHeldMerchantOrderReadyForPayout(
        runId,
        "m3-transfer",
      );
      createdOrderIds.push(orderId);

      const admin = createServiceRoleClient();
      const { error: stateError } = await admin.rpc(
        "rpc_e2e_set_merchant_order_payout_retry_test_state",
        {
          p_order_id: orderId,
          p_scenario: "bound_transfer",
        },
      );
      expect(stateError).toBeNull();

      const { error } = await admin.rpc(
        "rpc_admin_reset_merchant_connect_payout_retry",
        {
          p_order_id: orderId,
          p_admin_id: getAdminUserId(),
        },
      );

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/Stripe Transfer/);
    });

    it("M3 rejects reset for failed refund inside hold window (I-H12)", async () => {
      const orderId = await seedHeldMerchantOrderReadyForPayout(runId, "m3-i-h12");
      createdOrderIds.push(orderId);

      const admin = createServiceRoleClient();
      const { error: stateError } = await admin.rpc(
        "rpc_e2e_set_merchant_order_payout_retry_test_state",
        {
          p_order_id: orderId,
          p_scenario: "refund_failed_in_window",
        },
      );
      expect(stateError).toBeNull();

      const { error } = await admin.rpc(
        "rpc_admin_reset_merchant_connect_payout_retry",
        {
          p_order_id: orderId,
          p_admin_id: getAdminUserId(),
        },
      );

      expect(error).not.toBeNull();
      expect(error?.message).toMatch(/退款失敗保留期/);
    });
  },
);
