import { redirect } from "next/navigation";
import { getMemberDashboardOverview } from "@/app/actions/member-dashboard";
import { getDualPersonaContext } from "@/app/actions/profile";
import { searchUserTradingOrders } from "@/app/actions/orders";
import { getPublicProfileReviews } from "@/app/actions/reviews";
import type { MemberDashboardInitialData } from "@/app/lib/hooks/useMemberDashboard";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { MEMBER_DASHBOARD_PREVIEW_LIMIT } from "@/lib/dashboard/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { EMPTY_DUAL_PERSONA_CONTEXT } from "@/lib/auth/dual-persona";
import { UserOverviewClient } from "./UserOverviewClient";

export async function UserOverviewPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const [overviewResult, ordersResult, reviewsResult, dualPersonaResult] =
    await Promise.all([
    getMemberDashboardOverview(),
    searchUserTradingOrders({
      persona: "all",
      tabStatus: "pending",
      page: 1,
      pageSize: MEMBER_DASHBOARD_PREVIEW_LIMIT,
    }),
    getPublicProfileReviews({
      profileId: user.id,
      persona: "member",
      sort: "date-desc",
      page: 1,
      pageSize: MEMBER_DASHBOARD_PREVIEW_LIMIT,
    }),
    getDualPersonaContext(),
  ]);

  const initialData: MemberDashboardInitialData = {
    overview: overviewResult.success ? overviewResult.data : undefined,
    pendingOrders: ordersResult.success ? ordersResult.data : [],
    reviews: reviewsResult.success ? reviewsResult.data.reviews : [],
    publicReviewCount: reviewsResult.success
      ? reviewsResult.data.publicReviewCount
      : 0,
    aggregateRating: reviewsResult.success ? reviewsResult.data.aggregateRating : 0,
  };

  return (
    <UserOverviewClient
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
