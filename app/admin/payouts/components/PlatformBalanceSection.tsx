"use client";

import { refreshAdminStripeBalance } from "@/app/actions/admin-payouts";
import { BTN_OUTLINE_SM_CLASS } from "@/app/admin/campaigns/campaigns-ui";
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
    <section className="space-y-4 border-b border-white/[0.08] pb-5">
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div>
          <h2 className="font-sans text-[15px] font-semibold text-text-primary">
            Stripe 平台帳戶餘額
          </h2>
          <p className="mt-0.5 font-sans text-[12px] text-text-secondary">
            平台 Stripe Connect 主帳戶即時資金狀況
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`${BTN_OUTLINE_SM_CLASS} gap-1.5 text-brand border-brand/30 hover:text-brand disabled:opacity-60`}
        >
          <RefreshCw
            className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          重新整理
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
            可用餘額 (Available)
          </span>
          <span className="mt-1 block font-mono text-[22px] font-bold tracking-tight text-brand leading-none">
            HK$ {available.toLocaleString("zh-TW")}
          </span>
        </div>
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
            待結算 (Pending)
          </span>
          <span className="mt-1 block font-mono text-[22px] font-bold tracking-tight text-text-primary leading-none">
            HK$ {pending.toLocaleString("zh-TW")}
          </span>
        </div>
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
            今日入賬 (Today In)
          </span>
          <span className="mt-1 block font-mono text-[22px] font-bold tracking-tight text-success leading-none">
            HK$ {todayIn.toLocaleString("zh-TW")}
          </span>
        </div>
      </div>

      <p className="font-mono text-[11px] text-text-secondary">
        最後同步：{lastSyncedAt}
        {error ? (
          <span className="mt-1 block text-warning">{error}</span>
        ) : null}
      </p>
    </section>
  );
}
