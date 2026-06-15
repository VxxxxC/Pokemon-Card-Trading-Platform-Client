import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "商品分析 — PokéTrade JP",
  description: "進階商品表現分析閘道：即時數據流視窗準備中",
};

interface MerchantAnalyticsPageProps {
  searchParams: Promise<{ sku?: string }>;
}

// 骨架矩陣規格：高冷黑金漸層脈衝塊，等待後端即時數據流接管
const SKELETON_KPI_SLOTS = [
  "VIEW VELOCITY",
  "WATCHLIST DEPTH",
  "PRICE DELTA",
  "CONVERSION PULSE",
] as const;

// TODO: [BACKEND] Replace this temporary skeleton matrix with the Client Container Live Data Stream Viewport —
// subscribe to Supabase Realtime channel (per-SKU views / watchlist / price events) and hydrate via streaming RSC.
// TODO: [API] Fetch per-SKU analytics aggregation from `listing_analytics` (views, watchers, price history) WHERE listing_id = sku
export default async function MerchantAnalyticsPage({
  searchParams,
}: MerchantAnalyticsPageProps) {
  const { sku } = await searchParams;

  return (
    <section
      aria-labelledby="analytics-heading"
      aria-busy="true"
      className="space-y-5 animate-fadeIn p-5"
    >
      {/* ── 精緻航線麵包屑：引流重返商品管理 ─────────────────────────────── */}
      <div className="font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
        <Link
          href="/profile/merchant/inventory"
          className="hover:text-brand transition-colors"
        >
          🗂️ 商品管理
        </Link>
        <span className="text-text-disabled">/</span>
        <span className="text-text-disabled uppercase">Analytics 商品分析</span>
      </div>

      {/* ── Page Title Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1
            id="analytics-heading"
            className="font-sans font-black text-[22px] lg:text-[26px] text-text-primary tracking-tight"
          >
        {sku && (
          <span className="font-mono text-brand">
            {sku}
          </span>
        )}
            商品分析
          </h1>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            Client Container Live Data Stream Viewport
          </p>
        </div>
      </div>

      {/* ── KPI Skeleton Matrix（黑金脈衝佔位） ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
        {SKELETON_KPI_SLOTS.map((slot) => (
          <div
            key={slot}
            className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.15)] p-4 overflow-hidden"
          >
            <p className="font-mono text-[9px] text-text-disabled uppercase tracking-wider mb-3">
              {slot}
            </p>
            <div className="h-5 w-24 rounded-md bg-linear-to-r from-[rgba(212,165,116,0.18)] via-[rgba(212,165,116,0.06)] to-[rgba(212,165,116,0.18)] animate-pulse mb-2" />
            <div className="h-3 w-16 rounded bg-[rgba(237,232,224,0.06)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* ── Live Data Stream Viewport Skeleton ────────────────────────── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.15)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-36 rounded bg-[rgba(212,165,116,0.14)] animate-pulse" />
          <div className="h-6 w-20 rounded-lg bg-[rgba(237,232,224,0.06)] animate-pulse" />
        </div>
        <div
          className="flex items-end gap-1.5 h-40"
          role="img"
          aria-label="圖表數據載入中"
        >
          {[34, 58, 42, 71, 50, 88, 63, 95, 76, 54, 82, 67, 90, 60, 73, 48, 85, 70, 92, 64].map(
            (h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-linear-to-t from-[rgba(212,165,116,0.22)] to-[rgba(212,165,116,0.05)] animate-pulse"
                style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                aria-hidden="true"
              />
            ),
          )}
        </div>
        <div className="flex justify-between mt-3" aria-hidden="true">
          <div className="h-3 w-14 rounded bg-[rgba(237,232,224,0.06)] animate-pulse" />
          <div className="h-3 w-14 rounded bg-[rgba(237,232,224,0.06)] animate-pulse" />
        </div>
      </div>

      {/* ── Event Feed Skeleton Rows ──────────────────────────────────── */}
      <div
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden"
        aria-hidden="true"
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
          >
            <div className="w-9 h-9 rounded-xl bg-[rgba(212,165,116,0.10)] animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/5 rounded bg-[rgba(237,232,224,0.08)] animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-[rgba(237,232,224,0.05)] animate-pulse" />
            </div>
            <div className="h-4 w-16 rounded bg-[rgba(212,165,116,0.12)] animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
