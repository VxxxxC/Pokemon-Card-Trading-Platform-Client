"use client";

import { cn } from "@/lib/utils";
import {
  getP2pTimelineStep,
  type MemberOrderDbStatus,
} from "@/app/lib/member-order/p2p";

type MemberP2pOrderTimelineProps = {
  status: MemberOrderDbStatus | null | undefined;
};

const TONE_DOT_CLASS: Record<
  ReturnType<typeof getP2pTimelineStep>["tone"],
  string
> = {
  active: "bg-brand border-brand animate-pulse",
  success: "bg-success border-success",
  muted: "bg-[#1A1612] border-white/20",
};

const TONE_LABEL_CLASS: Record<
  ReturnType<typeof getP2pTimelineStep>["tone"],
  string
> = {
  active: "text-brand",
  success: "text-success",
  muted: "text-text-disabled",
};

export function MemberP2pOrderTimeline({
  status,
}: MemberP2pOrderTimelineProps) {
  const step = getP2pTimelineStep(status);

  return (
    <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
      <h4 className="font-sans font-bold text-[12.5px] text-text-primary">
        交易狀態
      </h4>

      <div className="relative pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
        <div className="relative text-[12.5px] leading-relaxed">
          <div
            className={cn(
              "absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all",
              TONE_DOT_CLASS[step.tone],
            )}
          />
          <div className="flex flex-col">
            <span
              className={cn("font-sans font-bold", TONE_LABEL_CLASS[step.tone])}
            >
              {step.label}
            </span>
            <span className="text-[11px] text-text-disabled">
              {step.description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
