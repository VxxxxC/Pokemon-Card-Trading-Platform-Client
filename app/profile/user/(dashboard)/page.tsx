import { Suspense } from "react";
import { UserOverviewPageData } from "./UserOverviewPageData";
import { UserOverviewSkeleton } from "./UserOverviewSkeleton";

export default function UserOverviewPage() {
  return (
    <Suspense fallback={<UserOverviewSkeleton />}>
      <UserOverviewPageData />
    </Suspense>
  );
}
