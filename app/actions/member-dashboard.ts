"use server";

import type {
  MemberDashboardOverview,
  MemberDashboardProfile,
  MemberDashboardTradingStats,
} from "@/app/lib/dashboard/types";
import {
  loadCollectionPricingContext,
  type CollectionRow,
} from "@/lib/collection/build-entries";
import { computeMemberTradingStats } from "@/lib/dashboard/member-trading-stats";
import { resolveAvatarUrl } from "@/lib/profile/avatar";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ListingPriceRow } from "@/lib/marketplace/portfolio-pricing";
import type { Tables } from "@/types/supabase";

type MemberDashboardResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type DashboardProfileRow = Pick<
  Tables<"profiles">,
  | "id"
  | "display_name"
  | "username"
  | "avatar_path"
  | "created_at"
  | "rating_score"
  | "reputation_tag"
  | "completed_trades_count"
>;

const EMPTY_TRADING_STATS: MemberDashboardTradingStats = {
  completedTradesCount: 0,
  heldCardCount: 0,
  listedForSaleCount: 0,
  totalMarketValue: 0,
};

function formatJoinDateLabel(createdAt: string | null): string {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}年 ${date.getMonth() + 1}月加入`;
}

function mapProfileRow(row: DashboardProfileRow): MemberDashboardProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: resolveAvatarUrl(row.avatar_path),
    joinDateLabel: formatJoinDateLabel(row.created_at),
    ratingScore: row.rating_score,
    reputationTag: row.reputation_tag,
  };
}

async function fetchCollectionRows(userId: string): Promise<CollectionRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchCollectionRows]", error.message);
    throw new Error("無法載入收藏庫");
  }

  return (data ?? []) as CollectionRow[];
}

async function fetchActiveSellerListings(userId: string): Promise<ListingPriceRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("id, product_id, grading_company, grading_score, price")
    .eq("seller_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("[fetchActiveSellerListings]", error.message);
    throw new Error("無法載入上架商品");
  }

  return (data ?? []) as ListingPriceRow[];
}

async function fetchGamificationPointsBalance(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gamification_stats")
    .select("points_balance")
    .eq("user_id", userId)
    .maybeSingle<{ points_balance: number }>();

  if (error) {
    console.error("[fetchGamificationPointsBalance]", error.message);
    return 0;
  }

  return data?.points_balance ?? 0;
}

export async function getMemberDashboardOverview(): Promise<
  MemberDashboardResult<MemberDashboardOverview>
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "請先登入" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "請先登入" };
  }

  try {
    const [profileResult, collectionRows, activeListings, pointsBalance] =
      await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, display_name, username, avatar_path, created_at, rating_score, reputation_tag, completed_trades_count",
        )
        .eq("id", user.id)
        .maybeSingle<DashboardProfileRow>(),
      fetchCollectionRows(user.id),
      fetchActiveSellerListings(user.id),
      fetchGamificationPointsBalance(user.id),
    ]);

    if (profileResult.error || !profileResult.data) {
      return { success: false, error: "無法取得用戶資料" };
    }

    const profile = mapProfileRow(profileResult.data);
    const completedTradesCount = profileResult.data.completed_trades_count ?? 0;

    if (collectionRows.length === 0 && activeListings.length === 0) {
      return {
        success: true,
        data: {
          profile,
          tradingStats: {
            ...EMPTY_TRADING_STATS,
            completedTradesCount,
          },
          pointsBalance,
        },
      };
    }

    const productIds = [
      ...new Set([
        ...collectionRows.map((row) => row.product_id),
        ...activeListings.map((listing) => listing.product_id),
      ]),
    ];

    const context = await loadCollectionPricingContext(supabase, user.id, productIds, {
      includeChartData: false,
    });

    const tradingStats = computeMemberTradingStats({
      completedTradesCount,
      collectionRows,
      activeListings,
      context,
    });

    return {
      success: true,
      data: {
        profile,
        tradingStats,
        pointsBalance,
      },
    };
  } catch (error) {
    console.error("[getMemberDashboardOverview]", error);
    return { success: false, error: "無法載入帳戶總覽" };
  }
}
