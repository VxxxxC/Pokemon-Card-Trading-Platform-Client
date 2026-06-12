import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CiSettings } from "react-icons/ci";


export const metadata: Metadata = {
  title: "商戶總覽 — PokéTrade JP",
  description: "查看銷售統計、待處理訂單及商戶概覽",
};

// 🟢 中央數據源：商戶身分真理數據（Hero 看板專用）
const mockMerchant = {
  id: "koji_tcg",
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
  xp: 2040,
  maxXp: 3000,
  nextLevel: "專業道館主",
  level: "資深收藏家",
  badges: [
    { id: "b1", label: "早期收藏家", emoji: "🌌" },
    { id: "b2", label: "PSA愛好者", emoji: "🏆" },
    { id: "b3", label: "百筆交易", emoji: "💯" },
    { id: "b4", label: "高評分賣家", emoji: "★" },
  ],
};

// 商戶專屬成長階梯 Stepper 節點
const merchantSteps = [
  { levelNum: 1, label: "新手商戶" },
  { levelNum: 2, label: "卡牌愛好者" },
  { levelNum: 3, label: "資深收藏家", active: true },
  { levelNum: 4, label: "專業高級店" },
  { levelNum: 5, label: "傳奇卡牌王" },
];

// 提純版指標數據
const revenueStats = [
  { label: "本月營收", value: "HK$ 384,600", note: "▲ +24% vs 上月", dir: "up" as const },
  { label: "本月訂單", value: "23", note: "4 件待處理", dir: "warn" as const },
];

// 待處理訂單流水線路
const pendingActions = [
  { id: "ORD-20250519-041", buyer: "M.佐藤", card: "Charizard ex SAR", grade: "PSA 10", amount: 49_800, action: "待發貨", actionColor: "text-warning" },
  { id: "ORD-20250519-039", buyer: "K.田中", card: "Umbreon ex SAR", grade: "BGS 9", amount: 38_200, action: "待確認", actionColor: "text-brand" },
  { id: "ORD-20250518-035", buyer: "C.Chen", card: "Pikachu ex SAR", grade: "PSA 10", amount: 32_500, action: "鑑定進行中", actionColor: "text-success" },
  { id: "ORD-20250517-030", buyer: "A.Yamamoto", card: "Gardevoir ex SAR", grade: "PSA 9", amount: 28_000, action: "待發貨", actionColor: "text-warning" },
];

// 模擬最新期 3 筆真實信用評價數據（未來直接對接 Supabase member_reviews 表）
const mockRecentReviews = [
  { id: "r1", reviewer: "K.田中", rating: 5, comment: "包裝非常謹慎，卡況與描述完全一致，快速發貨，強力推薦！", date: "2026年 5月" },
  { id: "r2", reviewer: "C.Lin", rating: 5, comment: "專業賣家，溝通回應快，第二次購買同一位賣家，值得信賴。", date: "2026年 4月" },
  { id: "r3", reviewer: "M.鈴木", rating: 5, comment: "PSA 10 品相完美，雙重氣泡袋保護出貨，超出預期，感謝！", date: "2026年 3月" },
];

export default function MerchantOverviewPage() {
  return (
    <>
      {/* ── 🟢 1. MERCHANT HERO HEADER (升級版商戶自豪看板) ───────────────── */}
      <section
        className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] animate-fadeIn"
        aria-labelledby="merchant-hero-name"
      >
        {/* Extreme Top-Right [Settings] Button */}
        <Link
          href="/profile/merchant/settings"
          className="absolute top-4 right-4 z-12 w-12 h-12 rounded-full bg-[#17130f]/60 backdrop-blur-xs border border-[rgba(237,232,224,0.15)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="店舖設定"
        >
          <div className="p-2 flex flex-row items-center gap-2">
            <CiSettings size={24} aria-hidden="true" />
          </div>
        </Link>

        <div className="h-24 bg-linear-to-r from-[#2a2318] via-[rgba(212,165,116,0.12)] to-[#2a2318]" />
        <div className="px-5 pb-5">
          {/* 頭像與認證徽章 */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative w-20 h-20 rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden shrink-0 bg-[#17130f]">
              <Image
                src={`https://picsum.photos/seed/${mockMerchant.avatarSeed}/80/80`}
                alt={`${mockMerchant.shopName} 的商舖頭像`}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 基本資料 */}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <h1 id="merchant-hero-name" className="font-sans font-bold text-[22px] text-text-primary tracking-tight">
              {mockMerchant.shopName}
            </h1>
            {mockMerchant.kycVerified && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-md border border-success/20 font-bold">
                ✓ KYC 已驗證
              </span>
            )}
            {mockMerchant.stripeConnected && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand bg-brand/10 px-2 py-0.5 rounded-md border border-brand/20 font-bold">
                ● Stripe 已連結
              </span>
            )}
          </div>
          <p className="font-mono text-[12px] text-text-secondary mt-0.5">
            {mockMerchant.handle} · {mockMerchant.joinDate}
          </p>

          {/* 雙欄核心指標：商戶級別與信用評分 (徹底清除積分餘額) */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)] flex-wrap">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                商戶級別
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold text-brand mt-1 bg-[rgba(212,165,116,0.08)] border border-brand/20 px-2 py-0.5 rounded-md">
                🏪 {mockMerchant.level}
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                信用評分
              </span>
              <span className="font-mono text-[13px] text-text-primary font-bold mt-1">
                ⭐ {mockMerchant.rating}{" "}
                <span className="text-text-disabled font-normal text-[11px]">
                  ({mockMerchant.reviewCount} 評)
                </span>
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                在庫資產
              </span>
              <span className="font-mono text-[13px] text-text-primary font-bold mt-1">
                {mockMerchant.totalListings} <span className="text-[11px] text-text-secondary font-normal">件在售</span>
              </span>
            </div>
          </div>

          {/* 1b. 商戶等級步進器 (Stepper) */}
          <div className="pt-4 max-w-xl">
            <div className="relative flex justify-between items-center">
              <div className="absolute top-3.25 left-2 right-2 h-px bg-white/5 z-0" />
              {merchantSteps.map((step) => (
                <div key={step.levelNum} className="relative flex flex-col items-center z-10 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold transition-colors ${
                      step.active
                        ? "bg-brand text-[#17130f] shadow-[0_0_10px_rgba(212,165,116,0.35)]"
                        : step.levelNum < 3
                          ? "bg-[#322a24] text-brand border border-brand/20"
                          : "bg-bg-card text-text-disabled border border-white/5"
                    }`}
                  >
                    {step.levelNum}
                  </div>
                  <span
                    className={`font-sans text-[10px] mt-1.5 whitespace-nowrap tracking-tight ${
                      step.active ? "text-brand font-bold" : "text-text-disabled"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* XP 經驗值進度條 */}
          <div className="max-w-xl pt-4 space-y-1.5">
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-text-disabled">
                升至 <span className="text-text-primary font-bold">{mockMerchant.nextLevel}</span>
              </span>
              <span className="text-brand font-bold">
                {mockMerchant.xp.toLocaleString()} / {mockMerchant.maxXp.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#17130f] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-linear-to-r from-[#d4a574] to-[#e8b896] rounded-full transition-all duration-500"
                style={{ width: `${(mockMerchant.xp / mockMerchant.maxXp) * 100}%` }}
              />
            </div>
          </div>

          {/* 1c. 商戶認證榮譽徽章列 */}
          <div className="flex gap-2 overflow-x-auto pt-4 pb-0.5 scrollbar-none max-w-xl">
            {mockMerchant.badges.map((badge) => (
              <div
                key={badge.id}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[#17130f] border border-[rgba(237,232,224,0.06)] rounded-lg"
              >
                <span className="text-[12px]">{badge.emoji}</span>
                <span className="font-mono text-[10.5px] text-[#d4c4b7]">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* ── 🟢 頂級增強點：加裝右下角高貴暗金漸變色「業績分析控制台」入口 ── */}
          <div className="md:absolute md:bottom-5 md:right-5 mt-4 md:mt-0">
            <Link
              href="/profile/merchant/performance"
              className="inline-flex items-center justify-center gap-1.5 w-full md:w-auto px-4 h-9 bg-linear-to-r from-[#d4a574] to-[#e8b896] hover:from-[#e8b896] hover:to-[#d4a574] text-[#17130f] font-sans text-[12.5px] font-black rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(212,165,116,0.22)] active:scale-[0.98] cursor-pointer"
              title="進入商戶數據與業績分析控制艙"
            >
              <span>經營分析 📈</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Revenue Stats ─────────────────────────────────────────────── */}
      <section aria-labelledby="revenue-heading" className="mb-5">
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
      <section aria-labelledby="pending-heading" className="mb-5">
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
                  HK$ {order.amount.toLocaleString("zh-TW")}
                </p>
                <span className={`font-mono text-[11px] ${order.actionColor}`}>
                  {order.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 🟢 2. REPUTATION SECTION (信用評級模組 — 精準對齊最近 3 筆) ────── */}
      <section aria-labelledby="rating-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="rating-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            最近收到的信用評價
          </h2>
          <Link
            href={`/profile/${mockMerchant.id}/rating`}
            className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors font-bold"
          >
            查看更多評價 →
          </Link>
        </div>
        <div className="space-y-3">
          {mockRecentReviews.map((review) => (
            <div
              key={review.id}
              className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 hover:border-[rgba(237,232,224,0.15)] transition-colors"
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[13px] font-bold text-text-primary">
                    {review.reviewer}
                  </span>
                  <span className="font-mono text-[12px] text-brand font-bold">
                    ⭐ {review.rating}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-disabled">
                  {review.date}
                </span>
              </div>
              <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}