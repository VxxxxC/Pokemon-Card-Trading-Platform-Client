import type { WishlistEntry } from "@/app/lib/wishlist/types";
import {
  resolveMarketCacheValue,
  toFiniteNumber,
  type MarketPriceRow,
} from "@/lib/marketplace/portfolio-pricing";

export type WishlistPriceSource = "snkrdunk" | "platform" | "tracked_price";

export type ResolvedWishlistDisplay = {
  value: number | null;
  source: WishlistPriceSource | null;
};

export function resolveWishlistDisplayValue(
  entry: WishlistEntry,
): ResolvedWishlistDisplay {
  const cache = resolveMarketCacheValue({
    market_avg_price: entry.currentMarketPrice,
    market_data_source: entry.marketDataSource ?? "",
  } as MarketPriceRow);

  if (cache.value != null && cache.source === "snkrdunk") {
    return { value: cache.value, source: "snkrdunk" };
  }

  if (cache.value != null && cache.source === "platform") {
    return { value: cache.value, source: "platform" };
  }

  const tracked = toFiniteNumber(entry.trackedPrice);
  if (tracked != null && tracked > 0) {
    return { value: tracked, source: "tracked_price" };
  }

  return { value: null, source: null };
}

export function resolveWishlistAlertTag(
  entry: WishlistEntry,
  resolved: ResolvedWishlistDisplay,
): string | null {
  const targetPrice = toFiniteNumber(entry.targetPrice);
  if (
    targetPrice != null &&
    resolved.value != null &&
    resolved.value <= targetPrice
  ) {
    return "降價通知";
  }

  return null;
}
