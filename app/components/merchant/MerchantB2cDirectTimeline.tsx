"use client";

import type { Tables } from "@/types/supabase";
import { cn } from "@/lib/utils";
import {
  MERCHANT_DIRECT_TIMELINE_STEPS,
  getMerchantDirectBuyerTimelineStepIndex,
  getMerchantDirectTimelineStepIndex,
} from "@/lib/merchant-order/order-timeline-steps";

type MerchantEscrowStatus = Tables<"merchant_orders">["escrow_status"];

type MerchantB2cDirectTimelineProps = {
  escrowStatus: MerchantEscrowStatus | null;
  perspective?: "seller" | "buyer";
};

export function MerchantB2cDirectTimeline({
  escrowStatus,
  perspective = "seller",
}: MerchantB2cDirectTimelineProps) {
  const currentStepIdx =
    perspective === "buyer"
      ? getMerchantDirectBuyerTimelineStepIndex(escrowStatus)
      : getMerchantDirectTimelineStepIndex(escrowStatus);
  const isCancelled = escrowStatus === "refunded";

  return (
    <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
      <h4 className="font-sans font-bold text-[12.5px] text-text-primary">
        交易狀態
      </h4>

      {isCancelled ? (
        <p className="text-[12.5px] text-text-disabled">訂單已取消 / 已退款</p>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
          {MERCHANT_DIRECT_TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx >= 0 && idx < currentStepIdx;
            const isActive = idx === currentStepIdx;

            return (
              <div
                key={step.id}
                className="relative text-[12.5px] leading-relaxed"
              >
                <div
                  className={cn(
                    "absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all",
                    isCompleted
                      ? "bg-success border-success"
                      : isActive
                        ? "bg-brand border-brand animate-pulse"
                        : "bg-[#1A1612] border-white/20",
                  )}
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-sans font-bold",
                      isActive
                        ? "text-brand"
                        : isCompleted
                          ? "text-success"
                          : "text-text-secondary",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-[11px] text-text-disabled">
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
