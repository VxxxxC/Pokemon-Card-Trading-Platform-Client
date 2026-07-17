import { Suspense } from "react";
import {
  MerchantTradingPageData,
  resolveMerchantTradingTabStatusFromFilter,
} from "./MerchantTradingPageData";
import { MerchantTradingSkeleton } from "./MerchantTradingSkeleton";

export const dynamic = "force-dynamic";

type MerchantTradingPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function MerchantTradingPage({
  searchParams,
}: MerchantTradingPageProps) {
  const params = await searchParams;
  const initialTabStatus = resolveMerchantTradingTabStatusFromFilter(
    params.filter,
  );

  return (
    <Suspense fallback={<MerchantTradingSkeleton />}>
      <MerchantTradingPageData initialTabStatus={initialTabStatus} />
    </Suspense>
  );
}
