import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type RpcCompleteMerchantOrderArgs = {
  p_order_id: string;
  p_user_id: string;
};

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type TypedRpcClient = {
  rpc(
    fn: "rpc_complete_merchant_order",
    args: RpcCompleteMerchantOrderArgs,
  ): Promise<RpcResult>;
};

function asTypedRpcClient(supabase: ServerSupabaseClient): TypedRpcClient {
  return supabase as unknown as TypedRpcClient;
}

export async function rpcCompleteMerchantOrder(
  supabase: ServerSupabaseClient,
  args: RpcCompleteMerchantOrderArgs,
): Promise<RpcResult> {
  return asTypedRpcClient(supabase).rpc("rpc_complete_merchant_order", args);
}

export function mapMerchantEscrowToMemberStatus(
  escrowStatus: Tables<"merchant_orders">["escrow_status"],
): Tables<"member_orders">["status"] {
  switch (escrowStatus) {
    case "completed_and_transferred":
      return "completed";
    case "refunded":
      return "cancelled";
    default:
      return "pending";
  }
}

export function isOpenMerchantBuyerOrder(
  escrowStatus: Tables<"merchant_orders">["escrow_status"],
): boolean {
  return (
    escrowStatus === "pending_payment" ||
    escrowStatus === "payment_held" ||
    escrowStatus === "authenticating" ||
    escrowStatus === "authenticated"
  );
}
