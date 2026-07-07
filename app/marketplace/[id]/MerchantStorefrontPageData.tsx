import { notFound } from "next/navigation";
import {
  getMarketplaceSellerProfile,
  searchMarketplaceSellerListings,
} from "@/app/actions/marketplace";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { MARKETPLACE_STOREFRONT_PAGE_SIZE } from "@/lib/marketplace/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantStorefrontPageClient } from "./MerchantStorefrontPageClient";

interface MerchantStorefrontPageDataProps {
  params: Promise<{ id: string }>;
}

export async function MerchantStorefrontPageData({
  params,
}: MerchantStorefrontPageDataProps) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <MerchantStorefrontPageClient
        seller={null}
        bootstrapError="無法連線至商戶櫥窗"
      />
    );
  }

  const profileResult = await getMarketplaceSellerProfile(id);
  if (!profileResult.success) {
    notFound();
  }

  const seller = profileResult.data;

  const [listingsResult, user] = await Promise.all([
    searchMarketplaceSellerListings({
      sellerId: seller.id,
      page: 1,
      pageSize: MARKETPLACE_STOREFRONT_PAGE_SIZE,
      sortKey: "最新",
    }),
    getOptionalAuthUser(),
  ]);

  const initialListings = listingsResult.success
    ? {
        listings: listingsResult.data.listings,
        meta: listingsResult.data.meta,
        priceBounds: listingsResult.data.priceBounds,
      }
    : undefined;

  return (
    <MerchantStorefrontPageClient
      seller={seller}
      initialListings={initialListings}
      currentUserId={user?.id ?? null}
      bootstrapError={listingsResult.success ? undefined : listingsResult.error}
    />
  );
}
