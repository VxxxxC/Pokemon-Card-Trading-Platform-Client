import type { Json } from "@/types/supabase";

export type MemberDashboardTradingStats = {
  completedTradesCount: number;
  heldCardCount: number;
  listedForSaleCount: number;
  totalMarketValue: number;
};

export type MemberDashboardProfile = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string;
  joinDateLabel: string;
  ratingScore: number | null;
  reputationTag: Json | null;
};

export type MemberDashboardOverview = {
  profile: MemberDashboardProfile;
  tradingStats: MemberDashboardTradingStats;
  /** Available PTS from gamification_stats.points_balance */
  pointsBalance: number;
};
