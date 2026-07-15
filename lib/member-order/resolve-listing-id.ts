import type { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/marketplace/seller-profile";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function resolveListingIdForSeller(
  supabase: ServerSupabaseClient,
  listingRef: string,
  sellerId: string,
): Promise<string | null> {
  const trimmed = listingRef.trim();
  if (!trimmed) {
    return null;
  }

  if (isUuid(trimmed)) {
    return trimmed;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, created_at, product_catalog!inner(display_id)")
    .eq("product_catalog.display_id", trimmed)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  const row = data[0] as { id: string };
  return row.id ?? null;
}
