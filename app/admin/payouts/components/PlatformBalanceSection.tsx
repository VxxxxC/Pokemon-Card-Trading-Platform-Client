"use client";

import { refreshAdminStripeBalance } from "@/app/actions/admin-payouts";
import type { AdminPayoutsStripeBalance } from "@/lib/admin-payouts/types";
import { formatAdminDateTime } from "@/lib/admin-payouts/format";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type PlatformBalanceSectionProps = {
  balance: AdminPayoutsStripeBalance | null;
  error?: string | null;
};

export default function PlatformBalanceSection({
  balance,
  error,
}: PlatformBalanceSectionProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const available = balance?.available ?? 0;
  const pending = balance?.pending ?? 0;
  const todayIn = balance?.todayIn ?? 0;
  const lastSyncedAt = balance?.lastSyncedAt
    ? formatAdminDateTime(balance.lastSyncedAt)
    : "—";

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshAdminStripeBalance();
      if (result.success) {
        toast.success("已重新整理 Stripe 帳戶餘額");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 relative overflow-hidden">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-sans font-bold text-[16px] text-text-primary">
            Stripe 平台帳戶餘額
          </h2>
          <p className="font-sans text-[12px] text-text-secondary mt-0.5">
            平台 Stripe Connect 主帳戶即時資金狀況
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="min-h-[44px] h-9 px-3 border border-brand/30 text-brand font-sans text-[12px] rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          重新整理
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
            可用餘額 (Available)
          </span>
          <span className="font-mono font-bold text-[24px] text-brand tracking-tight leading-none block mt-1">
            HK$ {available.toLocaleString("zh-TW")}
          </span>
        </div>
        <div>
          <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
            待結算 (Pending)
          </span>
          <span className="font-mono font-bold text-[24px] text-text-primary tracking-tight leading-none block mt-1">
            HK$ {pending.toLocaleString("zh-TW")}
          </span>
        </div>
        <div>
          <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
            今日入賬 (Today In)
          </span>
          <span className="font-mono font-bold text-[24px] text-success tracking-tight leading-none block mt-1">
            HK$ {todayIn.toLocaleString("zh-TW")}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[rgba(237,232,224,0.08)] font-mono text-[11px] text-text-secondary">
        最後同步：{lastSyncedAt}
        {error ? (
          <span className="block mt-1 text-warning">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
