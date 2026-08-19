"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelMemberOrder,
  completeBuyerOrder,
} from "@/app/actions/orders";
import type { MemberOrderKind } from "@/lib/member-order/order-kind";
import { MemberOrderCompleteConfirmDialog } from "@/app/components/user/MemberOrderCompleteConfirmDialog";
import { usePaymentCountdown } from "@/app/lib/hooks/usePaymentCountdown";
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
import { cn } from "@/lib/utils";
import {
  SaleOrder,
  OrderStatus,
  STATUS_STEP_INDEX,
} from "@/app/lib/types/trading";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import type { MemberEscrowStatus } from "@/app/lib/member-order/auth-escrow";

interface UserOrderRowProps {
  order: SaleOrder;
  statusBadge?: React.ReactNode;
  orderNumber?: string | null;
  detailOrderId?: string;
  onOpenReview?: (orderId: string, revieweeId: string) => void;
  dbOrderContext?: {
    orderKind?: MemberOrderKind;
    orderId: string;
    revieweeId: string;
    dbStatus: string;
    hasReviewedByMe: boolean;
    useAuthentication?: boolean;
    escrowStatus?: MemberEscrowStatus | null;
    canPay?: boolean;
    pendingPayment?: boolean;
    paymentExpiresAt?: string | null;
    canCompleteMerchantPurchase?: boolean;
    canCancel: boolean;
    onRefresh: () => void;
  };
}

function OrderStatusBadge({
  status,
  labelOverride,
}: {
  status: OrderStatus;
  labelOverride?: string;
}) {
  const stepIdx =
    STATUS_STEP_INDEX[status as Exclude<OrderStatus, "cancelled">];
  const step = stepIdx !== undefined ? ESCROW_STEPS[stepIdx] : null;
  const colorMap: Record<OrderStatus, string> = {
    payment: "text-warning bg-[rgba(239,68,68,0.10)] border border-warning/10",
    custody: "text-brand bg-[rgba(212,165,116,0.12)] border border-brand/10",
    shipped:
      "text-[#3b9eff] bg-[rgba(59,158,255,0.12)] border border-[#3b9eff]/10",
    grading: "text-success bg-[rgba(16,185,129,0.12)] border border-success/10",
    released: "text-text-secondary bg-bg-elevated border border-white/5",
    cancelled: "text-text-disabled bg-bg-elevated border border-white/5",
  };
  return (
    <span
      className={cn(
        "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full",
        colorMap[status] ?? "text-text-disabled bg-bg-elevated",
      )}
    >
      {status === "cancelled" ? "已取消" : (labelOverride ?? step?.label ?? status)}
    </span>
  );
}

export function UserOrderRow({
  order,
  statusBadge,
  orderNumber,
  detailOrderId,
  onOpenReview,
  dbOrderContext,
}: UserOrderRowProps) {
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const displayOrderNumber = orderNumber ?? order.id;
  const navigateOrderId = detailOrderId ?? order.id;

  const isBuyer = order.userContext === "BUYER";
  const counterpartLabel = isBuyer ? "賣家" : "買家";
  const counterpartName = isBuyer ? order.sellerName : order.buyerName;

  const isAuthOrder = Boolean(dbOrderContext?.useAuthentication);
  const isMerchantBuyerOrder =
    dbOrderContext?.orderKind === "merchant" && isBuyer;
  const isPendingDbOrder = dbOrderContext?.dbStatus === "pending";
  // B2C 訂單未完成 Stripe 託管付款前，唔可以確認收貨。
  const isPendingEscrowPayment = Boolean(dbOrderContext?.pendingPayment);
  const canCompleteOrder =
    isPendingDbOrder &&
    isBuyer &&
    !isPendingEscrowPayment &&
    (isMerchantBuyerOrder
      ? Boolean(dbOrderContext?.canCompleteMerchantPurchase)
      : !isAuthOrder);
  const canPayAuthOrder = Boolean(dbOrderContext?.canPay);
  const canCheckoutMerchantOrder = isPendingEscrowPayment && isBuyer;
  const { countdownLabel, isExpired, isExpiringSoon } = usePaymentCountdown(
    isPendingEscrowPayment ? dbOrderContext?.paymentExpiresAt : null,
  );
  const showPendingActions =
    isPendingDbOrder &&
    (canCompleteOrder ||
      canPayAuthOrder ||
      canCheckoutMerchantOrder ||
      Boolean(dbOrderContext?.canCancel));
  const showReviewCta =
    dbOrderContext?.dbStatus === "completed" &&
    !dbOrderContext.hasReviewedByMe &&
    Boolean(onOpenReview);

  const handleComplete = async (): Promise<boolean> => {
    if (!dbOrderContext || isActionLoading) {
      return false;
    }

    setIsActionLoading(true);
    const result = await completeBuyerOrder({
      orderKind: dbOrderContext.orderKind ?? "member",
      orderId: dbOrderContext.orderId,
    });
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success("交易已確認完成！");
    dbOrderContext.onRefresh();

    if (onOpenReview) {
      const reviewOrderId = dbOrderContext.orderId;
      const revieweeId = dbOrderContext.revieweeId;
      window.setTimeout(() => {
        onOpenReview(reviewOrderId, revieweeId);
      }, 0);
    }

    return true;
  };

  const handleCancel = async () => {
    if (!dbOrderContext || isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    const result = await cancelMemberOrder(dbOrderContext.orderId);
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("交易已取消，商品已重新上架");
    dbOrderContext.onRefresh();
  };

  const handleOpenReview = () => {
    if (!dbOrderContext || !onOpenReview || isActionLoading) {
      return;
    }

    onOpenReview(dbOrderContext.orderId, dbOrderContext.revieweeId);
  };

  return (
    <div
      onClick={() =>
        router.push("/profile/user/orderDetail/" + navigateOrderId)
      }
      className="flex items-center justify-between py-3 px-4 bg-bg-card hover:bg-bg-elevated border border-[rgba(237,232,224,0.08)] rounded-xl cursor-pointer transition-all duration-200 animate-fadeIn"
    >
      {/* Left side: Role Badge + Card Name + Status Badge + PSA Grade + Sub context */}
      <div className="flex flex-col gap-1 min-w-0 flex-1 pr-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dynamic Role Label Indicator */}
          {isBuyer ? (
            <span className="font-sans text-[10.5px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded text-[#3b9eff] bg-[#3b9eff]/10 border border-[#3b9eff]/20 shadow-[0_0_12px_rgba(59,158,255,0.15)]">
              買入
            </span>
          ) : (
            <span className="font-sans text-[10.5px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded text-warning bg-warning/10 border border-warning/20 shadow-[0_0_12px_rgba(212,165,116,0.15)]">
              賣出
            </span>
          )}
          {statusBadge ?? (
            <OrderStatusBadge
              status={order.status}
              labelOverride={
                dbOrderContext?.canPay || dbOrderContext?.pendingPayment
                  ? "待付款"
                  : order.statusLabelOverride
              }
            />
          )}

          <h3 className="text-[14.5px] font-mono font-black text-brand truncate max-w-[160px] sm:max-w-xs md:max-w-md">
            {"#" + displayOrderNumber}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-text-disabled">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] text-text-secondary font-medium truncate max-w-[200px] sm:max-w-xs">
              {order.cardName}
            </span>
            <span className="font-sans text-[10px] font-black text-brand bg-brand/5 border border-brand/20 px-1.5 py-0.5 rounded shrink-0">
              {order.grade}
            </span>
          </div>
          <span className="hidden sm:inline text-white/5">|</span>
          <span className="text-[12px] text-text-secondary font-medium">
            {counterpartLabel}：{counterpartName}
          </span>
          {order.createdAt ? (
            <>
              <span className="hidden sm:inline text-white/5">|</span>
              <span
                className="text-[11px] font-mono tracking-tight text-text-disabled"
                suppressHydrationWarning
              >
                {"建立時間：" + order.createdAt}
              </span>
            </>
          ) : null}
          {isPendingEscrowPayment && dbOrderContext?.paymentExpiresAt ? (
            <>
              <span className="hidden sm:inline text-white/5">|</span>
              <span
                className={cn(
                  "text-[11px] font-mono tracking-tight",
                  isExpired
                    ? "text-warning"
                    : isExpiringSoon
                      ? "text-warning"
                      : "text-text-disabled",
                )}
                suppressHydrationWarning
              >
                {isExpired ? "付款已過期" : countdownLabel}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Price + order actions */}
      <div className="flex items-center gap-3 shrink-0">
        {(showPendingActions || showReviewCta) && (
          <div
            className="flex flex-col gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            {showPendingActions && (
              <>
                {canCheckoutMerchantOrder && !isExpired && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => router.push("/checkout/" + navigateOrderId)}
                    className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-brand/15 text-brand border border-brand/25 hover:bg-brand/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    前往付款
                  </button>
                )}
                {canPayAuthOrder && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() =>
                      router.push("/checkout/" + navigateOrderId)
                    }
                    className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-brand/15 text-brand border border-brand/25 hover:bg-brand/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    前往付款
                  </button>
                )}
                {canCompleteOrder && (
                  <MemberOrderCompleteConfirmDialog
                    disabled={isActionLoading}
                    isActionLoading={isActionLoading}
                    onConfirm={handleComplete}
                    triggerClassName="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-success/15 text-success border border-success/25 hover:bg-success/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  />
                )}
                {dbOrderContext?.canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      disabled={isActionLoading}
                      className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[rgba(239,68,68,0.10)] text-warning border border-warning/20 hover:bg-[rgba(239,68,68,0.18)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                          HK$ {order.amount.toLocaleString("zh-TW")}
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
              </>
            )}
            {showReviewCta && (
              <button
                type="button"
                data-testid="order-review-cta"
                disabled={isActionLoading}
                onClick={handleOpenReview}
                className="font-sans text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-brand/30 text-brand bg-brand/5 hover:bg-brand/12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                ✍️ 給予對手評價
              </button>
            )}
          </div>
        )}
        <div className="text-right">
          <span className="text-[15.5px] font-mono font-black text-brand block">
            {"HK$ " + order.amount.toLocaleString("zh-TW")}
          </span>
        </div>
      </div>
    </div>
  );
}
