import { searchMarketplaceProducts } from "@/app/actions/marketplace";
import { getWishlistFavoredKeysForUser } from "@/app/actions/wishlist";
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

  const user = await getOptionalAuthUser();

  const [searchResult, initialFavoredKeys] = await Promise.all([
    searchMarketplaceProducts({
      page: 1,
      pageSize: MARKETPLACE_GRID_PAGE_SIZE,
      sortKey: "最新",
    }),
    user ? getWishlistFavoredKeysForUser(user.id) : Promise.resolve([]),
  ]);

  const initialData = searchResult.success
    ? {
        products: searchResult.data,
        meta: searchResult.meta,
      }
    : undefined;

  return (
    <MarketplacePageClient
      currentUserId={user?.id ?? null}
      initialData={initialData}
      initialFavoredKeys={initialFavoredKeys}
      bootstrapError={searchResult.success ? undefined : searchResult.error}
    />
  );
}
