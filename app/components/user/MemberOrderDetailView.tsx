"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { toast } from "sonner";
import {
  cancelMemberOrder,
  completeBuyerOrder,
  confirmBuyerReceived,
  submitInboundTracking,
  type MemberOrderDetail,
} from "@/app/actions/orders";
import { MemberAuthAdminDevPanel } from "@/app/components/user/MemberAuthAdminDevPanel";
import { MemberOrderCompleteConfirmDialog } from "@/app/components/user/MemberOrderCompleteConfirmDialog";
import { FpsIdCollectDialog } from "@/app/components/user/FpsIdCollectDialog";
import { ProfileAvatar } from "@/app/components/profile/ProfileAvatar";
import { MemberAuthOrderInvoice } from "@/app/components/user/MemberAuthOrderInvoice";
import { MemberAuthOrderTimeline } from "@/app/components/user/MemberAuthOrderTimeline";
import { MemberMerchantB2cOrderInvoice } from "@/app/components/user/MemberMerchantB2cOrderInvoice";
import { MerchantB2cDirectTimeline } from "@/app/components/merchant/MerchantB2cDirectTimeline";
import { usePaymentCountdown } from "@/app/lib/hooks/usePaymentCountdown";
import { MemberP2pOrderInvoice } from "@/app/components/user/MemberP2pOrderInvoice";
import { MemberP2pOrderTimeline } from "@/app/components/user/MemberP2pOrderTimeline";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import { OrderListingPhotoGrid } from "@/app/components/shared/OrderListingPhotoGrid";
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
  formatListingGrade,
  formatMemberOrderDateTime,
  isMeetupOnlyMemberOrder,
  isPendingMemberOrderStatus,
} from "@/app/lib/member-order/p2p";
import {
  formatSellerPayoutHoldUntilLabel,
  formatSellerPayoutStatusLabel,
} from "@/lib/member-order/seller-payout";
import {
  formatMerchantPayoutHoldUntilLabel,
  formatMerchantPayoutStatusLabel,
} from "@/lib/merchant-order/merchant-payout-hold";
import { shouldShowMerchantBuyerPayoutStatus } from "@/lib/merchant-order/display-status";
import { cn } from "@/lib/utils";

type MemberOrderDetailViewProps = {
  order: MemberOrderDetail;
  onRefresh: () => void;
  onOpenReview?: (orderId: string, revieweeId: string) => void;
};

function dispatchPortfolioRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent("inventory-should-refresh"));
  window.dispatchEvent(new CustomEvent("collection-should-refresh"));
}

function fpsCollectDismissStorageKey(sellerId: string): string {
  return `hkcv-fps-collect-dismissed-${sellerId}`;
}

function sellerNeedsFpsDetails(order: MemberOrderDetail): boolean {
  return (
    order.persona === "sell" &&
    order.useAuthentication &&
    (!order.sellerFpsId?.trim() || !order.sellerFpsName?.trim())
  );
}

export function MemberOrderDetailView({
  order,
  onRefresh,
  onOpenReview,
}: MemberOrderDetailViewProps) {
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const isSeller = order.persona === "sell";
  const isBuyer = !isSeller;
  const counterpartLabel = isBuyer ? "賣家" : "買家";
  const counterpartName = order.counterparty.displayName;
  const gradeLabel = formatListingGrade(order.listing);
  const cardMeta =
    (order.product.cardNumber ?? order.product.displayId ?? "—") +
    " · 等級: " +
    gradeLabel;
  const displayOrderNumber = order.orderNumber ?? order.id;
  const createdAtLabel = formatMemberOrderDateTime(order.createdAt);
  const useMerchantB2cEscrowUi = order.orderKind === "merchant";
  const useMeetupUi =
    isMeetupOnlyMemberOrder(order.useAuthentication) && !useMerchantB2cEscrowUi;
  const [inboundTrackingInput, setInboundTrackingInput] = useState("");
  const [inboundCourierInput, setInboundCourierInput] = useState("");
  const [fpsDialogOpen, setFpsDialogOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    if (!sellerNeedsFpsDetails(order)) {
      return false;
    }
    return !sessionStorage.getItem(fpsCollectDismissStorageKey(order.sellerId));
  });

  const needsSellerFps = isSeller && sellerNeedsFpsDetails(order);
  const payoutHoldUntilLabel = formatSellerPayoutHoldUntilLabel(
    order.payoutHoldUntil,
  );
  const buyerConfirmedLabel = order.buyerConfirmedAt
    ? formatMemberOrderDateTime(order.buyerConfirmedAt)
    : null;
  const merchantPayoutHoldUntilLabel = formatMerchantPayoutHoldUntilLabel(
    order.payoutHoldUntil,
  );

  const handleFpsDialogOpenChange = (open: boolean) => {
    setFpsDialogOpen(open);
    if (!open && needsSellerFps && typeof window !== "undefined") {
      sessionStorage.setItem(
        fpsCollectDismissStorageKey(order.sellerId),
        "1",
      );
    }
  };

  const galleryImages =
    order.listingImageUrls.length > 0
      ? order.listingImageUrls
      : order.product.imageUrl
        ? [order.product.imageUrl]
        : [];

  const isPending = isPendingMemberOrderStatus(order.status);
  // B2C 託管訂單未完成 Stripe 付款前，唔可以確認收貨 / 進入交割流程。
  const isPendingEscrowPayment = order.pendingPayment;
  const { countdownLabel, isExpired, isExpiringSoon } = usePaymentCountdown(
    isPendingEscrowPayment ? order.paymentExpiresAt : null,
  );
  const isMerchantPaymentExpired =
    order.merchantEscrowStatus === "refunded" ||
    (isPendingEscrowPayment && isExpired);
  const isMerchantBuyerOrder =
    order.orderKind === "merchant" && order.persona === "buy";
  const canCompletePurchase = isMerchantBuyerOrder
    ? Boolean(order.canCompleteMerchantPurchase)
    : isPending && !isPendingEscrowPayment;
  const showReviewCta =
    order.status === "completed" &&
    !order.hasReviewedByMe &&
    Boolean(onOpenReview);

  const handleComplete = async (): Promise<boolean> => {
    if (isActionLoading) {
      return false;
    }

    setIsActionLoading(true);
    const result = await completeBuyerOrder({
      orderKind: order.orderKind ?? "member",
      orderId: order.id,
    });
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success("交易已確認完成！");
    dispatchPortfolioRefresh();
    onRefresh();

    if (onOpenReview) {
      onOpenReview(order.id, order.counterparty.id);
    }

    return true;
  };

  const handleCancel = async () => {
    if (isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    const result = await cancelMemberOrder(order.id);
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("交易已取消，商品已重新上架");
    dispatchPortfolioRefresh();
    onRefresh();
  };

  const handleSubmitInbound = async () => {
    if (isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    const result = await submitInboundTracking(
      order.id,
      inboundTrackingInput,
      inboundCourierInput,
    );
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("入庫物流單號已提交");
    onRefresh();
  };

  const handleConfirmReceipt = async () => {
    if (isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    const result = await confirmBuyerReceived(order.id);
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("已確認收貨，交易完成！");
    dispatchPortfolioRefresh();
    onRefresh();

    if (onOpenReview) {
      onOpenReview(order.id, order.counterparty.id);
    }
  };

  const handleOpenReview = () => {
    if (!onOpenReview || isActionLoading) {
      return;
    }

    onOpenReview(order.id, order.counterparty.id);
  };

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] font-sans p-6 space-y-5 animate-fadeIn lg:mx-[20%]">
      <FpsIdCollectDialog
        open={fpsDialogOpen}
        onOpenChange={handleFpsDialogOpenChange}
        initialFpsId={order.sellerFpsId}
        initialFpsName={order.sellerFpsName}
        onSaved={onRefresh}
      />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 w-10 px-2.5 rounded-lg bg-bg-elevated font-sans text-md font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>
      </div>

      <div className="flex flex-col gap-y-2">
        <div>
          <span
            className={cn(
              "font-sans text-sm font-black tracking-wide uppercase px-2 py-0.5 rounded border",
              isSeller
                ? "text-warning bg-warning/10 border-warning/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]",
            )}
          >
            {isSeller ? "賣出交易" : "買入交易"}
          </span>
        </div>

        <div className="justify-items-start space-y-2">
          <div className="font-sans font-black text-[22px] text-text-primary leading-tight">
            {order.product.cardName}
          </div>
          <div className="w-full flex flex-col p-6 border border-brand/20 rounded-lg items-start space-y-3">
            <div className="font-mono text-[11px] text-text-secondary">
              {cardMeta}
            </div>
            <div className="font-mono text-[12.5px] text-brand mt-1 space-y-1">
              <p>商品上架序號: {order.listingId}</p>
              <p>訂單號碼: {displayOrderNumber}</p>
              {createdAtLabel ? (
                <p className="font-mono text-[11px] text-text-disabled mt-1">
                  {"建立時間: " + createdAtLabel}
                </p>
              ) : null}
            </div>
            <div className="relative w-10 h-10 shrink-0 shadow-xs mb-1">
              <ProfileAvatar
                avatarUrl={order.counterparty.avatarUrl}
                displayName={counterpartName}
                className="w-10 h-10 border border-white/10"
                fallbackClassName="bg-[#17130f] text-brand text-xs font-bold"
              />
            </div>
            <p className="font-mono font-black text-md text-brand mt-1 text-nowrap">
              {counterpartLabel}：{counterpartName}
            </p>
          </div>
        </div>
      </div>

      {needsSellerFps ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-2">
          <p className="text-[12.5px] text-text-secondary leading-relaxed">
            請補充轉數快收款人姓名及 ID／電話／電郵，以便平台於買家確認收貨後撥款。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFpsDialogOpen(true)}
              className="text-[12px] font-semibold text-brand underline-offset-2 hover:underline"
            >
              立即填寫
            </button>
            <Link
              href="/profile/user/settings"
              className="text-[12px] font-semibold text-brand underline-offset-2 hover:underline"
            >
              前往個人設定
            </Link>
          </div>
        </div>
      ) : null}

      {isSeller &&
      order.useAuthentication &&
      order.sellerSettlementStatus === "pending" ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-1">
          <p className="text-[12.5px] font-semibold text-warning">
            鑑定失敗追償待處理
          </p>
          <p className="text-[12px] text-text-secondary leading-relaxed">
            平台判定為賣方責任。請依平台通知向平台繳付追償款項
            {order.sellerReceivableAmountHkd != null
              ? `（HK$ ${order.sellerReceivableAmountHkd.toLocaleString("zh-HK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}）`
              : ""}
            ，完成後平台將安排寄回卡牌。
          </p>
        </div>
      ) : null}

      {isBuyer &&
        order.orderKind === "merchant" &&
        shouldShowMerchantBuyerPayoutStatus(
          order.merchantPayoutStatus,
          order.pendingPayment,
        ) ? (
        <div className="rounded-xl border border-white/5 bg-[#17130f] p-4 space-y-1">
          <p className="text-[12px] text-text-secondary">撥款狀態</p>
          <p className="text-[13px] font-semibold text-brand">
            {formatMerchantPayoutStatusLabel(order.merchantPayoutStatus)}
          </p>
          {buyerConfirmedLabel ? (
            <p className="text-[11px] font-mono text-text-disabled">
              買家確認收貨：{buyerConfirmedLabel}
            </p>
          ) : null}
          {order.merchantPayoutStatus === "held" &&
          merchantPayoutHoldUntilLabel ? (
            <p className="text-[11px] font-mono text-text-disabled">
              款項保留於平台，預計於 {merchantPayoutHoldUntilLabel} 撥至商戶
            </p>
          ) : null}
        </div>
      ) : null}

      {isSeller && order.useAuthentication && order.sellerPayoutStatus ? (
        <div className="rounded-xl border border-white/5 bg-[#17130f] p-4 space-y-1">
          <p className="text-[12px] text-text-secondary">賣家撥款狀態</p>
          <p className="text-[13px] font-semibold text-brand">
            {formatSellerPayoutStatusLabel(order.sellerPayoutStatus)}
          </p>
          {buyerConfirmedLabel ? (
            <p className="text-[11px] font-mono text-text-disabled">
              買家確認收貨：{buyerConfirmedLabel}
            </p>
          ) : null}
          {payoutHoldUntilLabel &&
          (order.sellerPayoutStatus === "held" ||
            order.sellerPayoutStatus === "ready") ? (
            <p className="text-[11px] font-mono text-text-disabled">
              撥款解凍時間：{payoutHoldUntilLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {isPendingEscrowPayment && (
        <div className="space-y-3 rounded-xl border border-brand/20 bg-[#17130f] p-4">
          <p className="text-[12.5px] text-text-secondary leading-relaxed">
            {isMerchantPaymentExpired
              ? "此訂單付款期限已過，掛單已釋放。請返回市集重新下單。"
              : isBuyer
                ? "此訂單尚未完成託管付款，請於 48 小時內完成 Stripe 全額支付，資金將由平台鎖定託管。"
                : "等待買家完成託管付款，收款後方可安排出貨。"}
          </p>
          {order.paymentExpiresAt && !isMerchantPaymentExpired ? (
            <p
              className={
                isExpiringSoon
                  ? "font-mono text-[11px] text-warning"
                  : "font-mono text-[11px] text-text-disabled"
              }
            >
              {countdownLabel}
            </p>
          ) : null}
          {isBuyer && !isMerchantPaymentExpired && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => router.push("/checkout/" + order.id)}
              className="w-full h-10 rounded-xl bg-brand text-[#1A1612] font-sans font-semibold text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前往付款
            </button>
          )}
          {isBuyer && isMerchantPaymentExpired ? (
            <Link
              href="/marketplace"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-brand/25 bg-brand/10 font-sans text-[13px] font-semibold text-brand"
            >
              返回市集重新下單
            </Link>
          ) : null}
        </div>
      )}

      {useMerchantB2cEscrowUi ? (
        <div className="space-y-4">
          <MerchantB2cDirectTimeline
            escrowStatus={order.merchantEscrowStatus ?? null}
            perspective="buyer"
            shippingMethod={order.shippingMethod}
            payoutStatus={order.merchantPayoutStatus}
          />

          {isPendingEscrowPayment ? null : isBuyer &&
            order.merchantEscrowStatus === "payment_held" ? (
            order.shippingMethod === "meetup" ? (
              canCompletePurchase ? (
                <div className="space-y-3">
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">
                    請與商戶約定面交／自取時間地點，現場點清後確認完成。
                  </p>
                  <MemberOrderCompleteConfirmDialog
                    disabled={isActionLoading}
                    isActionLoading={isActionLoading}
                    onConfirm={handleComplete}
                    triggerClassName="w-full h-10 bg-success text-white font-sans font-semibold text-[13px] rounded-xl hover:bg-success-hover active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ) : null
            ) : (
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                款項已由平台託管，等待商戶安排發貨。
              </p>
            )
          ) : null}

          {(order.sfLockerCode ||
            order.buyerPhone ||
            order.meetupDetail ||
            order.buyerRemark ||
            order.sfAddress) ? (
            <div className="p-4 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl space-y-2">
              <h3 className="font-sans font-bold text-[14px] text-[#eae1da]">
                交收資料
              </h3>
              <div className="font-mono text-[12px] space-y-1.5 text-text-secondary">
                {order.shippingMethod === "meetup" ? (
                  <>
                    {order.buyerPhone ? (
                      <p>
                        <span className="text-text-disabled">聯絡電話：</span>
                        {order.buyerPhone}
                      </p>
                    ) : null}
                    {order.meetupDetail ? (
                      <p>
                        <span className="text-text-disabled">面交備註：</span>
                        {order.meetupDetail}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    {order.buyerPhone ? (
                      <p>
                        <span className="text-text-disabled">聯絡電話：</span>
                        {order.buyerPhone}
                      </p>
                    ) : null}
                    {order.sfLockerCode ? (
                      <p>
                        <span className="text-text-disabled">自提點代碼：</span>
                        {order.sfLockerCode}
                      </p>
                    ) : null}
                    {order.sfAddress ? (
                      <p>
                        <span className="text-text-disabled">收件地址／自提點：</span>
                        {order.sfAddress}
                      </p>
                    ) : null}
                  </>
                )}
                {order.buyerRemark ? (
                  <p>
                    <span className="text-text-disabled">備註：</span>
                    {order.buyerRemark}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {isBuyer &&
          order.merchantEscrowStatus === "shipped" &&
          order.outboundTrackingNo ? (
            <p className="font-mono text-[12px] text-brand">
              物流：
              {order.outboundCourierName
                ? `${order.outboundCourierName} · `
                : ""}
              {order.outboundTrackingNo}
            </p>
          ) : null}

          {isBuyer && canCompletePurchase && order.merchantEscrowStatus === "shipped" && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                商戶已發貨。收到卡牌並驗貨後，請確認完成交易；款項將保留於平台 7 日後撥至商戶。
              </p>
              <MemberOrderCompleteConfirmDialog
                disabled={isActionLoading}
                isActionLoading={isActionLoading}
                onConfirm={handleComplete}
                triggerClassName="w-full h-10 bg-success text-white font-sans font-semibold text-[13px] rounded-xl hover:bg-success-hover active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>
      ) : useMeetupUi ? (
        <div className="space-y-4">
          <MemberP2pOrderTimeline status={order.status} />

          {isPending && !isPendingEscrowPayment && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                請與{isBuyer ? "賣家" : "買家"}
                約定面交時間地點，現場點清錢貨後，
                {isBuyer ? "點擊確認完成。" : "待買家確認完成交易。"}
              </p>
              <div className="flex flex-col gap-2">
                {isBuyer && (
                  <MemberOrderCompleteConfirmDialog
                    disabled={isActionLoading}
                    isActionLoading={isActionLoading}
                    onConfirm={handleComplete}
                    triggerClassName="w-full h-10 bg-success text-white font-sans font-semibold text-[13px] rounded-xl hover:bg-success-hover active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
                {order.canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      disabled={isActionLoading}
                      className="w-full h-10 font-sans font-semibold text-[13px] rounded-xl bg-[rgba(239,68,68,0.10)] text-warning border border-warning/20 hover:bg-[rgba(239,68,68,0.18)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading ? "處理中…" : "取消交易"}
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-sm rounded-2xl border border-[#ef4444]/30 bg-[#26211C] p-6 text-[#eae1da]">
                      <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="text-[15px] font-black">
                          確認取消交易
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] font-mono uppercase tracking-wider text-[#8A8680]">
                          Cancel Order
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <p className="py-3 text-[12.5px] leading-relaxed text-[#d4c4b7]">
                        您即將取消與{" "}
                        <span className="font-bold text-brand">
                          {counterpartName}
                        </span>{" "}
                        的待處理訂單（
                        <span className="font-mono text-warning">
                          {"HK$ " + order.finalPrice.toLocaleString("zh-TW")}
                        </span>
                        ）。確認後商品將重新上架至市集。
                      </p>
                      <div className="flex flex-col gap-2">
                        <AlertDialogAction
                          onClick={() => void handleCancel()}
                          disabled={isActionLoading}
                          className="h-11 rounded-xl bg-[#ef4444] font-black text-white hover:bg-[#dc2626] disabled:opacity-50"
                        >
                          {isActionLoading ? "處理中…" : "確認取消"}
                        </AlertDialogAction>
                        <AlertDialogCancel className="h-10 rounded-xl border border-white/10 bg-[#120F0C]">
                          返回
                        </AlertDialogCancel>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}

          {showReviewCta && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={handleOpenReview}
              className="w-full h-10 font-sans font-semibold text-[13px] rounded-xl border border-brand/30 text-brand bg-brand/5 hover:bg-brand/12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✍️ 給予對手評價
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <MemberAuthOrderTimeline
            status={order.status}
            escrowStatus={order.escrowStatus}
            paymentConfirmedAt={order.paymentConfirmedAt}
          />

          {order.escrowStatus === "payment" && order.canPay && isBuyer ? (
            <div className="space-y-3 rounded-xl border border-brand/20 bg-[#17130f] p-4">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                此訂單尚未完成託管付款，請前往結帳頁完成卡價與鑑定服務費支付。
              </p>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => router.push("/checkout/" + order.id)}
                className="w-full h-10 rounded-xl bg-brand text-[#1A1612] font-sans font-semibold text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前往付款
              </button>
            </div>
          ) : null}

          {order.escrowStatus === "custody" && isSeller ? (
            <div className="space-y-3 rounded-xl border border-white/5 bg-[#17130f] p-4">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                請將卡牌寄往平台倉庫，並填寫快遞公司與物流單號。
              </p>
              {order.inboundTrackingNo ? (
                <p className="font-mono text-[12px] text-brand">
                  已提交：
                  {order.inboundCourierName
                    ? `${order.inboundCourierName} · `
                    : ""}
                  {order.inboundTrackingNo}
                </p>
              ) : (
                <>
                  <input
                    type="text"
                    value={inboundCourierInput}
                    onChange={(event) =>
                      setInboundCourierInput(event.target.value)
                    }
                    placeholder="快遞公司（例如：順豐、DHL）"
                    className="w-full h-10 rounded-lg border border-white/10 bg-[#120f0c] px-3 text-[12px] text-brand"
                  />
                  <input
                    type="text"
                    value={inboundTrackingInput}
                    onChange={(event) =>
                      setInboundTrackingInput(event.target.value)
                    }
                    placeholder="物流單號"
                    className="w-full h-10 rounded-lg border border-white/10 bg-[#120f0c] px-3 text-[12px] text-brand"
                  />
                  <button
                    type="button"
                    disabled={
                      isActionLoading ||
                      !inboundTrackingInput.trim() ||
                      !inboundCourierInput.trim()
                    }
                    onClick={() => void handleSubmitInbound()}
                    className="w-full h-10 rounded-xl bg-brand text-[#1A1612] font-semibold text-[13px] disabled:opacity-50"
                  >
                    提交入庫物流單號
                  </button>
                </>
              )}
            </div>
          ) : null}

          {order.escrowStatus === "custody" && isBuyer ? (
            <p className="text-[12.5px] text-text-secondary">
              等待賣家將卡牌寄至平台倉庫…
            </p>
          ) : null}

          {order.escrowStatus === "shipped" ? (
            <div className="space-y-2 rounded-xl border border-white/5 bg-[#17130f] p-4">
              {order.outboundTrackingNo ? (
                <p className="font-mono text-[12px] text-brand">
                  平台代發物流：
                  {order.outboundCourierName
                    ? `${order.outboundCourierName} · `
                    : ""}
                  {order.outboundTrackingNo}
                </p>
              ) : (
                <p className="text-[12px] text-text-secondary">
                  平台鑑定通過，待上載寄出物流單號。
                </p>
              )}
              {(isMerchantBuyerOrder
                ? order.canCompleteMerchantPurchase
                : order.canConfirmReceipt) ? (
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() =>
                    void (
                      isMerchantBuyerOrder
                        ? handleComplete()
                        : handleConfirmReceipt()
                    )
                  }
                  className="w-full h-10 rounded-xl bg-success text-white font-semibold text-[13px] disabled:opacity-50"
                >
                  確認收貨
                </button>
              ) : null}
            </div>
          ) : null}

          {order.status === "cancelled" && order.useAuthentication ? (
            <p className="text-[12px] text-text-secondary">
              鑑定失敗或交易已取消，模擬全額退款已標記（測試模式）。
            </p>
          ) : null}

          {isPending && order.canCancel && isSeller ? (
            <AlertDialog>
              <AlertDialogTrigger
                disabled={isActionLoading}
                className="w-full h-10 rounded-xl border border-red-400/30 text-red-300 text-[13px] font-semibold disabled:opacity-50"
              >
                取消交易
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#26211C] border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[15px] font-black">
                    確認取消交易
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <p className="text-[12.5px] text-text-secondary">
                  確認後訂單將取消，商品將重新上架。
                </p>
                <div className="flex flex-col gap-2">
                  <AlertDialogAction
                    onClick={() => void handleCancel()}
                    className="h-11 rounded-xl bg-[#ef4444] font-black text-white"
                  >
                    確認取消
                  </AlertDialogAction>
                  <AlertDialogCancel className="h-10 rounded-xl border border-white/10">
                    返回
                  </AlertDialogCancel>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}

          <MemberAuthAdminDevPanel
            orderId={order.id}
            escrowStatus={order.escrowStatus}
            onRefresh={onRefresh}
          />

          {showReviewCta && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={handleOpenReview}
              className="w-full h-10 font-sans font-semibold text-[13px] rounded-xl border border-brand/30 text-brand bg-brand/5 hover:bg-brand/12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✍️ 給予對手評價
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 items-start">
        {useMerchantB2cEscrowUi ? (
          <MemberMerchantB2cOrderInvoice
            itemSubtotal={order.itemSubtotal ?? order.finalPrice}
            shippingFee={order.shippingFee ?? 0}
            shippingMethod={order.shippingMethod ?? null}
            totalAmount={order.totalAmount ?? order.finalPrice}
            authFee={order.authFee ?? 0}
            isSeller={isSeller}
          />
        ) : useMeetupUi ? (
          <MemberP2pOrderInvoice
            finalPrice={order.finalPrice}
            isSeller={isSeller}
          />
        ) : (
          <MemberAuthOrderInvoice
            finalPrice={order.finalPrice}
            isSeller={isSeller}
            orderId={order.id}
            orderNumber={order.orderNumber}
            escrowStatus={order.escrowStatus}
            status={order.status}
          />
        )}

        <OrderListingPhotoGrid
          images={galleryImages}
          altPrefix={order.product.cardName + " 實物照"}
          onImageClick={(photoIdx) => {
            setViewerIndex(photoIdx);
            setIsViewerOpen(true);
          }}
        />
      </div>

      <div className="pt-2">
        <Link
          href="/profile/user/trading"
          className="font-sans text-[13px] font-bold text-brand hover:underline"
        >
          返回交易管理
        </Link>
      </div>

      <ImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={galleryImages}
        initialIndex={viewerIndex}
      />
    </div>
  );
}
