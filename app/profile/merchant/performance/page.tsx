import { Suspense } from "react";
import { MerchantPerformancePageData } from "./MerchantPerformancePageData";
import { MerchantPerformanceSkeleton } from "./MerchantPerformanceSkeleton";

export default function MerchantPerformancePage() {
  return (
    <Suspense fallback={<MerchantPerformanceSkeleton />}>
      <MerchantPerformancePageData />
    </Suspense>
  );
}
