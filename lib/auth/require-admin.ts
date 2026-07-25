import type { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ProfileRoleRow = {
  role: string | null;
};

/**
 * 判斷目前登入者是否為平台管理員 (profiles.role === 'admin')。
 *
 * 用於 Admin 後台「查看訂單」override：管理員可跨越 buyer_id / merchant_id
 * 的 scope 限制，讀取任何一張獨立訂單以進行反洗錢追蹤與爭議仲裁。
 *
 * TODO: [Admin Guard] 待統一 requireAdmin() 於所有 admin server action 強制執行，
 *       目前僅用於訂單詳情唯讀 override，其他 admin 操作仍只靠 proxy.ts 路由層守衛。
 */
export async function isCurrentUserAdmin(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<ProfileRoleRow>();

  if (error) {
    console.error("[isCurrentUserAdmin]", error.message);
    return false;
  }

  return data?.role === "admin";
}
