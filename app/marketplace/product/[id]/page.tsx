import { notFound } from "next/navigation";
import { getMarketplaceProductDetail } from "@/app/actions/marketplace";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getMarketplaceProductDetail(id);

  if (!result.success) {
    notFound();
  }

  return <ProductDetailClient product={result.data} />;
}
