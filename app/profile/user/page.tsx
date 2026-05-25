import type { Metadata } from "next";
import Link from "next/link";
import { CheckInWidget } from "@/app/components/profile/CheckInWidget";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

export const metadata: Metadata = {
  title: "我的帳號 · 總覽 — PokéTrade JP",
  description: "查看個人收藏估值、身份等級及交易紀錄",
};

const portfolioStats = [
  { label: "總資產估值",  value: "¥1,234,500", note: "▲ ¥28,400 本月",  noteDir: "up"      as const },
  { label: "持有卡牌數",  value: "42",          note: "8 張待售中",       noteDir: "neutral" as const },
  { label: "本月損益",    value: "¥128,000",    note: "▲ +11.6%",        noteDir: "up"      as const },
  { label: "成交紀錄",    value: "18",          note: "★ 4.9 評分",      noteDir: "neutral" as const },
];

const LEVEL_TIERS = [
  { tier: 1, label: "新手收藏家",  xp: 0     },
  { tier: 2, label: "卡牌愛好者",  xp: 500   },
  { tier: 3, label: "資深收藏家",  xp: 1_500 },
  { tier: 4, label: "專業道館主",  xp: 3_000 },
  { tier: 5, label: "傳奇卡師",    xp: 6_000 },
] as const;

const member = {
  levelTier:   3,
  xpCurrent:   2_040,
  xpRequired:  3_000,
  nextLevel:   "專業道館主",
  rating:      4.9,
  reviewCount: 24,
};

const badges = [
  { id: "early-bird", label: "早鳥收藏家", emoji: "🐦", desc: "平台早期加入" },
  { id: "psa-fan",    label: "PSA愛好者",  emoji: "🏆", desc: "持有 5+ PSA 鑑定卡" },
  { id: "100trades",  label: "百筆交易",   emoji: "💯", desc: "累計完成 100 筆交易" },
  { id: "top-rated",  label: "高評分賣家", emoji: "⭐", desc: "評分維持 4.8+ 滿 30 天" },
];

const recentActivity = [
  { id: "txn-001", type: "sold"   as const, name: "Charizard ex SAR", cardNo: "sv2a-182", grade: "PSA 10", price: 44_800, delta: 2_400, deltaDir: "up"   as const, time: "3分鐘前" },
  { id: "txn-002", type: "bought" as const, name: "Umbreon ex SAR",   cardNo: "sv6a-109", grade: "BGS 9.5", price: 39_500, delta: 1_500, deltaDir: "up"   as const, time: "2小時前" },
  { id: "txn-003", type: "sold"   as const, name: "Mimikyu ex SAR",   cardNo: "sv2a-233", grade: "PSA 9",   price: 28_500, delta: 3_200, deltaDir: "up"   as const, time: "昨天" },
  { id: "txn-004", type: "bought" as const, name: "Pikachu AR",       cardNo: "sv2a-215", grade: "CGC 9",   price:  8_200, delta:   300, deltaDir: "down" as const, time: "3天前" },
];

const reviews = [
  { id: "rev-001", reviewer: "K.田中",  rating: 5, comment: "包裝非常謹慎，卡況與描述完全一致，快速發貨，強力推薦！",          date: "2025年 4月" },
  { id: "rev-002", reviewer: "C.Lin",   rating: 5, comment: "專業賣家，溝通回應快，第二次購買同一位賣家，值得信賴。",            date: "2025年 3月" },
  { id: "rev-003", reviewer: "M.佐藤",  rating: 5, comment: "SAR 成色完美，PSA 10 完全合理。非常滿意這次交易。",               date: "2025年 2月" },
];

const streakReward = { hasReward: true, streakDays: 7, rewardLabel: "順豐免運費券 x1" };

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`評分 ${score} 分`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(score) ? "#d4a574" : "none"}
          stroke="#d4a574" strokeWidth="1.5" aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

function ActivityTypePill({ type }: { type: "sold" | "bought" | "bid" }) {
  const map = {
    sold:   { label: "已售出", className: "text-success bg-[rgba(16,185,129,0.12)]" },
    bought: { label: "已購入", className: "text-brand bg-[rgba(212,165,116,0.12)]" },
    bid:    { label: "出價中", className: "text-text-secondary bg-bg-elevated" },
  };
  const { label, className } = map[type];
  return (
    <span className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded ${className}`}>
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserOverviewPage() {
  const currentTier = LEVEL_TIERS.find((t) => t.tier === member.levelTier);

  return (
    <>
      {/* ── Portfolio Stats ─────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading" className="mb-6">
        <h2 id="stats-heading" className="sr-only">資產總覽</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {portfolioStats.map(({ label, value, note, noteDir }) => (
            <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
              <p className="font-mono text-[11px] text-text-secondary mb-1.5">{label}</p>
              <p className="font-mono font-semibold text-[18px] text-text-primary leading-none mb-1">{value}</p>
              <p className={`font-mono text-[11px] ${noteDir === "up" ? "text-success" : "text-text-disabled"}`}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8">
        {/* ── Left Column ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Identity Level */}
          <section
            aria-labelledby="level-heading"
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4"
          >
            <h2 id="level-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
              身份等級
            </h2>
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {LEVEL_TIERS.map((tier, i) => {
                const isActive = tier.tier === member.levelTier;
                const isDone   = tier.tier < member.levelTier;
                return (
                  <div key={tier.tier} className="flex items-center shrink-0">
                    <div className={`flex flex-col items-center gap-1 ${isActive ? "opacity-100" : isDone ? "opacity-70" : "opacity-35"}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-medium border transition-colors ${
                        isActive ? "bg-brand text-[#17130f] border-brand"
                          : isDone ? "bg-[rgba(212,165,116,0.15)] text-brand border-brand/30"
                          : "bg-bg-elevated text-text-disabled border-[rgba(237,232,224,0.08)]"
                      }`}>
                        {tier.tier}
                      </div>
                      <span className={`font-mono text-[9px] text-center leading-tight max-w-[52px] ${
                        isActive ? "text-brand" : isDone ? "text-text-secondary" : "text-text-disabled"
                      }`}>
                        {tier.label}
                      </span>
                    </div>
                    {i < LEVEL_TIERS.length - 1 && (
                      <div className={`h-px w-6 mx-0.5 mb-4 ${tier.tier < member.levelTier ? "bg-brand/40" : "bg-bg-elevated"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[11px] text-text-secondary">
                  升至 <span className="text-brand">{member.nextLevel}</span>
                </span>
                <span className="font-mono text-[11px] text-text-secondary">
                  {member.xpCurrent.toLocaleString("zh-TW")} / {member.xpRequired.toLocaleString("zh-TW")} XP
                </span>
              </div>
              <div
                className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={member.xpCurrent}
                aria-valuemin={currentTier?.xp ?? 0}
                aria-valuemax={member.xpRequired}
              >
                <div
                  className="h-full bg-brand rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((member.xpCurrent / member.xpRequired) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.desc}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-elevated border border-[rgba(237,232,224,0.08)] rounded-lg"
                >
                  <span className="text-[13px]" aria-hidden="true">{badge.emoji}</span>
                  <span className="font-mono text-[11px] text-text-secondary whitespace-nowrap">{badge.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section aria-labelledby="activity-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="activity-heading" className="font-sans font-semibold text-[16px] text-text-primary">
                近期交易
              </h2>
              <Link href="/profile/user/orders" className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors">
                查看全部 →
              </Link>
            </div>
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
              {recentActivity.map((tx, i) => (
                <div key={tx.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}>
                  <ActivityTypePill type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[13px] font-medium text-text-primary truncate">{tx.name}</p>
                    <p className="font-mono text-[11px] text-text-secondary">{tx.cardNo} · {tx.grade}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-[14px] text-text-primary">¥{tx.price.toLocaleString("zh-TW")}</p>
                    <span className={`font-mono text-[11px] ${tx.deltaDir === "up" ? "text-success" : "text-warning"}`}>
                      {tx.deltaDir === "up" ? "▲" : "▼"} ¥{tx.delta.toLocaleString("zh-TW")}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-text-disabled w-14 text-right shrink-0">{tx.time}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section aria-labelledby="reviews-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="reviews-heading" className="font-sans font-semibold text-[16px] text-text-primary">
                收到的評價
              </h2>
              <div className="flex items-center gap-1.5">
                <StarRating score={member.rating} size={14} />
                <span className="font-mono text-[13px] text-text-primary font-semibold">{member.rating}</span>
                <span className="font-mono text-[11px] text-text-secondary">({member.reviewCount})</span>
              </div>
            </div>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-bg-card rounded-xl border border-[rgba(237,232,224,0.08)] px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[13px] font-medium text-text-primary">{review.reviewer}</span>
                      <StarRating score={review.rating} size={12} />
                    </div>
                    <span className="font-mono text-[11px] text-text-disabled">{review.date}</span>
                  </div>
                  <p className="font-sans text-[13px] text-text-secondary leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────── */}
        <div className="mt-6 lg:mt-0 space-y-6">
          <CheckInWidget initialStreak={4} />

          {streakReward.hasReward && (
            <section
              className="bg-bg-card border border-[rgba(212,165,116,0.20)] rounded-2xl p-4"
              aria-labelledby="streak-reward-heading"
            >
              <h2 id="streak-reward-heading" className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">
                待領取獎勵
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.20)] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d4a574" strokeWidth="1.5" aria-hidden="true">
                    <path d="M20 12V22H4V12" />
                    <path d="M22 7H2v5h20V7z" />
                    <path d="M12 22V7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <div>
                  <p className="font-sans font-medium text-[14px] text-text-primary">{streakReward.rewardLabel}</p>
                  <p className="font-mono text-[11px] text-brand mt-0.5">連續簽到 {streakReward.streakDays} 天達成</p>
                </div>
              </div>
              <button type="button" className="w-full h-11 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-xl hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform">
                立即領取
              </button>
            </section>
          )}

          <div className="bg-[rgba(212,165,116,0.08)] rounded-2xl border border-brand/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-[24px] shrink-0" aria-hidden="true">🎁</span>
              <div>
                <h3 className="font-sans font-semibold text-[14px] text-text-primary mb-0.5">積分餘額</h3>
                <p className="font-mono font-bold text-[22px] text-brand leading-none">
                  1,250
                  <span className="font-mono text-[12px] text-text-secondary font-normal ml-1">積分</span>
                </p>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  可折抵 ¥125 運費券 · 連續簽到累積更多
                </p>
              </div>
            </div>
          </div>

          <section
            className="bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-2xl p-4"
            aria-labelledby="session-ctrl-heading"
          >
            <h2 id="session-ctrl-heading" className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-3">
              Session Control
            </h2>
            <LogoutModal />
          </section>
        </div>
      </div>
    </>
  );
}
