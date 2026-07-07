import { Suspense } from "react";
import {
  UserTradingPageData,
  resolveTradingTabStatusFromFilter,
} from "./UserTradingPageData";
import { UserTradingSkeleton } from "./UserTradingSkeleton";

type UserTradingPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function UserTradingPage({
  searchParams,
}: UserTradingPageProps) {
  const params = await searchParams;
  const initialTabStatus = resolveTradingTabStatusFromFilter(params.filter);

  return (
    <Suspense fallback={<UserTradingSkeleton />}>
      <UserTradingPageData initialTabStatus={initialTabStatus} />
    </Suspense>
  );
}
