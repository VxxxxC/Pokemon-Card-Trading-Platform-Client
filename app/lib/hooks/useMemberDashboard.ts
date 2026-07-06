"use client";

import { useCallback, useEffect, useState } from "react";
import { getMemberDashboardOverview } from "@/app/actions/member-dashboard";
import { searchUserTradingOrders, type UserTradingOrder } from "@/app/actions/orders";
import { getPublicProfileReviews } from "@/app/actions/reviews";
import type {
  MemberDashboardOverview,
  MemberDashboardTradingStats,
} from "@/app/lib/dashboard/types";
import type { PublicProfileReviewItem } from "@/app/lib/reviews/types";
import { MEMBER_DASHBOARD_PREVIEW_LIMIT } from "@/lib/dashboard/constants";

type UseMemberDashboardResult = {
  profile: MemberDashboardOverview["profile"] | null;
  tradingStats: MemberDashboardTradingStats | null;
  pointsBalance: number | null;
  pendingOrders: UserTradingOrder[];
  reviews: PublicProfileReviewItem[];
  publicReviewCount: number;
  aggregateRating: number;
  isOverviewLoading: boolean;
  isOrdersLoading: boolean;
  isReviewsLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMemberDashboard(profileId: string | null): UseMemberDashboardResult {
  const [profile, setProfile] = useState<MemberDashboardOverview["profile"] | null>(null);
  const [tradingStats, setTradingStats] = useState<MemberDashboardTradingStats | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pendingOrders, setPendingOrders] = useState<UserTradingOrder[]>([]);
  const [reviews, setReviews] = useState<PublicProfileReviewItem[]>([]);
  const [publicReviewCount, setPublicReviewCount] = useState(0);
  const [aggregateRating, setAggregateRating] = useState(0);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setIsOverviewLoading(true);
      const result = await getMemberDashboardOverview();
      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
        setProfile(null);
        setTradingStats(null);
        setPointsBalance(null);
      } else {
        setProfile(result.data.profile);
        setTradingStats(result.data.tradingStats);
        setPointsBalance(result.data.pointsBalance);
      }

      setIsOverviewLoading(false);
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setIsOrdersLoading(true);
      const result = await searchUserTradingOrders({
        persona: "all",
        tabStatus: "pending",
        page: 1,
        pageSize: MEMBER_DASHBOARD_PREVIEW_LIMIT,
      });
      if (cancelled) return;

      if (!result.success) {
        setPendingOrders([]);
      } else {
        setPendingOrders(result.data);
      }

      setIsOrdersLoading(false);
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const reviewProfileId = profileId;
    let cancelled = false;

    async function loadReviews() {
      setIsReviewsLoading(true);
      const result = await getPublicProfileReviews({
        profileId: reviewProfileId,
        persona: "member",
        sort: "date-desc",
        page: 1,
        pageSize: MEMBER_DASHBOARD_PREVIEW_LIMIT,
      });
      if (cancelled) return;

      if (!result.success) {
        setReviews([]);
        setPublicReviewCount(0);
        setAggregateRating(0);
      } else {
        setReviews(result.data.reviews);
        setPublicReviewCount(result.data.publicReviewCount);
        setAggregateRating(result.data.aggregateRating);
      }

      setIsReviewsLoading(false);
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [profileId, reloadToken]);

  const hasProfileId = profileId != null;

  return {
    profile,
    tradingStats,
    pointsBalance,
    pendingOrders,
    reviews: hasProfileId ? reviews : [],
    publicReviewCount: hasProfileId ? publicReviewCount : 0,
    aggregateRating: hasProfileId ? aggregateRating : 0,
    isOverviewLoading,
    isOrdersLoading,
    isReviewsLoading: hasProfileId ? isReviewsLoading : false,
    error,
    refetch,
  };
}
