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
import { useUIStore } from "@/app/store/useUIStore";

// 將 PwaInstallPrompt 封裝為非 SSR 的純客戶端動態組件
const PwaInstallPrompt = dynamic(
  () =>
    import("./components/pwa/PwaInstallPrompt").then(
      (mod) => mod.PwaInstallPrompt,
    ),
  { ssr: false },
);

export default function HomePage() {
  // const mockRole = useUIStore((state) => state.mockRole);

  return (
    <div className="min-h-[100dvh] bg-bg-page text-text-primary flex flex-col font-sans items-center justify-center p-6">
      <div className="text-center max-w-md mx-auto space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-200 bg-clip-text text-transparent font-sans">
          HKCardVault
        </h1>
        <div className="h-[1px] w-12 bg-amber-500/50 mx-auto" />
        <p className="text-sm text-text-secondary tracking-wider">
          暫時維護中 / Under Maintenance
        </p>
      </div>

      {/*
      <TopNav />
      <MobileHeader />

      <PwaInlineBanner />

      <PriceTicker />

      <PwaInstallPrompt />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        <HeroSearch />

        <TrustBanner />

        {(mockRole === "USER" || mockRole === "ADMIN") && <WishlistTicker />}

        <PremiumMarket />

        <PortfolioRewards />

        <NewArrivals />
      </main>

      <Footer />

      <BottomNav />
      */}
    </div>
  );
}
