import { parseListingImageUrls } from "@/lib/listings/images";

/** Prefer the listing's first uploaded photo; fall back to catalog art. */
export function resolveOfferCardDisplayImage(
  listingImages: unknown,
  catalogImageUrl?: string | null,
): string {
  const listingUrls = parseListingImageUrls(listingImages);
  const catalogUrl = catalogImageUrl?.trim() ?? "";
  return listingUrls[0] ?? catalogUrl;
}

export function isValidOfferCardImageUrl(
  url?: string | null,
): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export function isCatalogImageUrl(url: string): boolean {
  try {
    return new URL(url).hostname === "www.pokemon-card.com";
  } catch {
    return false;
  }
}
