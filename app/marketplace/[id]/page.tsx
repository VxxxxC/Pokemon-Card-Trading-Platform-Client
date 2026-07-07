import { Suspense } from "react";
import { MerchantStorefrontPageData } from "./MerchantStorefrontPageData";
import { MerchantStorefrontPageSkeleton } from "./MerchantStorefrontPageSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MerchantStorefrontPage({ params }: PageProps) {
  return (
    <Suspense fallback={<MerchantStorefrontPageSkeleton />}>
      <MerchantStorefrontPageData params={params} />
    </Suspense>
  );
}
