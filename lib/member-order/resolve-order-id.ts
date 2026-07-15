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

function participantFilter(userId: string): string {
  return `buyer_id.eq.${userId},seller_id.eq.${userId}`;
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
): Promise<string | null> {
  const { data, error } = await supabase
    .from("member_orders")
    .select("id")
    .eq("id", memberOrderId)
    .or(participantFilter(userId))
    .maybeSingle();

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
): Promise<string | null> {
  const { data, error } = await supabase
    .from("member_orders")
    .select("id, status, created_at")
    .eq("listing_id", listingId)
    .or(participantFilter(userId))
    .order("created_at", { ascending: false });

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
): Promise<string | null> {
  const { data, error } = await supabase
    .from("member_orders")
    .select("id")
    .eq("order_number", orderNumber.toUpperCase())
    .or(participantFilter(userId))
    .maybeSingle();

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
): Promise<string | null> {
  const { data, error } = await supabase
    .from("member_orders")
    .select("id, status, created_at, listings!inner(product_catalog!inner(display_id))")
    .eq("listings.product_catalog.display_id", displayId)
    .or(participantFilter(userId))
    .order("created_at", { ascending: false });

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
): Promise<ResolveMemberOrderIdResult> {
  const trimmed = orderIdOrNumber.trim();
  if (!trimmed) {
    return { ok: false, error: "找不到此訂單" };
  }

  if (isUuid(trimmed)) {
    const byOrderId = await lookupParticipantOrderById(
      supabase,
      userId,
      trimmed,
    );
    if (byOrderId) {
      return { ok: true, id: byOrderId };
    }

    const byListingId = await lookupParticipantOrderByListingId(
      supabase,
      userId,
      trimmed,
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
  );
  if (byDisplayId) {
    return { ok: true, id: byDisplayId };
  }

  return { ok: false, error: INVALID_MEMBER_ORDER_ID_ERROR };
}
