import { Suspense } from "react";
import { UserCollectionPageData } from "./UserCollectionPageData";
import { UserCollectionSkeleton } from "./UserCollectionSkeleton";

export default function UserCollectionPage() {
  return (
    <Suspense fallback={<UserCollectionSkeleton />}>
      <UserCollectionPageData />
    </Suspense>
  );
}
