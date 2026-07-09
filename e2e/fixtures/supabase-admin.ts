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
  /** Codes / product id — more reliable in AddAssetModal catalog search. */
  catalogModalKeyword: string;
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

function resolveCatalogModalKeyword(
  catalog: ProductCatalogSummary | null,
  productId: string,
): string | null {
  if (catalog) {
    const displayId = catalog.display_id?.trim();
    if (displayId) return displayId;

    const cardNumber = catalog.card_number?.trim();
    if (cardNumber) return cardNumber;
  }

  const normalizedProductId = productId.trim();
  if (normalizedProductId) {
    return normalizedProductId;
  }

  return resolveSearchKeyword(catalog);
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
  const catalogModalKeyword = resolveCatalogModalKeyword(catalog, row.product_id);

  if (!searchKeyword) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} has no usable search keyword (display_id / card_number / name)`,
    };
  }

  if (!catalogModalKeyword) {
    return {
      ok: false,
      skipReason: `Listing ${normalizedListingId} has no usable catalog modal keyword`,
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
      catalogModalKeyword,
    },
  };
}

async function findActiveListingIdForSeller(
  admin: ReturnType<typeof createE2eAdminClient>,
  sellerId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("listings")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[findActiveListingIdForSeller] ${error.message}`);
  }

  return data?.id ?? null;
}

/**
 * Prefer `E2E_LISTING_ID`; if that listing is no longer active, fall back to any
 * active listing owned by `E2E_SELLER_ID` so local E2E env does not go stale.
 */
export async function resolveE2eMarketplaceFixture(
  options: GetListingMarketplaceFixtureOptions = {},
): Promise<ListingMarketplaceFixtureResult> {
  const configuredListingId = readTrimmedEnv("E2E_LISTING_ID");
  if (!configuredListingId) {
    return {
      ok: false,
      skipReason: "Missing E2E_LISTING_ID for marketplace fixture lookup",
    };
  }

  await ensureListingActive(configuredListingId);

  const primary = await getListingMarketplaceFixture(
    configuredListingId,
    options,
  );
  if (primary.ok) {
    return primary;
  }

  const sellerId = options.expectedSellerId?.trim() ?? readTrimmedEnv("E2E_SELLER_ID");
  if (!sellerId || !hasE2eAdminEnv()) {
    return primary;
  }

  const admin = createE2eAdminClient();
  const fallbackListingId = await findActiveListingIdForSeller(admin, sellerId);
  if (!fallbackListingId || fallbackListingId === configuredListingId) {
    return primary;
  }

  return getListingMarketplaceFixture(fallbackListingId, options);
}

function isSupabaseAccessDenied(
  error: { message?: string } | null,
  status?: number,
): boolean {
  if (status === 401 || status === 403) {
    return true;
  }

  if (status === 400 && !error?.message?.trim()) {
    return true;
  }

  return isAdminPermissionDenied(error);
}

export async function getLatestOfferForListing(params: {
  roomId: string;
  listingId: string;
  buyerId: string;
}): Promise<{
  id: string;
  status: string | null;
  use_authentication: boolean | null;
} | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("offers")
    .select("id, status, use_authentication")
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

  return {
    id: data.id,
    status: data.status,
    use_authentication: data.use_authentication,
  };
}

function isAdminPermissionDenied(error: {
  message?: string;
  status?: number;
} | null): boolean {
  if (!error) {
    return false;
  }

  if (error.status === 401 || error.status === 403) {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("permission denied") || message.includes("forbidden")
  );
}

export type MemberOrderAuditRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: string | null;
  use_authentication: boolean;
  escrow_status: string | null;
  order_number: string | null;
  inbound_tracking_no?: string | null;
  final_price: number;
};

export type P2pOrderGuardResult =
  | { ok: true; order: MemberOrderAuditRow }
  | { ok: false; skipReason: string };

export type AuthOrderGuardResult =
  | { ok: true; order: MemberOrderAuditRow }
  | { ok: false; skipReason: string };

export function guardAuthMemberOrder(
  order: MemberOrderAuditRow,
): AuthOrderGuardResult {
  if (!order.use_authentication) {
    return {
      ok: false,
      skipReason: "Order is not an auth escrow member order",
    };
  }

  return { ok: true, order };
}

export function guardP2pMemberOrder(
  order: MemberOrderAuditRow,
): P2pOrderGuardResult {
  if (order.use_authentication) {
    return {
      ok: false,
      skipReason:
        "Escrow/auth member orders are excluded until Stripe is enabled",
    };
  }

  return { ok: true, order };
}

export async function getMemberOrderIdForOffer(
  offerId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("chat_messages")
    .select("member_order_id")
    .eq("offer_id", offerId)
    .not("member_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getMemberOrderIdForOffer] ${error.message}`);
  }

  return data?.member_order_id ?? null;
}

export async function getLatestMemberOrderForListing(params: {
  listingId: string;
  buyerId: string;
}): Promise<MemberOrderAuditRow | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("member_orders")
    .select(
      "id, listing_id, buyer_id, seller_id, status, use_authentication, escrow_status, order_number, final_price, inbound_tracking_no",
    )
    .eq("listing_id", params.listingId)
    .eq("buyer_id", params.buyerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getLatestMemberOrderForListing] ${error.message}`);
  }

  return data as MemberOrderAuditRow | null;
}

export async function getMemberOrderById(
  orderId: string,
): Promise<MemberOrderAuditRow | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("member_orders")
    .select(
      "id, listing_id, buyer_id, seller_id, status, use_authentication, escrow_status, order_number, final_price, inbound_tracking_no",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getMemberOrderById] ${error.message}`);
  }

  return data as MemberOrderAuditRow | null;
}

export async function getReviewForMemberOrder(params: {
  memberOrderId: string;
  reviewerId: string;
}): Promise<{ id: string; rating: number } | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("transaction_reviews")
    .select("id, rating")
    .eq("member_order_id", params.memberOrderId)
    .eq("reviewer_id", params.reviewerId)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getReviewForMemberOrder] ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return { id: data.id, rating: data.rating };
}

export async function getGamificationStatsForProfile(
  profileId: string,
): Promise<{
  points_balance: number;
  current_streak: number | null;
  last_check_in: string | null;
} | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("gamification_stats")
    .select("points_balance, current_streak, last_check_in")
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getGamificationStatsForProfile] ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    points_balance: data.points_balance,
    current_streak: data.current_streak,
    last_check_in: data.last_check_in,
  };
}

export async function countProductWatchlistsForUser(
  userId: string,
  productId: string,
): Promise<number> {
  const admin = createE2eAdminClient();

  const { count, error, status } = await admin
    .from("product_watchlists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    if (isSupabaseAccessDenied(error, status)) {
      return 0;
    }
    throw new Error(`[countProductWatchlistsForUser] ${error.message}`);
  }

  return count ?? 0;
}

export async function getBuyerProfileIdFromEnv(): Promise<string | null> {
  const email = process.env.E2E_BUYER_EMAIL?.trim();
  if (!email) {
    return null;
  }

  return getProfileIdByEmail(email);
}

export async function deleteProductWatchlistsForUser(
  userId: string,
  productId: string,
): Promise<void> {
  const admin = createE2eAdminClient();

  const { error, status } = await admin
    .from("product_watchlists")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    if (isSupabaseAccessDenied(error, status)) {
      return;
    }
    throw new Error(`[deleteProductWatchlistsForUser] ${error.message}`);
  }
}

export async function deleteUserCollectionsForUserProduct(
  userId: string,
  productId: string,
): Promise<void> {
  const admin = createE2eAdminClient();

  const { error, status } = await admin
    .from("user_collections")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    if (isSupabaseAccessDenied(error, status)) {
      return;
    }
    throw new Error(`[deleteUserCollectionsForUserProduct] ${error.message}`);
  }
}

export async function countUserCollectionsForUserProduct(
  userId: string,
  productId: string,
): Promise<number> {
  const admin = createE2eAdminClient();

  const { count, error, status } = await admin
    .from("user_collections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("product_id", productId)
    .is("sold_at", null);

  if (error) {
    if (isSupabaseAccessDenied(error, status)) {
      return 0;
    }
    throw new Error(`[countUserCollectionsForUserProduct] ${error.message}`);
  }

  return count ?? 0;
}

export async function setListingStatusInactive(
  listingId: string,
): Promise<void> {
  const admin = createE2eAdminClient();

  const { error } = await admin
    .from("listings")
    .update({ status: "inactive" })
    .eq("id", listingId);

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return;
    }
    throw new Error(`[setListingStatusInactive] ${error.message}`);
  }
}

export async function getLatestActiveListingForSellerProduct(
  sellerId: string,
  productId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("product_id", productId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getLatestActiveListingForSellerProduct] ${error.message}`);
  }

  return data?.id ?? null;
}

export async function countActiveListingsForSellerProduct(
  sellerId: string,
  productId: string,
): Promise<number> {
  const admin = createE2eAdminClient();

  const { count, error } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("product_id", productId)
    .eq("status", "active");

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return 0;
    }
    throw new Error(`[countActiveListingsForSellerProduct] ${error.message}`);
  }

  return count ?? 0;
}

export async function getLatestUserCollectionId(
  userId: string,
  productId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error, status } = await admin
    .from("user_collections")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .is("sold_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isSupabaseAccessDenied(error, status)) {
      return null;
    }
    throw new Error(`[getLatestUserCollectionId] ${error.message}`);
  }

  return data?.id ?? null;
}

export async function getListingSourceCollectionId(
  listingId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("source_collection_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getListingSourceCollectionId] ${error.message}`);
  }

  return data?.source_collection_id ?? null;
}

export async function ensureListingActive(listingId: string): Promise<boolean> {
  const admin = createE2eAdminClient();

  const { error } = await admin
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId);

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return false;
    }
    throw new Error(`[ensureListingActive] ${error.message}`);
  }

  return true;
}

export async function ensureListingP2pMode(listingId: string): Promise<boolean> {
  const admin = createE2eAdminClient();

  const { error } = await admin
    .from("listings")
    .update({ use_authentication: false, status: "active" })
    .eq("id", listingId);

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return false;
    }
    throw new Error(`[ensureListingP2pMode] ${error.message}`);
  }

  return true;
}

export async function ensureListingAcceptsAuthentication(
  listingId: string,
): Promise<boolean> {
  const admin = createE2eAdminClient();

  const { error } = await admin
    .from("listings")
    .update({ use_authentication: true })
    .eq("id", listingId);

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return false;
    }
    throw new Error(`[ensureListingAcceptsAuthentication] ${error.message}`);
  }

  return true;
}

export async function getListingStatus(
  listingId: string,
): Promise<string | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("status")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getListingStatus] ${error.message}`);
  }

  return data?.status ?? null;
}

export async function getListingAcceptsAuthentication(
  listingId: string,
): Promise<boolean | null> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("use_authentication")
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return null;
    }
    throw new Error(`[getListingAcceptsAuthentication] ${error.message}`);
  }

  return data?.use_authentication ?? false;
}

export async function advanceAuthOrderToCustody(
  orderId: string,
): Promise<boolean> {
  const admin = createE2eAdminClient();

  const { error } = await admin
    .from("member_orders")
    .update({
      escrow_status: "custody",
      payment_confirmed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return false;
    }
    throw new Error(`[advanceAuthOrderToCustody] ${error.message}`);
  }

  return true;
}

export async function deactivateActiveListingsForSellerProduct(
  sellerId: string,
  productId: string,
): Promise<void> {
  const admin = createE2eAdminClient();

  const { data, error } = await admin
    .from("listings")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("product_id", productId)
    .eq("status", "active");

  if (error) {
    if (isAdminPermissionDenied(error)) {
      return;
    }
    throw new Error(
      `[deactivateActiveListingsForSellerProduct] ${error.message}`,
    );
  }

  for (const row of data ?? []) {
    if (row.id) {
      await setListingStatusInactive(row.id);
    }
  }
}

export async function markUserCollectionAsSold(params: {
  userId: string;
  collectionId: string;
  listingId?: string | null;
  soldPrice?: number;
}): Promise<boolean> {
  const admin = createE2eAdminClient();

  const { error, status } = await admin
    .from("user_collections")
    .update({
      sold_at: new Date().toISOString(),
      sold_listing_id: params.listingId ?? null,
      sold_price: params.soldPrice ?? null,
    })
    .eq("id", params.collectionId)
    .eq("user_id", params.userId);

  if (error) {
    if (isSupabaseAccessDenied(error, status)) {
      return false;
    }
    throw new Error(`[markUserCollectionAsSold] ${error.message}`);
  }

  return true;
}

export type E2eListingTradingResetResult = {
  ok: boolean;
  method: "rpc" | "fallback" | "skipped";
  cancelledOrders: number;
  cancelledOffers: number;
  error?: string;
};

function isMissingRpcError(message: string | undefined): boolean {
  const normalized = message?.toLowerCase() ?? "";
  return (
    normalized.includes("could not find the function") ||
    normalized.includes("function public.rpc_e2e_reset_listing_trading_fixture") ||
    normalized.includes("schema cache")
  );
}

export async function resetE2eListingTradingFixture(params: {
  listingId: string;
  buyerId: string;
  sellerId: string;
}): Promise<E2eListingTradingResetResult> {
  if (!hasE2eAdminEnv()) {
    return {
      ok: false,
      method: "skipped",
      cancelledOrders: 0,
      cancelledOffers: 0,
      error: "Missing SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const admin = createE2eAdminClient();

  const { data, error } = await (
    admin as unknown as {
      rpc: (
        fn: "rpc_e2e_reset_listing_trading_fixture",
        args: {
          p_listing_id: string;
          p_buyer_id: string;
          p_seller_id: string;
        },
      ) => Promise<{
        data: {
          cancelled_orders?: number;
          cancelled_offers?: number;
        } | null;
        error: { message: string } | null;
      }>;
    }
  ).rpc("rpc_e2e_reset_listing_trading_fixture", {
    p_listing_id: params.listingId,
    p_buyer_id: params.buyerId,
    p_seller_id: params.sellerId,
  });

  if (!error && data) {
    return {
      ok: true,
      method: "rpc",
      cancelledOrders: Number(data.cancelled_orders ?? 0),
      cancelledOffers: Number(data.cancelled_offers ?? 0),
    };
  }

  if (error && !isMissingRpcError(error.message)) {
    return {
      ok: false,
      method: "rpc",
      cancelledOrders: 0,
      cancelledOffers: 0,
      error: error.message,
    };
  }

  let cancelledOffers = 0;
  let cancelledOrders = 0;

  const { data: pendingOffers, error: pendingOffersError } = await admin
    .from("offers")
    .select("id")
    .eq("listing_id", params.listingId)
    .eq("buyer_id", params.buyerId)
    .eq("status", "pending");

  if (pendingOffersError) {
    return {
      ok: false,
      method: "fallback",
      cancelledOrders: 0,
      cancelledOffers: 0,
      error: pendingOffersError.message,
    };
  }

  for (const offer of pendingOffers ?? []) {
    if (!offer.id) {
      continue;
    }

    const { error: rejectError } = await (
      admin as unknown as {
        rpc: (
          fn: "rpc_reject_offer",
          args: { p_offer_id: string; p_seller_id: string },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_reject_offer", {
      p_offer_id: offer.id,
      p_seller_id: params.sellerId,
    });

    if (!rejectError) {
      cancelledOffers += 1;
    }
  }

  const roomId = await ensureDbChatRoom(params.buyerId, params.sellerId);
  const { data: orderMessages, error: orderMessagesError } = await admin
    .from("chat_messages")
    .select("member_order_id")
    .eq("room_id", roomId)
    .not("member_order_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (orderMessagesError) {
    return {
      ok: false,
      method: "fallback",
      cancelledOrders,
      cancelledOffers,
      error: orderMessagesError.message,
    };
  }

  const seenOrderIds = new Set<string>();
  for (const message of orderMessages ?? []) {
    const orderId = message.member_order_id;
    if (!orderId || seenOrderIds.has(orderId)) {
      continue;
    }
    seenOrderIds.add(orderId);

    const { error: cancelError } = await (
      admin as unknown as {
        rpc: (
          fn: "rpc_cancel_member_order",
          args: { p_order_id: string; p_user_id: string },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_cancel_member_order", {
      p_order_id: orderId,
      p_user_id: params.sellerId,
    });

    if (!cancelError) {
      cancelledOrders += 1;
    }
  }

  await ensureListingActive(params.listingId);

  return {
    ok: true,
    method: "fallback",
    cancelledOrders,
    cancelledOffers,
  };
}
