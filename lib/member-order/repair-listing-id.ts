import type { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/marketplace/seller-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveListingIdForSeller } from "@/lib/member-order/resolve-listing-id";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export function hasSupabaseServiceRole(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export type EnsureMemberOrderListingUuidResult =
  | { ok: true; listingId: string; wasRepaired: boolean }
  | { ok: false; error: string };

export async function ensureMemberOrderListingUuid(
  supabase: ServerSupabaseClient,
  params: {
    orderId: string;
    listingId: string;
    sellerId: string;
  },
): Promise<EnsureMemberOrderListingUuidResult> {
  const listingRef = params.listingId.trim();

  if (isUuid(listingRef)) {
    return { ok: true, listingId: listingRef, wasRepaired: false };
  }

  const resolved = await resolveListingIdForSeller(
    supabase,
    listingRef,
    params.sellerId,
  );

  if (!resolved) {
    return {
      ok: false,
      error: `無法解析商品上架記錄（${listingRef}）`,
    };
  }

  if (!hasSupabaseServiceRole()) {
    return {
      ok: false,
      error:
        "訂單商品資料需修復，但伺服器未設定 SUPABASE_SERVICE_ROLE_KEY；請聯繫客服或套用最新資料庫 migration。",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("member_orders")
    .update({ listing_id: resolved })
    .eq("id", params.orderId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, listingId: resolved, wasRepaired: true };
}
