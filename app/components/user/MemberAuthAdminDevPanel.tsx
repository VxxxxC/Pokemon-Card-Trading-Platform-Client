"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  completeAuthGrading,
  confirmPlatformReceived,
  failMemberAuthOrder,
  runMemberAuthMockFlowDevAction,
  submitOutboundTracking,
} from "@/app/actions/admin-member-orders";
import type { MemberEscrowStatus } from "@/app/lib/member-order/auth-escrow";

type MemberAuthAdminDevPanelProps = {
  orderId: string;
  escrowStatus: MemberEscrowStatus | null;
  onRefresh: () => void;
};

export function MemberAuthAdminDevPanel({
  orderId,
  escrowStatus,
  onRefresh,
}: MemberAuthAdminDevPanelProps) {
  const [outboundTracking, setOutboundTracking] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const runAction = async (action: () => Promise<{ success: boolean; error?: string }>) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    const result = await action();
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "操作失敗");
      return;
    }

    toast.success("平台操作已更新");
    onRefresh();
  };

  const handleRunFullMockFlow = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    const result = await runMemberAuthMockFlowDevAction(orderId);
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Mock 全流程完成：${result.data.stepsRun.join(" → ") || "已是完成狀態"}`,
    );
    onRefresh();
  };

  return (
    <div className="rounded-xl border border-dashed border-violet-400/40 bg-violet-500/5 p-4 space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-violet-300">
        Dev 平台操作（僅開發環境）
      </p>

      {escrowStatus !== "released" &&
      escrowStatus !== "cancelled" &&
      escrowStatus !== null ? (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleRunFullMockFlow()}
          className="w-full h-10 rounded-lg bg-violet-600/80 text-[12px] font-black text-white hover:bg-violet-500 disabled:opacity-50"
        >
          ▶ 一鍵跑完 Mock 全流程（至交易完成）
        </button>
      ) : null}

      {escrowStatus === "custody" ? (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void runAction(() => confirmPlatformReceived(orderId))}
          className="w-full h-9 rounded-lg border border-violet-400/30 text-[12px] font-bold text-violet-200"
        >
          確認平台已收貨 → 鑑定中
        </button>
      ) : null}

      {escrowStatus === "grading" ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void runAction(() => completeAuthGrading(orderId))}
            className="w-full h-9 rounded-lg border border-emerald-400/30 text-[12px] font-bold text-emerald-200"
          >
            鑑定通過 → 待平台代發貨
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void runAction(() => failMemberAuthOrder(orderId))}
            className="w-full h-9 rounded-lg border border-red-400/30 text-[12px] font-bold text-red-200"
          >
            鑑定失敗 → 取消並模擬退款
          </button>
        </div>
      ) : null}

      {escrowStatus === "shipped" ? (
        <div className="space-y-2">
          <input
            type="text"
            value={outboundTracking}
            onChange={(event) => setOutboundTracking(event.target.value)}
            placeholder="平台寄買家順豐單號"
            className="w-full h-10 rounded-lg border border-white/10 bg-[#17130f] px-3 text-[12px] text-brand"
          />
          <button
            type="button"
            disabled={isLoading || !outboundTracking.trim()}
            onClick={() =>
              void runAction(() =>
                submitOutboundTracking(orderId, outboundTracking.trim()),
              )
            }
            className="w-full h-9 rounded-lg border border-violet-400/30 text-[12px] font-bold text-violet-200 disabled:opacity-50"
          >
            上載代發貨單號
          </button>
        </div>
      ) : null}
    </div>
  );
}
