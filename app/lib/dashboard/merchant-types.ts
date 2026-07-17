import type { Json } from "@/types/supabase";

export type MerchantDashboardShop = {
  merchantId: string;
  shopName: string;
  shopHandle: string | null;
  joinDateLabel: string;
  avatarUrl: string;
  ratingScore: number | null;
  reputationTag: Json | null;
  completedTradesCount: number;
  activeListingCount: number;
  kycVerified: boolean;
  stripeConnected: boolean;
};

export type MerchantDashboardPerformanceStats = {
  monthlyOrderCount: number;
  monthlyRevenue: number;
};

export type MerchantDashboardOverview = {
  shop: MerchantDashboardShop;
  performance: MerchantDashboardPerformanceStats;
};
