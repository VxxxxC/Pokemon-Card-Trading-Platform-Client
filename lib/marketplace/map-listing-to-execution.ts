import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import type { MarketplaceProductDetail } from "@/app/lib/marketplace/types";
import type { SellOrder, UnifiedProductSpec } from "@/app/lib/mock-data/cards";
import { formatElementTypeZh } from "@/lib/catalog/element-types";

export type ExecutionSlideOverPayload = {
  listingId: string;
  order: SellOrder;
  card: UnifiedProductSpec;
  productId: string;
};

function formatSpecValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function mapProductDetailToExecutionCard(
  product: MarketplaceProductDetail,
): UnifiedProductSpec {
  return {
    id: product.productId,
    name: product.productName,
    jpName: product.nameJa,
    set: product.setCode,
    rarity: (product.rarity ?? "SAR") as UnifiedProductSpec["rarity"],
    delta: 0,
    deltaDirection: "up",
    images:
      product.images.length > 0 ? product.images : [product.imageUrl],
    type: formatElementTypeZh(product.elementType, "—"),
    stage: formatSpecValue(product.pokemonStage),
    weakness: "—",
    retreatCost: "—",
    moveDamage: "—",
    artist: "—",
    soldHistory: [],
    chartPoints: [],
    sellOrders: [],
  };
}

export function mapMarketplaceListingToExecutionCard(
  listing: MarketplaceListing,
): UnifiedProductSpec {
  const productId = listing.productId ?? listing.id;

  return {
    id: productId,
    cardNo: listing.cardNo,
    name: listing.name,
    jpName: listing.nameJa?.trim() || listing.name,
    set: listing.set,
    rarity: (listing.rarity ?? "SAR") as UnifiedProductSpec["rarity"],
    delta: listing.delta,
    deltaDirection: listing.deltaDirection,
    images: listing.image ? [listing.image] : [],
    type: "—",
    stage: "—",
    weakness: "—",
    retreatCost: "—",
    moveDamage: "—",
    artist: "—",
    soldHistory: [],
    chartPoints: [],
    sellOrders: [],
  };
}

function mapListingToSellOrder(listing: MarketplaceListing): SellOrder | null {
  if (!listing.sellerId?.trim()) {
    return null;
  }

  return {
    sellerName: listing.seller,
    sellerId: listing.sellerId,
    price: listing.price,
    sellerRating: 0,
    customGrade: listing.grade,
  };
}

export function canOpenExecutionSlideOver(listing: MarketplaceListing): boolean {
  return Boolean(listing.id?.trim() && listing.sellerId?.trim());
}

export function mapMarketplaceListingToExecutionPayload(
  listing: MarketplaceListing,
): ExecutionSlideOverPayload | null {
  if (!canOpenExecutionSlideOver(listing)) {
    return null;
  }

  const order = mapListingToSellOrder(listing);
  if (!order) {
    return null;
  }

  return {
    listingId: listing.id,
    order,
    card: mapMarketplaceListingToExecutionCard(listing),
    productId: listing.productId ?? listing.id,
  };
}

export function buildOrderBookExecutionPayload(
  product: MarketplaceProductDetail,
  listingId: string,
  order: SellOrder,
): ExecutionSlideOverPayload {
  return {
    listingId,
    order,
    card: mapProductDetailToExecutionCard(product),
    productId: product.productId,
  };
}
