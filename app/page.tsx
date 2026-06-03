"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Footer } from "@/app/components/navigation/Footer";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { TransactionWall } from "@/app/components/transactions/TransactionWall";
import { HeroSearch } from "@/app/components/home/HeroSearch";
import { TrustBanner } from "@/app/components/home/TrustBanner";
import { SniperRadar } from "@/app/components/home/SniperRadar";
import { PremiumMarket } from "@/app/components/home/PremiumMarket";
import { PortfolioRewards } from "@/app/components/home/PortfolioRewards";
import { NewArrivals } from "@/app/components/home/NewArrivals";
import { TokyoMarketIndex } from "@/app/components/home/TokyoMarketIndex";
import { WishlistTicker } from "@/app/components/shared/WishlistTicker";
import { ExecutionSlideOver } from "./components/transactions/ExecutionSlideOver";
import { FeaturedCarousel } from "@/app/components/home/FeaturedCarousel";
import { CheckInCard } from "@/app/components/rewards/CheckInCard";

// 將 PwaInstallPrompt 封裝為非 SSR 的純客戶端動態組件！
// 這樣 Server 端渲染時這裡會完全保持真空，等 Client 進場水合完畢後才加載
const PwaInstallPrompt = dynamic(
  () =>
    import("./components/pwa/PwaInstallPrompt").then(
      (mod) => mod.PwaInstallPrompt,
    ),
  { ssr: false },
);

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      {/* 頂部全域看盤元件列 */}
      <TopNav />
      <MobileHeader />
      <PriceTicker />

      {/* 安全隔離後的 PWA 提示組件 */}
      <PwaInstallPrompt />

      {/* 主線大盤跑道 */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* Section 1: Hero — Smart Search + Quick Filters */}
        <div className="flex flex-row w-full">
          <HeroSearch />
          <CheckInCard />
        </div>

        {/* Section 2: Trust Booster — How It Works (3-step escrow) */}
        <TrustBanner />

        {/* Section 3: 心水情報 — wishlist cards with price alerts & personal feed */}
        <WishlistTicker />

        {/* Section 4: Sniper Radar — below-market deals */}
        <SniperRadar />

        {/* Section 5: Premium Escrow Market — KYC merchant listings */}
        <PremiumMarket />

        {/* Section 6: Portfolio & Daily Rewards */}
        <PortfolioRewards />

        {/* Asymmetric 3:2 split on desktop: Featured + Market Dynamics */}
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8 mb-8">
          {/* Left: Section 7 — C2C New Arrivals */}
          <section aria-labelledby="arrivals-section" className="min-w-0">
            {/* 無限平滑自動傳送帶 */}
            <NewArrivals />

            {/* Featured Listings (existing CardGrid) */}
            <div className="flex items-center justify-between mb-4 mt-6">
              <h2
                id="featured-heading"
                className="font-sans font-semibold text-[20px] text-text-primary"
              >
                精選拍賣
              </h2>
              <Link
                href="/marketplace"
                className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
              >
                查看全部 →
              </Link>
            </div>
            {/* 精選拍賣即時競投輪播線 */}
            <FeaturedCarousel />
          </section>

          {/* Right: Market Dynamics + Live Transaction Wall */}
          <aside className="mt-8 lg:mt-0 space-y-6">
            {/* Live Transaction Wall */}
            <section aria-labelledby="transactions-heading">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="transactions-heading"
                  className="font-sans font-semibold text-[20px] text-text-primary"
                >
                  最新交易
                </h2>
                <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-success">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"
                    aria-hidden="true"
                  />
                  即時
                </span>
              </div>
              <TransactionWall />
            </section>
          </aside>
        </div>

        {/* Section 8: Tokyo Market Reference Index */}
        <TokyoMarketIndex />
      </main>

      {/* E-shop style Footer */}
      <Footer />

      <BottomNav />

      {/* 全域智能交割總線抽屜 */}
      <ExecutionSlideOver />
    </div>
  );
}
