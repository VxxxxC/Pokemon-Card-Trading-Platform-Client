"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";
import { useUIStore } from "@/app/store/useUIStore";
import { mapMarketplaceListingToExecutionPayload } from "@/lib/marketplace/map-listing-to-execution";
import { prefetchMarketplaceListingDetail } from "@/app/lib/hooks/useMarketplaceListingDetail";
import { buildSellerListingDetailHref } from "@/lib/marketplace/listing-detail-href";
import { type MarketplaceListing } from "../marketplace/MarketplaceCard";
import {
  BuyNowConfirmDialog,
  BuyNowGuestLockDialog,
} from "./BuyNowConfirmDialog";

interface GlobalButtonProps {
  listing: MarketplaceListing;
  className?: string;
  label?: string;
  /** When provided, skips per-button profile fetch (pass from grid parent). */
  currentUserId?: string | null;
}

export function BuyButton({
  listing,
  className = "",
  label,
  currentUserId: currentUserIdProp,
}: GlobalButtonProps) {
  if (currentUserIdProp !== undefined) {
    return (
      <BuyButtonView
        listing={listing}
        className={className}
        label={label}
        currentUserId={currentUserIdProp}
      />
    );
  }

  return (
    <BuyButtonWithSession
      listing={listing}
      className={className}
      label={label}
    />
  );
}

function BuyButtonWithSession({
  listing,
  className,
  label,
}: Pick<GlobalButtonProps, "listing" | "className" | "label">) {
  const currentUserId = useCurrentUserId();
  return (
    <BuyButtonView
      listing={listing}
      className={className}
      label={label}
      currentUserId={currentUserId}
    />
  );
}

function BuyButtonView({
  listing,
  className = "",
  label,
  currentUserId,
}: GlobalButtonProps & { currentUserId: string | null }) {
  const userAuthRole = useUIStore((state) => state.userAuthRole);
  const isGuest = userAuthRole === "GUEST";
  const openExecutionSlideOver = useUIStore(
    (state) => state.openExecutionSlideOver,
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [guestLockOpen, setGuestLockOpen] = useState(false);

  const listingId = listing.id?.trim() ?? "";
  const sellerId = listing.sellerId?.trim() ?? "";
  const guestRedirectPath =
    sellerId && listingId
      ? buildSellerListingDetailHref(sellerId, listingId)
      : "/marketplace";

  const handleBuy = () => {
    if (
      currentUserId != null &&
      listing.sellerId != null &&
      listing.sellerId === currentUserId
    ) {
      return;
    }

    if (isGuest) {
      setGuestLockOpen(true);
      return;
    }

    setConfirmOpen(true);
  };

  const handleNegotiate = () => {
    const payload = mapMarketplaceListingToExecutionPayload(listing);
    if (!payload) {
      return;
    }
    openExecutionSlideOver(payload);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleBuy}
        onMouseEnter={() => {
          if (listingId) {
            prefetchMarketplaceListingDetail(listingId);
          }
        }}
        className={`h-8 px-2 bg-brand text-[#1A1612] font-sans font-bold text-[10px] tracking-wide whitespace-nowrap truncate rounded-lg hover:bg-[#e8b896] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${className}`}
      >
        {label ? (
          label
        ) : (
          <>
            <Zap className="size-3 shrink-0" strokeWidth={2.25} />
            立即購買
          </>
        )}
      </button>

      <BuyNowConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        listing={listing}
        onNegotiate={handleNegotiate}
      />

      <BuyNowGuestLockDialog
        open={guestLockOpen}
        onOpenChange={setGuestLockOpen}
        redirectPath={guestRedirectPath}
      />
    </>
  );
}
