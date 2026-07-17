import type { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/marketplace/seller-profile";
import { MEMBER_ORDER_NUMBER_RE } from "@/lib/member-order/resolve-order-id";

export const INVALID_MERCHANT_ORDER_ID_ERROR =
  "訂單編號格式不正確，請從交易管理重新進入訂單";

export type ResolveMerchantOrderIdResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function lookupMerchantOrderById(
  supabase: ServerSupabaseClient,
  merchantId: string,
  orderId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("merchant_orders")
    .select("id")
    .eq("id", orderId)
    .eq("merchant_id", merchantId)
    .maybeSingle();

  if (error) {
    return null;
  }

  const row = data as { id: string } | null;
  return row?.id ?? null;
}

async function lookupMerchantOrderByOrderNumber(
  supabase: ServerSupabaseClient,
  merchantId: string,
  orderNumber: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("merchant_orders")
    .select("id")
    .eq("order_number", orderNumber.toUpperCase())
    .eq("merchant_id", merchantId)
    .maybeSingle();

  if (error) {
    return null;
  }

  const row = data as { id: string } | null;
  return row?.id ?? null;
}

export async function resolveMerchantOrderIdForMerchant(
  supabase: ServerSupabaseClient,
  orderIdOrNumber: string,
  merchantId: string,
): Promise<ResolveMerchantOrderIdResult> {
  const trimmed = orderIdOrNumber.trim();
  if (!trimmed) {
    return { ok: false, error: "找不到此訂單" };
  }

  if (isUuid(trimmed)) {
    const byOrderId = await lookupMerchantOrderById(
      supabase,
      merchantId,
      trimmed,
    );
    if (byOrderId) {
      return { ok: true, id: byOrderId };
    }
  }

  if (MEMBER_ORDER_NUMBER_RE.test(trimmed)) {
    const byOrderNumber = await lookupMerchantOrderByOrderNumber(
      supabase,
      merchantId,
      trimmed,
    );
    if (byOrderNumber) {
      return { ok: true, id: byOrderNumber };
    }

    return { ok: false, error: "找不到指定的交易訂單記錄" };
  }

  return { ok: false, error: INVALID_MERCHANT_ORDER_ID_ERROR };
}
