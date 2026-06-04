"use client";

import { type MarketplaceListing } from "../marketplace/MarketplaceCard";

interface GlobalButtonProps {
  listing: MarketplaceListing;
  className?: string;
  label?: string;
}

function dispatchTxEvent(
  listing: MarketplaceListing,
  mode: "buy" | "bid" | "auction",
) {
  const event = new CustomEvent("open-global-transaction", {
    detail: { listing, mode },
  });
  window.dispatchEvent(event);
}

// ⚡ 立即購買按鈕
export function BuyButton({
  listing,
  className = "",
  label,
}: GlobalButtonProps) {
  return (
    <button
      type="button"
      onClick={() => dispatchTxEvent(listing, "buy")}
      className={`h-9 px-2 sm:px-4 bg-[#d4a574] text-[#1A1612] font-sans font-bold text-[11px] sm:text-[12px] tracking-wide whitespace-nowrap truncate rounded-xl hover:bg-[#e8b896] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${className}`}
    >
      {label || "⚡ 立即購買"}
    </button>
  );
}

// 🔨 立即競投按鈕
export function AuctionButton({ listing, className = "" }: GlobalButtonProps) {
  return (
    <button
      type="button"
      onClick={() => dispatchTxEvent(listing, "auction")}
      className={`h-9 px-4 bg-transparent border border-[#d4a574]/50 text-[#d4a574] font-sans font-bold text-[11px] sm:text-[12px] tracking-wide whitespace-nowrap truncate rounded-xl hover:bg-[#d4a574]/10 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${className}`}
    >
      🔨 立即競投
    </button>
  );
}
