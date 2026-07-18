"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { submitUserReport } from "@/app/actions/reports";
import { TitleBadgeIcon } from "@/app/components/profile/TitleBadgeIcon";
import { useMemberTitleDisplay } from "@/app/lib/hooks/useMemberTitleDisplay";
import { useMerchantTitleDisplay } from "@/app/lib/hooks/useMerchantTitleDisplay";
import type { MarketplaceSellerProfile } from "@/lib/marketplace/load-seller-profile";
import { DEFAULT_AVATAR_URL } from "@/lib/profile/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PublicPersonaProfileHeaderProps = {
  profile: MarketplaceSellerProfile;
  rating: number;
  reviewCount: number;
  variant: "public-profile" | "storefront";
  listingCount?: number;
  onStorefrontChat?: () => void;
};

function MerchantIdentityChips({
  profile,
}: {
  profile: MarketplaceSellerProfile;
}) {
  return (
    <>
      <span className="inline-flex items-center font-mono font-bold text-[9px] text-brand bg-[rgba(212,165,116,0.06)] border border-brand/20 px-1.5 py-0.5 rounded-[3px] max-w-max select-none tracking-wide">
        認證商家
      </span>
      {profile.kycVerified ? (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-md border border-success/20 font-bold">
          ✓ KYC 已驗證
        </span>
      ) : null}
      {profile.stripeConnected ? (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand bg-brand/10 px-2 py-0.5 rounded-md border border-brand/20 font-bold">
          ● Stripe 已連結
        </span>
      ) : null}
    </>
  );
}

function ActivityBadgeRow({
  badges,
}: {
  badges: Array<{ id: string; nameZh: string; description: string; badgeUrl: string }>;
}) {
  if (badges.length === 0) {
    return (
      <p className="font-sans text-[12px] text-text-disabled px-1 py-1.5">
        暫無活動徽章
      </p>
    );
  }

  return (
    <>
      {badges.map((badge) => (
        <div
          key={badge.id}
          title={badge.description}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#17130f]/40 border border-[rgba(237,232,224,0.06)] rounded-xl hover:border-brand/20 transition-all cursor-help"
        >
          <TitleBadgeIcon src={badge.badgeUrl} alt={badge.nameZh} size="sm" />
          <span className="font-mono text-[10.5px] text-text-secondary whitespace-nowrap">
            {badge.nameZh}
          </span>
        </div>
      ))}
    </>
  );
}

export function PublicPersonaProfileHeader({
  profile,
  rating,
  reviewCount,
  variant,
  listingCount,
  onStorefrontChat,
}: PublicPersonaProfileHeaderProps) {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const isMerchant = profile.role === "merchant";
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);

  const memberTitles = useMemberTitleDisplay({
    reputationTag: isMerchant ? null : profile.reputationTag,
    completedTradesCount: profile.completedTrades,
  });
  const merchantTitles = useMerchantTitleDisplay({
    reputationTag: isMerchant ? profile.reputationTag : null,
    completedTradesCount: profile.completedTrades,
    ratingScore: profile.ratingScore,
  });

  const titleDisplay = isMerchant ? merchantTitles : memberTitles;
  const mainTitle = titleDisplay.mainTitle;
  const mainTitleLabel = mainTitle?.nameZh ?? profile.level;
  const activityBadges = titleDisplay.activityBadges;

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const openChat = useCallback(() => {
    if (variant === "storefront") {
      onStorefrontChat?.();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("open-global-chat", {
        detail: {
          partnerId: profile.id,
          partnerName: profile.username,
          partnerPersona: "member",
        },
      }),
    );
  }, [onStorefrontChat, profile.id, profile.username, variant]);

  useEffect(() => {
    if (variant === "public-profile" && chatParam === "open") {
      openChat();
    }
  }, [chatParam, openChat, variant]);

  const handleReportConfirm = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    if (!reportCategory) {
      toast.error("❌ 請選擇舉報事項類別");
      return;
    }

    if (isReportSubmitting) {
      return;
    }

    setIsReportSubmitting(true);

    try {
      const result = await submitUserReport({
        reportedUserId: profile.id,
        category: reportCategory,
        details: reportDetails,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("⚠️ 舉報信號已受理", {
        description: `【${reportCategory}】商戶風控隊列已啟動。已對該用戶實施鏈上行為快照。`,
        className:
          "bg-[#26211C] border border-red-500/30 text-[#eae1da] font-sans shadow-2xl",
      });

      setIsReportOpen(false);
      setReportCategory("");
      setReportDetails("");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "提交舉報時發生錯誤";
      toast.error(msg);
    } finally {
      setIsReportSubmitting(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  const sectionClassName =
    variant === "storefront"
      ? "relative flex-1 rounded-2xl border border-[rgba(212,165,116,0.18)] bg-[#26211C] shadow-[0_2px_12px_rgba(0,0,0,0.35)] overflow-hidden"
      : "relative bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden";

  const merchantTopBanner = isMerchant ? profile.topBannerUrl : null;

  const bannerClassName = isMerchant
    ? "h-24 bg-linear-to-r from-[#2a2318] via-[rgba(212,165,116,0.12)] to-[#2a2318]"
    : "h-24 bg-gradient-to-r from-[#2e2925] via-[rgba(140,115,85,0.15)] to-[#2e2925]";

  const metaLine =
    variant === "storefront" && listingCount != null
      ? `${profile.handle} · ${profile.joinDate} · 累計完成 ${profile.completedTrades.toLocaleString()} 筆託管交割 · 目前公開 ${listingCount} 件私域現貨標的`
      : `${profile.handle} · ${profile.joinDate}`;

  return (
    <section className={sectionClassName}>
      {merchantTopBanner ? (
        <div className="relative h-36 sm:h-40 w-full">
          <Image
            src={merchantTopBanner}
            alt={`${profile.username} 店舖橫幅`}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1200px"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#26211C] via-[rgba(38,33,28,0.35)] to-transparent" />
        </div>
      ) : (
        <div className={bannerClassName} />
      )}
      <div
        className={
          variant === "storefront"
            ? "relative space-y-3 min-w-0 px-5 lg:px-6 pb-5 lg:pb-6"
            : "px-6 pb-6"
        }
      >
        <div
          className={
            variant === "storefront"
              ? "flex items-end justify-between gap-4 -mt-10 mb-3"
              : "flex items-end justify-between -mt-10 mb-4"
          }
        >
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full border-4 border-[#26211C] shadow-xl overflow-hidden bg-[#17130f]">
            <Image
              src={profile.avatarUrl || DEFAULT_AVATAR_URL}
              alt={`${profile.username} 頭像`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {variant === "public-profile" ? (
            <div className="text-right">
              <p className="font-mono text-[11px] text-[#d4c4b7] uppercase">
                總完成交易
              </p>
              <p className="font-mono font-bold text-[20px] text-[#eae1da]">
                {profile.completedTrades.toLocaleString()}+
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pr-12">
          <h1
            className={
              variant === "storefront"
                ? "font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] tracking-tight"
                : "font-sans font-bold text-[24px] text-[#eae1da]"
            }
          >
            {profile.username}
          </h1>
          {isMerchant ? <MerchantIdentityChips profile={profile} /> : null}
        </div>

        <p
          className={
            variant === "storefront"
              ? "font-mono text-[11.5px] text-[#d4c4b7] leading-relaxed"
              : "font-mono text-[12px] text-brand mb-1"
          }
        >
          {metaLine}
        </p>

        <div className="flex items-center gap-5 mt-2 pt-3 border-t border-white/5 flex-wrap">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
              {isMerchant ? "商戶級別" : "身分級別"}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[12.5px] font-bold text-brand mt-1 bg-[rgba(212,165,116,0.08)] border border-brand/20 px-2 py-0.5 rounded-md">
              {mainTitle?.badgeUrl ? (
                <TitleBadgeIcon
                  src={mainTitle.badgeUrl}
                  alt={mainTitleLabel}
                  size="sm"
                />
              ) : isMerchant ? (
                <span>🏪</span>
              ) : null}
              {mainTitleLabel}
            </span>
          </div>
          <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
          {variant === "public-profile" ? (
            <button
              type="button"
              className="flex flex-col items-start"
              onClick={() => {
                document
                  .getElementById("rating")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
                信用評分
              </span>
              <span className="font-mono text-[13px] text-[#eae1da] font-bold mt-1">
                ⭐ {Number(rating).toFixed(1)}{" "}
                <span className="text-[#8A8680] font-normal text-[11px]">
                  ({reviewCount} 評)
                </span>
              </span>
            </button>
          ) : (
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
                信用評分
              </span>
              <span className="font-mono text-[13px] text-[#eae1da] font-bold mt-1">
                ⭐ {rating > 0 ? Number(rating).toFixed(1) : "—"}{" "}
                <span className="text-[#8A8680] font-normal text-[11px]">
                  ({reviewCount} 評)
                </span>
              </span>
            </div>
          )}
        </div>

        <p
          className={
            variant === "storefront"
              ? "max-w-[760px] font-sans text-[13.5px] text-[#d4c4b7] leading-relaxed"
              : "font-sans text-[14px] text-[#d4c4b7] leading-relaxed max-w-2xl mt-3"
          }
        >
          {profile.bio}
        </p>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)]">
          <ActivityBadgeRow badges={activityBadges} />
        </div>

        <button
          type="button"
          onClick={openChat}
          className="absolute top-4 right-4 z-12 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#17130f]/60 backdrop-blur-xs border border-[rgba(237,232,224,0.15)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-md focus:outline-none"
          aria-label="開啟對話"
        >
          💬
        </button>

        {variant === "public-profile" ? (
          <AlertDialog
            open={isReportOpen}
            onOpenChange={(open) => {
              setIsReportOpen(open);
              if (!open) {
                setReportCategory("");
                setReportDetails("");
              }
            }}
          >
            <AlertDialogTrigger className="absolute top-2 left-2 shrink-0 flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[12px] font-medium text-red-400/90 transition-colors font-sans lg:border-transparent lg:bg-transparent lg:text-text-disabled/70 lg:hover:text-red-500 cursor-pointer select-none focus:outline-none">
              🚩 舉報用戶
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-[#26211C] text-[#eae1da] border border-white/10 ring-0 shadow-[0_12px_40px_rgba(239,68,68,0.15)] rounded-2xl max-w-sm p-6 animate-scaleUp">
              <AlertDialogHeader className="text-left place-items-start gap-1">
                <AlertDialogTitle className="text-[16px] font-black text-[#eae1da] flex items-center gap-2">
                  🚩 舉報該商戶用戶
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[11px] font-mono leading-normal text-[#8A8680] uppercase tracking-wider">
                  Merchant Compliance Audit Protocol
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 py-3 font-sans text-[13px] w-full">
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide">
                    選擇舉報事項類別
                  </label>
                  <Select
                    value={reportCategory}
                    onValueChange={(value) => setReportCategory(value ?? "")}
                  >
                    <SelectTrigger className="w-full h-10 bg-[#17130f] border border-white/5 rounded-xl text-[#eae1da] font-sans text-[12px] hover:bg-[#2c2722] transition-colors focus:ring-0 focus:border-brand/40">
                      <SelectValue placeholder="點擊展開違規類別" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#26211C] border border-white/10 rounded-xl text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
                      <SelectItem value="惡意欺詐 / 虛假交易">🛑 惡意欺詐 / 虛假交易 (FRAUD)</SelectItem>
                      <SelectItem value="言語辱罵 / 不當言論">💬 言語辱罵 / 不當言論 (HARASS)</SelectItem>
                      <SelectItem value="誘導私下交易">🔒 誘導私下交易 / 逃避中介 (OFFLINE)</SelectItem>
                      <SelectItem value="其他違規行為">⚙️ 其他違規行為 (OTHER)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="public-persona-report-details"
                    className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide"
                  >
                    舉報或投訴之詳細事實敘述
                  </label>
                  <textarea
                    id="public-persona-report-details"
                    value={reportDetails}
                    onChange={(event) => setReportDetails(event.target.value)}
                    placeholder="請具體描述該用戶的違規事實（例如：收到貨件與敘述嚴重不符、在其他渠道進行詐騙等）。"
                    rows={3}
                    className="w-full bg-[#17130f] border border-white/5 rounded-xl text-[12.5px] font-sans text-[#eae1da] placeholder:text-[#50453b] p-3 focus:outline-none focus:border-brand/40 transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 w-full">
                <AlertDialogAction
                  type="button"
                  onClick={handleReportConfirm}
                  disabled={isReportSubmitting}
                  className="w-full h-11 bg-[#ef4444] hover:bg-[#dc2626] text-white font-sans font-black text-[13.5px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(239,68,68,0.18)] active:scale-[0.97] transition-all focus:outline-none"
                >
                  {isReportSubmitting ? "提交中…" : "🚀 確認提交安全審查"}
                </AlertDialogAction>
                <AlertDialogCancel className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none">
                  取消返回
                </AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </section>
  );
}
