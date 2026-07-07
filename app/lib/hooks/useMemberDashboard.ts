"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMemberDashboardOverview } from "@/app/actions/member-dashboard";
import { searchUserTradingOrders, type UserTradingOrder } from "@/app/actions/orders";
import { getPublicProfileReviews } from "@/app/actions/reviews";
import type { MemberDashboardOverview } from "@/app/lib/dashboard/types";
import type { MemberDashboardTradingStats } from "@/app/lib/dashboard/types";
import {
  isDashboardClientPerfLogEnabled,
  logDashboardClientReady,
  markDashboardClientMount,
} from "@/app/lib/dashboard/perf-log-client";
import type { PublicProfileReviewItem } from "@/app/lib/reviews/types";
import { MEMBER_DASHBOARD_PREVIEW_LIMIT } from "@/lib/dashboard/constants";

export type MemberDashboardInitialData = {
  overview?: MemberDashboardOverview;
  pendingOrders?: UserTradingOrder[];
  reviews?: PublicProfileReviewItem[];
  publicReviewCount?: number;
  aggregateRating?: number;
};

type UseMemberDashboardOptions = {
  profileId: string | null;
  initialData?: MemberDashboardInitialData;
};

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
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
};

function hasMemberDashboardInitialOverview(
  data: MemberDashboardInitialData | undefined,
): data is MemberDashboardInitialData & { overview: MemberDashboardOverview } {
  return Boolean(data?.overview);
}

export function useMemberDashboard({
  profileId,
  initialData,
}: UseMemberDashboardOptions): UseMemberDashboardResult {
  const hasInitialOverview = hasMemberDashboardInitialOverview(initialData);
  const hasInitialOrders = initialData?.pendingOrders !== undefined;
  const hasInitialReviews =
    profileId != null && initialData?.reviews !== undefined;

  const [profile, setProfile] = useState<MemberDashboardOverview["profile"] | null>(
    initialData?.overview?.profile ?? null,
  );
  const [tradingStats, setTradingStats] = useState<MemberDashboardTradingStats | null>(
    initialData?.overview?.tradingStats ?? null,
  );
  const [pointsBalance, setPointsBalance] = useState<number | null>(
    initialData?.overview?.pointsBalance ?? null,
  );
  const [pendingOrders, setPendingOrders] = useState<UserTradingOrder[]>(
    initialData?.pendingOrders ?? [],
  );
  const [reviews, setReviews] = useState<PublicProfileReviewItem[]>(
    initialData?.reviews ?? [],
  );
  const [publicReviewCount, setPublicReviewCount] = useState(
    initialData?.publicReviewCount ?? 0,
  );
  const [aggregateRating, setAggregateRating] = useState(
    initialData?.aggregateRating ?? 0,
  );
  const [isOverviewLoading, setIsOverviewLoading] = useState(!hasInitialOverview);
  const [isOrdersLoading, setIsOrdersLoading] = useState(!hasInitialOrders);
  const [isReviewsLoading, setIsReviewsLoading] = useState(!hasInitialReviews);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const mountLoggedRef = useRef(false);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (mountLoggedRef.current) return;
    mountLoggedRef.current = true;
    markDashboardClientMount(hasInitialOverview);
  }, [hasInitialOverview]);

  useEffect(() => {
    if (reloadToken === 0 && hasInitialOverview) {
      return;
    }

    let cancelled = false;
    const isBackground = reloadToken === 0 && hasInitialOverview;

    async function loadOverview() {
      if (!isBackground) {
        setIsOverviewLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const result = await getMemberDashboardOverview();
      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
        if (!isBackground) {
          setProfile(null);
          setTradingStats(null);
          setPointsBalance(null);
        }
      } else {
        setProfile(result.data.profile);
        setTradingStats(result.data.tradingStats);
        setPointsBalance(result.data.pointsBalance);
        setError(null);
      }

      setIsOverviewLoading(false);
      setIsRefreshing(false);

      if (isDashboardClientPerfLogEnabled() && !isBackground) {
        logDashboardClientReady("overview");
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, hasInitialOverview]);

  useEffect(() => {
    if (reloadToken === 0 && hasInitialOrders) {
      return;
    }

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
  }, [reloadToken, hasInitialOrders]);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    if (reloadToken === 0 && hasInitialReviews) {
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
  }, [profileId, reloadToken, hasInitialReviews]);

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
    isRefreshing,
    error,
    refetch,
  };
}
