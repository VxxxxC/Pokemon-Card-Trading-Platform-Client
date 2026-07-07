import { notFound } from "next/navigation";
import { getMarketplaceSellerListingDetail } from "@/app/actions/marketplace";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantProductDetailPageClient } from "./MerchantProductDetailPageClient";

interface MerchantProductDetailPageDataProps {
  params: Promise<{ id: string; productId: string }>;
}

export async function MerchantProductDetailPageData({
  params,
}: MerchantProductDetailPageDataProps) {
  const { id, productId } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <MerchantProductDetailPageClient
        detail={null}
        routeProductId={productId}
        bootstrapError="無法連線至商戶櫥窗"
      />
    );
  }

  const detailResult = await getMarketplaceSellerListingDetail(id, productId);
  if (!detailResult.success) {
    notFound();
  }

  return (
    <MerchantProductDetailPageClient
      detail={detailResult.data}
      routeProductId={productId}
    />
  );
}
