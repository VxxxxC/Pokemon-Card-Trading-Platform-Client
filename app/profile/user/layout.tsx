import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileTabNav } from "@/app/components/profile/ProfileTabNav";
import type { TabItem } from "@/app/components/profile/ProfileTabNav";

const USER_TABS: TabItem[] = [
  { href: "/profile/user",             label: "總覽",   icon: "👤" },
  { href: "/profile/user/collection",  label: "收藏庫", icon: "🎁" },
  { href: "/profile/user/orders",      label: "訂單",   icon: "📦" },
  { href: "/profile/user/settings",    label: "帳戶設定", icon: "⚙️" },
];

const mockUser = {
  name: "山田レン",
  handle: "@yamada_ren",
  avatarSeed: "user-yamada-ren-tcg",
  level: "資深收藏家",
  xpCurrent: 2_040,
  xpRequired: 3_000,
  nextLevel: "專業道館主",
  joinDate: "2024年 8月加入",
  verifiedBuyer: true,
  rating: 4.9,
  reviewCount: 24,
};

export default function UserProfileLayout({ children }: { children: ReactNode }) {
  const xpProgress = Math.min((mockUser.xpCurrent / mockUser.xpRequired) * 100, 100);

  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <TopNav activePath="/profile" />
      <MobileHeader />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-10">
        {/* ── Demo Role Banner ──────────────────────────────────────────── */}
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

        {/* ── Profile Hero ──────────────────────────────────────────────── */}
        <section
          className="relative mb-5 rounded-2xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
          aria-labelledby="user-hero-name"
        >
          <div className="h-20 bg-linear-to-r from-[#2e2925] via-[rgba(212,165,116,0.08)] to-[#2e2925]" />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative w-20 h-20 rounded-full border-2 border-bg-card shadow-[0_4px_12px_rgba(0,0,0,0.50)] overflow-hidden shrink-0">
                <Image
                  src={`https://picsum.photos/seed/${mockUser.avatarSeed}/80/80`}
                  alt={`${mockUser.name} 的頭像`}
                  fill
                  className="object-cover"
                />
              </div>
              <Link
                href="/profile/user/settings"
                className="flex justify-center items-center min-h-11 px-4 font-sans text-[13px] font-medium text-brand border border-[rgba(237,232,224,0.12)] rounded-lg hover:bg-bg-elevated active:scale-[0.98] active:translate-y-px transition-transform"
              >
                設定
              </Link>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 id="user-hero-name" className="font-sans font-bold text-[22px] text-text-primary">
                {mockUser.name}
              </h1>
              {mockUser.verifiedBuyer && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-full border border-success/20">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已驗證買家
                </span>
              )}
            </div>
            <p className="font-mono text-[12px] text-text-secondary mt-0.5">
              {mockUser.handle} · {mockUser.joinDate}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium text-brand bg-[rgba(212,165,116,0.12)] border border-brand/20 px-2.5 py-1 rounded-lg">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#d4a574" stroke="none" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {mockUser.level}
              </span>
              <span className="font-mono text-[12px] text-text-secondary">
                {mockUser.rating} ({mockUser.reviewCount} 評)
              </span>
            </div>

            {/* XP Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[11px] text-text-secondary">
                  升至 <span className="text-brand">{mockUser.nextLevel}</span>
                </span>
                <span className="font-mono text-[11px] text-text-secondary">
                  {mockUser.xpCurrent.toLocaleString()} / {mockUser.xpRequired.toLocaleString()} XP
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
          </div>
        </section>

        {/* ── Tab Navigation ────────────────────────────────────────────── */}
        <ProfileTabNav tabs={USER_TABS} />

        {/* ── Page Content ──────────────────────────────────────────────── */}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
