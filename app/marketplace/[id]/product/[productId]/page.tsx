import { Suspense } from "react";
import { MerchantProductDetailPageData } from "./MerchantProductDetailPageData";
import { MerchantProductDetailPageSkeleton } from "./MerchantProductDetailPageSkeleton";

interface PageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default function MerchantProductDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<MerchantProductDetailPageSkeleton />}>
      <MerchantProductDetailPageData params={params} />
    </Suspense>
  );
}
