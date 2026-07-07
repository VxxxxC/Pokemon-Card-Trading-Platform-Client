import { redirect } from "next/navigation";
import { Suspense } from "react";
import { searchUserTradingOrders } from "@/app/actions/orders";
import type { TradingInitialData } from "@/app/lib/hooks/useUserTrading";
import { getOptionalAuthUser } from "@/lib/auth/session";
import {
  TAB_STATUS_FROM_PARAM,
  TRADING_DEFAULT_PAGE_SIZE,
  type TabStatusFilter,
} from "@/lib/member-order/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { UserTradingClient } from "./UserTradingClient";
import { UserTradingSkeleton } from "./UserTradingSkeleton";

type UserTradingPageDataProps = {
  initialTabStatus?: TabStatusFilter;
};

export async function UserTradingPageData({
  initialTabStatus = "all",
}: UserTradingPageDataProps) {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const bootstrapResult = await searchUserTradingOrders({
    persona: "all",
    tabStatus: initialTabStatus,
    page: 1,
    pageSize: TRADING_DEFAULT_PAGE_SIZE,
  });

  const initialData: TradingInitialData = bootstrapResult.success
    ? {
        orders: bootstrapResult.data,
        meta: bootstrapResult.meta,
        filters: bootstrapResult.filters,
      }
    : {};

  return (
    <Suspense fallback={<UserTradingSkeleton />}>
      <UserTradingClient
        initialData={initialData}
        initialTabStatus={initialTabStatus}
        bootstrapError={
          bootstrapResult.success ? undefined : bootstrapResult.error
        }
      />
    </Suspense>
  );
}

export function resolveTradingTabStatusFromFilter(
  filter: string | undefined,
): TabStatusFilter {
  if (!filter) {
    return "all";
  }
  return TAB_STATUS_FROM_PARAM[filter] ?? "all";
}
