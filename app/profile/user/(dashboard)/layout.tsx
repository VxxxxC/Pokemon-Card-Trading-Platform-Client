import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileTabNav } from "@/app/components/profile/ProfileTabNav";
import type { TabItem } from "@/app/components/profile/ProfileTabNav";

const USER_TABS: TabItem[] = [
  { href: "/profile/user", label: "總覽", icon: "👤" },
  { href: "/profile/user/collection", label: "收藏庫", icon: "💎" },
  { href: "/profile/user/trading", label: "交易管理", icon: "⚡" },
];

// 🟢 身份等級真理階梯
const LEVEL_TIERS = [
  { tier: 1, label: "新手收藏家", xp: 0 },
  { tier: 2, label: "卡牌愛好者", xp: 500 },
  { tier: 3, label: "資深收藏家", xp: 1500 },
  { tier: 4, label: "專業道館主", xp: 3000 },
  { tier: 5, label: "傳奇卡師", xp: 6000 },
] as const;

// 🟢 成就勳章數據源全面歸一進駐 Layout
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
  levelTier: 3, // 當前等級節點
};

export default function UserProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const xpProgress = Math.min(
    (mockUser.xpCurrent / mockUser.xpRequired) * 100,
    100,
  );

  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-300 mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-10">
        {/* Demo 角色切換快速條 */}
        <div className="mt-4 mb-4 flex items-center justify-between px-3 py-2 bg-[rgba(212,165,116,0.06)] border border-brand/20 rounded-xl">
          <span className="font-mono text-[11px] text-brand">
            Demo 模式：一般會員 (USER)
          </span>
          <div className="flex gap-2">
            <Link
              href="/profile/merchant"
              className="font-mono text-[11px] text-text-secondary hover:text-text-primary border border-[rgba(237,232,224,0.12)] px-2 py-0.5 rounded-md transition-colors"
            >
              商戶
            </Link>
            <Link
              href="/admin"
              className="font-mono text-[11px] text-text-secondary hover:text-text-primary border border-[rgba(237,232,224,0.12)] px-2 py-0.5 rounded-md transition-colors"
            >
              管理員
            </Link>
          </div>
        </div>

        {/* Profile Hero 身分看板大橫幅 */}
        <section
          className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] shadow-md"
          aria-labelledby="user-hero-name"
        >
          {/* 右上角極致齒輪設定按鈕 */}
          <Link
            href="/profile/user/settings"
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-[#17130f]/60 backdrop-blur-xs border border-[rgba(237,232,224,0.15)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="進入帳戶設定"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

          <div className="h-20 bg-linear-to-r from-[#2e2925] via-[rgba(212,165,116,0.08)] to-[#2e2925]" />
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

            {/* 高階資產數值橫向矩陣 */}
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

            {/* 🟢 核心修正 1：將 5階身份等級 Stepper 完美乾坤大挪移至此，提供頂級滑動沙盒 */}
            <div className="mt-5 pt-4 border-t border-[rgba(237,232,224,0.06)]">
              <span className="font-mono text-[9px] text-text-disabled uppercase tracking-wider block mb-3">
                道館晉升成就軌跡
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
                {LEVEL_TIERS.map((tier, i) => {
                  const isActive = tier.tier === mockUser.levelTier;
                  const isDone = tier.tier < mockUser.levelTier;
                  return (
                    <div key={tier.tier} className="flex items-center shrink-0">
                      <div
                        className={`flex flex-col items-center gap-1.5 ${isActive ? "opacity-100" : isDone ? "opacity-70" : "opacity-30"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border transition-colors ${
                            isActive
                              ? "bg-brand text-[#17130f] border-brand"
                              : isDone
                                ? "bg-[rgba(212,165,116,0.15)] text-brand border-brand/30"
                                : "bg-bg-elevated text-text-disabled border-[rgba(237,232,224,0.08)]"
                          }`}
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
            </div>

            {/* XP 經驗值進度條 */}
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

            {/* 🟢 核心修正 2：將成就勳章牆（Medals）完美收納至 Hero 看板的最底層，橫向滑動不卡死 */}
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

        {/* 4柱石分流導航列 */}
        <ProfileTabNav tabs={USER_TABS} />

        {/* 渲染子頁面內容 */}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
