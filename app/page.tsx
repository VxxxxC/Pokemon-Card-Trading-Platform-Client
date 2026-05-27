/**
 * Homepage - Revamped according to HKcardvault specification
 * 首頁 Section 由上至下黃金排列藍圖
 *
 * Structure (top to bottom):
 * 🌐 Global Top: Market Pulse Ticker (PriceTicker)
 * 1. Hero & Smart Search (HeroSmartSearch)
 * 2. Trust Booster Banner (TrustBoosterBanner)
 * 3. My Following Feed (MyFollowingFeed)
 * 4. Sniper Radar (SniperRadar)
 * 5. Premium Escrow Market (CardGrid - enhanced)
 * 6. Portfolio & Daily Check-in (CheckInWidget - existing)
 * 7. New Arrivals C2C (CardGrid - latest)
 * 8. Tokyo Market Reference (TokyoMarketReference)
 *
 * + Live Transaction Wall (TransactionWall - sidebar on desktop)
 */

import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { HeroSmartSearch } from "@/app/components/home/HeroSmartSearch";
import { TrustBoosterBanner } from "@/app/components/home/TrustBoosterBanner";
import { MyFollowingFeed } from "@/app/components/home/MyFollowingFeed";
import { SniperRadar } from "@/app/components/home/SniperRadar";
import { TokyoMarketReference } from "@/app/components/home/TokyoMarketReference";
import { CardGrid } from "@/app/components/cards/CardGrid";
import { TransactionWall } from "@/app/components/transactions/TransactionWall";
import { CheckInWidget } from "@/app/components/profile/CheckInWidget";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      {/* 🌐 Global Top: Market Pulse Ticker (Section 🌐) */}
      <PriceTicker />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* Section 1: Hero & Smart Search */}
        <div className="mt-5 mb-6">
          <HeroSmartSearch />
        </div>

        {/* Section 2: Trust Booster Banner */}
        <div className="mb-8">
          <TrustBoosterBanner />
        </div>

        {/* Section 3: My Following Feed */}
        <MyFollowingFeed />

        {/* Section 4: Sniper Radar (破底價專區) */}
        <SniperRadar />

        {/* Main content grid: Premium Escrow Market + Transaction Wall + Portfolio */}
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8 mb-8">
          {/* Left: Section 5 Premium Escrow Market & Section 7 New Arrivals */}
          <div className="space-y-8">
            {/* Section 5: Premium Escrow Market (認證商家·鑑定託管保障區) */}
            <section aria-labelledby="premium-escrow-heading">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    id="premium-escrow-heading"
                    className="font-sans font-semibold text-[20px] text-text-primary"
                  >
                    🏅 認證商家託管專區
                  </h2>
                  <p className="font-sans text-[12px] text-text-secondary mt-1">
                    KYC 認證商家 · 強制實物細節 · 兩段式金流
                  </p>
                </div>
                <Link
                  href="/marketplace?verified=true"
                  className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
                >
                  查看全部 →
                </Link>
              </div>
              <CardGrid />
            </section>

            {/* Section 7: New Arrivals C2C (最新現貨上架) */}
            <section aria-labelledby="new-arrivals-heading">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    id="new-arrivals-heading"
                    className="font-sans font-semibold text-[20px] text-text-primary"
                  >
                    最新上架
                  </h2>
                  <p className="font-sans text-[12px] text-text-secondary mt-1">
                    私人玩家 C2C 散件現貨
                  </p>
                </div>
                <Link
                  href="/marketplace?sort=newest"
                  className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
                >
                  查看全部 →
                </Link>
              </div>
              <CardGrid />
            </section>
          </div>

          {/* Right: Transaction Wall + Portfolio Widget */}
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

            {/* Section 6: Portfolio & Daily Check-in Widget */}
            <section aria-labelledby="portfolio-heading">
              <h2
                id="portfolio-heading"
                className="font-sans font-semibold text-[20px] text-text-primary mb-4"
              >
                個人卡盒
              </h2>
              <CheckInWidget />
            </section>
          </aside>
        </div>

        {/* Section 8: Tokyo Market Reference (日本東京連線市價參考) */}
        <div className="mb-8">
          <TokyoMarketReference />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
