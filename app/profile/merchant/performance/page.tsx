"use client";

import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";

// TODO [MOCK DATA]: Replace with real Supabase merchant analytics queries
const monthlyPerformanceData = [
  { month: "1月", revenue: 280000, profit: 70000 },
  { month: "2月", revenue: 320000, profit: 82000 },
  { month: "3月", revenue: 390000, profit: 98000 },
  { month: "4月", revenue: 450000, profit: 112000 },
  { month: "5月", revenue: 384600, profit: 95400 }, // Current active billing cycle
];

export default function MerchantPerformancePage() {
  const router = useRouter();

  return (
    <section
      aria-labelledby="performance-heading"
      className="space-y-6 animate-fadeIn p-4 md:p-6"
    >
      {/* ── 🟢 STAGE 1: Minimalist Header Control ── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="返回"
          className="w-10 h-10 rounded-full bg-[#26211C] border border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
        >
          <IoChevronBack className="w-5 h-5" />
        </button>
        <div>
          <h1
            id="performance-heading"
            className="font-sans font-black text-[22px] lg:text-[26px] text-text-primary tracking-tight"
          >
            店舖經營與業績分析
          </h1>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            Macro Storefront Business Intelligence Terminal
          </p>
        </div>
      </div>

      {/* ── 🟢 STAGE 2: Three Master Executive Financial Metric Cards ── */}
      <div className="flex flex-row justify-evenly gap-4">
        {/* KPI 1: 總營業額 */}
        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            總營業額 (Gross Turnover)
          </p>
          <div className="space-y-1">
            <p className="font-mono text-[24px] font-black text-text-primary leading-none tracking-tight">
              HK$ 4,820,500
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="font-mono text-[10px] text-success bg-[rgba(16,185,129,0.1)] px-1.5 py-0.5 rounded font-bold">
                ▲ +18.5%
              </span>
              <span className="font-sans text-[10.5px] text-text-disabled">
                累計全期總體營收
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: 平均客單價 (AOV) — replaces Conversion Velocity */}
        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-brand/5 to-transparent rounded-bl-full pointer-events-none" />
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            平均客單價 (Average Order Value - AOV)
          </p>
          <div className="space-y-1">
            <p className="font-mono text-[24px] font-black text-text-primary leading-none tracking-tight">
              HK$ 16,720
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="font-mono text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded font-bold">
                ★ 高價值型店舖
              </span>
              <span className="font-sans text-[10.5px] text-text-disabled">
                反映高單價鑑定精選卡熱銷
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 🟢 STAGE 3: CHART 1 - 月度營收與利潤增長趨勢圖 ── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
        <div className="mb-5">
          <h2 className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
            月度營收與利潤增長走勢
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            Monthly Turnover &amp; Profit Margin Visualization Canvas
          </p>
        </div>

        {/* Bar Graphic Grid Block */}
        <div className="relative border border-white/5 rounded-xl bg-[#17130f] p-6 h-64 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 grid grid-rows-4 opacity-5 pointer-events-none">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="border-b border-text-primary" />
            ))}
          </div>

          {/* Dual-bar columns: Revenue + Profit per month */}
          <div className="relative flex-1 flex items-end justify-around h-full pt-4 px-2 gap-4">
            {monthlyPerformanceData.map((data, idx) => (
              <div
                key={idx}
                className="flex-1 flex flex-col justify-end items-center h-full group max-w-[50px] relative"
              >
                <div className="flex items-end gap-1.5 w-full h-full">
                  {/* Revenue Bar */}
                  <div
                    className="flex-1 rounded-t-xs bg-linear-to-t from-brand/40 to-brand/10 border-t border-brand/50 hover:from-brand/60 hover:to-brand/30 transition-all duration-300 cursor-help"
                    style={{ height: `${(data.revenue / 500000) * 100}%` }}
                    title={`營收: HK$ ${data.revenue.toLocaleString()}`}
                  />
                  {/* Profit Bar */}
                  <div
                    className="flex-1 rounded-t-xs bg-linear-to-t from-emerald-500/40 to-emerald-500/10 border-t border-emerald-500/50 hover:from-emerald-500/60 hover:to-emerald-500/30 transition-all duration-300 cursor-help"
                    style={{ height: `${(data.profit / 500000) * 100}%` }}
                    title={`淨利潤: HK$ ${data.profit.toLocaleString()}`}
                  />
                </div>
                <span className="font-sans text-[11px] text-text-secondary mt-2 absolute -bottom-6">
                  {data.month}
                </span>
              </div>
            ))}
          </div>

          {/* X Axis Padding Footer */}
          <div className="h-4" />
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 font-sans text-[11px] text-text-secondary mt-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-xs bg-brand" />
            <span>總體營業額 (Turnover)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>店舖淨利潤 (Net Profit)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
