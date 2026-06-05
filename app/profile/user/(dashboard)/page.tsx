import type { Metadata } from "next";
import Link from "next/link";
import { CheckInCard } from "@/app/components/rewards/CheckInCard";
import { PortfolioStatsSkeleton } from "@/app/components/shared/PortfolioSkeletons";

export const metadata: Metadata = {
  title: "我的帳號 · 總覽 — PokéTrade JP",
  description: "查看個人收藏估值、身份等級及交易紀錄",
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

const member = {
  rating: 4.9,
  reviewCount: 24,
};

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

const reviews = [
  {
    id: "rev-001",
    reviewer: "K.田中",
    rating: 5,
    comment: "包裝非常謹慎，卡況與描述完全一致，快速發貨，強力推薦！",
    date: "2025年 4月",
  },
  {
    id: "rev-002",
    reviewer: "C.Lin",
    rating: 5,
    comment: "專業賣家，溝通回應快，第二次購買同一位賣家，值得信賴。",
    date: "2025年 3月",
  },
];

function StarRating({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`評分 ${score} 分`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(score) ? "#d4a574" : "none"}
          stroke="#d4a574"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

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

export default function UserOverviewPage() {
  const isPortfolioLoading = portfolioStats.length === 0;

  return (
    <>
      {/* ── 1. 資產估值數據卡 ── */}
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

      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8 items-start">
        {/* ── 左分欄：核心交易紀錄與評價矩陣 ── */}
        <div className="space-y-6">
          {/* 近期交易紀錄 */}
          <section aria-labelledby="activity-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="activity-heading"
                className="font-sans font-bold text-[15px] text-text-primary"
              >
                近期交易紀錄
              </h2>
              <Link
                href="/profile/user/orders"
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

          {/* 收到的評價 */}
          <section aria-labelledby="reviews-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="reviews-heading"
                className="font-sans font-bold text-[15px] text-text-primary"
              >
                最近收到的信用評價
              </h2>
              <div className="flex items-center gap-1.5">
                <StarRating score={member.rating} size={14} />
                <span className="font-mono text-[13px] text-text-primary font-bold">
                  {member.rating}
                </span>
                <span className="font-mono text-[11px] text-text-disabled">
                  ({member.reviewCount})
                </span>
              </div>
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
                      <StarRating score={review.rating} size={11} />
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

        {/* ── 右分欄：常駐簽到與 Ticket 高亮導流鍵 ── */}
        <div className="mt-6 lg:mt-0 space-y-4">
          {/* 每日靈魂簽到卡 */}
          <CheckInCard />

          {/* 奢華金邊流光 Ticket 動作鈕，直通獎勵專區 Full Page */}
          <Link href="/profile/user/rewards" className="block w-full group">
            <div className="w-full h-14 bg-gradient-to-r from-[#d4a574] via-[#e2b98f] to-[#d4a574] p-[1px] rounded-2xl shadow-[0_4px_20px_rgba(212,165,116,0.18)] transition-all active:scale-[0.99] cursor-pointer">
              <div className="w-full h-full bg-[#26211C] rounded-[15px] px-4 flex items-center justify-between group-hover:bg-[#2c2722] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[18px] shrink-0">🎟️</span>
                  <div className="text-left min-w-0">
                    <p className="font-sans font-black text-[13.5px] text-brand tracking-tight">
                      進入專屬獎勵特權專區
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
        </div>
      </div>
    </>
  );
}
