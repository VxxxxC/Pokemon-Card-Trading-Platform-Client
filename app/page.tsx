import { Suspense } from "react";
import { HomePageShell } from "@/app/HomePageShell";
import { getWishlistFavoredKeysForUser } from "@/app/actions/wishlist";
import { HomeC2cSectionData } from "@/app/home/HomeC2cSectionData";
import { HomeMerchantSectionData } from "@/app/home/HomeMerchantSectionData";
import { HomeWishlistSectionData } from "@/app/home/HomeWishlistSectionData";
import {
  C2cSectionSkeleton,
  MerchantSectionSkeleton,
  WishlistSectionSkeleton,
} from "@/app/home/HomeSectionSkeletons";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function HomePage() {
  const user = isSupabaseConfigured() ? await getOptionalAuthUser() : null;
  const currentUserId = user?.id ?? null;
  const favoredKeys =
    user != null ? await getWishlistFavoredKeysForUser(user.id) : [];

  return (
    <HomePageShell currentUserId={currentUserId}>
      {user ? (
        <Suspense fallback={<WishlistSectionSkeleton />}>
          <HomeWishlistSectionData userId={user.id} />
        </Suspense>
      ) : null}

      <Suspense fallback={<MerchantSectionSkeleton />}>
        <HomeMerchantSectionData
          currentUserId={currentUserId}
          favoredKeys={favoredKeys}
        />
      </Suspense>

      <Suspense fallback={<C2cSectionSkeleton />}>
        <HomeC2cSectionData
          currentUserId={currentUserId}
          favoredKeys={favoredKeys}
        />
      </Suspense>
    </HomePageShell>
  );
}
