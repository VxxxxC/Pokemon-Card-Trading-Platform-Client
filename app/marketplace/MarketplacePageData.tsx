import { getMarketplaceBootstrap } from "@/app/actions/marketplace";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { MARKETPLACE_GRID_PAGE_SIZE } from "@/lib/marketplace/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MarketplacePageClient } from "./MarketplacePageClient";

export async function MarketplacePageData() {
  if (!isSupabaseConfigured()) {
    return (
      <MarketplacePageClient
        currentUserId={null}
        bootstrapError="無法連線至大盤市場"
      />
    );
  }

  const [user, bootstrapResult] = await Promise.all([
    getOptionalAuthUser(),
    getMarketplaceBootstrap({
      page: 1,
      pageSize: MARKETPLACE_GRID_PAGE_SIZE,
      sortKey: "最新",
    }),
  ]);

  const initialData = bootstrapResult.success
    ? {
        products: bootstrapResult.data.products,
        meta: bootstrapResult.data.meta,
        priceBounds: bootstrapResult.data.priceBounds,
        rarities: bootstrapResult.data.rarities,
      }
    : undefined;

  return (
    <MarketplacePageClient
      currentUserId={user?.id ?? null}
      initialData={initialData}
      bootstrapError={bootstrapResult.success ? undefined : bootstrapResult.error}
    />
  );
}
