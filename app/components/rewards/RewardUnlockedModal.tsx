"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatRewardGrantSummary,
  REWARD_TYPE_LABELS,
  type UnacknowledgedRewardGrant,
} from "@/lib/constants/rewards";

export type RewardUnlockedModalProps = {
  open: boolean;
  grants: UnacknowledgedRewardGrant[];
  onClose: () => void;
  isAcknowledging?: boolean;
};

export function RewardUnlockedModal({
  open,
  grants,
  onClose,
  isAcknowledging = false,
}: RewardUnlockedModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isAcknowledging && onClose()}>
      <DialogContent className="bg-[#26211C] border-[rgba(237,232,224,0.12)] text-[#eae1da] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans text-[18px] text-brand">
            恭喜解鎖獎勵
          </DialogTitle>
          <DialogDescription className="text-[#d4c4b7] text-[13px]">
            你已符合資格，系統已自動發放以下獎勵。
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {grants.map((grant) => (
            <li
              key={grant.userRewardId}
              className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-[#17130f]/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-sans font-bold text-[14px] text-[#eae1da]">
                    {grant.title}
                  </p>
                  {grant.description ? (
                    <p className="mt-1 font-sans text-[12px] text-[#a89b8f] leading-relaxed">
                      {grant.description}
                    </p>
                  ) : null}
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#7a6f65]">
                    {REWARD_TYPE_LABELS[grant.type] ?? grant.type}
                  </p>
                </div>
                <span className="shrink-0 font-mono font-black text-[15px] text-brand">
                  {formatRewardGrantSummary(grant)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          <Link
            href="/profile/user/rewards"
            className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold"
            onClick={onClose}
          >
            查看獎勵專區 →
          </Link>
          <button
            type="button"
            disabled={isAcknowledging}
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-brand text-[#1A1612] font-sans font-bold text-[13px] hover:bg-[#e8b896] disabled:opacity-60"
          >
            {isAcknowledging ? "處理中…" : "太好了"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
