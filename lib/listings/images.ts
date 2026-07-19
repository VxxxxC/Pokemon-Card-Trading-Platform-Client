/** Ordered listing image row — matches `listings.images` JSONB contract. */
export type ListingImage = {
  url: string;
  order: number;
  remark?: string;
};

export const LISTING_IMAGE_MIN = 6;
export const LISTING_IMAGE_MAX = 6;
export const SEALED_LISTING_IMAGE_MIN = 1;

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

function normalizeListingImageItem(
  item: unknown,
  fallbackOrder: number,
): ListingImage | null {
  if (typeof item === "string") {
    const url = item.trim();
    if (!url) return null;
    return { url, order: fallbackOrder };
  }

  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url) return null;

    let order = fallbackOrder;
    if (typeof record.order === "number" && Number.isFinite(record.order)) {
      order = record.order;
    } else if (typeof record.order === "string") {
      const parsed = Number(record.order);
      if (Number.isFinite(parsed)) {
        order = parsed;
      }
    }

    const remark =
      typeof record.remark === "string"
        ? record.remark.trim() || undefined
        : undefined;

    return { url, order, remark };
  }

  return null;
}

function coerceListingImages(value: unknown): ListingImage[] {
  if (!Array.isArray(value)) return [];

  const images: ListingImage[] = [];
  value.forEach((item, index) => {
    const normalized = normalizeListingImageItem(item, index + 1);
    if (normalized) {
      images.push(normalized);
    }
  });

  return images.sort((a, b) => a.order - b.order);
}

/** Parse `listings.images` JSONB into ordered URL strings for display. */
export function parseListingImageUrls(value: unknown): string[] {
  return coerceListingImages(value)
    .map((item) => item.url)
    .filter((url) => url.length > 0);
}

/** Parse `listings.images` JSONB into structured image objects including optional remarks. */
export function parseListingImageObjects(value: unknown): ListingImage[] {
  return coerceListingImages(value).filter((item) => item.url.length > 0);
}

/** Listing cover: first listing photo, then optional catalog image. */
export function resolveListingCoverImageUrl(
  images: unknown,
  catalogImageUrl?: string | null,
): string | null {
  const listingUrl = parseListingImageUrls(images)[0]?.trim();
  if (listingUrl) {
    return listingUrl;
  }

  const catalogUrl = catalogImageUrl?.trim();
  if (catalogUrl) {
    return catalogUrl;
  }

  return null;
}
