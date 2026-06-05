"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Footer } from "@/app/components/navigation/Footer";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { HeroSearch } from "@/app/components/home/HeroSearch";
import { TrustBanner } from "@/app/components/home/TrustBanner";
import { PremiumMarket } from "@/app/components/home/PremiumMarket";
import { PortfolioRewards } from "@/app/components/home/PortfolioRewards";
import { NewArrivals } from "@/app/components/home/NewArrivals";
import { WishlistTicker } from "@/app/components/shared/WishlistTicker";
import { ExecutionSlideOver } from "./components/transactions/ExecutionSlideOver";
import { CheckInCard } from "@/app/components/rewards/CheckInCard";
// 🟢 引入全新頂部高轉化 Inline 提示條
import { PwaInlineBanner } from "./components/pwa/PwaInlineBanner";

// 將 PwaInstallPrompt 封裝為非 SSR 的純客戶端動態組件
const PwaInstallPrompt = dynamic(
  () =>
    import("./components/pwa/PwaInstallPrompt").then(
      (mod) => mod.PwaInstallPrompt,
    ),
  { ssr: false },
);

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page text-text-primary flex flex-col font-sans">
      {/* 頂部全域看盤元件外框鏈 */}
      <TopNav />
      <MobileHeader />

      {/* 🟢 核心對齊位置：黏貼在 Navbar 的 Bottom line 下面，無痛融合進看盤排版 */}
      <PwaInlineBanner />

      <PriceTicker />

      {/* 安全隔離後的 PWA 右下角浮動窗提示 */}
      <PwaInstallPrompt />

      {/* 主線大盤跑道 */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* Section 1: Hero — Smart Search + Quick Filters */}
        <HeroSearch />

        <div className="mb-8">
          <CheckInCard />
        </div>

        {/* Section 2: Trust Booster — How It Works (3-step escrow) */}
        <TrustBanner />

        {/* Section 3: 心水情報 — wishlist cards with price alerts & personal feed */}
        <WishlistTicker />

        {/* Section 5: Premium Escrow Market — KYC merchant listings */}
        <PremiumMarket />

        {/* Section 6: Portfolio & Daily Rewards */}
        <PortfolioRewards />

        {/* Left: Section 7 — C2C New Arrivals */}
        <NewArrivals />
      </main>

      {/* E-shop style Footer */}
      <Footer />

      <BottomNav />

      {/* 全域智能交割總線抽屜 */}
      <ExecutionSlideOver />
    </div>
  );
}
