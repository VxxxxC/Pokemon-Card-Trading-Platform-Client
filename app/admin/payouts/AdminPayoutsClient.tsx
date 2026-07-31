"use client";

import { useState } from "react";
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
    <div className="flex flex-col min-h-[calc(100dvh-100px)] space-y-4">
      <div className="bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <h1 className="font-sans font-bold text-[20px] text-text-primary">
          財務與結算管控台
        </h1>
        <p className="font-sans text-[12px] text-text-secondary mt-0.5">
          人手 FPS 批處理銷帳與 Stripe Connect 商戶賬戶與佣金收益監控
        </p>
      </div>

      {loadError ? (
        <div className="bg-bg-card rounded-2xl border border-warning/30 p-4 font-sans text-sm text-warning">
          {loadError}
        </div>
      ) : null}

      <PlatformBalanceSection
        balance={data?.stripeBalance ?? null}
        error={data?.stripeBalanceError}
      />

      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab("fps")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "fps"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">🏦 FPS 批次處理</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {fpsTotal}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stripe")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "stripe"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">💳 商戶流水 (Stripe)</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {merchantTotal}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        {activeTab === "fps" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 font-sans text-[12px] text-text-secondary">
              Member FPS 週批 — 下一批處理日：
              <span className="text-brand font-semibold">
                {" "}
                {fpsBatchSchedule.nextBatchDateLabel}（
                {fpsBatchSchedule.batchWeekdayLabel}）
              </span>
              ；截止：
              <span className="text-text-primary font-medium">
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
        )}

        {activeTab === "stripe" && (
          <MerchantConnectLedgerTab
            initialPage={initialMerchantPage}
            loadError={merchantLoadError ?? undefined}
            onTotalChange={setMerchantTotal}
          />
        )}
      </div>
    </div>
  );
}
