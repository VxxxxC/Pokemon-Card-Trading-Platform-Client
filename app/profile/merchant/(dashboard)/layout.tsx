import type { ReactNode } from "react";
import type { Metadata } from "next";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileTabNav } from "@/app/components/profile/ProfileTabNav";
import type { TabItem } from "@/app/components/profile/ProfileTabNav";

export const metadata: Metadata = {
  title: "商戶總覽 — PokéTrade JP",
  description: "查看銷售統計、待處理訂單及商戶概覽",
};

const MERCHANT_TABS: TabItem[] = [
  { href: "/profile/merchant", label: "總覽", icon: "📊" },
  { href: "/profile/merchant/inventory", label: "商品管理", icon: "🗂️" },
  { href: "/profile/merchant/trading", label: "交易管理", icon: "🤝" },
  { href: "/profile/merchant/finance", label: "資金金流", icon: "💰" },
];

export default function MerchantProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      <main className="mt-5 flex-1 max-w-300 mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-10">
        {/* 商戶後台分流導航列（輕量外殼 — Hero 已下放至總覽頁承載） */}
        <ProfileTabNav tabs={MERCHANT_TABS} />

        {/* 渲染子頁面內容 */}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
