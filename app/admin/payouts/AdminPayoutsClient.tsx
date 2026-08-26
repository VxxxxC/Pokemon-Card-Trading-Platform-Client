"use client";

import { useState } from "react";
import {
  FILTER_CHIP_CLASS,
} from "@/app/admin/campaigns/campaigns-ui";
import MerchantConnectLedgerTab from "./components/MerchantConnectLedgerTab";
import FpsLedgerTab from "./components/FpsLedgerTab";
import PlatformBalanceSection from "./components/PlatformBalanceSection";
import type {
  AdminPayoutsPageData,
  FpsBatchScheduleInfo,
  FpsPayoutPage,
  MerchantTransferPage,
} from "@/lib/admin-payouts/types";

type AdminPayoutsClientProps = {
  data: AdminPayoutsPageData | null;
  loadError: string | null;
  fpsBatchSchedule: FpsBatchScheduleInfo;
  initialMerchantPage: MerchantTransferPage;
  merchantLoadError?: string | null;
  initialFpsPage: FpsPayoutPage;
  fpsLoadError?: string | null;
};

export default function AdminPayoutsClient({
  data,
  loadError,
  fpsBatchSchedule,
  initialMerchantPage,
  merchantLoadError,
  initialFpsPage,
  fpsLoadError,
}: AdminPayoutsClientProps) {
  const [activeTab, setActiveTab] = useState<"fps" | "stripe">("fps");
  const [merchantTotal, setMerchantTotal] = useState(initialMerchantPage.total);
  const [fpsTotal, setFpsTotal] = useState(initialFpsPage.total);

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">
              財務與結算管控台
            </h1>
            <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-brand">
              FINANCE
            </span>
          </div>
          <p className="mt-1 font-sans text-[13px] text-text-secondary">
            人手 FPS 批處理銷帳與 Stripe Connect 商戶賬戶與佣金收益監控
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("fps")}
            className={`${FILTER_CHIP_CLASS(activeTab === "fps")} gap-1.5`}
          >
            FPS 批次
            <span
              className={`font-mono text-[10px] tabular-nums ${
                activeTab === "fps" ? "text-brand/80" : "text-text-disabled"
              }`}
            >
              {fpsTotal.toLocaleString("en-US")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stripe")}
            className={`${FILTER_CHIP_CLASS(activeTab === "stripe")} gap-1.5`}
          >
            商戶流水
            <span
              className={`font-mono text-[10px] tabular-nums ${
                activeTab === "stripe" ? "text-brand/80" : "text-text-disabled"
              }`}
            >
              {merchantTotal.toLocaleString("en-US")}
            </span>
          </button>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 font-sans text-[13px] text-warning">
          {loadError}
        </div>
      ) : null}

      <PlatformBalanceSection
        balance={data?.stripeBalance ?? null}
        error={data?.stripeBalanceError}
      />

      {activeTab === "fps" ? (
        <div className="space-y-4 border-b border-white/[0.08] pb-5">
          <div className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2.5 font-sans text-[12px] text-text-secondary">
            Member FPS 週批 — 下一批處理日：
            <span className="font-semibold text-brand">
              {" "}
              {fpsBatchSchedule.nextBatchDateLabel}（
              {fpsBatchSchedule.batchWeekdayLabel}）
            </span>
            ；截止：
            <span className="font-medium text-text-primary">
              {" "}
              {fpsBatchSchedule.cutoffLabel}
            </span>
            前 ready 的提現單。
          </div>

          <FpsLedgerTab
            initialPage={initialFpsPage}
            loadError={fpsLoadError ?? undefined}
            onTotalChange={setFpsTotal}
          />
        </div>
      ) : (
        <div className="space-y-4 border-b border-white/[0.08] pb-5">
          <MerchantConnectLedgerTab
            initialPage={initialMerchantPage}
            loadError={merchantLoadError ?? undefined}
            onTotalChange={setMerchantTotal}
          />
        </div>
      )}
    </div>
  );
}
