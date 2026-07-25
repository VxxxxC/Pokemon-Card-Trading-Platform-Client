import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Service-role Supabase client — 完全繞過 RLS，**只可於 server-side 使用**，
 * 嚴禁 import 入任何 "use client" 元件。
 *
 * TODO: [Admin RLS] 需新增 migration 補上 public.is_admin() SECURITY DEFINER 函數，
 *       以及 member_orders / merchant_orders 的 admin bypass policy。
 *       落地後，app/actions/orders.ts 內的 Admin Override 分支應改回統一走 RLS，
 *       不再依賴 service-role 讀取。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
