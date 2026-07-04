import { notFound } from "next/navigation";
import { getMarketplaceProductDetail } from "@/app/actions/marketplace";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [result, user] = await Promise.all([
    getMarketplaceProductDetail(id),
    getOptionalAuthUser(),
  ]);

  if (!result.success) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={result.data}
      currentUserId={user?.id ?? null}
    />
  );
}
