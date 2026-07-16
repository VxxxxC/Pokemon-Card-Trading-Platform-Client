import { Suspense } from "react";
import { MerchantInventoryPageData } from "./MerchantInventoryPageData";
import { MerchantInventorySkeleton } from "./MerchantInventorySkeleton";

export default function MerchantInventoryPage() {
  return (
    <Suspense fallback={<MerchantInventorySkeleton />}>
      <MerchantInventoryPageData />
    </Suspense>
  );
}
