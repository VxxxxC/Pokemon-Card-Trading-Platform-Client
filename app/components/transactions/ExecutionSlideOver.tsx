"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type MarketplaceListing } from "../marketplace/MarketplaceCard";

interface ExecutionSlideOverProps {
  listing: MarketplaceListing | null;
  mode: "buy" | "bid" | null;
  onClose: () => void;
}

export function ExecutionSlideOver({ listing, mode, onClose }: ExecutionSlideOverProps) {
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!listing || !mode) return null;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Simulate network transaction latency & idempotency lock
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    onClose();

    if (mode === "buy") {
      // Direct checkout landing redirect
      router.push(`/marketplace/payment-status?status=success&id=${listing.id}`);
    } else {
      // Mock bidding success trigger
      alert(`📈 提交成功！您的出價單 HK$ ${Number(bidAmount).toLocaleString("en-HK")} 已進入全網撮合池。`);
    }
  };

  const depositFee = Math.round(listing.price * 0.1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
        {/* Backdrop Blur Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-screen max-w-md bg-[#2e2925] border-l border-[rgba(237,232,224,0.12)] shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between"
          >
            {/* Header Drawer */}
            <div className="p-5 border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
              <div>
                <h2 className="font-sans font-bold text-[18px] text-[#eae1da]">
                  {mode === "buy" ? "⚡ 確認購買交易" : "📈 提交撮合出價"}
                </h2>
                <p className="font-mono text-[10px] text-[#8A8680] mt-0.5 uppercase tracking-wider">
                  PKT SECURE TRANSACTION PORT
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#17130f] hover:bg-[#39342f] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="關閉交易面板"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
              {/* Product Card Profile */}
              <div className="flex gap-4 p-3 bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.06)]">
                <div className="relative w-14 h-19 bg-[#17130f] rounded overflow-hidden border border-[rgba(237,232,224,0.08)] shrink-0">
                  <Image src={listing.image} alt={listing.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans font-semibold text-[14px] text-[#eae1da] truncate">{listing.name}</h3>
                  <p className="font-mono text-[11px] text-[#d4c4b7] mt-0.5">{listing.id} · {listing.set}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[#17130f] text-[#d4a574] border border-[#d4a574]/20">
                      {listing.rarity}
                    </span>
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[rgba(140,115,85,0.12)] text-[#eae1da]">
                      {listing.grade.authority} {listing.grade.score}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAction} className="space-y-6">
                {mode === "buy" ? (
                  /* DIRECT INSTANT BUY SYSTEM */
                  <div className="space-y-4">
                    <div className="p-4 bg-[rgba(212,165,116,0.05)] border border-[#d4a574]/20 rounded-xl space-y-3">
                      <h4 className="font-mono text-[11px] font-semibold text-[#d4a574] uppercase tracking-wider flex items-center gap-1">
                        🔒 第三方 Escrow 託管保障
                      </h4>
                      <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
                        本項目支援分段式 Escrow 託管。針對高價值卡牌，您當前僅需支付 **10% 港幣訂金** 即可立刻啟動第三方實體鑑定流程。
                      </p>
                    </div>

                    {/* Monetary breakdown */}
                    <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.06)] divide-y divide-[rgba(237,232,224,0.06)] space-y-3 font-mono text-[13px]">
                      <div className="flex items-center justify-between pb-3 text-[#d4c4b7]">
                        <span>商品全款總額</span>
                        <span>HK$ {listing.price.toLocaleString("en-HK")}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 text-[#d4a574] font-semibold">
                        <span>本次應付訂金 (10%)</span>
                        <span>HK$ {depositFee.toLocaleString("en-HK")}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 text-[#d4c4b7]">
                        <span>尾款 (收貨鑑定確認後支付)</span>
                        <span>HK$ {(listing.price - depositFee).toLocaleString("en-HK")}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* INVESTMENT MATCHING BID SYSTEM */
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="bid-input" className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider block mb-2">
                        輸入您的出價金額 (HK$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 inset-y-0 flex items-center font-mono text-[18px] text-[#d4a574] font-bold">
                          HK$
                        </span>
                        <input
                          id="bid-input"
                          type="number"
                          required
                          min={Math.round(listing.price * 0.5)}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`${Math.round(listing.price * 0.9)}`}
                          className="w-full h-13 pl-14 pr-4 bg-[#26211C] border border-[rgba(237,232,224,0.12)] focus:border-[#d4a574]/40 rounded-xl font-mono text-[18px] text-[#d4a574] font-bold focus:outline-none focus:ring-2 focus:ring-[#d4a574]/20 transition-all"
                        />
                      </div>
                      <p className="font-mono text-[10px] text-[#50453b] mt-1.5">
                        當前市場最低售價：HK$ {listing.price.toLocaleString("en-HK")}
                      </p>
                    </div>

                    <div className="p-4 bg-[#17130f] border border-[rgba(237,232,224,0.06)] rounded-xl space-y-2">
                      <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
                        📈 **股市撮合機制**：您的出價將進入平台掛單撮合池，當有賣家願意以此價匹配時，系統將自動為您成交。
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Container Action */}
                <div className="pt-4 border-t border-[rgba(237,232,224,0.06)] flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] disabled:opacity-50 font-sans font-bold text-[14px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all min-h-[48px] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
                        <span className="font-mono text-[12px] text-[#1A1612]">LOCKING TRANSACTION...</span>
                      </>
                    ) : mode === "buy" ? (
                      "⚡ 立即支付訂金"
                    ) : (
                      "📈 確認發出買方出價"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Legal footer info */}
            <div className="p-4 bg-[#26211C] border-t border-[rgba(237,232,224,0.06)] text-center">
              <p className="font-mono text-[9px] text-[#50453b] tracking-wider leading-relaxed">
                SECURED BY STRIPE CONNECT & HK CUSTOMS TCG ESCROW COMPLIANCE LICENSE
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
