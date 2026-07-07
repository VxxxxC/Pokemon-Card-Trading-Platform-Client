import { Suspense } from "react";
import { MarketplacePageData } from "./MarketplacePageData";
import { MarketplacePageSkeleton } from "./MarketplacePageSkeleton";

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplacePageSkeleton />}>
      <MarketplacePageData />
    </Suspense>
  );
}
