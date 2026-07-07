import { Suspense } from "react";
import { ProductDetailPageData } from "./ProductDetailPageData";
import { ProductDetailSkeleton } from "./ProductDetailSkeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailPageData params={params} />
    </Suspense>
  );
}
