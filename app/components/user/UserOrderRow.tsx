"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SaleOrder,
  OrderStatus,
  STATUS_STEP_INDEX,
} from "@/app/lib/types/trading";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";

interface UserOrderRowProps {
  order: SaleOrder;
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
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
      {status === "cancelled" ? "已取消" : (step?.label ?? status)}
    </span>
  );
}

export function UserOrderRow({ order }: UserOrderRowProps) {
  const router = useRouter();

  const isBuyer = order.userContext === "BUYER";
  const counterpartLabel = isBuyer ? "賣家" : "買家";
  const counterpartName = isBuyer ? order.sellerName : order.buyerName;

  return (
    <div
      onClick={() => router.push("/profile/user/orderDetail/" + order.id)}
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
          <OrderStatusBadge status={order.status} />

          <h3 className="text-[14.5px] font-bold text-text-primary truncate max-w-[160px] sm:max-w-xs md:max-w-md">
            {order.cardName}
          </h3>
          <span className="font-sans text-[10px] font-black text-brand bg-brand/5 border border-brand/20 px-1.5 py-0.5 rounded">
            {order.grade}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-text-disabled">
          <span className="text-[12px] text-text-secondary font-medium">
            {counterpartLabel}：{counterpartName}
          </span>
          <span className="hidden sm:inline text-white/5">|</span>
          <span className="text-[11px] font-mono tracking-tight text-brand">
            {"訂單編號: #" + order.id}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <span className="text-[15.5px] font-mono font-black text-brand block">
            {"HK$ " + order.amount.toLocaleString("zh-TW")}
          </span>
        </div>
      </div>
    </div>
  );
}
