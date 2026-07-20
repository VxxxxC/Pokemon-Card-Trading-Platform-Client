import { incrementListingView } from "@/app/actions/listings";

export function trackListingView(input: {
  listingId?: string | null;
  sellerId?: string | null;
  currentUserId?: string | null;
}): void {
  const listingId = input.listingId?.trim();
  if (!listingId) {
    return;
  }

  if (
    input.sellerId &&
    input.currentUserId &&
    input.sellerId === input.currentUserId
  ) {
    return;
  }

  void incrementListingView(listingId);
}
