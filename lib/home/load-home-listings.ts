import type { HomeListingCard } from "@/app/lib/home/types";
import { HOME_LISTING_LIMIT } from "@/lib/home/constants";
import { parseListingImageUrls } from "@/lib/listings/images";
import { formatTradeGradeLabel } from "@/lib/marketplace/listing-display";
import {
  resolveCardCode,
  resolveProductName,
  type CatalogRow,
} from "@/lib/marketplace/portfolio-pricing";
import { createPublicClient } from "@/lib/supabase/public";
import {
  homePerfLog,
  homePerfNow,
  isHomePerfLogEnabled,
} from "@/lib/home/perf-log";
import type { Tables } from "@/types/supabase";

type ListingRow = Pick<
  Tables<"listings">,
  | "id"
  | "product_id"
  | "price"
  | "grading_company"
  | "grading_score"
  | "seller_id"
  | "images"
  | "created_at"
  | "use_authentication"
  | "seller_persona"
>;

type ProfileRow = Pick<Tables<"profiles">, "id" | "display_name" | "role">;

const CATALOG_COLUMNS =
  "id, name_zh, name_en, name_ja, card_number, display_id, set_code, image_url, rarity";

function mapListingToCard(
  listing: ListingRow,
  catalog: CatalogRow | undefined,
  profile: ProfileRow | undefined,
): HomeListingCard {
  const imageUrls = parseListingImageUrls(listing.images);
  const imageUrl =
    imageUrls[0]?.trim() || catalog?.image_url?.trim() || "/placeholder-card.png";

  return {
    listingId: listing.id,
    productId: listing.product_id,
    displayId: catalog?.display_id ?? null,
    cardCode: resolveCardCode(catalog),
    name: resolveProductName(catalog),
    setCode: catalog?.set_code ?? "",
    rarity: catalog?.rarity ?? null,
    gradingCompany: listing.grading_company,
    gradingScore: listing.grading_score,
    gradeLabel: formatTradeGradeLabel(
      listing.grading_company,
      listing.grading_score,
    ),
    price: Number(listing.price),
    imageUrl,
    sellerId: listing.seller_id,
    sellerName: profile?.display_name?.trim() || "賣家",
    sellerBadge:
      profile?.role === "merchant" ? "認證商家" : "C2C 賣家",
    photoCount: imageUrls.length,
    createdAt: listing.created_at,
    useAuthentication: listing.use_authentication,
  };
}

export async function fetchHomeListingsByPersona(
  persona: Tables<"listings">["seller_persona"],
  limit = HOME_LISTING_LIMIT,
): Promise<HomeListingCard[]> {
  const supabase = createPublicClient();
  const startedAt = isHomePerfLogEnabled() ? homePerfNow() : 0;

  const { data: listingRows, error: listingError } = await supabase
    .from("listings")
    .select(
      "id, product_id, price, grading_company, grading_score, seller_id, images, created_at, use_authentication, seller_persona",
    )
    .eq("status", "active")
    .eq("seller_persona", persona)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (listingError) {
    console.error("[fetchHomeListingsByPersona]", listingError.message);
    throw new Error("無法載入首頁掛單");
  }

  const listings = (listingRows ?? []) as ListingRow[];
  if (listings.length === 0) {
    if (isHomePerfLogEnabled()) {
      homePerfLog(
        `listings.${persona}=${Math.round(homePerfNow() - startedAt)}ms count=0`,
      );
    }
    return [];
  }

  const productIds = [...new Set(listings.map((row) => row.product_id))];
  const sellerIds = [...new Set(listings.map((row) => row.seller_id))];

  const [catalogResult, profileResult] = await Promise.all([
    supabase.from("product_catalog").select(CATALOG_COLUMNS).in("id", productIds),
    supabase
      .from("profiles")
      .select("id, display_name, role")
      .in("id", sellerIds),
  ]);

  if (catalogResult.error) {
    console.error("[fetchHomeListingsByPersona]", catalogResult.error.message);
    throw new Error("無法載入卡牌資料");
  }

  if (profileResult.error) {
    console.error("[fetchHomeListingsByPersona]", profileResult.error.message);
    throw new Error("無法載入賣家資料");
  }

  const catalogById = new Map(
    ((catalogResult.data ?? []) as CatalogRow[]).map((row) => [row.id, row]),
  );
  const profileById = new Map(
    ((profileResult.data ?? []) as ProfileRow[]).map((row) => [row.id, row]),
  );

  const cards = listings.map((listing) =>
    mapListingToCard(
      listing,
      catalogById.get(listing.product_id),
      profileById.get(listing.seller_id),
    ),
  );

  if (isHomePerfLogEnabled()) {
    homePerfLog(
      `listings.${persona}=${Math.round(homePerfNow() - startedAt)}ms count=${cards.length}`,
    );
  }

  return cards;
}
