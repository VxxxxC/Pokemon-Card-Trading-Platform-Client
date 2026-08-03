"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buyNowListing } from "@/app/actions/buy-now";
import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
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
  onNegotiate,
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

  return (
    <AlertDialog open={open} onOpenChange={handleDialogOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl border border-brand/25 bg-[#26211C] p-6 text-[#eae1da]">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-[16px] font-black">
            確認立即購買
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[11px] font-mono uppercase tracking-wider text-[#8A8680]">
            Buy Now — Instant Deal
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-[13px] leading-relaxed text-[#d4c4b7]">
          <p>
            您將以{" "}
            <span className="font-mono font-black text-brand">
              HK$ {listing.price.toLocaleString()}
            </span>{" "}
            向{" "}
            <span className="font-bold text-[#eae1da]">{listing.seller}</span>{" "}
            一口價購買：
          </p>
          <p className="font-bold text-[#eae1da]">{displayName}</p>
          {deliverySummary ? (
            <p className="font-mono text-[11px] text-[#8A8680]">
              {deliverySummary}
            </p>
          ) : null}
          <p className="text-[12px] text-text-disabled">
            {isMerchantListing
              ? "確認後將自動成交並前往託管結帳頁完成付款（同時保留賣家對話紀錄），無需等待賣家接受出價。"
              : "確認後將自動成交並開啟與賣家的聊天視窗，無需等待賣家接受出價。"}
          </p>

          {showAuthToggle ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#17130f] px-3 py-2.5">
              <span className="text-[12px] font-semibold text-[#eae1da]">
                加購平台鑑定服務
              </span>
              <Switch
                checked={useAuthentication}
                onCheckedChange={setUseAuthentication}
              />
            </div>
          ) : null}
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            type="button"
            disabled={isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className="h-11 w-full rounded-xl bg-brand font-black text-[#1A1612] hover:bg-[#e8b896] disabled:opacity-60"
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

          {onNegotiate ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                handleDialogOpenChange(false);
                onNegotiate();
              }}
              className="h-10 w-full rounded-xl border border-white/10 bg-transparent text-[12px] font-bold text-brand hover:bg-brand/10 disabled:opacity-60"
            >
              改為議價出價
            </button>
          ) : null}

          <AlertDialogCancel
            disabled={isSubmitting}
            className="h-10 w-full rounded-xl border border-white/10 bg-[#120F0C] mt-0"
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
