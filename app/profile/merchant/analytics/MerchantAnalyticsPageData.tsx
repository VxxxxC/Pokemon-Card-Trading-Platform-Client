import { notFound, redirect } from "next/navigation";
import { getMerchantProductAnalytics } from "@/app/actions/merchant-product-analytics";
import { MERCHANT_PERF_DEFAULT_RANGE } from "@/lib/dashboard/merchant-performance-ranges";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantAnalyticsClient } from "./MerchantAnalyticsClient";

type MerchantAnalyticsPageDataProps = {
  searchParams: Promise<{ productId?: string; sku?: string }>;
};

export async function MerchantAnalyticsPageData({
  searchParams,
}: MerchantAnalyticsPageDataProps) {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth?redirect=/profile/merchant/analytics");
  }

  const params = await searchParams;
  const productId = params.productId?.trim();
  const sku = params.sku?.trim();

  if (!productId && !sku) {
    notFound();
  }

  const analyticsResult = await getMerchantProductAnalytics({
    productId,
    sku,
    timeRange: MERCHANT_PERF_DEFAULT_RANGE,
    historyPage: 1,
  });

  if (!analyticsResult.success) {
    if (analyticsResult.error === "無商戶權限") {
      redirect("/profile/user");
    }

    if (analyticsResult.notFound) {
      notFound();
    }
  }

  const resolvedProductId = analyticsResult.success
    ? analyticsResult.data.product.id
    : productId ?? sku ?? "";

  return (
    <MerchantAnalyticsClient
      productId={resolvedProductId}
      initialData={analyticsResult.success ? analyticsResult.data : null}
      bootstrapError={
        analyticsResult.success ? undefined : analyticsResult.error
      }
    />
  );
}
