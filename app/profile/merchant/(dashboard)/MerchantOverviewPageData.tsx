import { redirect } from "next/navigation";
import { getMerchantDashboardOverview } from "@/app/actions/merchant-dashboard";
import { searchMerchantTradingOrders } from "@/app/actions/orders";
import { getDualPersonaContext } from "@/app/actions/profile";
import { getPublicProfileReviews } from "@/app/actions/reviews";
import type { MerchantDashboardOverview } from "@/app/lib/dashboard/merchant-types";
import type { MerchantTradingOrder } from "@/app/actions/orders";
import type { PublicProfileReviewItem } from "@/app/lib/reviews/types";
import { EMPTY_DUAL_PERSONA_CONTEXT } from "@/lib/auth/dual-persona";
import { getOptionalAuthUser } from "@/lib/auth/session";
import {
  MERCHANT_DASHBOARD_PENDING_PREVIEW_LIMIT,
  MERCHANT_DASHBOARD_REVIEWS_PREVIEW_LIMIT,
} from "@/lib/dashboard/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantOverviewClient } from "./MerchantOverviewClient";

export type MerchantDashboardInitialData = {
  overview?: MerchantDashboardOverview;
  pendingOrders?: MerchantTradingOrder[];
  pendingOrderCount?: number;
  reviews?: PublicProfileReviewItem[];
  publicReviewCount?: number;
  aggregateRating?: number;
};

export async function MerchantOverviewPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const [overviewResult, ordersResult, reviewsResult, dualPersonaResult] =
    await Promise.all([
      getMerchantDashboardOverview(),
      searchMerchantTradingOrders({
        tabStatus: "pending",
        page: 1,
        pageSize: MERCHANT_DASHBOARD_PENDING_PREVIEW_LIMIT,
      }),
      getPublicProfileReviews({
        profileId: user.id,
        persona: "merchant",
        sort: "date-desc",
        page: 1,
        pageSize: MERCHANT_DASHBOARD_REVIEWS_PREVIEW_LIMIT,
      }),
      getDualPersonaContext(),
    ]);

  if (!overviewResult.success && overviewResult.error === "無商戶權限") {
    redirect("/profile/user");
  }

  const initialData: MerchantDashboardInitialData = {
    overview: overviewResult.success ? overviewResult.data : undefined,
    pendingOrders: ordersResult.success ? ordersResult.data : [],
    pendingOrderCount: ordersResult.success
      ? ordersResult.filters.status.pending
      : 0,
    reviews: reviewsResult.success ? reviewsResult.data.reviews : [],
    publicReviewCount: reviewsResult.success
      ? reviewsResult.data.publicReviewCount
      : 0,
    aggregateRating: reviewsResult.success ? reviewsResult.data.aggregateRating : 0,
  };

  return (
    <MerchantOverviewClient
      currentUserId={user.id}
      initialData={initialData}
      dualPersona={
        dualPersonaResult.success
          ? dualPersonaResult.data
          : EMPTY_DUAL_PERSONA_CONTEXT
      }
      bootstrapError={overviewResult.success ? undefined : overviewResult.error}
    />
  );
}
