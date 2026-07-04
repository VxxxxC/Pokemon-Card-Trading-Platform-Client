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

export type MarketplaceBootstrapData = {
  products: MarketplaceProductRow[];
  meta: MarketplacePaginationMeta;
  priceBounds: { minPrice: number; maxPrice: number };
  rarities: string[];
};

export type MarketplaceBootstrapResult =
  | { success: true; data: MarketplaceBootstrapData }
  | { success: false; error: string };

/** Mapped `product_catalog` row for marketplace product detail page. */
export type MarketplaceProductDetail = {
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
  /** Gallery slots — catalog currently exposes one official image. */
  images: string[];
  catalogType: Database["public"]["Enums"]["catalog_type"];
  elementType: string | null;
  pokemonStage: string | null;
  hp: number | null;
  subTypeJa: string | null;
};

export type MarketplaceProductDetailResult =
  | { success: true; data: MarketplaceProductDetail }
  | { success: false; error: string };

export type ProductListingSortKey = "price_asc" | "grade_desc" | "rating_desc";

export type MarketplaceProductListingRow = {
  listingId: string;
  price: number;
  gradingCompany: string;
  gradingScore: string | null;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerTotalTrades: number;
  sellerPersona: Database["public"]["Enums"]["seller_persona_type"];
  useAuthentication: boolean;
  createdAt: string;
};

/** Full listing payload for slide-over / detail views (fetched on demand). */
export type MarketplaceListingDetail = {
  listingId: string;
  productId: string;
  price: number;
  gradingCompany: string;
  gradingScore: string | null;
  sellerId: string;
  sellerDescription: string | null;
  images: string[];
  useAuthentication: boolean;
};

export type MarketplaceListingDetailResult =
  | { success: true; data: MarketplaceListingDetail }
  | { success: false; error: string };

export type MarketplaceProductListingsInput = {
  productId: string;
  gradeFilters?: GradeFilter[];
  onlyGraded?: boolean;
  sort?: ProductListingSortKey;
  page?: number;
  pageSize?: number;
};

export type MarketplaceProductListingsResult =
  | {
      success: true;
      data: MarketplaceProductListingRow[];
      meta: MarketplacePaginationMeta;
      lowestPrice: number | null;
    }
  | { success: false; error: string };

export type MarketplaceProductTradeHistoryRow = {
  orderId: string;
  createdAt: string;
  grade: string;
  price: number;
};

export type MarketplaceProductTradeHistoryInput = {
  productId: string;
  page?: number;
  pageSize?: number;
};

export type MarketplaceProductTradeHistoryResult =
  | {
      success: true;
      data: MarketplaceProductTradeHistoryRow[];
      meta: MarketplacePaginationMeta;
    }
  | { success: false; error: string };

export type MarketplacePriceChartPoint = {
  date: string;
  price: number;
};

export type MarketplaceMarketPrice = {
  marketAvgPrice: number | null;
  marketTrend30d: number | null;
  chartPoints: MarketplacePriceChartPoint[];
};

/** One cached market price row per product + grade. */
export type MarketplaceMarketPriceGradeRow = {
  gradeKey: string;
  label: string;
  gradingCompany: string;
  gradingScore: string | null;
  marketAvgPrice: number | null;
  marketTrend30d: number | null;
  chartPoints: MarketplacePriceChartPoint[];
};

export type MarketplaceMarketPriceInput = {
  productId: string;
  gradingCompany: string;
  gradingScore: string | null;
};

export type MarketplaceMarketPriceResult =
  | { success: true; data: MarketplaceMarketPrice }
  | { success: false; error: string };

export type MarketplaceProductMarketPricesResult =
  | { success: true; data: MarketplaceMarketPriceGradeRow[] }
  | { success: false; error: string };
