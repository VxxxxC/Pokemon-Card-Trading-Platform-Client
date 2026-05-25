import type { Metadata } from "next";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export const metadata: Metadata = {
  title: "營運設定 — PokéTrade JP 後台",
  description: "調整定額運費補貼、爬蟲頻率及外部 API 授權",
};

export default function AdminSettingsPage() {
  return (
    <div className="max-w-180 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-2">
        <h1 className="font-sans font-bold text-[22px] text-text-primary">營運設定</h1>
        <p className="font-sans text-[13px] text-text-secondary mt-0.5">
          管理員可彈性調整平台核心參數，設定立即生效
        </p>
      </div>

      {/* ── Shipping Subsidy ─────────────────────────────────────────── */}
      {/* TODO [BACKEND]: "儲存運費設定" button has no handler — must call server action to upsert `platform_settings.shipping_subsidy_amount` in Supabase */}
      <section
        aria-labelledby="shipping-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="shipping-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-1">
          定額運費補貼設定
        </h2>
        <p className="font-sans text-[13px] text-text-secondary mb-4">
          每筆成交後，平台從佣金中補貼固定金額至賣家，涵蓋順豐標準陸運單程費用。
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="subsidy-amount" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              補貼金額 (JPY / 件)
            </label>
            <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
              <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)]">¥</span>
              <input
                id="subsidy-amount"
                type="number"
                defaultValue={200}
                min={0}
                max={1000}
                className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-text-primary focus:outline-none"
              />
            </div>
            <p className="font-mono text-[10px] text-text-disabled mt-1">建議範圍：¥100 – ¥500 / 件</p>
          </div>
          <div>
            <label htmlFor="subsidy-max-monthly" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              每位商戶月度上限
            </label>
            <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
              <span className="px-3 font-mono text-[13px] text-text-disabled border-r border-[rgba(237,232,224,0.08)]">¥</span>
              <input
                id="subsidy-max-monthly"
                type="number"
                defaultValue={5000}
                className="flex-1 h-full bg-transparent px-3 font-mono text-[14px] text-text-primary focus:outline-none"
              />
            </div>
            <p className="font-mono text-[10px] text-text-disabled mt-1">超出上限後，補貼停止計算</p>
          </div>
        </div>
        <button type="button" className="mt-4 h-10 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform">
          儲存運費設定
        </button>
      </section>

      {/* ── Scraper Settings ──────────────────────────────────────────── */}
      {/* TODO [BACKEND]: "立即觸發" button has no handler — must call server action to trigger Mercari/SKUNK scraper job; scraper status ("上次: 2小時前") is hardcoded */}
      {/* TODO [MOCK DATA]: Scraper last-run timestamps are hardcoded — replace with `scraper_jobs.last_run_at` from Supabase */}
      <section
        aria-labelledby="scraper-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="scraper-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-1">
          數據爬蟲頻率設定
        </h2>
        <p className="font-sans text-[13px] text-text-secondary mb-4">
          調整 Mercari JP 已成交記錄及 SKUNK 估值數據的爬取頻率。
        </p>
        <div className="space-y-4">
          {[
            { id: "scraper-mercari", label: "Mercari JP 爬蟲", desc: "已成交卡牌價格記錄（Top 100 熱門卡）", defaultVal: "4" },
            { id: "scraper-skunk",   label: "SKUNK 估值爬蟲",  desc: "PSA / BGS / CGC 鑑定卡市值估算",     defaultVal: "12" },
          ].map(({ id, label, desc, defaultVal }) => (
            <div key={id}>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className="font-sans text-[14px] font-medium text-text-primary">{label}</p>
                  <p className="font-mono text-[11px] text-text-secondary">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  id={id}
                  defaultValue={defaultVal}
                  className="h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-text-primary focus:outline-none appearance-none"
                >
                  {["1", "2", "4", "6", "8", "12", "24"].map((v) => (
                    <option key={v} value={v}>每 {v} 小時</option>
                  ))}
                </select>
                <button type="button" className="h-10 px-4 font-mono text-[12px] text-brand border border-brand/30 rounded-xl hover:bg-[rgba(212,165,116,0.08)] transition-colors">
                  立即觸發
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true" />
                  <span className="font-mono text-[11px] text-success">上次: 2小時前</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── API Management ────────────────────────────────────────────── */}
      {/* TODO [MOCK DATA]: API keys (sk_live_••••, tcgdex_••••, etc.) and statuses are hardcoded — replace with masked keys and live status from `api_credentials` table in Supabase */}
      {/* TODO [BACKEND]: "更換" button has no handler — must open a modal to securely update API key via server action with encryption at rest */}
      <section
        aria-labelledby="api-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="api-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          外部 API 授權管理
        </h2>
        <div className="space-y-3">
          {[
            { name: "Stripe Connect API",  key: "sk_live_••••••••••••••••••••X9Kz", status: "active"  as const, lastUsed: "2分鐘前" },
            { name: "TCGdex API",          key: "tcgdex_••••••••••••••••••••A4Bv", status: "active"  as const, lastUsed: "12分鐘前" },
            { name: "匯率 API (OpenFX)",   key: "fx_••••••••••••••••••••T7Wm",     status: "active"  as const, lastUsed: "1小時前"  },
            { name: "Proxy (Scrape-It)",   key: "proxy_••••••••••••••••••••N2Xp",  status: "warning" as const, lastUsed: "未知"      },
          ].map(({ name, key, status, lastUsed }) => (
            <div
              key={name}
              className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border ${
                status === "warning"
                  ? "border-warning/20 bg-[rgba(239,68,68,0.04)]"
                  : "border-[rgba(237,232,224,0.08)] bg-bg-elevated"
              }`}
            >
              <div className="min-w-0">
                <p className="font-sans text-[13px] font-medium text-text-primary">{name}</p>
                <p className="font-mono text-[11px] text-text-secondary">{key}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                    status === "active" ? "text-success bg-[rgba(16,185,129,0.12)]" : "text-warning bg-[rgba(239,68,68,0.10)]"
                  }`}>
                    {status === "active" ? "正常" : "警告"}
                  </span>
                  <p className="font-mono text-[10px] text-text-disabled mt-0.5">{lastUsed}</p>
                </div>
                <button type="button" className="px-2.5 py-1.5 font-mono text-[11px] text-text-secondary border border-[rgba(237,232,224,0.08)] rounded-lg hover:text-text-primary hover:bg-bg-hover transition-colors">
                  更換
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Commission Rate ───────────────────────────────────────────── */}
      {/* TODO [BACKEND]: "更新費率" button has no handler — must call server action to upsert `platform_settings.commission_rate` in Supabase */}
      {/* TODO [MOCK DATA]: Current rate (5%) is hardcoded in display text — read from `platform_settings` table */}
      <section
        aria-labelledby="commission-rate-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5"
      >
        <h2 id="commission-rate-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-1">
          平台佣金費率
        </h2>
        <p className="font-sans text-[13px] text-text-secondary mb-4">
          成交時由賣方支付，計算基礎為最終成交金額。調整後僅適用於新成交訂單。
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center h-11 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
            <input
              type="number"
              defaultValue={5}
              min={1}
              max={15}
              step={0.5}
              className="w-20 h-full bg-transparent pl-4 font-mono text-[16px] text-text-primary focus:outline-none"
            />
            <span className="px-3 font-mono text-[13px] text-text-disabled border-l border-[rgba(237,232,224,0.08)]">%</span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-mono text-[11px] text-text-secondary">目前費率：5%（建議範圍 3–8%）</p>
            <p className="font-mono text-[10px] text-text-disabled">不含 Stripe 手續費 (1.4%)</p>
          </div>
          <button type="button" className="h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shrink-0">
            更新費率
          </button>
        </div>
      </section>

      {/* ── Danger Zone ───────────────────────────────────────────────── */}
      {/* TODO [BACKEND]: "暫停全平台交易" and "清除所有快取數據" buttons have no handlers — must call server actions with admin auth check before execution */}
      <section
        aria-labelledby="danger-heading"
        className="bg-[rgba(239,68,68,0.04)] rounded-2xl border border-warning/20 p-5"
      >
        <h2 id="danger-heading" className="font-sans font-semibold text-[16px] text-warning mb-3">
          危險操作
        </h2>
        <div className="space-y-3">
          {[
            { label: "暫停全平台交易",     desc: "立即停止所有新買賣訂單的建立（緊急維護用）" },
            { label: "清除所有快取數據",   desc: "清除 Redis / Supabase 快取，強制所有 API 重新請求" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 bg-bg-card border border-[rgba(239,68,68,0.15)] rounded-xl">
              <div>
                <p className="font-sans text-[13px] font-medium text-text-primary">{label}</p>
                <p className="font-mono text-[11px] text-text-secondary">{desc}</p>
              </div>
              <button type="button" className="px-3 py-2 font-mono text-[12px] text-warning border border-warning/25 rounded-xl hover:bg-[rgba(239,68,68,0.08)] active:scale-[0.98] transition-all shrink-0">
                執行
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Session Control ───────────────────────────────────────────── */}
      <section
        aria-labelledby="session-ctrl"
        className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4"
      >
        <h2 id="session-ctrl" className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">
          Session Control
        </h2>
        <LogoutModal />
      </section>
    </div>
  );
}
