import { notFound } from "next/navigation";
import { getMarketplaceProductDetail,
  getMarketplaceProductListings,
  getMarketplaceProductMarketPrices,
} from "@/app/actions/marketplace";
import { getWishlistFavoredKeysForUser } from "@/app/actions/wishlist";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { ProductDetailClient } from "./ProductDetailClient";

import { DEFAULT_PRODUCT_DETAIL_LISTINGS_PAGE_SIZE } from "@/lib/marketplace/product-detail-default";

interface ProductDetailPageDataProps {
  params: Promise<{ id: string }>;
}

export async function ProductDetailPageData({
  params,
}: ProductDetailPageDataProps) {
  const { id } = await params;

  const catalogResult = await getMarketplaceProductDetail(id);
  if (!catalogResult.success) {
    notFound();
  }

  const productId = catalogResult.data.productId;
  const user = await getOptionalAuthUser();

  const [listingsResult, marketPricesResult, initialFavoredKeys] =
    await Promise.all([
      getMarketplaceProductListings({
        productId,
        sort: "price_asc",
        onlyGraded: false,
        page: 1,
        pageSize: DEFAULT_PRODUCT_DETAIL_LISTINGS_PAGE_SIZE,
      }),
      getMarketplaceProductMarketPrices(productId),
      user?.id
        ? getWishlistFavoredKeysForUser(user.id)
        : Promise.resolve([] as string[]),
    ]);

  const initialListings = listingsResult.success
    ? {
        listings: listingsResult.data,
        meta: listingsResult.meta,
        lowestPrice: listingsResult.lowestPrice,
      }
    : undefined;

  const initialMarketGrades = marketPricesResult.success
    ? marketPricesResult.data
    : undefined;

  return (
    <ProductDetailClient
      product={catalogResult.data}
      currentUserId={user?.id ?? null}
      initialListings={initialListings}
      initialMarketGrades={initialMarketGrades}
      initialFavoredKeys={initialFavoredKeys}
    />
  );
}
