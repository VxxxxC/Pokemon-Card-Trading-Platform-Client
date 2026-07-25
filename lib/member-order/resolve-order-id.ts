import type { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/marketplace/seller-profile";

export const INVALID_MEMBER_ORDER_ID_ERROR =
  "訂單編號格式不正確，請從交易管理重新進入訂單";

export const MEMBER_ORDER_NUMBER_RE = /^ORD-\d{4}-[A-Z0-9]{6}$/i;

export type ResolveMemberOrderIdResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ParticipantOrderRow = {
  id: string;
  status?: string;
};

/**
 * Admin override：管理員後台（財務結算 / 爭議仲裁）需要跨越交易雙方 scope
 * 讀取任何一張獨立訂單，以進行反洗錢逐單追蹤。
 *
 * TODO: [Admin Override] 目前由 caller 傳入 service-role client 並跳過 participant
 *       filter 暫代 RLS policy，待 DB 層補上 is_admin() SECURITY DEFINER 函數與
 *       member_orders 的 admin bypass policy 後應改回統一走 RLS。
 */
export type ResolveMemberOrderIdOptions = {
  adminOverride?: boolean;
};

function participantFilter(userId: string): string {
  return `buyer_id.eq.${userId},seller_id.eq.${userId}`;
}

/** 依 admin override 決定是否套用交易雙方 scope 限制。 */
function withParticipantScope<T extends { or: (filter: string) => T }>(
  query: T,
  userId: string,
  adminOverride: boolean,
): T {
  return adminOverride ? query : query.or(participantFilter(userId));
}

function pickPreferredParticipantOrder(
  rows: ParticipantOrderRow[],
): string | null {
  if (rows.length === 0) {
    return null;
  }

  const pending = rows.find((row) => row.status === "pending");
  return pending?.id ?? rows[0]?.id ?? null;
}

async function lookupParticipantOrderById(
  supabase: ServerSupabaseClient,
  userId: string,
  memberOrderId: string,
  adminOverride: boolean,
): Promise<string | null> {
  const { data, error } = await withParticipantScope(
    supabase.from("member_orders").select("id").eq("id", memberOrderId),
    userId,
    adminOverride,
  ).maybeSingle();

  if (error) {
    return null;
  }

  const row = data as { id: string } | null;
  return row?.id ?? null;
}

async function lookupParticipantOrderByListingId(
  supabase: ServerSupabaseClient,
  userId: string,
  listingId: string,
  adminOverride: boolean,
): Promise<string | null> {
  const { data, error } = await withParticipantScope(
    supabase
      .from("member_orders")
      .select("id, status, created_at")
      .eq("listing_id", listingId),
    userId,
    adminOverride,
  ).order("created_at", { ascending: false });

  if (error) {
    return null;
  }

  return pickPreferredParticipantOrder(
    (data ?? []) as ParticipantOrderRow[],
  );
}

async function lookupParticipantOrderByOrderNumber(
  supabase: ServerSupabaseClient,
  userId: string,
  orderNumber: string,
  adminOverride: boolean,
): Promise<string | null> {
  const { data, error } = await withParticipantScope(
    supabase
      .from("member_orders")
      .select("id")
      .eq("order_number", orderNumber.toUpperCase()),
    userId,
    adminOverride,
  ).maybeSingle();

  if (error) {
    return null;
  }

  const row = data as { id: string } | null;
  return row?.id ?? null;
}

async function lookupParticipantOrderByDisplayId(
  supabase: ServerSupabaseClient,
  userId: string,
  displayId: string,
  adminOverride: boolean,
): Promise<string | null> {
  const { data, error } = await withParticipantScope(
    supabase
      .from("member_orders")
      .select(
        "id, status, created_at, listings!inner(product_catalog!inner(display_id))",
      )
      .eq("listings.product_catalog.display_id", displayId),
    userId,
    adminOverride,
  ).order("created_at", { ascending: false });

  if (error) {
    return null;
  }

  return pickPreferredParticipantOrder(
    (data ?? []) as ParticipantOrderRow[],
  );
}

export async function resolveMemberOrderIdForUser(
  supabase: ServerSupabaseClient,
  orderIdOrNumber: string,
  userId: string,
  options: ResolveMemberOrderIdOptions = {},
): Promise<ResolveMemberOrderIdResult> {
  const adminOverride = options.adminOverride === true;
  const trimmed = orderIdOrNumber.trim();
  if (!trimmed) {
    return { ok: false, error: "找不到此訂單" };
  }

  if (isUuid(trimmed)) {
    const byOrderId = await lookupParticipantOrderById(
      supabase,
      userId,
      trimmed,
      adminOverride,
    );
    if (byOrderId) {
      return { ok: true, id: byOrderId };
    }

    const byListingId = await lookupParticipantOrderByListingId(
      supabase,
      userId,
      trimmed,
      adminOverride,
    );
    if (byListingId) {
      return { ok: true, id: byListingId };
    }
  }

  if (MEMBER_ORDER_NUMBER_RE.test(trimmed)) {
    const byOrderNumber = await lookupParticipantOrderByOrderNumber(
      supabase,
      userId,
      trimmed,
      adminOverride,
    );
    if (byOrderNumber) {
      return { ok: true, id: byOrderNumber };
    }

    return { ok: false, error: "找不到指定的交易訂單記錄" };
  }

  const byDisplayId = await lookupParticipantOrderByDisplayId(
    supabase,
    userId,
    trimmed,
    adminOverride,
  );
  if (byDisplayId) {
    return { ok: true, id: byDisplayId };
  }

  return { ok: false, error: INVALID_MEMBER_ORDER_ID_ERROR };
}
