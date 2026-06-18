"use client";

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
      {/* 頂部全域看盤元件列 */}
      <TopNav />
      <MobileHeader />

      {/* 奢華常駐看盤提示條 */}
      <PwaInlineBanner />

      <PriceTicker />

      {/* 安全隔離後的 PWA 提示組件 */}
      <PwaInstallPrompt />

      {/* 主線大盤跑道 */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* 🟢 頂級整合：Hero看板自帶右翼每日簽到控制台，視覺合流 */}
        <HeroSearch />

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

      {/* 全域交割終端已遷移至 product/[id]/page.tsx props-based 架構 */}
    </div>
  );
}
