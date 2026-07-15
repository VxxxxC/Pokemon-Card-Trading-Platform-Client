import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type RpcCompleteMemberOrderArgs =
  Database["public"]["Functions"]["rpc_complete_member_order"]["Args"];

export type RpcCancelMemberOrderArgs =
  Database["public"]["Functions"]["rpc_cancel_member_order"]["Args"];

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type TypedRpcClient = {
  rpc(
    fn: "rpc_complete_member_order",
    args: RpcCompleteMemberOrderArgs,
  ): Promise<RpcResult>;
  rpc(
    fn: "rpc_cancel_member_order",
    args: RpcCancelMemberOrderArgs,
  ): Promise<RpcResult>;
};

function asTypedRpcClient(supabase: ServerSupabaseClient): TypedRpcClient {
  return supabase as unknown as TypedRpcClient;
}

export async function rpcCompleteMemberOrder(
  supabase: ServerSupabaseClient,
  args: RpcCompleteMemberOrderArgs,
): Promise<RpcResult> {
  return asTypedRpcClient(supabase).rpc("rpc_complete_member_order", args);
}

export async function rpcCancelMemberOrder(
  supabase: ServerSupabaseClient,
  args: RpcCancelMemberOrderArgs,
): Promise<RpcResult> {
  return asTypedRpcClient(supabase).rpc("rpc_cancel_member_order", args);
}
