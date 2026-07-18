"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { makeOffer } from "@/app/actions/offers";
import { incrementListingView } from "@/app/actions/listings";
import { Switch } from "@/components/ui/switch";
import { BUYER_AUTH_DISABLED_COPY } from "@/lib/listings/auth-service-copy";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { useUIStore } from "@/app/store/useUIStore";
import { useMarketplaceListingDetail } from "@/app/lib/hooks/useMarketplaceListingDetail";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";
import { SELF_OFFER_ERROR_MESSAGE } from "@/lib/auth/dual-persona";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import {
  formatSellerIdentityLabel,
  resolveSellerProfilePath,
} from "@/lib/marketplace/seller-identity";
import {
  type SellOrder,
  type UnifiedProductSpec,
} from "@/app/lib/mock-data/cards";

interface ExecutionSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string | null;
  order: SellOrder | null;
  card: UnifiedProductSpec;
  productId: string;
}

export function ExecutionSlideOver({
  isOpen,
  onClose,
  listingId,
  order,
  card,
  productId,
}: ExecutionSlideOverProps) {
  const [customPrice, setCustomPrice] = useState("");
  const [useAuthentication, setUseAuthentication] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ImageViewer integration states
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const userAuthRole = useUIStore((state) => state.userAuthRole);
  const isGuest = userAuthRole === "GUEST";
  const currentUserId = useCurrentUserId();
  const isOwnListing =
    currentUserId != null &&
    order != null &&
    order.sellerId === currentUserId;

  const openOfferChatSession = useHkCardVaultStore(
    (state) => state.openOfferChatSession,
  );

  const {
    detail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useMarketplaceListingDetail({
    listingId,
    enabled: isOpen && listingId != null,
  });

  const lastViewedListingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !listingId) {
      lastViewedListingIdRef.current = null;
      return;
    }

    if (lastViewedListingIdRef.current === listingId) {
      return;
    }

    lastViewedListingIdRef.current = listingId;
    void incrementListingView(listingId);
  }, [isOpen, listingId]);

  useEffect(() => {
    if (isOpen && order) {
      queueMicrotask(() => {
        setCustomPrice(order.price.toString());
        setUseAuthentication(false);
      });
    }
  }, [isOpen, listingId, order]);

  useEffect(() => {
    if (detail?.useAuthentication === false) {
      setUseAuthentication(false);
    }
  }, [detail?.useAuthentication]);

  if (!isOpen || !order) {
    return null;
  }

  const listingImages = detail?.images ?? [];
  const images = listingImages;
  const remarks = detail?.imagesDetail?.map((img) => img.remark) ?? [];

  const sellerDisplayName =
    detail?.sellerDisplayName?.trim() || order.sellerName;
  const sellerUsername = detail?.sellerUsername ?? order.sellerUsername ?? null;
  const sellerLabel = formatSellerIdentityLabel(
    sellerDisplayName,
    sellerUsername,
  );
  const sellerProfileHref = resolveSellerProfilePath({
    sellerId: order.sellerId,
    sellerUsername,
  });

  const listingAcceptsBuyerAuth = detail?.useAuthentication !== false;

  const handleSendCounterOffer = async () => {
    if (!listingId) {
      toast.error("找不到此掛單");
      return;
    }

    if (isOwnListing) {
      toast.error(SELF_OFFER_ERROR_MESSAGE);
      return;
    }

    if (!customPrice || Number(customPrice) <= 0) {
      toast.error("⚠️ 請輸入有效的預期出價金額");
      return;
    }

    if (useAuthentication && !listingAcceptsBuyerAuth) {
      toast.error("此賣家不接受平台鑑定加購");
      return;
    }

    setIsSubmitting(true);

    const offerContext = {
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      cardName: card.name,
      cardId: productId,
    };

    try {
      const profileResult = await getCurrentUserProfile();
      if (!profileResult.success) {
        toast.error(profileResult.error);
        return;
      }

      const result = await makeOffer(
        listingId,
        Number(customPrice),
        useAuthentication,
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { room, offer, message } = result.data;

      openOfferChatSession({
        roomId: room.id,
        partnerId: offerContext.sellerId,
        partnerName: offerContext.sellerName,
        partnerPersona:
          room.seller_persona === "merchant" ? "merchant" : "member",
        buyerId: profileResult.data.id,
        buyerName: profileResult.data.displayName,
        sellerId: offerContext.sellerId,
        sellerName: offerContext.sellerName,
        cardName: offerContext.cardName,
        cardId: offerContext.cardId,
        offerId: offer.id,
        offerPrice: offer.offer_price,
        modifiedCount:
          "modified_count" in offer ? Number(offer.modified_count) || 0 : 0,
        messageId: message.id,
        messageContent: message.content,
        messageCreatedAt: message.created_at ?? new Date().toISOString(),
        offerStatus: offer.status ?? "pending",
        useAuthentication: offer.use_authentication,
      });

      onClose();

      toast.success("✉️ 議價要約已成功送出", {
        description: "交易協定已實時注入全域對話中樞，即刻為您開啟對話視窗！",
        duration: 4000,
      });
    } catch {
      toast.error("出價時發生錯誤，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel — Right-Side Full-Height Slide-over Drawer */}
      <div
        className="relative z-10 w-full max-w-md bg-[#2e2925] border-l border-white/[0.08] flex flex-col h-screen h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.85)] translate-x-0 transition-transform duration-300 ease-out rounded-none"
        style={{ height: "100dvh" }}
      >
        {/* Header Section (Fixed, Top) */}
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#26211C]">
          <div>
            <h2 className="font-sans font-bold text-[16px] text-[#eae1da] truncate max-w-[280px]">
              {card.name}
            </h2>
            <p className="font-mono text-[10px] text-brand mt-0.5 uppercase tracking-wider">
              {card.rarity} · {order.customGrade.authority}{" "}
              {order.customGrade.score}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#17130f] hover:bg-[#39342f] flex items-center justify-center transition-colors cursor-pointer text-[#8A8680] hover:text-brand focus:outline-none"
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
        {/* Dynamic Scrollable Body Content / Lock Wrapper */}
        <div className="relative flex-1 overflow-hidden bg-[#231e1a]/40 flex flex-col min-h-0">
          {isGuest && (
            <div className="absolute inset-0 bg-[#2e2925]/75 backdrop-blur-lg z-40 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
              <span className="text-[32px] mb-4">⚠️</span>
              <p className="font-sans font-bold text-[15px] text-[#eae1da] mb-2">
                您目前正以遊客身份觀盤
              </p>
              <p className="font-sans text-[12.5px] text-text-secondary mb-5 max-w-[280px]">
                請先登入會員以活化平台第三方雙向鑑定與託管出價機制。
              </p>
              <Link
                href={`/auth?redirect=${encodeURIComponent(`/marketplace/product/${productId}`)}`}
                onClick={onClose}
                className="w-full h-11 bg-brand text-[#1A1612] font-sans font-bold text-[13px] rounded-xl hover:bg-[#e8b896] active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 focus:outline-none"
              >
                登入 / 註冊
              </Link>
            </div>
          )}

          {/* Inner Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-none min-h-0">
            {/* ── Seller info deck ── */}
            <div className="bg-[#17130f] border border-white/5 rounded-xl p-4 space-y-3.5">
              <div className="flex flex-col text-left space-y-1">
                <span className="font-mono text-[10px] text-[#8A8680] uppercase">
                  對接賣家商號
                </span>
                <Link
                  href={sellerProfileHref}
                  onClick={onClose}
                  className="font-sans font-black text-[14px] text-brand underline cursor-pointer bg-transparent border-none text-left focus:outline-none"
                >
                  {sellerLabel} →
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

            {/* ── Listing photo thumbnails (4–6 × 3:4 grid) ── */}
            <div className="w-full select-none">
              <span className="font-mono text-[10px] text-[#8A8680] uppercase block mb-2">
                賣家實物照 ({isDetailLoading ? "…" : images.length})
              </span>
              {isDetailLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }, (_, idx) => (
                    <div
                      key={idx}
                      className="aspect-[3/4] rounded-lg bg-[#120f0c] border border-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : detailError ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                  {detailError}
                </p>
              ) : images.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-[#120f0c] px-3 py-4 text-center text-[12px] text-[#8A8680]">
                  此掛單暫無賣家實物照
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, idx) => {
                    const remarkText = remarks[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setViewerIndex(idx);
                          setIsViewerOpen(true);
                        }}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#120f0c] border border-white/5 cursor-zoom-in"
                      >
                        <Image
                          src={img}
                          alt={`${card.name} 實物照 ${idx + 1}`}
                          fill
                          sizes="(max-width: 640px) 28vw, 120px"
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                        {remarkText && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-xs py-0.5 px-1 text-center border-t border-white/5 pointer-events-none select-none">
                            <p className="font-sans text-[9px] text-[#eae1da] truncate font-bold leading-normal">
                              {remarkText}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Storefront navigation card ── */}
            <Link
              href={`/marketplace/${order.sellerId}/product/${productId}`}
              onClick={onClose}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-brand/20 bg-[#17130f] hover:bg-[#26211C] font-sans font-bold text-[12.5px] text-brand transition-colors cursor-pointer text-left focus:outline-none"
            >
              <span>
                🏪 查看 {sellerLabel} 的{" "}
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

            <div className="bg-[#17130f] border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <span className="font-mono text-[11px] text-[#d4c4b7] block uppercase tracking-wide">
                    平台鑑定加購
                  </span>
                  <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                    {listingAcceptsBuyerAuth
                      ? "啟用後由平台第三方鑑定機構複驗品相與真偽（HK$150）"
                      : BUYER_AUTH_DISABLED_COPY}
                  </p>
                </div>
                <Switch
                  checked={useAuthentication}
                  onCheckedChange={setUseAuthentication}
                  disabled={!listingAcceptsBuyerAuth || isDetailLoading}
                  className="data-checked:bg-brand data-unchecked:bg-[#39342f] disabled:opacity-40"
                />
              </div>
            </div>

            <div className="space-y-1.5 animate-fadeIn">
              <label
                htmlFor="exe-negotiation-price"
                className="font-mono text-[11px] text-[#d4c4b7] block uppercase tracking-wide"
              >
                購入價 (HK$)
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
                  disabled={isOwnListing}
                  className="flex-1 h-full bg-transparent px-3 font-mono text-[13px] text-brand focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {isOwnListing ? (
              <p className="font-sans text-[11px] text-[#8A8680] px-1">
                這是您的掛單，無法對自己的商品出價
              </p>
            ) : null}
          </div>

          {/* Bottom Action Footer Container */}
          <div className="px-5 py-4 border-t border-white/[0.07] shrink-0 bg-[#26211C]">
            <button
              type="button"
              disabled={isSubmitting || !listingId || isOwnListing}
              onClick={handleSendCounterOffer}
              className="w-full h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl hover:bg-[#e8b896] active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 focus:outline-none disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
              ) : (
                "發送叫價至聊天室"
              )}
            </button>
          </div>
        </div>
      </div>

      <ImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={images}
        remarks={remarks}
        initialIndex={viewerIndex}
      />
    </div>
  );
}
