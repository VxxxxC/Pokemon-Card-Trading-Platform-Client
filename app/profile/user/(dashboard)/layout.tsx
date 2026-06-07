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

export default function UserProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
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

        {/* 4柱石分流導航列 - 依然穩坐中軍，負責切換子分頁 */}
        <ProfileTabNav tabs={USER_TABS} />

        {/* 渲染子頁面內容 - 收藏庫與交易管理從此獲得 100% 寬闊高物理大平原 */}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
