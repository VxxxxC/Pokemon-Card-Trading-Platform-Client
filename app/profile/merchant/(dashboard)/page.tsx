import { Suspense } from "react";
import { MerchantOverviewPageData } from "./MerchantOverviewPageData";
import { MerchantOverviewSkeleton } from "./MerchantOverviewSkeleton";

export default function MerchantOverviewPage() {
  return (
    <Suspense fallback={<MerchantOverviewSkeleton />}>
      <MerchantOverviewPageData />
    </Suspense>
  );
}
