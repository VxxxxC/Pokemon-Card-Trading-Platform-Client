import type { Database } from "@/types/supabase";
import type { SortKey } from "@/app/store/useMarketStore";

export type GradeFilter = {
  company: string;
  score: string | null;
};

export type MarketplaceProductRow = {
  productId: string;
  productName: string;
  nameJa: string;
  nameEn: string | null;
  nameZh: string | null;
  setCode: string;
  cardNumber: string | null;
  displayId: string | null;
  rarity: string | null;
  imageUrl: string;
  catalogType: Database["public"]["Enums"]["catalog_type"];
  listingCount: number;
  lowestPrice: number;
  highestPrice: number;
  lowestListingId: string;
  lowestListingCreatedAt: string;
  latestListingAt: string;
  gradingCompany: string;
  gradingScore: string | null;
  sellerId: string;
  sellerName: string;
  sellerPersona: Database["public"]["Enums"]["seller_persona_type"];
  useAuthentication: boolean;
};

export type MarketplacePaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
};

export type MarketplaceSearchInput = {
  query?: string;
  setCode?: string;
  cardNumber?: string;
  rarities?: string[];
  sellerModes?: string[];
  gradeFilters?: GradeFilter[];
  priceMin?: number;
  priceMax?: number;
  sortKey?: SortKey;
  page?: number;
  pageSize?: number;
};

export type SearchMarketplaceResult =
  | {
      success: true;
      data: MarketplaceProductRow[];
      meta: MarketplacePaginationMeta;
    }
  | { success: false; error: string };

export type MarketplacePriceBoundsResult =
  | { success: true; data: { minPrice: number; maxPrice: number } }
  | { success: false; error: string };
