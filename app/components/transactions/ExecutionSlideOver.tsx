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
  // isCounterOffer: true = buyer entered custom price mode; false = instant accept mode (default)
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

  // Task C: One-click instant accept — fires immediately on button click, bypasses confirm step
  const handleInstantAccept = () => {
    injectSpecialTransaction({
      sellerName: order.sellerName,
      sellerId: order.sellerId,
      cardName: card.name,
      cardId: productId,
      offerPrice: order.price,
      buyerName: MOCK_BUYER_NAME,
      buyerId: MOCK_BUYER_ID,
      isInstantTake: true, // 🟢 直接 accepted 狀態，商品即時 on hold，開立新訂單
    });
    onClose();
    toast.success("🎉 已接受原價！資產已成功扣鎖預留", {
      description: "交易協定已實時注入全域對話中樞，即刻為您開啟對話視窗！",
      duration: 4000,
    });
  };

  // Task B: Counter-offer submit — only reachable when isCounterOffer === true
  const handleSendCounterOffer = async () => {
    if (!customPrice || Number(customPrice) <= 0) {
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
      offerPrice: Number(customPrice),
      buyerName: MOCK_BUYER_NAME,
      buyerId: MOCK_BUYER_ID,
      isInstantTake: false, // 🟡 pending 狀態，等待賣家回應議價
    });

    onClose();
    toast.success("✉️ 議價要約已成功送出", {
      description: "交易協定已實時注入全域對話中樞，即刻為您開啟對話視窗！",
      duration: 4000,
    });
  };

  return (
    <div className="fixed inset-0 z-[400] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel — Right-Side Full-Height Slide-over Drawer */}
      <div className="relative z-10 w-full max-w-md bg-[#2e2925] border-l border-white/[0.08] flex flex-col h-screen h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.85)] translate-x-0 transition-transform duration-300 ease-out rounded-none" style={{ height: '100dvh' }}>

        {/* Header Section (Fixed, Top) */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#26211C]">
          <div>
            <h2 className="font-sans font-bold text-[16px] text-[#eae1da] truncate max-w-[280px]">
              {card.name}
            </h2>
            <p className="font-mono text-[10px] text-brand mt-0.5 uppercase tracking-wider">
              {card.rarity} · {order.customGrade.authority} {order.customGrade.score}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#17130f] hover:bg-[#39342f] flex items-center justify-center transition-colors cursor-pointer text-[#8A8680] hover:text-brand focus:outline-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Dynamic Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#231e1a]/40 min-h-0 scrollbar-none">
          {/* ── Super-Sized Photo Carousel ── */}
          <div className="flex flex-col items-center select-none group w-full overflow-hidden">
            <div className="relative w-full aspect-[3/4] max-h-[45dvh] sm:max-h-[55vh] md:w-80 md:h-[380px] md:aspect-auto rounded-2xl overflow-hidden bg-[#120f0c] border border-white/5 shrink-0 shadow-inner mx-auto">
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

          {/* ── Seller info deck ── */}
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

          {/* ── Storefront navigation card ── */}
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

          {/* ── Action mode toggle ── */}
          <div className="grid grid-cols-2 gap-2">
            {/* Task C: onClick immediately triggers instant-accept transaction */}
            <button
              type="button"
              onClick={handleInstantAccept}
              className="h-10 text-[12px] font-bold rounded-xl border transition-all cursor-pointer focus:outline-none bg-brand/10 border-brand text-brand font-black hover:bg-brand/20 active:scale-[0.97]"
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

          {/* Counter-offer price input — only visible in counter-offer mode */}
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

        {/* Task B: Fixed action bar — ONLY rendered when isCounterOffer === true */}
        {isCounterOffer && (
          <div className="px-5 py-4 border-t border-white/[0.07] shrink-0 bg-[#26211C]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSendCounterOffer}
              className="w-full h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl hover:bg-[#e8b896] active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 focus:outline-none disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
              ) : (
                "✉️ 發送議價要約至聊天室"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
