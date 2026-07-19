import type { MarketplacePriceChartPoint } from "@/app/lib/marketplace/types";
import type { CatalogType } from "@/lib/constants/commerce";

export type WishlistEntry = {
  productId: string;
  displayId: string | null;
  name: string;
  cardCode: string;
  rarity: string | null;
  catalogType: CatalogType | null;
  gradingCompany: string;
  gradingScore: string;
  gradeLabel: string;
  imageUrl: string | null;
  trackedPrice: number | null;
  targetPrice: number | null;
  currentMarketPrice: number | null;
  lowestListingPrice: number | null;
  trend30d: number | null;
  chartPoints: MarketplacePriceChartPoint[];
};

export type WishlistToggleInput = {
  productId: string;
  gradingCompany: string;
  gradingScore: string | null | undefined;
  trackedPrice?: number | null;
};

export type WishlistRemoveInput = {
  productId: string;
  gradingCompany: string;
  gradingScore: string;
};

export type WishlistUpdateGradeInput = {
  productId: string;
  gradingCompany: string;
  gradingScore: string;
  nextGradingCompany: string;
  nextGradingScore: string | null | undefined;
};

export type WishlistUpdateTargetInput = {
  productId: string;
  gradingCompany: string;
  gradingScore: string;
  targetPrice: number | null;
  alertEnabled?: boolean;
};
