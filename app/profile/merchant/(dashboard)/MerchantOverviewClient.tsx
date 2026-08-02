"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { CiSettings } from "react-icons/ci";
import { updateMerchantShopAvatar } from "@/app/actions/merchant-settings";
import { MerchantOrderRow } from "@/app/components/merchant/MerchantOrderRow";
import { ProfilePersonaSwitch } from "@/app/components/profile/ProfilePersonaSwitch";
import { PublicReviewPreviewCard } from "@/app/components/profile/PublicReviewPreviewCard";
import { TitleBadgeIcon } from "@/app/components/profile/TitleBadgeIcon";
import { useMerchantTitleDisplay } from "@/app/lib/hooks/useMerchantTitleDisplay";
import { mapMerchantTradingOrderToSaleOrder } from "@/app/lib/merchant-order/map-sale-order";
import type { MerchantDashboardInitialData } from "./MerchantOverviewPageData";
import type { DualPersonaContext } from "@/lib/auth/dual-persona";
import { uploadMerchantShopAvatar } from "@/lib/merchant/client-upload";
import { DEFAULT_AVATAR_URL } from "@/lib/profile/avatar";

type MerchantOverviewClientProps = {
  currentUserId: string;
  initialData: MerchantDashboardInitialData;
  dualPersona: DualPersonaContext;
  bootstrapError?: string;
};

function formatDashboardCurrency(value: number): string {
  return `HK$ ${value.toLocaleString("en-HK")}`;
}

function formatShopMeta(handle: string | null, joinDateLabel: string): string {
  return [handle, joinDateLabel].filter(Boolean).join(" · ");
}

export function MerchantOverviewClient({
  currentUserId,
  initialData,
  dualPersona,
  bootstrapError,
}: MerchantOverviewClientProps) {
  const router = useRouter();
  const [avatarOverrideUrl, setAvatarOverrideUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const shop = initialData.overview?.shop;
  const performance = initialData.overview?.performance;

  const handleAvatarEditClick = useCallback(() => {
    if (isAvatarUploading) return;
    avatarFileInputRef.current?.click();
  }, [isAvatarUploading]);

  const handleAvatarFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      const localPreview = URL.createObjectURL(file);
      setAvatarOverrideUrl(localPreview);
      setIsAvatarUploading(true);

      try {
        const { cdnUrl } = await uploadMerchantShopAvatar(file);
        const result = await updateMerchantShopAvatar(cdnUrl);
        if (!result.success) {
          throw new Error(result.error);
        }

        URL.revokeObjectURL(localPreview);
        setAvatarOverrideUrl(cdnUrl);
        toast.success("店舖頭像已更新");
        router.refresh();
      } catch (error) {
        URL.revokeObjectURL(localPreview);
        setAvatarOverrideUrl(null);
        toast.error(
          error instanceof Error ? error.message : "店舖頭像上載失敗，請稍後再試",
        );
      } finally {
        setIsAvatarUploading(false);
      }
    },
    [router],
  );

  const { mainTitle, titleProgress, stepper, activityBadges } = useMerchantTitleDisplay({
    reputationTag: shop?.reputationTag,
    completedTradesCount: shop?.completedTradesCount,
    ratingScore: shop?.ratingScore,
  });

  const pendingOrders = useMemo(
    () => (initialData.pendingOrders ?? []).map(mapMerchantTradingOrderToSaleOrder),
    [initialData.pendingOrders],
  );

  const shopName = shop?.shopName ?? "認證商戶";
  const avatarUrl = shop?.avatarUrl ?? DEFAULT_AVATAR_URL;
  const displayAvatarUrl = avatarOverrideUrl ?? avatarUrl;
  const topBannerUrl = shop?.topBannerUrl ?? null;
  const shopMeta = formatShopMeta(shop?.shopHandle ?? null, shop?.joinDateLabel ?? "");
  const mainTitleLabel = mainTitle?.nameZh ?? "尚未獲得稱號";
  const aggregateRating = initialData.aggregateRating ?? 0;
  const ratingScore =
    (shop?.ratingScore ?? 0) > 0
      ? Number(shop?.ratingScore).toFixed(1)
      : aggregateRating > 0
        ? aggregateRating.toFixed(1)
        : "—";
  const reviewCount = initialData.publicReviewCount ?? 0;
  const totalListings = shop?.activeListingCount ?? 0;
  const monthlyRevenue = performance?.monthlyRevenue ?? 0;
  const monthlyOrderCount = performance?.monthlyOrderCount ?? 0;
  const pendingOrderCount = initialData.pendingOrderCount ?? 0;
  const reviews = initialData.reviews ?? [];

  return (
    <>
      {bootstrapError ? (
        <div className="mb-4 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入商戶總覽：{bootstrapError}
          </p>
        </div>
      ) : null}

      {shop && !shop.kycVerified ? (
        <div className="mb-4 px-4 py-3 bg-[rgba(212,165,116,0.08)] border border-brand/25 rounded-xl">
          <p className="font-sans text-[13px] text-brand">
            商戶入駐審核中 — 審批通過後可上架商品及收款
          </p>
        </div>
      ) : null}

      {/* ── 🟢 1. MERCHANT HERO HEADER (升級版商戶自豪看板) ───────────────── */}
      <section
        className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] animate-fadeIn"
        aria-labelledby="merchant-hero-name"
      >
        <Link
          href="/profile/merchant/settings"
          className="absolute top-4 right-4 z-12 w-12 h-12 rounded-full bg-[#17130f]/60 backdrop-blur-xs border border-[rgba(237,232,224,0.15)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="店舖設定"
        >
          <div className="p-2 flex flex-row items-center gap-2">
            <CiSettings size={24} aria-hidden="true" />
          </div>
        </Link>

        {topBannerUrl ? (
          <div className="relative h-36 sm:h-40 w-full">
            <Image
              src={topBannerUrl}
              alt={`${shopName} 店舖橫幅`}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1200px"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-t from-bg-card via-[rgba(38,33,28,0.35)] to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-linear-to-r from-[#2a2318] via-[rgba(212,165,116,0.12)] to-[#2a2318]" />
        )}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3 gap-3">
            <div className="relative w-20 h-20 shrink-0">
              <div className="relative w-full h-full rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden bg-[#17130f]">
                <Image
                  src={displayAvatarUrl}
                  alt={`${shopName} 的商舖頭像`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {isAvatarUploading ? (
                  <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[#17130f]/70">
                    <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  </div>
                ) : null}
              </div>
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <button
                type="button"
                onClick={handleAvatarEditClick}
                disabled={isAvatarUploading}
                className="absolute -bottom-0.5 -right-0.5 z-10 w-6 h-6 rounded-full bg-[#17130f]/90 border border-[rgba(237,232,224,0.2)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="更換店舖頭像"
                aria-label="更換店舖頭像"
              >
                <Camera size={12} aria-hidden="true" />
              </button>
            </div>
            {dualPersona.hasDualPersona ? (
              <ProfilePersonaSwitch
                activeContext="merchant"
                context={dualPersona}
                className="mb-1 shrink-0"
              />
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <h1
              id="merchant-hero-name"
              className="font-sans font-bold text-[22px] text-text-primary tracking-tight"
            >
              {shopName}
            </h1>
            {shop?.kycVerified ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-md border border-success/20 font-bold">
                ✓ KYC 已驗證
              </span>
            ) : shop ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand bg-brand/10 px-2 py-0.5 rounded-md border border-brand/20 font-bold">
                審核中
              </span>
            ) : null}
            {shop?.stripeConnected ? (
              <a
                href="/api/stripe/connect/dashboard"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-[#635bff] bg-[rgba(99,91,255,0.10)] px-2 py-0.5 rounded-md border border-[rgba(99,91,255,0.25)] font-bold hover:bg-[rgba(99,91,255,0.16)] transition-colors"
              >
                管理 Stripe 收款 →
              </a>
            ) : null}
            {shop?.kycVerified && !shop.stripeConnected ? (
              // 後端接駁 stub：Stripe Connect onboarding 入口（完成後 webhook 更新狀態，樣式留待 frontend 精修）
              <a href="/api/stripe/connect/onboard">
                完成 Stripe 收款設定 →
              </a>
            ) : null}
          </div>
          <p className="font-mono text-[12px] text-text-secondary mt-0.5">
            {shopMeta}
          </p>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)] flex-wrap">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                商戶級別
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold text-brand mt-1 bg-[rgba(212,165,116,0.08)] border border-brand/20 px-2 py-0.5 rounded-md">
                {mainTitle?.badgeUrl ? (
                  <TitleBadgeIcon
                    src={mainTitle.badgeUrl}
                    alt={mainTitleLabel}
                    size="sm"
                  />
                ) : (
                  <span>🏪</span>
                )}
                {mainTitleLabel}
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                信用評分
              </span>
              <span className="font-mono text-[13px] text-text-primary font-bold mt-1">
                ⭐ {ratingScore}{" "}
                <span className="text-text-disabled font-normal text-[11px]">
                  ({reviewCount} 評)
                </span>
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                在庫資產
              </span>
              <span className="font-mono text-[13px] text-text-primary font-bold mt-1">
                {totalListings}{" "}
                <span className="text-[11px] text-text-secondary font-normal">
                  件在售
                </span>
              </span>
            </div>
          </div>

          <div className="pt-4 max-w-xl">
            <div className="relative flex justify-between items-center">
              <div className="absolute top-3.25 left-2 right-2 h-px bg-white/5 z-0" />
              {stepper.map((step) => (
                <div
                  key={step.tier}
                  className="relative flex flex-col items-center z-10 flex-1"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                      step.isActive
                        ? "bg-brand text-[#17130f] shadow-[0_0_10px_rgba(212,165,116,0.35)]"
                        : step.isDone
                          ? "bg-[#322a24] text-brand border border-brand/20"
                          : "bg-bg-card text-text-disabled border border-white/5"
                    }`}
                  >
                    {step.tier}
                  </div>
                  <span
                    className={`font-sans text-[10px] mt-1.5 whitespace-nowrap tracking-tight ${
                      step.isActive
                        ? "text-brand font-bold"
                        : "text-text-disabled"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-xl pt-4 space-y-1.5">
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-text-disabled">
                {titleProgress.nextTitleName ? (
                  <>
                    升至{" "}
                    <span className="text-text-primary font-bold">
                      {titleProgress.nextTitleName}
                    </span>
                  </>
                ) : (
                  <span className="text-text-primary font-bold">已達最高稱號</span>
                )}
              </span>
              <span className="text-brand font-bold">{titleProgress.progressLabel}</span>
            </div>
            <div
              className="w-full h-1.5 bg-[#17130f] rounded-full overflow-hidden border border-white/5"
              role="progressbar"
              aria-valuenow={titleProgress.completedTrades}
              aria-valuemax={
                titleProgress.nextTitle?.threshold ?? titleProgress.completedTrades
              }
              aria-valuemin={0}
            >
              <div
                className="h-full bg-linear-to-r from-[#d4a574] to-[#e8b896] rounded-full transition-all duration-500"
                style={{ width: `${titleProgress.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pt-4 pb-0.5 scrollbar-none max-w-xl">
            {activityBadges.length === 0 ? (
              <p className="font-sans text-[12px] text-text-disabled px-1 py-1">
                暫無活動徽章
              </p>
            ) : (
              activityBadges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.description}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[#17130f] border border-[rgba(237,232,224,0.06)] rounded-lg"
                >
                  <TitleBadgeIcon src={badge.badgeUrl} alt={badge.nameZh} size="sm" />
                  <span className="font-mono text-[10.5px] text-[#d4c4b7]">
                    {badge.nameZh}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="revenue-heading" className="mb-5">
        <h2 id="revenue-heading" className="sr-only">
          經營業績與快報分析
        </h2>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 space-y-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-text-secondary uppercase tracking-wider select-none">
                本月營收
              </p>
              <p className="font-mono font-black text-[20px] md:text-[23px] text-text-primary leading-none tracking-tight">
                {formatDashboardCurrency(monthlyRevenue)}
              </p>
            </div>

            <div className="space-y-1 pl-4 border-l border-white/5">
              <p className="font-mono text-[11px] text-text-secondary uppercase tracking-wider select-none">
                本月訂單
              </p>
              <p className="font-mono font-black text-[20px] md:text-[23px] text-text-primary leading-none tracking-tight">
                {monthlyOrderCount}{" "}
                <span className="font-sans text-[12px] text-text-secondary font-normal">
                  單
                </span>
              </p>
              <p className="font-mono text-[11px] text-warning font-medium">
                {pendingOrderCount} 件待處理
              </p>
            </div>
          </div>

          <div className="pt-0.5">
            <Link
              href="/profile/merchant/performance"
              className="flex items-center justify-center gap-1.5 w-full h-11 bg-linear-to-r from-[#d4a574] to-[#e8b896] hover:from-[#e8b896] hover:to-[#d4a574] text-[#17130f] font-sans text-[13.5px] font-black rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(212,165,116,0.18)] active:scale-[0.98] cursor-pointer"
              title="進入商戶數據與業績分析控制艙"
            >
              <span>經營分析 📈</span>
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="pending-heading" className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="pending-heading"
            className="font-sans font-semibold text-[16px] text-text-primary"
          >
            待處理訂單
          </h2>
          <Link
            href="/profile/merchant/trading?filter=待處理"
            className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors font-bold"
          >
            查看全部 →
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-12 text-center">
            <p className="font-sans text-[13px] text-text-disabled">
              目前無待處理訂單
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingOrders.map((order) => (
              <MerchantOrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="rating-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="rating-heading"
            className="font-sans font-semibold text-[15px] text-text-primary"
          >
            最近收到的信用評價
          </h2>
          <Link
            href={`/profile/${currentUserId}/rating?persona=merchant`}
            className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors font-bold"
          >
            查看更多評價 →
          </Link>
        </div>
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-12 text-center">
              <p className="font-sans text-[13px] text-text-disabled">
                暫無信用評價
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <PublicReviewPreviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </section>
    </>
  );
}
