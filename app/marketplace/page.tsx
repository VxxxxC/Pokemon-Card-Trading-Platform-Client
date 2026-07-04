import { Suspense } from "react";
import { getMarketplaceBootstrap } from "@/app/actions/marketplace";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MarketplacePageClient } from "./MarketplacePageClient";

const DEFAULT_BOOTSTRAP_PAGE_SIZE = 9;

export default async function MarketplacePage() {
  const [user, bootstrap] = isSupabaseConfigured()
    ? await Promise.all([
        getOptionalAuthUser(),
        getMarketplaceBootstrap({
          page: 1,
          pageSize: DEFAULT_BOOTSTRAP_PAGE_SIZE,
          sortKey: "最新",
        }),
      ])
    : [null, { success: false as const, error: "無法連線至大盤市場" }];

  const initialData = bootstrap.success ? bootstrap.data : undefined;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[#17130f] min-h-screen">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <MarketplacePageClient
        currentUserId={user?.id ?? null}
        initialData={initialData}
      />
    </Suspense>
  );
}
