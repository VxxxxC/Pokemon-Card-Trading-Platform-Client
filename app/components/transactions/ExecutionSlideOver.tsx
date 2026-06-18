"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { useTradeStore } from "@/app/store/useTradeStore";
import {
  type SellOrder,
  type UnifiedProductSpec,
} from "@/app/lib/mock-data/cards";

interface ExecutionSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  order: SellOrder | null;
  card: UnifiedProductSpec;
  productId: string;
}

// TODO [BACKEND]: Replace with authed session user identity
const MOCK_BUYER_NAME = "九龍灣卡王";
const MOCK_BUYER_ID = "USR-BUYER-MOCK-001";

export function ExecutionSlideOver({
  isOpen,
  onClose,
  order,
  card,
  productId,
}: ExecutionSlideOverProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isCounterOffer, setIsCounterOffer] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const injectSpecialTransaction = useTradeStore(
    (state) => state.injectSpecialTransaction,
  );

  // Sync carousel dot state via microtask to prevent synchronous setState cascade
  useEffect(() => {
    if (!api) return;
    const update = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };
    queueMicrotask(update);
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  // Reset inner state whenever a new order is opened — use queueMicrotask to avoid sync setState cascade
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setIsCounterOffer(false);
        setCustomPrice("");
        setCurrent(0);
      });
    }
  }, [isOpen, order?.sellerId]);

  if (!isOpen || !order) return null;

  const images =
    card.images.length > 0
      ? card.images
      : ["https://picsum.photos/seed/fallback/400/500"];

  const handleConfirm = async () => {
    const finalPrice = isCounterOffer ? Number(customPrice) : order.price;

    if (isCounterOffer && (!customPrice || Number(customPrice) <= 0)) {
      toast.error("⚠️ 請輸入有效的預期出價金額");
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSubmitting(false);

    injectSpecialTransaction({
      sellerName: order.sellerName,
      sellerId: order.sellerId,
      cardName: card.name,
      cardId: productId,
      offerPrice: finalPrice,
      buyerName: MOCK_BUYER_NAME,
      buyerId: MOCK_BUYER_ID,
      isInstantTake: !isCounterOffer,
    });

    onClose();

    toast.success(
      !isCounterOffer ? "🎉 已接受原價！資產已成功扣鎖預留" : "✉️ 議價要約已成功送出",
      {
        description: "交易協定已實時注入全域對話中樞，即刻為您開啟對話視窗！",
        duration: 4000,
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[#2e2925] border border-[rgba(237,232,224,0.15)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl animate-fadeIn overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div>
            <h4 className="font-sans font-black text-[16px] text-[#eae1da]">
              ⚡ 即時購買交割終端
            </h4>
            <p className="font-mono text-[10px] text-[#8A8680] uppercase tracking-widest mt-0.5">
              C2C PEER-TO-PEER INSTANT BARGAIN
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#8A8680] hover:text-[#eae1da] transition-all text-[14px] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ── Super-Sized Photo Carousel ── */}
          <div className="flex flex-col items-center select-none group w-full overflow-hidden">
            <div className="relative w-full aspect-[3/4] max-h-[55dvh] sm:max-h-[60vh] md:w-80 md:h-[420px] md:aspect-auto rounded-2xl overflow-hidden bg-[#120f0c] border border-white/5 shrink-0 shadow-inner mx-auto">
              <Carousel
                setApi={setApi}
                className="w-full h-full [&>div]:h-full"
                opts={{ loop: true }}
              >
                <CarouselContent className="-ml-0 h-full">
                  {images.map((img, idx) => (
                    <CarouselItem
                      key={idx}
                      className="pl-0 relative w-full h-full overflow-hidden rounded-2xl"
                    >
                      <Image
                        src={img}
                        alt={`${card.name} 實物照 ${idx + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 320px"
                        className="scale-100 object-cover transition-transform duration-500 hover:scale-105"
                        unoptimized
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 left-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
                <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 right-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
              </Carousel>
            </div>

            {/* Animated dot indicators */}
            {count > 1 && (
              <div className="flex justify-center gap-1.5 py-2.5">
                {Array.from({ length: count }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`前往第 ${i + 1} 張照片`}
                    onClick={() => api?.scrollTo(i)}
                    className={
                      i === current
                        ? "bg-brand w-3.5 h-1.5 opacity-100 rounded-full transition-all duration-300"
                        : "bg-text-disabled w-1.5 h-1.5 opacity-30 hover:opacity-50 rounded-full transition-all duration-300"
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Snippet 1: 對接賣家商號 ── */}
          <div className="bg-[#17130f] border border-white/5 rounded-xl p-4 space-y-3.5">
            <div className="flex flex-col text-left space-y-1">
              <span className="font-mono text-[10px] text-[#8A8680] uppercase">
                對接賣家商號
              </span>
              <Link
                href={`/profile/${order.sellerId}`}
                className="font-sans font-black text-[14px] text-brand underline cursor-pointer bg-transparent border-none text-left focus:outline-none"
              >
                {order.sellerName} (@{order.sellerId}) →
              </Link>
            </div>

            <div className="flex flex-col text-left border-t border-white/5 pt-2.5">
              <span className="font-mono text-[10px] text-[#8A8680] uppercase">
                選定掛牌售價
              </span>
              <span className="font-mono font-black text-[18px] text-brand mt-0.5">
                HK$ {order.price.toLocaleString("en-HK")}
              </span>
            </div>
          </div>

          {/* ── Snippet 2: 私域現貨引流導航卡 ── */}
          <Link
            href={`/marketplace/${order.sellerId}/product/${productId}`}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-brand/20 bg-[#17130f] hover:bg-[#26211C] font-sans font-bold text-[12.5px] text-brand transition-colors cursor-pointer text-left focus:outline-none"
          >
            <span>
              🏪 查看 {order.sellerName} 的{" "}
              <span className="font-black underline">{card.name}</span>
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          {/* ── Action Mode Toggle ── */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsCounterOffer(false)}
              className={`h-10 text-[12px] font-bold rounded-xl border transition-all cursor-pointer focus:outline-none ${
                !isCounterOffer
                  ? "bg-brand/10 border-brand text-brand font-black"
                  : "bg-[#17130f] border-white/5 text-[#d4c4b7]"
              }`}
            >
              🤝 接受賣方原價
            </button>
            <button
              type="button"
              onClick={() => setIsCounterOffer(true)}
              className={`h-10 text-[12px] font-bold rounded-xl border transition-all cursor-pointer focus:outline-none ${
                isCounterOffer
                  ? "bg-brand/10 border-brand text-brand font-black"
                  : "bg-[#17130f] border-white/5 text-[#d4c4b7]"
              }`}
            >
              💬 提出議價要約
            </button>
          </div>

          {/* Counter-offer price input */}
          {isCounterOffer && (
            <div className="space-y-1.5 animate-fadeIn">
              <label
                htmlFor="exe-negotiation-price"
                className="font-mono text-[11px] text-[#d4c4b7] block uppercase tracking-wide"
              >
                您的預期購入價 (HK$) *
              </label>
              <div className="flex items-center h-10 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                <span className="px-3 font-mono text-[12px] font-bold text-brand bg-[#26211C] border-r border-white/5">
                  HK$
                </span>
                <input
                  id="exe-negotiation-price"
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="請輸入您希望議定的金額"
                  className="flex-1 h-full bg-transparent px-3 font-mono text-[13px] text-brand focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fixed action bar */}
        <div className="px-5 py-4 border-t border-white/[0.07] shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="w-full h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl hover:bg-[#e8b896] active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 focus:outline-none disabled:opacity-60"
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
    </div>
  );
}
