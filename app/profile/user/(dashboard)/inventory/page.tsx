import { Suspense } from "react";
import { UserInventoryPageData } from "./UserInventoryPageData";
import { UserInventorySkeleton } from "./UserInventorySkeleton";

export default function UserInventoryPage() {
  return (
    <Suspense fallback={<UserInventorySkeleton />}>
      <UserInventoryPageData />
    </Suspense>
  );
}
