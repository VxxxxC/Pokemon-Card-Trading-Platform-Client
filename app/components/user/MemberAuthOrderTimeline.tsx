"use client";

import {
  getAuthEscrowStepIndexFromStatus,
  type MemberEscrowStatus,
} from "@/app/lib/member-order/auth-escrow";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import type { MemberOrderDbStatus } from "@/app/lib/member-order/p2p";
import { cn } from "@/lib/utils";

type MemberAuthOrderTimelineProps = {
  status: MemberOrderDbStatus | null | undefined;
  escrowStatus?: MemberEscrowStatus | null;
};

export function MemberAuthOrderTimeline({
  status,
  escrowStatus,
}: MemberAuthOrderTimelineProps) {
  const currentStepIdx = getAuthEscrowStepIndexFromStatus(
    escrowStatus,
    status,
  );
  const isCancelled =
    status === "cancelled" || escrowStatus === "cancelled";

  return (
    <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
      <h4 className="font-sans font-bold text-[12.5px] text-text-primary">
        交易狀態
      </h4>

      {isCancelled ? (
        <div className="relative pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
          <div className="relative text-[12.5px] leading-relaxed">
            <div className="absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-[#1A1612] border-white/20" />
            <div className="flex flex-col">
              <span className="font-sans font-bold text-text-disabled">
                已取消
              </span>
              <span className="text-[11px] text-text-disabled">
                交易已中止
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
          {ESCROW_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isActive = idx === currentStepIdx;

            return (
              <div
                key={step.id}
                className="relative text-[12.5px] leading-relaxed"
              >
                <div
                  className={cn(
                    "absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center",
                    isCompleted
                      ? "bg-success border-success text-white"
                      : isActive
                        ? "bg-brand border-brand animate-pulse"
                        : "bg-[#1A1612] border-white/20",
                  )}
                >
                  {isCompleted && (
                    <svg
                      width="6"
                      height="6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

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
