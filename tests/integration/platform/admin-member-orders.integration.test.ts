import { afterAll, describe, expect, it } from "vitest";
import { confirmPlatformReceived } from "@/app/actions/admin-member-orders";
import {
  clearSessionCache,
  getBuyerUserId,
  warmSession,
} from "../shared/auth-context";
import { createServiceRoleClient } from "../shared/supabase-admin";
import {
  ensureMemberListingAcceptsAuthentication,
  findMemberListingForIntegration,
  seedPendingMemberAuthOrders,
} from "../rewards/helpers/checkout-fixture";
import { hasRewardsIntegrationEnv } from "../rewards/helpers/env";

describe("TC-M40 admin member orders — contract", () => {
  it("confirmPlatformReceived rejects empty order id", async () => {
    const result = await confirmPlatformReceived("  ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("找不到此訂單");
    }
  });
});

describe.skipIf(!hasRewardsIntegrationEnv())(
  "TC-M40 admin member orders — smoke",
  () => {
    const trackedOrderIds: string[] = [];

    afterAll(async () => {
      const admin = createServiceRoleClient();
      for (const orderId of trackedOrderIds) {
        await admin.from("member_orders").delete().eq("id", orderId);
      }
      await clearSessionCache();
    });

    it("confirmPlatformReceived advances custody order to grading", async () => {
      await warmSession("buyer");
      const buyerId = getBuyerUserId();
      const { listingId } = await findMemberListingForIntegration();
      await ensureMemberListingAcceptsAuthentication(listingId);

      const [orderId] = await seedPendingMemberAuthOrders(buyerId, listingId, 1);
      trackedOrderIds.push(orderId);

      const admin = createServiceRoleClient();
      const { error: custodyError } = await admin
        .from("member_orders")
        .update({
          escrow_status: "custody",
          payment_confirmed_at: new Date().toISOString(),
          inbound_tracking_no: `SF-TCM40-${orderId.slice(0, 8)}`,
        })
        .eq("id", orderId);

      expect(custodyError).toBeNull();

      const result = await confirmPlatformReceived(orderId);
      expect(result.success).toBe(true);

      const { data: orderRow, error: readError } = await admin
        .from("member_orders")
        .select("escrow_status, platform_received_at")
        .eq("id", orderId)
        .single();

      expect(readError).toBeNull();
      expect(orderRow?.escrow_status).toBe("grading");
      expect(orderRow?.platform_received_at).toBeTruthy();
    });
  },
);
