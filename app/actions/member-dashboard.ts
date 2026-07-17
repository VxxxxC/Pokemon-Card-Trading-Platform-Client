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
import {
  dashboardPerfLog,
  dashboardPerfNow,
  isDashboardPerfLogEnabled,
} from "@/lib/dashboard/perf-log";
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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const COLLECTION_STATS_COLUMNS =
  "id, product_id, grading_company, grading_score, purchase_price";

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

async function fetchCollectionRows(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<CollectionRow[]> {
  const { data, error } = await supabase
    .from("user_collections")
    .select(COLLECTION_STATS_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchCollectionRows]", error.message);
    throw new Error("無法載入收藏庫");
  }

  return (data ?? []) as CollectionRow[];
}

async function fetchActiveSellerListings(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ListingPriceRow[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("id, product_id, grading_company, grading_score, price")
    .eq("seller_id", userId)
    .eq("seller_persona", "member")
    .eq("status", "active");

  if (error) {
    console.error("[fetchActiveSellerListings]", error.message);
    throw new Error("無法載入上架商品");
  }

  return (data ?? []) as ListingPriceRow[];
}

async function fetchGamificationPointsBalance(
  supabase: SupabaseServerClient,
): Promise<number> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: "get_gamification_stats_for_me") => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    }
  ).rpc("get_gamification_stats_for_me");

  if (error) {
    console.error("[fetchGamificationPointsBalance]", error.message);
    return 0;
  }

  const payload = data as Record<string, unknown> | null;
  return Number(payload?.points_balance ?? 0);
}

export async function getMemberDashboardOverview(): Promise<
  MemberDashboardResult<MemberDashboardOverview>
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "請先登入" };
  }

  const totalStart = isDashboardPerfLogEnabled() ? dashboardPerfNow() : 0;

  const supabase = await createClient();
  const authStart = isDashboardPerfLogEnabled() ? dashboardPerfNow() : 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isDashboardPerfLogEnabled()) {
    dashboardPerfLog(`overview.authMs=${Math.round(dashboardPerfNow() - authStart)}`);
  }

  if (!user) {
    return { success: false, error: "請先登入" };
  }

  try {
    const parallelStart = isDashboardPerfLogEnabled() ? dashboardPerfNow() : 0;
    const [profileResult, collectionRows, activeListings, pointsBalance] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, display_name, username, avatar_path, created_at, rating_score, reputation_tag, completed_trades_count",
          )
          .eq("id", user.id)
          .maybeSingle<DashboardProfileRow>(),
        fetchCollectionRows(supabase, user.id),
        fetchActiveSellerListings(supabase, user.id),
        fetchGamificationPointsBalance(supabase),
      ]);

    if (isDashboardPerfLogEnabled()) {
      dashboardPerfLog(
        `overview.parallelFetchMs=${Math.round(dashboardPerfNow() - parallelStart)} collections=${collectionRows.length} listings=${activeListings.length}`,
      );
    }

    if (profileResult.error || !profileResult.data) {
      return { success: false, error: "無法取得用戶資料" };
    }

    const profile = mapProfileRow(profileResult.data);
    const completedTradesCount = profileResult.data.completed_trades_count ?? 0;

    if (collectionRows.length === 0 && activeListings.length === 0) {
      if (isDashboardPerfLogEnabled()) {
        dashboardPerfLog(
          `overview.totalMs=${Math.round(dashboardPerfNow() - totalStart)} path=empty`,
        );
      }

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

    const pricingStart = isDashboardPerfLogEnabled() ? dashboardPerfNow() : 0;
    const context = await loadCollectionPricingContext(supabase, user.id, productIds, {
      includeChartData: false,
      userListingRows: activeListings,
    });

    if (isDashboardPerfLogEnabled()) {
      dashboardPerfLog(
        `overview.pricingContextMs=${Math.round(dashboardPerfNow() - pricingStart)} products=${productIds.length}`,
      );
    }

    const tradingStats = computeMemberTradingStats({
      completedTradesCount,
      collectionRows,
      activeListings,
      context,
    });

    if (isDashboardPerfLogEnabled()) {
      dashboardPerfLog(
        `overview.totalMs=${Math.round(dashboardPerfNow() - totalStart)} path=full`,
      );
    }

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
