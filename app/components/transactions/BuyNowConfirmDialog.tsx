"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buyNowListing } from "@/app/actions/buy-now";
import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { useMarketplaceListingDetail } from "@/app/lib/hooks/useMarketplaceListingDetail";
import { completeBuyNowFlow } from "@/lib/chat/complete-buy-now-flow";
import { BUYER_AUTH_DISABLED_COPY } from "@/lib/listings/auth-service-copy";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

export type BuyNowConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: MarketplaceListing | null;
  onNegotiate?: () => void;
};

export function BuyNowConfirmDialog({
  open,
  onOpenChange,
  listing,
}: BuyNowConfirmDialogProps) {
  const router = useRouter();
  const listingId = listing?.id?.trim() ?? null;
  const [useAuthentication, setUseAuthentication] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { detail } = useMarketplaceListingDetail({
    listingId,
    enabled: open && listingId != null,
  });

  const listingAcceptsAuth = detail?.useAuthentication !== false;
  const showAuthToggle = listingAcceptsAuth;

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setUseAuthentication(false);
        setIsSubmitting(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleConfirm = useCallback(async () => {
    if (!listingId || !listing || isSubmitting) {
      return;
    }

    if (useAuthentication && !listingAcceptsAuth) {
      toast.error(BUYER_AUTH_DISABLED_COPY);
      return;
    }

    setIsSubmitting(true);
    const result = await buyNowListing(listingId, useAuthentication);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    const flow = completeBuyNowFlow(result.data, router);
    handleDialogOpenChange(false);

    if (flow === "checkout") {
      toast.success("🧾 交易已成立", {
        description: "請於結帳頁完成託管付款。",
        duration: 4000,
      });
      return;
    }

    toast.success("🧾 交易已成立", {
      description: "已為您開啟與賣家的安全對話，請於對話中完成後續交收步驟。",
      duration: 4000,
    });
  }, [
    isSubmitting,
    listing,
    listingAcceptsAuth,
    listingId,
    handleDialogOpenChange,
    useAuthentication,
    router,
  ]);

  if (!listing) {
    return null;
  }

  const displayName =
    listing.name?.trim() ||
    listing.nameZh?.trim() ||
    listing.nameJa?.trim() ||
    "未知商品";

  const deliverySummary =
    detail?.deliverySummary ?? listing.deliverySummary ?? null;
  const isMerchantListing = listing.sellerPersona === "merchant";
  const sellerHandle = detail?.sellerUsername?.trim();
  const confirmHint = isMerchantListing
    ? "確認後前往託管結帳，並保留與賣家的對話紀錄。"
    : "確認後自動成交並開啟與賣家的聊天視窗。";

  return (
    <AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
      <AlertDialogContent
        className="max-w-[min(100vw-2rem,340px)] gap-3 rounded-2xl border border-[rgba(237,232,224,0.10)] bg-[#26211C] p-4 text-[#eae1da] ring-0"
      >
        <AlertDialogHeader className="text-left space-y-0.5">
          <AlertDialogTitle className="text-[16px] font-black tracking-tight">
            確認立即購買
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[12px] leading-snug text-[#8A8680]">
            一口價成交，無需等待賣家接受出價。{confirmHint}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-[#17130f] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-brand/[0.06] border-b border-white/5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8680]">
              應付一口價
            </span>
            <span className="font-mono font-black text-[22px] text-brand leading-none tabular-nums">
              HK$ {listing.price.toLocaleString("en-HK")}
            </span>
          </div>

          <div className="flex gap-2.5 p-3 min-w-0">
            {listing.image ? (
              <div className="relative w-12 aspect-5/7 shrink-0 rounded-md overflow-hidden bg-[#26211C]">
                <Image
                  src={listing.image}
                  alt={displayName}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-sans font-bold text-[13px] text-[#eae1da] leading-snug line-clamp-2">
                {displayName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <GradeBadge
                  authority={listing.grade.authority}
                  score={listing.grade.score}
                />
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-[#8A8680] truncate">
                <span className="text-[#d4c4b7]">{listing.seller}</span>
                {sellerHandle ? (
                  <span className="text-[#6f6a62]"> · @{sellerHandle}</span>
                ) : null}
              </p>
            </div>
          </div>

          {deliverySummary ? (
            <p className="px-3 pb-3 font-mono text-[10px] text-[#8A8680] border-t border-white/5 pt-2">
              {deliverySummary}
            </p>
          ) : null}
        </div>

        {showAuthToggle ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#17130f] px-3 py-2">
            <span className="text-[12px] font-semibold text-[#eae1da]">
              加購平台鑑定服務
            </span>
            <Switch
              checked={useAuthentication}
              onCheckedChange={setUseAuthentication}
            />
          </div>
        ) : null}

        <AlertDialogFooter
          className="!mx-0 !mb-0 !border-0 !bg-transparent !p-0 flex-row gap-2 sm:flex-row sm:space-x-0"
        >
          <AlertDialogAction
            type="button"
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="h-11 flex-1 rounded-xl bg-brand font-black text-[#1A1612] hover:bg-[#e8b896] disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4" />
                處理中…
              </span>
            ) : (
              "確認立即購買"
            )}
          </AlertDialogAction>

          <AlertDialogCancel
            disabled={isSubmitting}
            className="h-11 flex-1 rounded-xl border border-white/10 bg-[#17130f] text-[12px] font-medium text-[#d4c4b7] hover:bg-[#2c2722] hover:text-[#eae1da] mt-0"
          >
            取消
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type BuyNowGuestLockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPath: string;
};

export function BuyNowGuestLockDialog({
  open,
  onOpenChange,
  redirectPath,
}: BuyNowGuestLockDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl border border-brand/25 bg-[#26211C] p-6 text-[#eae1da]">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-[15px] font-black">
            您目前正以遊客身份觀盤
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[12px] leading-relaxed text-[#d4c4b7]">
            請先登入會員以活化平台第三方雙向鑑定與託管出價機制。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            render={
              <Link
                href={`/auth?redirect=${encodeURIComponent(redirectPath)}`}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand font-black text-[#1A1612] hover:bg-[#e8b896]"
              />
            }
          >
            登入 / 註冊
          </AlertDialogAction>
          <AlertDialogCancel className="h-10 w-full rounded-xl border border-white/10 bg-[#120F0C] mt-0">
            返回
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
