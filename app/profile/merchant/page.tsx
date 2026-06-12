import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "商戶總覽 — PokéTrade JP",
  description: "查看銷售統計、待處理訂單及商戶概覽",
};

// 🟢 從 Layout 移動進駐的商戶身分真理數據（Hero 看板專用）
// TODO: [database] Replace with Supabase query — fetch merchant profile from `merchant_profiles` WHERE user_id = current user
const mockMerchant = {
  name: "田中 Koji",
  shopName: "KojiTCG Premium",
  handle: "@koji_tcg",
  avatarSeed: "merchant-koji-tcg",
  joinDate: "2023年 11月加入",
  kycVerified: true,
  stripeConnected: true,
  rating: 4.95,
  reviewCount: 187,
  totalListings: 34,
  monthlyRevenue: 384_600,
};

// TODO: [database] Replace with Supabase query — fetch merchant's revenue stats from `orders` aggregation (sum amount WHERE seller_id = current user, grouped by period)
const revenueStats = [
  { label: "本月營收",   value: "¥384,600",  note: "▲ +24% vs 上月",  dir: "up"   as const },
  { label: "本月訂單",   value: "23",         note: "4 件待處理",      dir: "warn" as const },
];

// TODO: [database] Replace with Supabase query — fetch pending orders from `orders` table WHERE seller_id = current user AND status IN ('pending_confirmation', 'pending_shipment', 'grading'), ordered by created_at ASC
const pendingActions = [
  { id: "ORD-20250519-041", buyer: "M.佐藤",   card: "Charizard ex SAR",  grade: "PSA 10",  amount: 49_800, action: "待發貨",   actionColor: "text-warning" },
  { id: "ORD-20250519-039", buyer: "K.田中",   card: "Umbreon ex SAR",    grade: "BGS 9",   amount: 38_200, action: "待確認",   actionColor: "text-brand"   },
  { id: "ORD-20250518-035", buyer: "C.Chen",   card: "Pikachu ex SAR",    grade: "PSA 10",  amount: 32_500, action: "鑑定進行中", actionColor: "text-success" },
  { id: "ORD-20250517-030", buyer: "A.Yamamoto", card: "Gardevoir ex SAR", grade: "PSA 9",  amount: 28_000, action: "待發貨",   actionColor: "text-warning" },
];

export default function MerchantOverviewPage() {
  return (
    <>
      {/* ── Merchant Hero（自 Layout 抽離後封裝於總覽頁內） ───────────────── */}
      <section
        className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] animate-fadeIn"
        aria-labelledby="merchant-hero-name"
      >
        <div className="h-20 bg-linear-to-r from-[#2a2318] via-[rgba(212,165,116,0.12)] to-[#2a2318]" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative w-20 h-20 rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden shrink-0">
              <Image
                src={`https://picsum.photos/seed/${mockMerchant.avatarSeed}/80/80`}
                alt={`${mockMerchant.shopName} 的商舖頭像`}
                fill
                className="object-cover"
              />
            </div>
            {/* KYC + Stripe status badges */}
            <div className="flex gap-2 flex-wrap justify-end">
              {mockMerchant.kycVerified && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-1 rounded-lg border border-success/20">
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  KYC 已驗證
                </span>
              )}
              {mockMerchant.stripeConnected && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#635bff] bg-[rgba(99,91,255,0.12)] px-2 py-1 rounded-lg border border-[rgba(99,91,255,0.25)]">
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Stripe 已連結
                </span>
              )}
            </div>
          </div>

          <h1
            id="merchant-hero-name"
            className="font-sans font-bold text-[22px] text-text-primary"
          >
            {mockMerchant.shopName}
          </h1>
          <p className="font-mono text-[12px] text-text-secondary mt-0.5">
            {mockMerchant.handle} · {mockMerchant.joinDate}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="font-mono text-[12px] text-text-secondary">
              ★ {mockMerchant.rating} ({mockMerchant.reviewCount} 評)
            </span>
            <span className="font-mono text-[12px] text-text-secondary">
              {mockMerchant.totalListings} 件在售
            </span>
            <span className="font-mono text-[12px] text-brand font-medium">
              本月 ¥{mockMerchant.monthlyRevenue.toLocaleString("zh-TW")}
            </span>
          </div>
        </div>
      </section>

      {/* ── Revenue Stats（提純版：僅保留本月營收 / 本月訂單） ─────────────── */}
      <section aria-labelledby="revenue-heading" className="mb-6">
        <h2 id="revenue-heading" className="sr-only">營收統計</h2>
        <div className="grid grid-cols-2 gap-3">
          {revenueStats.map(({ label, value, note, dir }) => (
            <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
              <p className="font-mono text-[11px] text-text-secondary mb-1.5">{label}</p>
              <p className="font-mono font-semibold text-[18px] text-text-primary leading-none mb-1">{value}</p>
              <p className={`font-mono text-[11px] ${dir === "up" ? "text-success" : dir === "warn" ? "text-warning" : "text-text-disabled"}`}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pending Actions ────────────────────────────────────────────── */}
      <section aria-labelledby="pending-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="pending-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            待處理訂單
          </h2>
          <Link
            href="/profile/merchant/trading"
            className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
          >
            查看全部 →
          </Link>
        </div>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {pendingActions.map((order, i) => (
            <div
              key={order.id}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-sans text-[13px] font-medium text-text-primary truncate">{order.card}</p>
                  <span className="font-mono text-[10px] text-text-disabled">{order.grade}</span>
                </div>
                <p className="font-mono text-[11px] text-text-secondary">
                  買家：{order.buyer} · #{order.id.slice(-6)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-semibold text-[14px] text-text-primary">
                  ¥{order.amount.toLocaleString("zh-TW")}
                </p>
                <span className={`font-mono text-[11px] ${order.actionColor}`}>
                  {order.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
