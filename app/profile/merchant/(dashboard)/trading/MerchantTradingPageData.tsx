import { redirect } from "next/navigation";
import { Suspense } from "react";
import { searchMerchantTradingOrders } from "@/app/actions/orders";
import type { MerchantTradingInitialData } from "@/app/lib/hooks/useMerchantTrading";
import { getOptionalAuthUser } from "@/lib/auth/session";
import {
  TAB_STATUS_FROM_PARAM,
  TRADING_DEFAULT_PAGE_SIZE,
  type TabStatusFilter,
} from "@/lib/merchant-order/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantTradingClient } from "./MerchantTradingClient";
import { MerchantTradingSkeleton } from "./MerchantTradingSkeleton";

type MerchantTradingPageDataProps = {
  initialTabStatus?: TabStatusFilter;
};

export async function MerchantTradingPageData({
  initialTabStatus = "all",
}: MerchantTradingPageDataProps) {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const bootstrapResult = await searchMerchantTradingOrders({
    tabStatus: initialTabStatus,
    page: 1,
    pageSize: TRADING_DEFAULT_PAGE_SIZE,
    includePaymentPending: true,
    includeAuthInProgress: true,
  });

  const initialData: MerchantTradingInitialData = bootstrapResult.success
    ? {
        orders: bootstrapResult.data,
        meta: bootstrapResult.meta,
        filters: bootstrapResult.filters,
      }
    : {};

  return (
    <Suspense fallback={<MerchantTradingSkeleton />}>
      <MerchantTradingClient
        initialData={initialData}
        initialTabStatus={initialTabStatus}
        bootstrapError={
          bootstrapResult.success ? undefined : bootstrapResult.error
        }
      />
    </Suspense>
  );
}

export function resolveMerchantTradingTabStatusFromFilter(
  filter: string | undefined,
): TabStatusFilter {
  if (!filter) {
    return "all";
  }
  return TAB_STATUS_FROM_PARAM[filter] ?? "all";
}
