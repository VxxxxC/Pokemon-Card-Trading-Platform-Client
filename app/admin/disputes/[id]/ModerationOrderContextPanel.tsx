"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MerchantB2cDirectTimeline } from "@/app/components/merchant/MerchantB2cDirectTimeline";
import { MemberAuthOrderTimeline } from "@/app/components/user/MemberAuthOrderTimeline";
import { MemberP2pOrderTimeline } from "@/app/components/user/MemberP2pOrderTimeline";
import type { MemberOrderDbStatus } from "@/app/lib/member-order/p2p";
import type { MemberEscrowStatus } from "@/app/lib/member-order/auth-escrow";
import {
  formatModerationDateTime,
  moderationOrderPersonaLabel,
  moderationOrderSourceLabel,
  moderationRefundStatusLabel,
} from "@/lib/moderation/admin-case-presenters";
import { Button } from "@/components/ui/button";
import { BTN_OUTLINE_CLASS } from "./moderation-detail-ui";
import type {
  AdminModerationOrderSummary,
  ReportCategorySlug,
} from "@/lib/moderation/types";
import type { Tables } from "@/types/supabase";

type ModerationOrderContextPanelProps = {
  relatedOrders: AdminModerationOrderSummary[];
  primaryCategory: ReportCategorySlug | null;
  caseId?: string;
  caseOpen?: boolean;
  isRetryPending?: boolean;
  onRetryRefund?: (orderId: string) => void;
};

function orderDetailHref(order: AdminModerationOrderSummary): string {
  if (order.persona === "merchant") {
    return `/profile/merchant/orderDetail/${order.id}`;
  }
  return `/profile/user/orderDetail/${order.id}`;
}

function MemberOrderTimeline({
  order,
}: {
  order: AdminModerationOrderSummary;
}) {
  if (order.useAuthentication) {
    return (
      <MemberAuthOrderTimeline
        status={order.status as MemberOrderDbStatus | null}
        escrowStatus={order.escrowStatus as MemberEscrowStatus | null}
        paymentConfirmedAt={order.paidAt}
      />
    );
  }

  return (
    <MemberP2pOrderTimeline status={order.status as MemberOrderDbStatus | null} />
  );
}

function orderSummaryLine(order: AdminModerationOrderSummary): string {
  const parts = [`HK$${order.finalPrice}`];
  if (order.escrowStatus) {
    parts.push(order.escrowStatus);
  }
  if (order.refundEligible) {
    parts.push("可退款");
  } else if (order.refundIneligibleReason) {
    parts.push(order.refundIneligibleReason);
  } else if (order.refundStatus) {
    parts.push(moderationRefundStatusLabel(order.refundStatus));
  }
  return parts.join(" · ");
}

function OrderContextCard({
  order,
  defaultOpen,
  caseOpen,
  caseId,
  isRetryPending,
  onRetryRefund,
}: {
  order: AdminModerationOrderSummary;
  defaultOpen: boolean;
  caseOpen: boolean;
  caseId?: string;
  isRetryPending: boolean;
  onRetryRefund?: (orderId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-2 px-3 py-3 text-left transition-colors hover:bg-brand/5 active:scale-[0.99]"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-text-primary">
              {order.orderNumber ?? order.id.slice(0, 8)}
            </span>
            <span className="font-sans text-[11px] text-text-disabled">
              {moderationOrderPersonaLabel(order.persona)}
            </span>
            <span className="font-sans text-[11px] text-text-disabled">
              {moderationOrderSourceLabel(order.source)}
            </span>
          </div>
          <p className="mt-1 truncate font-sans text-[11px] text-text-disabled">
            {orderSummaryLine(order)}
          </p>
        </div>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-text-disabled transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-white/[0.06] px-3 pb-3 pt-3">
          <div className="space-y-1 font-sans text-[12px] text-text-secondary">
            <p>
              金額：HK${order.finalPrice}
              {order.totalAmount != null
                ? `（含運費 HK$${order.totalAmount}）`
                : ""}
            </p>
            <p>
              Escrow：{order.escrowStatus ?? "—"}
              {order.status ? ` · 狀態 ${order.status}` : ""}
            </p>
            {order.inboundTrackingNo ? (
              <p>入庫物流：{order.inboundTrackingNo}</p>
            ) : null}
            {order.outboundTrackingNo ? (
              <p>出庫物流：{order.outboundTrackingNo}</p>
            ) : null}
            {order.createdAt ? (
              <p>建立於 {formatModerationDateTime(order.createdAt)}</p>
            ) : null}
            {order.refundWindowEndsAt ? (
              <p>
                退款窗口至 {formatModerationDateTime(order.refundWindowEndsAt)}
              </p>
            ) : null}
            {order.refundStatus ? (
              <p>
                退款狀態：{moderationRefundStatusLabel(order.refundStatus)}
              </p>
            ) : null}
            {order.refundEligible ? (
              <p className="text-success">可執行售後退款</p>
            ) : order.refundIneligibleReason ? (
              <p className="text-text-disabled">
                不可退款：{order.refundIneligibleReason}
              </p>
            ) : null}
          </div>

          {!caseOpen &&
          caseId &&
          onRetryRefund &&
          ["processing", "failed"].includes(
            (order.refundStatus ?? "").toLowerCase(),
          ) ? (
            <Button
              type="button"
              variant="outline"
              disabled={isRetryPending}
              onClick={() => onRetryRefund(order.id)}
              className={`h-9 ${BTN_OUTLINE_CLASS}`}
            >
              {isRetryPending ? "重試中…" : "重試退款"}
            </Button>
          ) : null}

          <Link
            href={orderDetailHref(order)}
            target="_blank"
            rel="noreferrer"
            className="inline-block font-sans text-[12px] text-brand underline"
          >
            在新分頁開啟訂單詳情
          </Link>

          {order.persona === "member" ? (
            <MemberOrderTimeline order={order} />
          ) : (
            <MerchantB2cDirectTimeline
              escrowStatus={
                order.escrowStatus as Tables<"merchant_orders">["escrow_status"]
              }
              perspective="seller"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ModerationOrderContextPanel({
  relatedOrders,
  primaryCategory,
  caseId,
  caseOpen = true,
  isRetryPending = false,
  onRetryRefund,
}: ModerationOrderContextPanelProps) {
  const showPanel =
    relatedOrders.length > 0 ||
    primaryCategory === "fraud" ||
    primaryCategory === "offline_trade";

  if (!showPanel) {
    return null;
  }

  const defaultExpandSingle = relatedOrders.length === 1;

  return (
    <section className="space-y-3 rounded-lg border border-white/[0.08] bg-bg-card/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-[15px] font-bold text-text-primary">
          關聯訂單
        </h2>
        {relatedOrders.length > 0 ? (
          <span className="font-mono text-[12px] text-text-disabled">
            共 {relatedOrders.length} 筆
          </span>
        ) : null}
      </div>

      {relatedOrders.length === 0 ? (
        <p className="font-sans text-[12px] text-text-disabled">
          {primaryCategory === "offline_trade"
            ? "無平台訂單 — 符合私下交易風險特徵。"
            : "暫無關聯訂單紀錄。"}
        </p>
      ) : (
        <div className="space-y-2">
          {relatedOrders.map((order) => (
            <OrderContextCard
              key={`${order.persona}-${order.id}`}
              order={order}
              defaultOpen={defaultExpandSingle}
              caseOpen={caseOpen}
              caseId={caseId}
              isRetryPending={isRetryPending}
              onRetryRefund={onRetryRefund}
            />
          ))}
        </div>
      )}
    </section>
  );
}
