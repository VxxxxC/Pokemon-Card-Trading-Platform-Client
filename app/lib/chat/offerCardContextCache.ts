import type { OfferCardContext } from "@/app/actions/offers";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  data: OfferCardContext;
  fetchedAt: number;
};

const offerCardContextCache = new Map<string, CacheEntry>();

export function readCachedOfferCardContext(
  offerId: string,
): OfferCardContext | null {
  const entry = offerCardContextCache.get(offerId.trim());
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    offerCardContextCache.delete(offerId.trim());
    return null;
  }

  return entry.data;
}

export function writeCachedOfferCardContext(
  offerId: string,
  data: OfferCardContext,
): void {
  offerCardContextCache.set(offerId.trim(), {
    data,
    fetchedAt: Date.now(),
  });
}

export function invalidateOfferCardContextCache(offerId: string): void {
  offerCardContextCache.delete(offerId.trim());
}
