"use client";

import Link from "next/link";
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

export default function ModerationOrderContextPanel({
  relatedOrders,
  primaryCategory,
  caseId,
  caseOpen = true,
  isRetryPending = false,
  onRetryRefund,
}: ModerationOrderContextPanelProps) {
  const showPanel =
    relatedOrders.length > 0 || primaryCategory === "fraud" || primaryCategory === "offline_trade";

  if (!showPanel) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
      <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
        關聯訂單
      </h2>

      {relatedOrders.length === 0 ? (
        <p className="mt-2 font-sans text-[12px] text-[#8A8680]">
          {primaryCategory === "offline_trade"
            ? "無平台訂單 — 符合私下交易風險特徵。"
            : "暫無關聯訂單紀錄。"}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {relatedOrders.map((order) => (
            <div
              key={`${order.persona}-${order.id}`}
              className="rounded-xl border border-white/[0.06] bg-[#17130f] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-semibold text-[#eae1da]">
                  {order.orderNumber ?? order.id.slice(0, 8)}
                </span>
                <span className="font-sans text-[11px] text-[#8A8680]">
                  {moderationOrderPersonaLabel(order.persona)}
                </span>
                <span className="font-sans text-[11px] text-[#8A8680]">
                  {moderationOrderSourceLabel(order.source)}
                </span>
              </div>

              <div className="font-sans text-[12px] text-[#d4c4b7] space-y-1">
                <p>
                  金額：HK${order.finalPrice}
                  {order.totalAmount != null ? `（含運費 HK$${order.totalAmount}）` : ""}
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
                  <p>退款窗口至 {formatModerationDateTime(order.refundWindowEndsAt)}</p>
                ) : null}
                {order.refundStatus ? (
                  <p>退款狀態：{moderationRefundStatusLabel(order.refundStatus)}</p>
                ) : null}
                {order.refundEligible ? (
                  <p className="text-[#10b981]">可執行售後退款</p>
                ) : order.refundIneligibleReason ? (
                  <p className="text-[#8A8680]">不可退款：{order.refundIneligibleReason}</p>
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
                  className="h-9 border-white/10 text-[#d4c4b7]"
                >
                  {isRetryPending ? "重試中…" : "重試退款"}
                </Button>
              ) : null}

              <Link
                href={orderDetailHref(order)}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-sans text-[12px] text-[#d4a574] underline"
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
          ))}
        </div>
      )}
    </div>
  );
}
