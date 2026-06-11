import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GrUserSettings } from "react-icons/gr";
import { CheckInCard } from "@/app/components/rewards/CheckInCard";
import { PortfolioStatsSkeleton } from "@/app/components/shared/PortfolioSkeletons";
import { MOCK_MEMBER_REVIEWS } from "@/app/lib/mock-data/member-rating";

export const metadata: Metadata = {
  title: "我的帳號 · 總覽 — PokéTrade JP",
  description: "查看個人收藏估值、身份等級及交易紀錄",
};

// 🟢 從 Layout 移動進駐的真理數據與等級設定基準
const LEVEL_TIERS = [
  { tier: 1, label: "新手收藏家", xp: 0 },
  { tier: 2, label: "卡牌愛好者", xp: 500 },
  { tier: 3, label: "資深收藏家", xp: 1500 },
  { tier: 4, label: "專業道館主", xp: 3000 },
  { tier: 5, label: "傳奇卡師", xp: 6000 },
] as const;

const BADGES = [
  { id: "early-bird", label: "早鳥收藏家", emoji: "🐦", desc: "平台早期加入" },
  {
    id: "psa-fan",
    label: "PSA愛好者",
    emoji: "🏆",
    desc: "持有 5+ PSA 鑑定卡",
  },
  {
    id: "100trades",
    label: "百筆交易",
    emoji: "💯",
    desc: "累計完成 100 筆交易",
  },
  {
    id: "top-rated",
    label: "高評分賣家",
    emoji: "⭐",
    desc: "評分維持 4.8+ 滿 30 天",
  },
];

const mockUser = {
  name: "山田レン",
  handle: "@yamada_ren",
  avatarSeed: "user-yamada-ren-tcg",
  level: "資深收藏家",
  xpCurrent: 2040,
  xpRequired: 3000,
  nextLevel: "專業道館主",
  joinDate: "2024年 8月加入",
  verifiedBuyer: true,
  rating: 4.9,
  reviewCount: 24,
  points: 1250,
  levelTier: 3,
};

const portfolioStats = [
  {
    label: "總資產估值",
    value: "¥1,234,500",
    note: "▲ ¥28,400 本月",
    noteDir: "up" as const,
  },
  {
    label: "持有卡牌數",
    value: "42",
    note: "8 張待售中",
    noteDir: "neutral" as const,
  },
  {
    label: "本月損益",
    value: "¥128,000",
    note: "▲ +11.6%",
    noteDir: "up" as const,
  },
  {
    label: "成交紀錄",
    value: "18",
    note: "★ 4.9 評分",
    noteDir: "neutral" as const,
  },
];

const recentActivity = [
  {
    id: "txn-001",
    type: "sold" as const,
    name: "Charizard ex SAR",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    price: 44800,
    delta: 2400,
    deltaDir: "up" as const,
    time: "3分鐘前",
  },
  {
    id: "txn-002",
    type: "bought" as const,
    name: "Umbreon ex SAR",
    cardNo: "sv6a-109",
    grade: "BGS 9.5",
    price: 39500,
    delta: 1500,
    deltaDir: "up" as const,
    time: "2小時前",
  },
  {
    id: "txn-003",
    type: "sold" as const,
    name: "Mimikyu ex SAR",
    cardNo: "sv2a-233",
    grade: "PSA 9",
    price: 28500,
    delta: 3200,
    deltaDir: "up" as const,
    time: "昨天",
  },
  {
    id: "txn-004",
    type: "bought" as const,
    name: "Pikachu AR",
    cardNo: "sv2a-215",
    grade: "CGC 9",
    price: 8200,
    delta: 300,
    deltaDir: "down" as const,
    time: "3天前",
  },
];

// 🟢 Use centralized mock data — display only 5 most recent reviews on overview
const reviews = MOCK_MEMBER_REVIEWS.slice(0, 5);

function ActivityTypePill({ type }: { type: "sold" | "bought" | "bid" }) {
  const map = {
    sold: {
      label: "已售出",
      className: "text-success bg-[rgba(16,185,129,0.12)]",
    },
    bought: {
      label: "已購入",
      className: "text-brand bg-[rgba(212,165,116,0.12)]",
    },
    bid: { label: "出價中", className: "text-text-secondary bg-bg-elevated" },
  };
  const { label, className } = map[type];
  return (
    <span
      className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded ${className}`}
    >
      {label}
    </span>
  );
}

function RewardsTicketButton() {
  return (
    <Link href="/profile/user/rewards" className="block w-full group">
      <div className="w-full h-14 bg-gradient-to-r from-[#d4a574] via-[#e2b98f] to-[#d4a574] p-[1px] rounded-2xl shadow-[0_4px_20px_rgba(212,165,116,0.18)] transition-all active:scale-[0.99] cursor-pointer">
        <div className="w-full h-full bg-[#26211C] rounded-[15px] px-4 flex items-center justify-between group-hover:bg-[#2c2722] transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[18px] shrink-0">🎟️</span>
            <div className="text-left min-w-0">
              <p className="font-sans font-black text-[13.5px] text-brand tracking-tight">
                進入專專屬獎勵特權專區
              </p>
              <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider truncate">
                兌換運費券與限量特典周邊
              </p>
            </div>
          </div>
          <span className="text-brand group-hover:translate-x-0.5 transition-transform font-mono text-[14px] font-bold shrink-0">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function UserOverviewPage() {
  const isPortfolioLoading = portfolioStats.length === 0;
  const xpProgress = Math.min(
    (mockUser.xpCurrent / mockUser.xpRequired) * 100,
    100,
  );

  return (
    <>
      {/* ── 🟢 核心挪移點：Profile Hero 身分看板大橫幅完美進駐總覽頁最頂部 ── */}
      <section
        className="relative mb-5 mt-4 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] shadow-md animate-fadeIn"
        aria-labelledby="user-hero-name"
      >
        <Link
          href="/profile/user/settings"
          className="absolute top-4 right-4 z-12 w-12 h-12 rounded-full bg-[#17130f]/60 backdrop-blur-xs border border-[rgba(237,232,224,0.15)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="設定"
        >
          <div className="p-2 flex flex-row items-center gap-2">
            <GrUserSettings size={18} aria-hidden="true" />
          </div>
        </Link>

        <div className="h-20 bg-gradient-to-r from-[#2e2925] via-[rgba(212,165,116,0.08)] to-[#2e2925]" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative w-20 h-20 rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden shrink-0">
              <Image
                src={`https://picsum.photos/seed/${mockUser.avatarSeed}/80/80`}
                alt={`${mockUser.name} 的頭像`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1
              id="user-hero-name"
              className="font-sans font-bold text-[22px] text-text-primary tracking-tight"
            >
              {mockUser.name}
            </h1>
            {mockUser.verifiedBuyer && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-full border border-success/20">
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
                已驗證買家
              </span>
            )}
          </div>

          <p className="font-mono text-[12px] text-text-secondary mt-0.5">
            {mockUser.handle} · {mockUser.joinDate}
          </p>

          <div className="flex items-center gap-5 mt-4 pt-3 border-t border-[rgba(237,232,224,0.06)] flex-wrap">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                身分級別
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[12.5px] font-bold text-brand mt-1 bg-[rgba(212,165,116,0.08)] border border-brand/20 px-2 py-0.5 rounded-md">
                {mockUser.level}
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
                信用評分
              </span>
              <span className="font-mono text-[13px] text-text-primary font-bold mt-1">
                ⭐ {mockUser.rating}{" "}
                <span className="text-text-disabled font-normal text-[11px]">
                  ({mockUser.reviewCount} 評)
                </span>
              </span>
            </div>
            <div className="w-px h-7 bg-white/5 self-end hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-brand font-black uppercase tracking-widest">
                帳戶總積分餘額
              </span>
              <p className="font-mono font-black text-[22px] text-brand leading-none mt-0.5 tracking-tight">
                {mockUser.points.toLocaleString()}{" "}
                <span className="font-sans text-[11px] font-bold text-text-primary ml-0.5">
                  PTS
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none mt-5 pt-4 border-t border-[rgba(237,232,224,0.06)]">
            {LEVEL_TIERS.map((tier, i) => {
              const isActive = tier.tier === mockUser.levelTier;
              const isDone = tier.tier < mockUser.levelTier;
              return (
                <div key={tier.tier} className="flex items-center shrink-0">
                  <div
                    className={`flex flex-col items-center gap-1.5 ${isActive ? "opacity-100" : isDone ? "opacity-70" : "opacity-30"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border transition-colors ${isActive ? "bg-brand text-[#17130f] border-brand" : isDone ? "bg-[rgba(212,165,116,0.15)] text-brand border-brand/30" : "bg-bg-elevated text-text-disabled border-[rgba(237,232,224,0.08)]"}`}
                    >
                      {tier.tier}
                    </div>
                    <span
                      className={`font-mono text-[9.5px] text-center leading-tight max-w-14 ${isActive ? "text-brand font-bold" : isDone ? "text-text-secondary" : "text-text-disabled"}`}
                    >
                      {tier.label}
                    </span>
                  </div>
                  {i < LEVEL_TIERS.length - 1 && (
                    <div
                      className={`h-px w-5 mx-1 mb-5 ${tier.tier < mockUser.levelTier ? "bg-brand/40" : "bg-bg-elevated"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[11px] text-text-secondary">
                升至 <span className="text-brand">{mockUser.nextLevel}</span>
              </span>
              <span className="font-mono text-[11px] text-text-secondary">
                {mockUser.xpCurrent.toLocaleString()} /{" "}
                {mockUser.xpRequired.toLocaleString()} XP
              </span>
            </div>
            <div
              className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={mockUser.xpCurrent}
              aria-valuemax={mockUser.xpRequired}
              aria-valuemin={0}
            >
              <div
                className="h-full bg-brand rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-[rgba(237,232,224,0.04)] pt-3">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                title={badge.desc}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#17130f]/40 border border-[rgba(237,232,224,0.06)] rounded-xl hover:border-brand/20 transition-all cursor-help"
              >
                <span className="text-[12px]" aria-hidden="true">
                  {badge.emoji}
                </span>
                <span className="font-mono text-[10.5px] text-text-secondary whitespace-nowrap">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. 資產估值數據卡 ── */}
      <section aria-labelledby="stats-heading" className="mb-6 animate-fadeIn">
        <h2 id="stats-heading" className="sr-only">
          資產總覽
        </h2>
        {isPortfolioLoading ? (
          <PortfolioStatsSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {portfolioStats.map(({ label, value, note, noteDir }) => (
              <div
                key={label}
                className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-xs"
              >
                <p className="font-mono text-[11px] text-text-secondary mb-1.5">
                  {label}
                </p>
                <p className="font-mono font-bold text-[18px] text-text-primary leading-none mb-1">
                  {value}
                </p>
                <p
                  className={`font-mono text-[11px] font-medium ${noteDir === "up" ? "text-success" : "text-text-disabled"}`}
                >
                  {note}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:gap-8 items-start gap-6 lg:gap-0">
        <div className="space-y-6">
          <div className="block lg:hidden space-y-4">
            <CheckInCard />
            <RewardsTicketButton />
          </div>

          <section aria-labelledby="activity-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="activity-heading"
                className="font-sans font-bold text-[15px] text-text-primary"
              >
                近期交易紀錄
              </h2>
              <Link
                href="/profile/user/trading"
                className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold transition-colors"
              >
                查看全部 →
              </Link>
            </div>
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-xs">
              {recentActivity.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.06)]" : ""}`}
                >
                  <ActivityTypePill type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13.5px] font-bold text-text-primary truncate">
                      {tx.name}
                    </p>
                    <p className="font-mono text-[11px] text-text-disabled mt-0.5">
                      {tx.cardNo} · {tx.grade}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-black text-[14px] text-text-primary">
                      ¥{tx.price.toLocaleString("zh-TW")}
                    </p>
                    <span
                      className={`font-mono text-[11px] font-medium ${tx.deltaDir === "up" ? "text-success" : "text-warning"}`}
                    >
                      {tx.deltaDir === "up" ? "▲" : "▼"} ¥
                      {tx.delta.toLocaleString("zh-TW")}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-text-disabled w-14 text-right shrink-0">
                    {tx.time}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="reviews-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="reviews-heading"
                className="font-sans font-bold text-[15px] text-text-primary"
              >
                最近收到的信用評價
              </h2>
              <Link
                href="/profile/user/rating"
                className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold transition-colors"
              >
                查看更多評價 →
              </Link>
            </div>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[13px] font-bold text-text-primary">
                        {review.reviewer}
                      </span>
                      <span className="font-mono text-[12px] text-brand font-bold">⭐ {review.rating}</span>
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
        </div>

        <div className="hidden lg:block space-y-4">
          <CheckInCard />
          <RewardsTicketButton />
        </div>
      </div>
    </>
  );
}
