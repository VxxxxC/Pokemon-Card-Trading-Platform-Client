import { incrementListingView } from "@/app/actions/listings";

export function trackListingViewOnNavigate(input: {
  listingId?: string | null;
  sellerId?: string | null;
  currentUserId?: string | null;
}): void {
  const listingId = input.listingId?.trim();
  if (!listingId || !input.currentUserId) {
    return;
  }

  if (input.sellerId && input.sellerId === input.currentUserId) {
    return;
  }

  void incrementListingView(listingId);
}
