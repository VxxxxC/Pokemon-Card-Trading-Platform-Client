import { Suspense } from "react";
import { MerchantAnalyticsPageData } from "./MerchantAnalyticsPageData";
import { MerchantAnalyticsSkeleton } from "./MerchantAnalyticsSkeleton";

export const dynamic = "force-dynamic";

type MerchantAnalyticsPageProps = {
  searchParams: Promise<{ productId?: string; sku?: string }>;
};

export default function MerchantAnalyticsPage({
  searchParams,
}: MerchantAnalyticsPageProps) {
  return (
    <Suspense fallback={<MerchantAnalyticsSkeleton />}>
      <MerchantAnalyticsPageData searchParams={searchParams} />
    </Suspense>
  );
}
