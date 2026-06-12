import type { ReactNode } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileTabNav } from "@/app/components/profile/ProfileTabNav";
import type { TabItem } from "@/app/components/profile/ProfileTabNav";

const USER_TABS: TabItem[] = [
  { href: "/profile/user", label: "總覽", icon: "👤" },
  { href: "/profile/user/collection", label: "卡牌庫", icon: "💎" },
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
        {/* 4柱石分流導航列 */}
        <ProfileTabNav tabs={USER_TABS} />

        {/* 渲染子頁面內容 */}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
