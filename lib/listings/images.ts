/** Ordered listing image row — matches `listings.images` JSONB contract. */
export type ListingImage = {
  url: string;
  order: number;
  remark?: string;
};

export const LISTING_IMAGE_MIN = 6;
export const LISTING_IMAGE_MAX = 6;

export const LISTING_PHOTO_SLOT_LABELS = [
  "正面",
  "背面",
  "角1",
  "角2",
  "角3",
  "角4",
] as const;

export const LISTING_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const LISTING_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function toListingImages(urls: string[]): ListingImage[] {
  return urls.map((url, index) => ({
    url,
    order: index + 1,
  }));
}

export function isListingImageArray(value: unknown): value is ListingImage[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as ListingImage).url === "string" &&
      typeof (item as ListingImage).order === "number",
  );
}

/** Parse `listings.images` JSONB into ordered URL strings for display. */
export function parseListingImageUrls(value: unknown): string[] {
  if (!isListingImageArray(value)) return [];
  return [...value]
    .sort((a, b) => a.order - b.order)
    .map((item) => item.url.trim())
    .filter((url) => url.length > 0);
}

/** Parse `listings.images` JSONB into structured image objects including optional remarks. */
export function parseListingImageObjects(value: unknown): ListingImage[] {
  if (!isListingImageArray(value)) return [];
  return [...value]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      url: item.url.trim(),
      order: item.order,
      remark: item.remark?.trim() || undefined,
    }))
    .filter((item) => item.url.length > 0);
}
