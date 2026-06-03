"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type MarketplaceListing } from "../marketplace/MarketplaceCard";

export function ExecutionSlideOver() {
  const router = useRouter();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [mode, setMode] = useState<"buy" | "bid" | "auction" | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleGlobalTx = (e: Event) => {
      const customEvent = e as CustomEvent<{
        listing: MarketplaceListing;
        mode: "buy" | "bid" | "auction";
      }>;
      if (customEvent.detail) {
        setListing(customEvent.detail.listing);
        setMode(customEvent.detail.mode);
        setBidAmount(
          Math.round(customEvent.detail.listing.price * 0.9).toString(),
        );
      }
    };

    window.addEventListener("open-global-transaction", handleGlobalTx);
    return () =>
      window.removeEventListener("open-global-transaction", handleGlobalTx);
  }, []);

  const handleClose = () => {
    setListing(null);
    setMode(null);
  };

  if (!listing || !mode) return null;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    handleClose();

    if (mode === "buy") {
      router.push(
        `/marketplace/payment-status?status=success&id=${listing.id}`,
      );
    } else if (mode === "bid") {
      toast.success("📈 撮合出價已提交", {
        description: `您的掛單買方出價 HK$ ${Number(bidAmount).toLocaleString("en-HK")} 已成功進入市場撮合池。`,
      });
    } else {
      toast.success("🔨 競投出價成功", {
        description: `您已成功對該拍賣品加價至 HK$ ${Number(bidAmount).toLocaleString("en-HK")}。`,
      });
    }
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
            {/* Header Drawer */}
            <div className="p-5 border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
              <div>
                <h2 className="font-sans font-bold text-[18px] text-[#eae1da]">
                  {mode === "buy"
                    ? "⚡ 確認購買商品"
                    : mode === "bid"
                      ? "📈 提交撮合出價"
                      : "🔨 參與專屬拍賣競投"}
                </h2>
                <p className="font-mono text-[10px] text-[#8A8680] mt-0.5 uppercase tracking-wider">
                  PKT SECURE TRANSACTION PORT
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

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
              {/* 大比例重磅商品頭像卡 */}
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
                    {listing.name}
                  </h3>
                  <p className="font-mono text-[12px] text-[#d4c4b7]">
                    流水代號:{" "}
                    <span className="text-white font-bold">{listing.id}</span> ·{" "}
                    {listing.set}
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

              <form onSubmit={handleAction} className="space-y-6">
                {mode === "buy" ? (
                  <div className="space-y-4">
                    <div className="bg-[#26211C] p-5 rounded-2xl border border-[rgba(237,232,224,0.06)] shadow-inner divide-y divide-[rgba(237,232,224,0.08)] space-y-4 font-mono text-[14px]">
                      <div className="flex items-center justify-between pb-2 text-[#d4c4b7]">
                        <span>商品成交全款 (NET VALUE)</span>
                        <span className="text-[#eae1da] font-bold">
                          HK$ {listing.price.toLocaleString("en-HK")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 text-brand font-black text-[18px] tracking-tight">
                        <span>應付結算總額</span>
                        <span className="text-brand">
                          HK$ {listing.price.toLocaleString("en-HK")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="bid-input"
                        className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider block mb-2 font-bold"
                      >
                        {mode === "bid"
                          ? "輸入您的出價金額 (HK$)"
                          : "輸入您的競投加價 (HK$)"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 inset-y-0 flex items-center font-mono text-[18px] text-[#d4a574] font-bold">
                          HK$
                        </span>
                        <input
                          id="bid-input"
                          type="number"
                          required
                          min={
                            mode === "bid"
                              ? Math.round(listing.price * 0.5)
                              : listing.price + 50
                          }
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full h-13 pl-14 pr-4 bg-[#26211C] border border-[rgba(237,232,224,0.12)] focus:border-[#d4a574]/40 rounded-xl font-mono text-[18px] text-[#d4a574] font-bold focus:outline-none"
                        />
                      </div>
                      <p className="font-mono text-[10px] text-[#50453b] mt-1.5">
                        {mode === "bid"
                          ? `當前市場最低售價：HK$ ${listing.price.toLocaleString("en-HK")}`
                          : `當前拍賣最低競投價：HK$ ${(listing.price + 50).toLocaleString("en-HK")}`}
                      </p>
                    </div>

                    {mode === "auction" && (
                      <div className="p-4 bg-[#17130f] border border-[rgba(237,232,224,0.06)] rounded-xl">
                        <p className="font-sans text-[12.5px] text-[#d4c4b7] leading-relaxed">
                          🔨
                          拍賣機制：加價競投將即時鎖定份額，若拍賣倒計時結束前無更高出價，您將成功斬獲該珍稀卡牌。
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] disabled:opacity-50 font-sans font-bold text-[14px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all min-h-[48px] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
                        <span className="font-mono text-[11px] text-[#1A1612]">
                          EXECUTING ORDER...
                        </span>
                      </>
                    ) : mode === "buy" ? (
                      "⚡ 確認付款並下單"
                    ) : mode === "bid" ? (
                      "📈 確認發出買方出價"
                    ) : (
                      "🔨 確認加價競投"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 🟢 核心修正 1：刪除原本多餘且阻擋 Mobile View 的 Footer 晶片區塊，底層空間完美解壓 */}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
