"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin",           label: "平台監控",   icon: "📈", exact: true  },
  { href: "/admin/approvals", label: "審核中心",   icon: "🪪", exact: false },
  { href: "/admin/users",     label: "用戶管理",   icon: "👥", exact: false },
  { href: "/admin/database",  label: "卡牌資料庫", icon: "🗃️", exact: false },
  { href: "/admin/settings",  label: "營運設定",   icon: "⚙️", exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-bg-card border-r border-[rgba(237,232,224,0.08)] min-h-dvh sticky top-0">
        <div className="px-5 py-6 border-b border-[rgba(237,232,224,0.08)]">
          <p className="font-mono text-[10px] text-text-secondary uppercase tracking-widest mb-1">
            後台管理
          </p>
          <h1 className="font-sans font-bold text-[16px] text-text-primary">
            PokéTrade JP
          </h1>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-warning bg-[rgba(239,68,68,0.10)] border border-warning/20 px-2 py-0.5 rounded-full mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" aria-hidden="true" />
            ADMIN
          </span>
        </div>

        <nav className="p-3 space-y-0.5" aria-label="後台導航">
          {NAV_ITEMS.map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl font-sans text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-[rgba(212,165,116,0.12)] text-brand"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                <span aria-hidden="true" className="text-[16px]">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[rgba(237,232,224,0.08)]">
          <Link
            href="/profile/user"
            className="flex items-center gap-2 font-mono text-[12px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回前台
          </Link>
        </div>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 bg-bg-card border-b border-[rgba(237,232,224,0.08)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-[14px] text-text-primary">後台管理</span>
            <span className="font-mono text-[10px] text-warning bg-[rgba(239,68,68,0.10)] border border-warning/20 px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>
          <Link href="/profile/user" className="font-mono text-[12px] text-text-secondary hover:text-text-primary transition-colors">
            返回前台
          </Link>
        </div>
        <nav className="flex overflow-x-auto scrollbar-none px-2 pb-2 gap-1" aria-label="後台導航">
          {NAV_ITEMS.map(({ href, label, icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg font-mono text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-[rgba(212,165,116,0.12)] text-brand"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
