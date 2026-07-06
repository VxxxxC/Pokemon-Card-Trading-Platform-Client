import type { InventoryProductGroup } from "@/app/lib/inventory/types";
import { mapListingStatusToUi } from "@/app/lib/inventory/types";
import { formatTradeGradeLabel } from "@/lib/marketplace/listing-display";
import {
  resolveCardCode,
  resolveProductName,
  type CatalogRow,
} from "@/lib/marketplace/portfolio-pricing";
import { parseListingImageUrls } from "@/lib/listings/images";
import type { Tables } from "@/types/supabase";

export type InventoryListingRow = Pick<
  Tables<"listings">,
  | "id"
  | "product_id"
  | "price"
  | "grading_company"
  | "grading_score"
  | "images"
  | "status"
  | "seller_description"
  | "created_at"
>;

export type InventoryStatsRow = Pick<
  Tables<"listing_stats">,
  "listing_id" | "views" | "offers_count"
>;

function formatInventoryCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
}

export function matchesInventorySearch(
  catalog: CatalogRow | undefined,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const cardName = resolveProductName(catalog).toLowerCase();
  const cardNo = resolveCardCode(catalog).toLowerCase();

  return cardName.includes(normalized) || cardNo.includes(normalized);
}

export function groupListingsByProduct(input: {
  listings: InventoryListingRow[];
  catalogById: Map<string, CatalogRow>;
  statsByListingId: Map<string, InventoryStatsRow>;
}): InventoryProductGroup[] {
  const grouped = new Map<string, InventoryListingRow[]>();

  for (const listing of input.listings) {
    const bucket = grouped.get(listing.product_id);
    if (bucket) {
      bucket.push(listing);
    } else {
      grouped.set(listing.product_id, [listing]);
    }
  }

  const groups: InventoryProductGroup[] = [];

  for (const [productId, productListings] of grouped) {
    const catalog = input.catalogById.get(productId);
    const sortedListings = [...productListings].sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );

    groups.push({
      id: productId,
      cardName: resolveProductName(catalog),
      cardNo: resolveCardCode(catalog),
      thumbnailSeed: productId,
      imageUrl: catalog?.image_url ?? null,
      items: sortedListings.map((listing) => {
        const stats = input.statsByListingId.get(listing.id);
        const gradeLabel = formatTradeGradeLabel(
          listing.grading_company,
          listing.grading_score,
        );

        return {
          id: listing.id,
          grade: gradeLabel,
          grader: listing.grading_company,
          askPrice: Number(listing.price),
          status: mapListingStatusToUi(listing.status),
          createdAt: formatInventoryCreatedAt(listing.created_at),
          conditionDesc: listing.seller_description?.trim() ?? "",
          edgeWear: "",
          photos: parseListingImageUrls(listing.images).length,
          views: stats?.views ?? 0,
          offersCount: stats?.offers_count ?? 0,
        };
      }),
    });
  }

  groups.sort((left, right) => left.cardName.localeCompare(right.cardName, "zh-Hant"));

  return groups;
}

export function summarizeInventoryListings(
  listings: InventoryListingRow[],
): {
  totalListings: number;
  activeCount: number;
  soldCount: number;
  inactiveCount: number;
} {
  let activeCount = 0;
  let soldCount = 0;
  let inactiveCount = 0;

  for (const listing of listings) {
    if (listing.status === "active") activeCount += 1;
    else if (listing.status === "sold") soldCount += 1;
    else if (listing.status === "inactive") inactiveCount += 1;
  }

  return {
    totalListings: listings.length,
    activeCount,
    soldCount,
    inactiveCount,
  };
}
