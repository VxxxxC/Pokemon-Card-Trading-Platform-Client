"use client";

import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { type MarketplaceListing } from "../marketplace/MarketplaceCard";

interface GlobalButtonProps {
  listing: MarketplaceListing;
  className?: string;
  label?: string;
}

// TODO [BACKEND]: Replace mock buyer fields with authed session user identity
const MOCK_BUYER_NAME = "九龍灣卡王";
const MOCK_BUYER_ID = "USR-BUYER-MOCK-001";

// ⚡ 立即購買按鈕 — 直接注入 accepted 狀態的 SpecialTransaction，跳過中間事件廣播層
export function BuyButton({
  listing,
  className = "",
  label,
}: GlobalButtonProps) {
  const injectSpecialTransaction = useHkCardVaultStore(
    (state) => state.injectSpecialTransaction,
  );

  const handleBuy = () => {
    injectSpecialTransaction({
      sellerName: listing.seller,
      sellerId: listing.sellerId ?? "HKCV-SELLER-UNKNOWN",
      cardName: listing.name,
      cardId: listing.id,
      offerPrice: listing.price,
      buyerName: MOCK_BUYER_NAME,
      buyerId: MOCK_BUYER_ID,
      isInstantTake: true,
    });
  };

  return (
    <button
      type="button"
      onClick={handleBuy}
      className={`h-9 px-2 sm:px-4 bg-[#d4a574] text-[#1A1612] font-sans font-bold text-[11px] sm:text-[12px] tracking-wide whitespace-nowrap truncate rounded-xl hover:bg-[#e8b896] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${className}`}
    >
      {label || "⚡ 立即購買"}
    </button>
  );
}

// 🔨 立即競投按鈕 — 注入 pending 議價要約，開啟聊天室議價通道
export function AuctionButton({ listing, className = "" }: GlobalButtonProps) {
  const injectSpecialTransaction = useHkCardVaultStore(
    (state) => state.injectSpecialTransaction,
  );

  const handleAuction = () => {
    injectSpecialTransaction({
      sellerName: listing.seller,
      sellerId: listing.sellerId ?? "HKCV-SELLER-UNKNOWN",
      cardName: listing.name,
      cardId: listing.id,
      offerPrice: listing.price,
      buyerName: MOCK_BUYER_NAME,
      buyerId: MOCK_BUYER_ID,
      isInstantTake: false,
    });
  };

  return (
    <button
      type="button"
      onClick={handleAuction}
      className={`h-9 px-4 bg-transparent border border-[#d4a574]/50 text-[#d4a574] font-sans font-bold text-[11px] sm:text-[12px] tracking-wide whitespace-nowrap truncate rounded-xl hover:bg-[#d4a574]/10 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${className}`}
    >
      🔨 立即競投
    </button>
  );
}
