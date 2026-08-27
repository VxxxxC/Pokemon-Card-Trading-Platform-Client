"use client";

import { useState, useEffect, useRef, type UIEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buyNowListing } from "@/app/actions/buy-now";
import { makeOffer } from "@/app/actions/offers";
import { completeBuyNowFlow } from "@/lib/chat/complete-buy-now-flow";
import { trackListingView } from "@/lib/listings/track-listing-view";
import { Switch } from "@/components/ui/switch";
import { BUYER_AUTH_DISABLED_COPY, buildBuyerAuthAddOnDescription } from "@/lib/listings/auth-service-copy";
import { usePlatformAuthFee } from "@/lib/platform/use-platform-auth-fee";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { useUIStore } from "@/app/store/useUIStore";
import { useMarketplaceListingDetail } from "@/app/lib/hooks/useMarketplaceListingDetail";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";
import { SELF_OFFER_ERROR_MESSAGE } from "@/lib/auth/dual-persona";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import { ProfileAvatar } from "@/app/components/profile/ProfileAvatar";
import { CertifiedMerchantBadge } from "@/app/components/profile/CertifiedMerchantBadge";
import { SellerReputationMeta } from "@/lib/marketplace/seller-reputation-meta";
import {
  formatTradeGradeLabel,
} from "@/lib/marketplace/listing-display";
import {
  formatSellerIdentityLabel,
  resolveSellerProfilePath,
} from "@/lib/marketplace/seller-identity";
import { isSealedProductGrade } from "@/lib/catalog/item-kind";
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
  const router = useRouter();
  const [customPrice, setCustomPrice] = useState("");
  const [useAuthentication, setUseAuthentication] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const authServiceFeeHkd = usePlatformAuthFee();

  // ImageViewer integration states
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    if (!isOpen) {
      setIsHeaderCompact(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !listingId || isOwnListing) {
      lastViewedListingIdRef.current = null;
      return;
    }

    if (lastViewedListingIdRef.current === listingId) {
      return;
    }

    lastViewedListingIdRef.current = listingId;
    trackListingView({
      listingId,
      sellerId: order?.sellerId,
      currentUserId,
    });
  }, [isOpen, listingId, isOwnListing, order?.sellerId, currentUserId]);

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

  useEffect(() => {
    if (!isOpen) return;

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onDocumentKeyDown);
    closeButtonRef.current?.focus();

    const panel = panelRef.current;
    if (!panel) {
      return () => document.removeEventListener("keydown", onDocumentKeyDown);
    }

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onPanelKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onPanelKeyDown);

    return () => {
      document.removeEventListener("keydown", onDocumentKeyDown);
      panel.removeEventListener("keydown", onPanelKeyDown);
    };
  }, [isOpen, onClose]);

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
    sellerPersona: order.sellerPersona,
  });

  const gradeBadgeLabel = (() => {
    const { authority, score } = order.customGrade;
    if (authority === "Raw Card") {
      return formatTradeGradeLabel("RAW", score || "A");
    }
    return formatTradeGradeLabel(authority, score || null);
  })();

  const handleScrollBody = (event: UIEvent<HTMLDivElement>) => {
    setIsHeaderCompact(event.currentTarget.scrollTop > 36);
  };

  const listingAcceptsBuyerAuth = detail?.useAuthentication !== false;
  const isSealedListing =
    detail != null &&
    isSealedProductGrade(detail.gradingCompany, detail.gradingScore);
  const authFeeApplied =
    useAuthentication && listingAcceptsBuyerAuth && !isSealedListing;
  const buyNowTotal =
    order.price + (authFeeApplied ? authServiceFeeHkd : 0);

  const canBuyNow = !isOwnListing && !isGuest;

  const handleBuyNow = async () => {
    if (!listingId) {
      toast.error("找不到此掛單");
      return;
    }

    setIsBuyingNow(true);
    const result = await buyNowListing(listingId, useAuthentication);
    setIsBuyingNow(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const flow = completeBuyNowFlow(result.data, router);
    onClose();
    if (flow === "checkout") {
      toast.success("🧾 交易已成立", {
        description: "請於結帳頁完成託管付款。",
      });
      return;
    }
    toast.success("🧾 交易已成立", {
      description: "已為您開啟與賣家的安全對話，請於對話中完成後續交收步驟。",
    });
  };

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${card.name} 交易面板`}
        className="relative z-10 w-full max-w-md bg-[#2e2925] border-l border-white/[0.08] flex flex-col h-screen h-[100dvh] shadow-[0_0_50px_rgba(0,0,0,0.85)] translate-x-0 transition-transform duration-300 ease-out rounded-none"
        style={{ height: "100dvh" }}
      >
        {/* Header Section (Fixed, Top) */}
        <div
          className={`px-4 border-b border-white/[0.07] flex items-center gap-2 shrink-0 bg-[#26211C] ${
            isHeaderCompact ? "py-2" : "py-2.5"
          }`}
        >
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {isHeaderCompact ? (
              <p className="font-sans font-bold text-[13px] text-[#eae1da] truncate min-w-0">
                {card.name}
                {gradeBadgeLabel ? (
                  <span className="text-[#8A8680] font-mono text-[11px] font-semibold">
                    {" "}
                    · {gradeBadgeLabel}
                  </span>
                ) : null}
                <span className="font-mono text-brand">
                  {" "}
                  · HK$ {order.price.toLocaleString("en-HK")}
                </span>
              </p>
            ) : (
              <>
                <h2 className="font-sans font-bold text-[15px] text-[#eae1da] truncate min-w-0">
                  {card.name}
                </h2>
                {gradeBadgeLabel ? (
                  <span
                    className="shrink-0 max-w-[40%] truncate font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 bg-[#17130f] text-[#d4c4b7]"
                  >
                    {gradeBadgeLabel}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="關閉交易面板"
            className="size-8 shrink-0 rounded-lg border border-white/[0.06] bg-[#17130f] hover:bg-[#2c2722] flex items-center justify-center transition-colors cursor-pointer text-[#8A8680] hover:text-brand focus:outline-none"
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
                登入後即可議價或立即購買此掛單。
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
          <div
            ref={scrollBodyRef}
            onScroll={handleScrollBody}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none min-h-0"
          >
            <div className="rounded-lg border border-white/[0.08] bg-[#17130f] p-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={sellerProfileHref}
                  onClick={onClose}
                  aria-label={`查看 ${sellerDisplayName} 的個人檔案`}
                  className="flex items-start gap-2.5 min-w-0 group focus:outline-none"
                >
                  <ProfileAvatar
                    avatarUrl={order.sellerAvatarUrl}
                    displayName={sellerDisplayName}
                    className="size-9 shrink-0 border border-white/10"
                    fallbackClassName="bg-[#26211C] text-brand text-xs font-bold font-mono"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-sans font-semibold text-[13px] text-[#eae1da] truncate">
                        {sellerLabel}
                      </span>
                      {order.sellerPersona === "merchant" ? (
                        <CertifiedMerchantBadge />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <SellerReputationMeta
                        rating={order.sellerRating}
                        reviewCount={order.reviewCount}
                        totalTrades={order.sellerTotalTrades}
                      />
                      <span className="font-sans text-[11px] text-brand shrink-0 group-hover:underline">
                        查看個人檔案 →
                      </span>
                    </div>
                    {order.deliverySummary ? (
                      <p className="font-mono text-[10px] text-[#8A8680] mt-1 truncate">
                        {order.deliverySummary}
                      </p>
                    ) : null}
                  </div>
                </Link>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[10px] text-[#8A8680] block">
                    掛牌售價
                  </span>
                  <span className="font-mono font-black text-[18px] text-brand leading-none">
                    HK$ {order.price.toLocaleString("en-HK")}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full select-none">
              <span className="font-sans font-semibold text-[12px] text-[#eae1da] block mb-2">
                賣家實物照
                <span className="text-[#8A8680] font-normal">
                  （{isDetailLoading ? "…" : images.length}）
                </span>
              </span>
              {isDetailLoading ? (
                <div className="grid grid-cols-3 gap-1.5">
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
                <div className="grid grid-cols-3 gap-1.5">
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

            {!isSealedListing ? (
            <div className="rounded-lg border border-white/[0.08] bg-[#17130f] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <span className="font-sans font-semibold text-[12px] text-[#eae1da] block">
                    加購平台鑑定託管
                  </span>
                  <p className="font-sans text-[11px] text-text-secondary leading-snug">
                    {listingAcceptsBuyerAuth
                      ? buildBuyerAuthAddOnDescription(authServiceFeeHkd)
                      : BUYER_AUTH_DISABLED_COPY}
                  </p>
                </div>
                <Switch
                  checked={useAuthentication}
                  onCheckedChange={setUseAuthentication}
                  disabled={!listingAcceptsBuyerAuth || isDetailLoading}
                  className="shrink-0 data-checked:bg-brand data-unchecked:bg-[#39342f] disabled:opacity-40"
                />
              </div>
            </div>
            ) : null}
          </div>

          {/* Bottom Action Footer Container */}
          <div className="px-4 py-2.5 border-t border-white/[0.07] shrink-0 bg-[#26211C] space-y-2">
            {isOwnListing ? (
              <p className="font-sans text-[11px] text-[#8A8680]">
                這是您的掛單，無法對自己的商品出價
              </p>
            ) : (
              <div
                className="flex h-9 min-w-0 rounded-lg border border-white/[0.08] bg-[#17130f] overflow-hidden focus-within:border-brand/40 transition-colors"
              >
                <label htmlFor="exe-negotiation-price" className="sr-only">
                  議價金額 (HK$)
                </label>
                <span className="px-2 font-mono text-[10px] font-bold text-brand bg-[#26211C] border-r border-white/5 flex items-center shrink-0">
                  HK$
                </span>
                <input
                  id="exe-negotiation-price"
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="議價金額"
                  className="flex-1 min-w-0 h-full bg-transparent px-2 font-mono text-[13px] text-brand focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isSubmitting || isBuyingNow || !listingId}
                  onClick={handleSendCounterOffer}
                  className="shrink-0 px-3 border-l border-white/[0.08] text-[#eae1da] font-sans font-semibold text-[12px] hover:bg-[#2c2722] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "發送議價"
                  )}
                </button>
              </div>
            )}
            {canBuyNow ? (
              <button
                type="button"
                disabled={isBuyingNow || isSubmitting || !listingId}
                onClick={handleBuyNow}
                className="w-full h-9 bg-brand text-[#1A1612] font-sans font-bold text-[12px] rounded-lg hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-60"
              >
                {isBuyingNow ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="truncate">
                      {authFeeApplied ? "立即購買（含鑑定）" : "立即購買"}
                    </span>
                    <span className="font-mono shrink-0">
                      HK$ {buyNowTotal.toLocaleString("en-HK")}
                    </span>
                  </>
                )}
              </button>
            ) : null}
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
