import type { CollectionValuationSource } from "@/lib/marketplace/portfolio-pricing";

export type { CollectionValuationSource };

export type CollectionEntryStatus = "holding" | "listed" | "in_trade" | "sold";

export type CollectionEntry = {
  collectionId: string;
  productId: string;
  name: string;
  cardCode: string;
  setCode: string;
  rarity: string | null;
  imageUrl: string | null;
  gradingCompany: string;
  gradingScore: string;
  gradeLabel: string;
  gradingOptionId: string;
  purchasePrice: number;
  currentMarketValue: number | null;
  valuationSource: CollectionValuationSource | null;
  trend30d: number | null;
  status: CollectionEntryStatus;
  activeListingId: string | null;
  soldAt?: string | null;
  soldPrice?: number | null;
};

export type CollectionListFilter = "all" | "graded" | "raw" | "listed" | "sold";

export type GetCollectionEntriesInput = {
  page?: number;
  pageSize?: number;
  filter?: CollectionListFilter;
  query?: string;
};

export type CollectionEntriesPage = {
  entries: CollectionEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CollectionPortfolioSummary = {
  totalMarketValue: number;
  totalPurchasePrice: number;
  unrealizedPnl: number;
  pnlPercent: number;
  cardCount: number;
  gradedCount: number;
  rawCount: number;
  listedCount: number;
};

export type CollectionAddInput = {
  productId: string;
  gradingOptionId: string;
  purchasePrice: number;
};

export type CollectionRemoveInput = {
  collectionId: string;
};

export type CollectionUpdateGradeInput = {
  collectionId: string;
  nextGradingOptionId: string;
};

export type CollectionUpdatePurchasePriceInput = {
  collectionId: string;
  purchasePrice: number;
};

export type CollectionPageBootstrap = {
  summary: CollectionPortfolioSummary;
  page: CollectionEntriesPage;
};
