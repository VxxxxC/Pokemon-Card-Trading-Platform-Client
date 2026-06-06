"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { type MarketplaceListing } from "../marketplace/MarketplaceCard";
// 🟢 確保路徑對齊全新大掃除後的中央 Store
import { useTradeStore } from "@/app/store/useTradeStore";

export function ExecutionSlideOver() {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isCounterOffer, setIsCounterOffer] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 訂閱 Zustand 核心 Action
  const injectSpecialTransaction = useTradeStore(
    (state) => state.injectSpecialTransaction,
  );

  useEffect(() => {
    const handleGlobalTx = (e: Event) => {
      const customEvent = e as CustomEvent<{
        listing: MarketplaceListing;
        mode: "buy" | "bid" | "auction";
      }>;
      if (customEvent.detail) {
        setListing(customEvent.detail.listing);
        setIsCounterOffer(false);
        setCustomPrice("");
      }
    };

    window.addEventListener("open-global-transaction", handleGlobalTx);
    return () =>
      window.removeEventListener("open-global-transaction", handleGlobalTx);
  }, []);

  const handleClose = () => {
    setListing(null);
  };

  if (!listing) return null;

  const sellerListedPrice = listing.price;
  const targetCardName = listing.name;
  const targetSellerId = listing.sellerId ?? "PKT-8839-44A";
  const targetSellerName = listing.seller ?? "渡邊道館";

  // 🟢 核心連動：對齊中央數據銀行資產編碼
  const targetCardId =
    listing.id === "sv2a-182"
      ? "LST-C2C-001"
      : listing.id === "sv2a-215"
        ? "LST-C2C-002"
        : listing.id === "sv2a-205"
          ? "LST-C2C-003"
          : listing.id === "sv3-155"
            ? "LST-C2C-004"
            : listing.id === "sv6a-109"
              ? "LST-C2C-005"
              : listing.id === "s5a-070"
                ? "LST-C2C-006"
                : listing.id;

  const handleConfirmNegotiation = async () => {
    const finalOfferPrice = isCounterOffer
      ? Number(customPrice)
      : sellerListedPrice;

    if (isCounterOffer && (!customPrice || Number(customPrice) <= 0)) {
      toast.error("⚠️ 請輸入有效的預期出價金額");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);

    // ⚡ 滿血透傳：將是否為立即購買 (!isCounterOffer) 的核心交割標誌灌入 Zustand
    injectSpecialTransaction({
      sellerName: targetSellerName,
      sellerId: targetSellerId,
      cardName: targetCardName,
      cardId: targetCardId,
      offerPrice: finalOfferPrice,
      buyerName: "九龍灣卡王",
      isInstantTake: !isCounterOffer, // 🟢 雙軌分流關鍵：一口價秒殺為 true，提出議價為 false
    });

    // 關閉當成交割操作抽屜
    handleClose();

    toast.success(
      !isCounterOffer
        ? "🎉 已接受原價！資產已成功扣鎖預留"
        : "✉️ 議價要約已成功送出",
      {
        description: `交易協定已實時注入全域對話中樞，即刻為您開啟對話視窗！`,
        duration: 4000,
      },
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="w-screen max-w-md bg-[#2e2925] border-l border-[rgba(237,232,224,0.12)] shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
              <div>
                <h2 className="font-sans font-bold text-[18px] text-[#eae1da]">
                  ⚡ 即時購買交割終端
                </h2>
                <p className="font-mono text-[10px] text-[#8A8680] mt-0.5 uppercase tracking-wider">
                  C2C PEER-TO-PEER INSTANT BARGAIN
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-[#17130f] hover:bg-[#39342f] flex items-center justify-center transition-colors cursor-pointer text-text-secondary hover:text-brand"
                aria-label="關閉交易面板"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none">
              <div className="flex flex-col items-center p-5 bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] shadow-inner text-center space-y-4">
                <div className="relative w-28 h-38 bg-[#17130f] rounded-xl overflow-hidden border-2 border-[rgba(237,232,224,0.15)] shrink-0 shadow-lg">
                  <Image
                    src={listing.image}
                    alt={listing.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                    unoptimized
                  />
                </div>
                <div className="w-full space-y-1">
                  <h3 className="font-sans font-black text-[16px] md:text-[18px] text-[#eae1da] leading-tight tracking-tight px-2">
                    {targetCardName}
                  </h3>
                  <p className="font-mono text-[12px] text-brand font-bold">
                    當前賣方定價: HK$ {sellerListedPrice.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#17130f] text-[#d4a574] border border-[#d4a574]/20 font-bold">
                      {listing.rarity}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[rgba(140,115,85,0.20)] text-[#eae1da] border border-white/5">
                      {listing.grade.authority} {listing.grade.score}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCounterOffer(false)}
                    className={`h-10 text-[12px] font-bold rounded-xl border transition-all cursor-pointer focus:outline-none ${!isCounterOffer ? "bg-brand/10 border-brand text-brand font-black" : "bg-[#17130f] border-white/5 text-[#d4c4b7]"}`}
                  >
                    🤝 接受賣方原價購入
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCounterOffer(true)}
                    className={`h-10 text-[12px] font-bold rounded-xl border transition-all cursor-pointer focus:outline-none ${isCounterOffer ? "bg-brand/10 border-brand text-brand font-black" : "bg-[#17130f] border-white/5 text-[#d4c4b7]"}`}
                  >
                    💬 向賣家提出議價
                  </button>
                </div>

                {/* Counter-Offer Input */}
                {isCounterOffer && (
                  <div className="space-y-1.5 animate-fadeIn pt-2">
                    <label
                      htmlFor="negotiation-price"
                      className="font-mono text-[11px] text-[#d4c4b7] block uppercase tracking-wide"
                    >
                      您的預期購入價 (HK$) *
                    </label>
                    <div className="flex items-center h-10 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                      <span className="px-3 font-mono text-[12px] font-bold text-brand bg-[#26211C] border-r border-white/5">
                        HK$
                      </span>
                      <input
                        id="negotiation-price"
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="請輸入您希望議定的金額"
                        className="flex-1 h-full bg-transparent px-3 font-mono text-[13px] text-brand focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmNegotiation}
                  className="w-full h-11 bg-brand text-[#1A1612] font-black text-[13px] rounded-xl hover:bg-[#e8b896] active:scale-[0.98] transition-all mt-4 shadow-md cursor-pointer flex items-center justify-center gap-2 focus:outline-none"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
                  ) : !isCounterOffer ? (
                    "⚡ 確認以原價購入並預留資產"
                  ) : (
                    "✉️ 發送議價要約至聊天室"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
