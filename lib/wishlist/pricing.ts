import type { WishlistEntry } from "@/app/lib/wishlist/types";
import { toFiniteNumber } from "@/lib/marketplace/portfolio-pricing";

export type WishlistPriceSource = "snkrdunk" | "platform" | "tracked_price";

export type ResolvedWishlistDisplay = {
  value: number | null;
  source: WishlistPriceSource | null;
};

export function resolveWishlistDisplayValue(
  entry: WishlistEntry,
): ResolvedWishlistDisplay {
  const snkrdunk = toFiniteNumber(entry.currentMarketPrice);
  if (snkrdunk != null && snkrdunk > 0) {
    return { value: snkrdunk, source: "snkrdunk" };
  }

  const platform = toFiniteNumber(entry.lowestListingPrice);
  if (platform != null && platform > 0) {
    return { value: platform, source: "platform" };
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
