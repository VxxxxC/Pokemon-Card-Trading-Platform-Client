"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { GrUserSettings } from "react-icons/gr";
import { updateUserAvatar } from "@/app/actions/profile";
import { CheckInCard, type CheckInCardStats } from "@/app/components/rewards/CheckInCard";
import { TitleBadgeIcon } from "@/app/components/profile/TitleBadgeIcon";
import {
  useMemberDashboard,
  type MemberDashboardInitialData,
} from "@/app/lib/hooks/useMemberDashboard";
import { useMemberTitleDisplay } from "@/app/lib/hooks/useMemberTitleDisplay";
import { mapTradingOrderToSaleOrder } from "@/app/lib/member-order/map-sale-order";
import { PortfolioStatsSkeleton } from "@/app/components/shared/PortfolioSkeletons";
import { PublicReviewPreviewCard } from "@/app/components/profile/PublicReviewPreviewCard";
import { UserOrderRow } from "@/app/components/user/UserOrderRow";
import { DEFAULT_AVATAR_URL } from "@/lib/profile/avatar";
import { uploadProfileAvatar } from "@/lib/profile/client-upload";

type UserOverviewClientProps = {
  currentUserId: string;
  initialData: MemberDashboardInitialData;
  bootstrapError?: string;
};

function RewardsTicketButton() {
  return (
    <Link href="/profile/user/rewards" className="block w-full group">
      <div className="w-full h-14 bg-gradient-to-r from-[#d4a574] via-[#e2b98f] to-[#d4a574] p-[1px] rounded-2xl shadow-[0_4px_20px_rgba(212,165,116,0.18)] transition-all active:scale-[0.99] cursor-pointer">
        <div className="w-full h-full bg-[#26211C] rounded-[15px] px-4 flex items-center justify-between group-hover:bg-[#2c2722] transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[18px] shrink-0">🎟️</span>
            <div className="text-left min-w-0">
              <p className="font-sans font-black text-[13.5px] text-brand tracking-tight">
                進入獎勵及任務專區
              </p>
            </div>
          </div>
          <span className="text-brand group-hover:translate-x-0.5 transition-transform font-mono text-[14px] font-bold shrink-0">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatProfileHandle(username: string | null | undefined): string {
  const trimmed = username?.trim();
  return trimmed ? `@${trimmed}` : "";
}

function formatDashboardCurrency(value: number): string {
  return `HK$ ${value.toLocaleString("en-HK")}`;
}

export function UserOverviewClient({
  currentUserId,
  initialData,
  bootstrapError,
}: UserOverviewClientProps) {
  const [accountPoints, setAccountPoints] = useState<number | null>(
    initialData.overview?.pointsBalance ?? null,
  );
  const [avatarOverrideUrl, setAvatarOverrideUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const handleCheckInStatsChange = useCallback((stats: CheckInCardStats) => {
    setAccountPoints(stats.pointsBalance);
  }, []);

  const {
    profile,
    tradingStats,
    pointsBalance: overviewPointsBalance,
    pendingOrders: pendingDbOrders,
    reviews,
    publicReviewCount,
    aggregateRating,
    isOverviewLoading,
    isOrdersLoading,
    isReviewsLoading,
    refetch,
  } = useMemberDashboard({
    profileId: currentUserId,
    initialData,
  });

  const { mainTitle, titleProgress, stepper, activityBadges } = useMemberTitleDisplay({
    reputationTag: profile?.reputationTag,
    completedTradesCount: tradingStats?.completedTradesCount,
  });

  const displayPoints = accountPoints ?? overviewPointsBalance ?? 0;

  const displayName = profile?.displayName ?? "會員";
  const profileHandle = formatProfileHandle(profile?.username);
  const joinDateLabel = profile?.joinDateLabel ?? "";
  const avatarUrl = profile?.avatarUrl ?? DEFAULT_AVATAR_URL;
  const displayAvatarUrl = avatarOverrideUrl ?? avatarUrl;
  const ratingScore = profile?.ratingScore ?? aggregateRating;
  const reviewCount = publicReviewCount;

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
        const { cdnUrl } = await uploadProfileAvatar(file);
        const result = await updateUserAvatar(cdnUrl);
        if (!result.success) {
          throw new Error(result.error);
        }

        URL.revokeObjectURL(localPreview);
        setAvatarOverrideUrl(cdnUrl);
        toast.success("頭像已更新");
        refetch();
      } catch (error) {
        URL.revokeObjectURL(localPreview);
        setAvatarOverrideUrl(null);
        toast.error(
          error instanceof Error ? error.message : "頭像上載失敗，請稍後再試",
        );
      } finally {
        setIsAvatarUploading(false);
      }
    },
    [refetch],
  );

  const portfolioStats = useMemo(() => {
    if (!tradingStats) {
      return [];
    }

    const listedNote =
      tradingStats.listedForSaleCount > 0
        ? `${tradingStats.listedForSaleCount} 張待售中`
        : "暫無待售卡牌";

    return [
      {
        label: "成交次數",
        value: tradingStats.completedTradesCount.toLocaleString("en-HK"),
        note: "買入 + 賣出",
      },
      {
        label: "持有卡牌數",
        value: tradingStats.heldCardCount.toLocaleString("en-HK"),
        note: listedNote,
      },
      {
        label: "總卡牌估值",
        value: formatDashboardCurrency(tradingStats.totalMarketValue),
        note: "SNKRDUNK → 平台 → 入手價",
      },
    ];
  }, [tradingStats]);

  const pendingOrders = useMemo(
    () => pendingDbOrders.map(mapTradingOrderToSaleOrder),
    [pendingDbOrders],
  );

  const mainTitleLabel = mainTitle?.nameZh ?? "尚未獲得稱號";

  const directTo = useCallback((sectionId: string) => {
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <>
      {bootstrapError ? (
        <div className="mb-4 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入帳戶總覽：{bootstrapError}
          </p>
        </div>
      ) : null}

      <section
        className="relative mb-5 mt-4 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] shadow-md animate-fadeIn"
        aria-labelledby="user-hero-name"
      >
        <Link
          href="/profile/user/settings"
          className="absolute top-4 right-4 z-12 w-12 h-12 rounded-full bg-[#17130f]/60 backdrop-blur-xs border border-[rgba(237,232,224,0.15)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="設定"
        >
          <div className="p-2 flex flex-row items-center gap-2">
            <GrUserSettings size={18} aria-hidden="true" />
          </div>
        </Link>

        <div className="h-20 bg-gradient-to-r from-[#2e2925] via-[rgba(212,165,116,0.08)] to-[#2e2925]" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative w-20 h-20 shrink-0">
              <div className="relative w-full h-full rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden bg-[#17130f]">
                <Image
                  src={displayAvatarUrl}
                  alt={`${displayName} 的頭像`}
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
                className="absolute -top-0.5 -right-0.5 z-10 w-6 h-6 rounded-full bg-[#17130f]/90 border border-[rgba(237,232,224,0.2)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="更換頭像"
                aria-label="更換頭像"
              >
                <Camera size={12} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1
              id="user-hero-name"
              className="font-sans font-bold text-[22px] text-text-primary tracking-tight"
            >
              {displayName}
            </h1>
          </div>

          <p className="font-mono text-[12px] text-brand mt-0.5">
            {[profileHandle, joinDateLabel].filter(Boolean).join(" · ")}
          </p>

          <div className="flex items-center gap-5 mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)] flex-wrap">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                身分級別
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[12.5px] font-bold text-brand mt-1 bg-[rgba(212,165,116,0.08)] border border-brand/20 px-2 py-0.5 rounded-md">
                {mainTitle?.badgeUrl ? (
                  <TitleBadgeIcon
                    src={mainTitle.badgeUrl}
                    alt={mainTitleLabel}
                    size="sm"
                  />
                ) : null}
                {isOverviewLoading ? "—" : mainTitleLabel}
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col" onClick={() => directTo("reviews")}>
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                信用評分
              </span>
              <span className="font-mono text-[13px] text-text-primary font-bold mt-1">
                ⭐ {ratingScore > 0 ? ratingScore.toFixed(1) : "—"}{" "}
                <span className="text-text-disabled font-normal text-[11px]">
                  ({reviewCount} 評)
                </span>
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-brand font-black uppercase tracking-widest">
                帳戶總積分餘額
              </span>
              <p className="font-mono font-black text-[22px] text-brand leading-none mt-0.5 tracking-tight">
                {displayPoints.toLocaleString()}{" "}
                <span className="font-sans text-[11px] font-bold text-text-primary ml-0.5">
                  PTS
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none mt-5 pt-4 border-t border-[rgba(237,232,224,0.06)]">
            {stepper.map((tier, i) => {
              const isActive = tier.isActive;
              const isDone = tier.isDone;
              return (
                <div key={tier.tier} className="flex items-center shrink-0">
                  <div
                    className={`flex flex-col items-center gap-1.5 ${isActive ? "opacity-100" : isDone ? "opacity-70" : "opacity-30"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${isActive ? "bg-brand border-brand" : isDone ? "bg-[rgba(212,165,116,0.15)] border-brand/30" : "bg-bg-elevated border-[rgba(237,232,224,0.08)]"}`}
                    >
                      <TitleBadgeIcon
                        src={tier.badgeUrl}
                        alt={tier.label}
                        size="sm"
                        fallbackText={String(tier.tier)}
                      />
                    </div>
                    <span
                      className={`font-mono text-[9.5px] text-center leading-tight max-w-14 ${isActive ? "text-brand font-bold" : isDone ? "text-text-secondary" : "text-text-disabled"}`}
                    >
                      {tier.label}
                    </span>
                  </div>
                  {i < stepper.length - 1 && (
                    <div
                      className={`h-px w-5 mx-1 mb-5 ${isDone ? "bg-brand/40" : "bg-bg-elevated"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] text-text-secondary">
                {titleProgress.nextTitleName ? (
                  <>
                    升至 <span className="text-brand">{titleProgress.nextTitleName}</span>
                  </>
                ) : (
                  <span className="text-brand">已達最高稱號</span>
                )}
              </span>
              <span className="font-mono text-[11px] text-text-secondary">
                {isOverviewLoading ? "—" : titleProgress.progressLabel}
              </span>
            </div>
            <div
              className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={titleProgress.completedTrades}
              aria-valuemax={titleProgress.nextTitle?.threshold ?? titleProgress.completedTrades}
              aria-valuemin={0}
            >
              <div
                className="h-full bg-brand rounded-full transition-all duration-700"
                style={{ width: `${titleProgress.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-[rgba(237,232,224,0.04)] pt-3">
            {activityBadges.length === 0 ? (
              <p className="font-sans text-[12px] text-text-disabled px-1 py-1.5">
                暫無活動徽章
              </p>
            ) : (
              activityBadges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.description}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#17130f]/40 border border-[rgba(237,232,224,0.06)] rounded-xl hover:border-brand/20 transition-all cursor-help"
                >
                  <TitleBadgeIcon
                    src={badge.badgeUrl}
                    alt={badge.nameZh}
                    size="sm"
                  />
                  <span className="font-mono text-[10.5px] text-text-secondary whitespace-nowrap">
                    {badge.nameZh}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="stats-heading" className="mb-6 animate-fadeIn">
        <h2 id="stats-heading" className="sr-only">
          資產總覽
        </h2>
        {isOverviewLoading ? (
          <PortfolioStatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {portfolioStats.map(({ label, value, note }) => (
              <div
                key={label}
                className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-xs"
              >
                <p className="font-mono text-[11px] text-text-secondary mb-1.5">
                  {label}
                </p>
                <p className="font-mono font-bold text-[18px] text-text-primary leading-none mb-1">
                  {value}
                </p>
                <p className="font-mono text-[11px] font-medium text-text-disabled">
                  {note}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:gap-8 items-start gap-6 lg:gap-0">
        <div className="space-y-6">
          <div className="block lg:hidden space-y-4">
            <CheckInCard
              onStatsChange={handleCheckInStatsChange}
              initialPointsBalance={initialData.overview?.pointsBalance}
              deferStatsLoad
            />
            <RewardsTicketButton />
          </div>

          <section aria-labelledby="pending-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="pending-heading"
                className="font-sans font-semibold text-[16px] text-text-primary"
              >
                待處理訂單
              </h2>
              <Link
                href="/profile/user/trading?filter=待處理"
                className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold transition-colors"
              >
                查看全部 →
              </Link>
            </div>

            {isOrdersLoading ? (
              <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-8 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto" />
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-12 text-center">
                <p className="font-sans text-[13px] text-text-disabled">
                  目前無待處理訂單
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingOrders.map((order) => (
                  <UserOrderRow
                    key={order.id}
                    order={order}
                    orderNumber={
                      pendingDbOrders.find((row) => row.id === order.id)?.orderNumber
                    }
                    detailOrderId={order.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section id="reviews" aria-labelledby="reviews-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="reviews-heading"
                className="font-sans font-semibold text-[15px] text-text-primary"
              >
                最近收到的信用評價
              </h2>
              <Link
                href={`/profile/${currentUserId}/rating?persona=member`}
                className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold transition-colors"
              >
                查看更多評價 →
              </Link>
            </div>
            {isReviewsLoading ? (
              <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-8 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-12 text-center">
                <p className="font-sans text-[13px] text-text-disabled">
                  暫無收到的評價
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <PublicReviewPreviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="hidden lg:block space-y-4">
          <CheckInCard
            onStatsChange={handleCheckInStatsChange}
            initialPointsBalance={initialData.overview?.pointsBalance}
            deferStatsLoad
          />
          <RewardsTicketButton />
        </div>
      </div>
    </>
  );
}
