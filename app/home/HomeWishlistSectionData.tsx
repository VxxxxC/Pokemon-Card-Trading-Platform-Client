import { getHomeWishlistPreview } from "@/app/actions/wishlist";
import { WishlistTicker } from "@/app/components/shared/WishlistTicker";

type HomeWishlistSectionDataProps = {
  userId: string;
};

export async function HomeWishlistSectionData({
  userId: _userId,
}: HomeWishlistSectionDataProps) {

  const result = await getHomeWishlistPreview();

  if (!result.success) {
    return null;
  }

  if (result.data.length === 0) {
    return null;
  }

  return <WishlistTicker entries={result.data} />;
}
