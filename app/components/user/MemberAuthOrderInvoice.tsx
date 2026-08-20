"use client";

import {
  MEMBER_AUTH_PLATFORM_SUBSIDY,
  MEMBER_AUTH_SERVICE_FEE,
  MEMBER_AUTH_SHIPPING_FEE,
} from "@/app/lib/member-order/p2p";
import { cn } from "@/lib/utils";

type MemberAuthOrderInvoiceProps = {
  finalPrice: number;
  isSeller: boolean;
  orderId?: string;
  orderNumber?: string | null;
  escrowStatus?: string | null;
  status?: string | null;
  payoutId?: string;
  releasedAmount?: number;
  platformFee?: number;
  releaseStatus?: "pending" | "completed" | "rejected" | string;
};

export function MemberAuthOrderInvoice({
  finalPrice,
  isSeller,
  orderId,
  orderNumber,
  escrowStatus,
  status,
  payoutId,
  releasedAmount,
  platformFee,
  releaseStatus: explicitReleaseStatus,
}: MemberAuthOrderInvoiceProps) {
  const totalAmount = finalPrice + MEMBER_AUTH_SERVICE_FEE;

  // Resolve Escrow Release details
  const displayPayoutId =
    payoutId ??
    `PO-${orderNumber ? orderNumber.replace("ORD-", "") : orderId ? orderId.slice(0, 8).toUpperCase() : "20260721-881"}`;
  const displayReleasedAmount = releasedAmount ?? finalPrice;
  const displayPlatformFee = platformFee ?? MEMBER_AUTH_SERVICE_FEE;

  const currentReleaseStatus = (() => {
    if (explicitReleaseStatus) return explicitReleaseStatus;
    if (status === "completed" || escrowStatus === "released")
      return "completed";
    if (status === "cancelled" || explicitReleaseStatus === "rejected")
      return "rejected";
    return "pending";
  })();

  const releaseBadge = (() => {
    switch (currentReleaseStatus) {
      case "completed":
        return (
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border bg-emerald-950/80 text-emerald-400 border-emerald-500/30">
            已完成
          </span>
        );
      case "rejected":
        return (
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border bg-rose-950/80 text-rose-400 border-rose-500/30">
            已駁回
          </span>
        );
      default:
        return (
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border bg-amber-950/80 text-amber-400 border-amber-500/30">
            待處理
          </span>
        );
    }
  })();

  return (
    <div className="p-5 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl space-y-4 shadow-md animate-fadeIn">
      <div className="flex items-center justify-between pb-2">
        <h3 className="font-sans font-extrabold text-[14.5px] text-[#eae1da]">
          🧾 交易資產最終交收電子收據
        </h3>
        <span
          className={cn(
            "font-sans text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded border",
            isSeller
              ? "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]",
          )}
        >
          {isSeller ? "賣出交易" : "買入交易"}
        </span>
      </div>

      <div className="border-t border-[rgba(237,232,224,0.06)] font-mono text-[12px] space-y-2 text-text-secondary">
        <div className="flex justify-between">
          <span>商品最終成交價</span>
          <span className="text-text-primary">
            {"HK$ " + finalPrice.toLocaleString("zh-TW")}
          </span>
        </div>
        <div className="flex justify-between">
          <span>速遞本港運費</span>
          <span className="text-text-primary">
            {"HK$ " + MEMBER_AUTH_SHIPPING_FEE.toLocaleString("zh-TW")}
          </span>
        </div>
        <div className="flex justify-between text-[#ef4444]">
          {/* TODO: depends on coupon redeem */}
          <span>免郵補貼</span>
          <span>
            {"-HK$ " + MEMBER_AUTH_PLATFORM_SUBSIDY.toLocaleString("zh-TW")}
          </span>
        </div>
        <div className="flex justify-between text-brand">
          {/* TODO: depends on admin settings for authentication charge */}
          <span>鑑定服務費</span>
          <span className="font-bold">
            {"HK$ " + MEMBER_AUTH_SERVICE_FEE.toLocaleString("zh-TW")}
          </span>
        </div>

        <div className="border-t border-[rgba(237,232,224,0.08)] pt-3 flex justify-between items-center text-[#eae1da] font-black text-[14px] md:text-[16px]">
          <span>{isSeller ? "最終實收總額" : "最終扣款總額"}</span>
          <span className="text-brand font-mono text-[18px] md:text-[24px]">
            {isSeller
              ? "HK$ " +
                (totalAmount - MEMBER_AUTH_SERVICE_FEE).toLocaleString("zh-TW")
              : "HK$ " + totalAmount.toLocaleString("zh-TW")}
          </span>
        </div>

        {/* Detailed Escrow Release to Seller Section */}
        {isSeller ? (
          <div className="mt-4 pt-3 border-t border-[rgba(237,232,224,0.08)] bg-[#17130f]/60 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <span className="font-sans font-bold text-[12px] text-text-primary">
                🔒 資金放款明細{" "}
              </span>
              {releaseBadge}
            </div>
            <div className="flex justify-between items-center text-[11.5px]">
              <span className="text-text-secondary">提現單號</span>
              <span className="font-mono text-brand font-medium">
                {displayPayoutId}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11.5px]">
              <span className="text-text-secondary">釋放金額 </span>
              <span className="font-mono text-brand font-bold">
                {"HK$ " + displayReleasedAmount.toLocaleString("zh-TW")}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11.5px]">
              <span className="text-text-secondary">鑑定服務費</span>
              {/* TODO: depends on admin settings for authentication charge */}
              <span className="font-mono text-text-primary">
                {"HK$ " + displayPlatformFee.toLocaleString("zh-TW")}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
