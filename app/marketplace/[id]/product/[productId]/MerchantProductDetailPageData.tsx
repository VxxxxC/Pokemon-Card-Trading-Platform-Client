import { notFound } from "next/navigation";
import { getMarketplaceSellerListingDetail } from "@/app/actions/marketplace";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantProductDetailPageClient } from "./MerchantProductDetailPageClient";

interface MerchantProductDetailPageDataProps {
  params: Promise<{ id: string; productId: string }>;
}

export async function MerchantProductDetailPageData({
  params,
}: MerchantProductDetailPageDataProps) {
  const { id, productId } = await params;
  const user = await getOptionalAuthUser();

  if (!isSupabaseConfigured()) {
    return (
      <MerchantProductDetailPageClient
        detail={null}
        routeProductId={productId}
        currentUserId={user?.id ?? null}
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
      currentUserId={user?.id ?? null}
    />
  );
}
