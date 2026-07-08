import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type ChatMessageAuditRow = {
  id: string;
  room_id: string;
  content: string;
  created_at: string | null;
  sender_id: string;
  is_system_warning: boolean | null;
};

function createE2eAdminClient() {
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

export async function getProfileIdByEmail(email: string): Promise<string | null> {
  const admin = createE2eAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(`[getProfileIdByEmail] ${error.message}`);
  }

  const normalized = email.trim().toLowerCase();
  const user = data.users.find(
    (entry) => entry.email?.trim().toLowerCase() === normalized,
  );

  return user?.id ?? null;
}

export async function ensureDbChatRoom(
  buyerId: string,
  sellerId: string,
): Promise<string> {
  const admin = createE2eAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("chat_rooms")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (selectError) {
    throw new Error(`[ensureDbChatRoom] ${selectError.message}`);
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data: created, error: insertError } = await admin
    .from("chat_rooms")
    .insert({ buyer_id: buyerId, seller_id: sellerId })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`[ensureDbChatRoom] ${insertError.message}`);
  }

  return created.id;
}

export async function getLatestChatMessage(
  roomId: string,
  contentContains?: string,
): Promise<ChatMessageAuditRow | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("chat_messages")
    .select("id, room_id, content, created_at, sender_id, is_system_warning")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`[getLatestChatMessage] ${error.message}`);
  }

  const rows = (data ?? []) as ChatMessageAuditRow[];
  if (rows.length === 0) {
    return null;
  }

  if (contentContains) {
    return rows.find((row) => row.content.includes(contentContains)) ?? null;
  }

  return rows[0] ?? null;
}

export async function getOfferStatus(offerId: string): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("offers")
    .select("status")
    .eq("id", offerId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getOfferStatus] ${error.message}`);
  }

  return data?.status ?? null;
}

export async function getListingSellerId(
  listingId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("seller_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getListingSellerId] ${error.message}`);
  }

  return data?.seller_id ?? null;
}

export async function getProfileDisplayName(profileId: string): Promise<string> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getProfileDisplayName] ${error.message}`);
  }

  return data?.display_name?.trim() || "對話夥伴";
}

export type ListingMarketplaceFixture = {
  listingId: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  productName: string;
  listingPrice: number;
  lowestPrice: number;
  searchKeyword: string;
};

export type ListingMarketplaceFixtureResult =
  | { ok: true; fixture: ListingMarketplaceFixture }
  | { ok: false; skipReason: string };

export type GetListingMarketplaceFixtureOptions = {
  /** When set, returns skip if the listing owner does not match. */
  expectedSellerId?: string;
  /** When set, preferred over catalog fields for `searchKeyword`. */
  preferredSearchKeyword?: string;
};

type ProductCatalogSummary = {
  display_id: string | null;
  card_number: string | null;
  name_zh: string | null;
  name_en: string | null;
  name_ja: string;
};

type ListingCatalogJoinRow = {
  id: string;
  price: number;
  status: string;
  product_id: string;
  seller_id: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
  product_catalog: ProductCatalogSummary | ProductCatalogSummary[] | null;
};

function hasE2eAdminEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function readTrimmedEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function unwrapJoinRow<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function resolveProductName(catalog: ProductCatalogSummary | null): string {
  if (!catalog) {
    return "未命名卡牌";
  }

  const zh = catalog.name_zh?.trim();
  if (zh) return zh;

  const en = catalog.name_en?.trim();
  if (en) return en;

  const ja = catalog.name_ja?.trim();
  if (ja) return ja;

  return "未命名卡牌";
}

function resolveSearchKeyword(
  catalog: ProductCatalogSummary | null,
  preferredSearchKeyword?: string,
): string | null {
  const preferred = preferredSearchKeyword?.trim();
  if (preferred) {
    return preferred;
  }

  if (!catalog) {
    return null;
  }

  // Prefer catalog names before codes — card_number / display_id can match unrelated products.
  const nameZh = catalog.name_zh?.trim();
  if (nameZh) return nameZh;

  const nameJa = catalog.name_ja?.trim();
  if (nameJa) return nameJa;

  const nameEn = catalog.name_en?.trim();
  if (nameEn) return nameEn;

  const displayId = catalog.display_id?.trim();
  if (displayId) return displayId;

  const cardNumber = catalog.card_number?.trim();
  if (cardNumber) return cardNumber;

  return null;
}

async function getLowestActiveListingPrice(
  admin: ReturnType<typeof createE2eAdminClient>,
  productId: string,
): Promise<number | null> {
  const { data, error } = await admin
    .from("listings")
    .select("price")
    .eq("product_id", productId)
    .eq("status", "active");

  if (error) {
    throw new Error(`[getListingMarketplaceFixture.lowestPrice] ${error.message}`);
  }

  const prices = (data ?? [])
    .map((row) => row.price)
    .filter((price): price is number => typeof price === "number" && price > 0);

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
}

/**
 * Loads marketplace search/order-book fixture data for a listing.
 * Returns `{ ok: false, skipReason }` when env or listing state is unsuitable for E2E.
 */
export async function getListingMarketplaceFixture(
  listingId: string,
  options: GetListingMarketplaceFixtureOptions = {},
): Promise<ListingMarketplaceFixtureResult> {
  const normalizedListingId = listingId.trim();
  if (!normalizedListingId) {
    return { ok: false, skipReason: "Missing listingId for marketplace fixture lookup" };
  }

  if (!hasE2eAdminEnv()) {
    return {
      ok: false,
      skipReason:
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for marketplace fixture lookup",
    };
  }

  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select(
      `
      id,
      price,
      status,
      product_id,
      seller_id,
      profiles!fk_listings_seller_id (
        display_name
      ),
      product_catalog!listings_product_id_fkey (
        display_id,
        card_number,
        name_zh,
        name_en,
        name_ja
      )
    `,
    )
    .eq("id", normalizedListingId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getListingMarketplaceFixture] ${error.message}`);
  }

  if (!data) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} was not found in Supabase`,
    };
  }

  const row = data as ListingCatalogJoinRow;

  if (row.status !== "active") {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} is not active (status=${row.status})`,
    };
  }

  const expectedSellerId =
    options.expectedSellerId?.trim() ?? readTrimmedEnv("E2E_SELLER_ID");
  if (expectedSellerId && row.seller_id !== expectedSellerId) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} owner is ${row.seller_id} but E2E_SELLER_ID is ${expectedSellerId}`,
    };
  }

  const sellerProfile = unwrapJoinRow(row.profiles);
  const sellerName = sellerProfile?.display_name?.trim();
  if (!sellerName) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} is missing seller display_name`,
    };
  }

  const catalog = unwrapJoinRow(row.product_catalog);
  if (!catalog) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} is missing product_catalog join`,
    };
  }

  const preferredSearchKeyword = options.preferredSearchKeyword?.trim();
  const searchKeyword = resolveSearchKeyword(catalog, preferredSearchKeyword);

  if (!searchKeyword) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} has no usable search keyword (display_id / card_number / name)`,
    };
  }

  const lowestPrice = await getLowestActiveListingPrice(admin, row.product_id);
  if (lowestPrice == null) {
    return {
      ok: false,
      skipReason: `Product ${row.product_id} has no active listings for lowestPrice`,
    };
  }

  if (typeof row.price !== "number" || row.price <= 0) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} has invalid price`,
    };
  }

  return {
    ok: true,
    fixture: {
      listingId: row.id,
      productId: row.product_id,
      sellerId: row.seller_id,
      sellerName,
      productName: resolveProductName(catalog),
      listingPrice: row.price,
      lowestPrice,
      searchKeyword,
    },
  };
}

export async function getLatestOfferForListing(params: {
  roomId: string;
  listingId: string;
  buyerId: string;
}): Promise<{ id: string; status: string | null } | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("offers")
    .select("id, status")
    .eq("room_id", params.roomId)
    .eq("listing_id", params.listingId)
    .eq("buyer_id", params.buyerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[getLatestOfferForListing] ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return { id: data.id, status: data.status };
}
