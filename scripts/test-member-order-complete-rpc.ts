/**
 * Connectivity test for rpc_complete_member_order parameter contract.
 * Run: bun run test:member-order-complete-rpc
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 * Does NOT mutate production data unless MEMBER_ORDER_RPC_TEST_ORDER_ID is set
 * to a disposable pending P2P order UUID.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const explicitOrderId = process.env.MEMBER_ORDER_RPC_TEST_ORDER_ID?.trim();

if (!url || !serviceKey) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const INVALID_DISPLAY_ID = "OFFICIAL-44940";

async function assertRpcRejectsInvalidOrderId(): Promise<boolean> {
  const fakeBuyerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const { error } = await admin.rpc("rpc_complete_member_order", {
    p_order_id: INVALID_DISPLAY_ID,
    p_user_id: fakeBuyerId,
  });

  if (!error) {
    console.error("❌ Expected RPC to reject non-UUID p_order_id");
    return false;
  }

  if (!error.message.includes("invalid input syntax for type uuid")) {
    console.error("❌ Unexpected error for invalid p_order_id:", error.message);
    return false;
  }

  console.log("✅ rpc_complete_member_order rejects non-UUID p_order_id");
  return true;
}

async function findPendingP2pOrder(): Promise<{
  id: string;
  buyer_id: string;
} | null> {
  const { data, error } = await admin
    .from("member_orders")
    .select("id, buyer_id, status, use_authentication")
    .eq("status", "pending")
    .eq("use_authentication", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ Could not query member_orders:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return { id: data.id, buyer_id: data.buyer_id };
}

async function verifyFunctionExists(): Promise<boolean> {
  const { error } = await admin.rpc("rpc_complete_member_order", {
    p_order_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    p_user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  });

  if (!error) {
    console.log("✅ rpc_complete_member_order is callable (returned without throw)");
    return true;
  }

  if (error.message.includes("invalid input syntax for type uuid")) {
    console.error("❌ RPC exists but UUID binding failed unexpectedly");
    return false;
  }

  if (
    error.message.includes("操作失敗") ||
    error.message.includes("does not exist")
  ) {
    if (error.message.includes("does not exist")) {
      console.error("❌ rpc_complete_member_order missing on linked project");
      return false;
    }
    console.log("✅ rpc_complete_member_order exists (buyer/pending guard fired)");
    return true;
  }

  console.log(`✅ rpc_complete_member_order exists (response: ${error.message})`);
  return true;
}

async function maybeCompleteDisposableOrder(): Promise<void> {
  if (!explicitOrderId) {
    console.log(
      "ℹ️  Set MEMBER_ORDER_RPC_TEST_ORDER_ID to a disposable pending P2P order to run live complete",
    );
    return;
  }

  const { data: order, error: lookupError } = await admin
    .from("member_orders")
    .select("id, buyer_id, status, use_authentication")
    .eq("id", explicitOrderId)
    .maybeSingle();

  if (lookupError || !order) {
    console.error("❌ Could not load MEMBER_ORDER_RPC_TEST_ORDER_ID");
    return;
  }

  if (order.status !== "pending" || order.use_authentication) {
    console.error("❌ Test order must be pending P2P (use_authentication = false)");
    return;
  }

  const { error } = await admin.rpc("rpc_complete_member_order", {
    p_order_id: order.id,
    p_user_id: order.buyer_id,
  });

  if (error) {
    console.error("❌ Live complete failed:", error.message);
    return;
  }

  console.log(`✅ Live complete succeeded for member_orders.id=${order.id}`);
}

async function main(): Promise<void> {
  console.log("--- rpc_complete_member_order contract check ---");

  const checks = [
    await verifyFunctionExists(),
    await assertRpcRejectsInvalidOrderId(),
  ];

  const sample = await findPendingP2pOrder();
  if (sample) {
    console.log(
      `ℹ️  Found pending P2P order id=${sample.id} buyer_id=${sample.buyer_id}`,
    );
  } else {
    console.log("ℹ️  No pending P2P member_orders row found for sampling");
  }

  await maybeCompleteDisposableOrder();

  if (!checks.every(Boolean)) {
    process.exit(1);
  }
}

void main();
