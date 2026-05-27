import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Footer } from "@/app/components/navigation/Footer";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { CardGrid } from "@/app/components/cards/CardGrid";
import { TransactionWall } from "@/app/components/transactions/TransactionWall";
import { HeroSearch } from "@/app/components/home/HeroSearch";
import { TrustBanner } from "@/app/components/home/TrustBanner";
import { FollowingFeed } from "@/app/components/home/FollowingFeed";
import { SniperRadar } from "@/app/components/home/SniperRadar";
import { PremiumMarket } from "@/app/components/home/PremiumMarket";
import { PortfolioRewards } from "@/app/components/home/PortfolioRewards";
import { NewArrivals } from "@/app/components/home/NewArrivals";
import { TokyoMarketIndex } from "@/app/components/home/TokyoMarketIndex";

// TODO: [database] Replace with Supabase query — fetch active box series from `card_series` table with live HKD price feed
// TODO: [API] Connect to Mercari JP scraper for real-time box series pricing converted to HKD
const marketSeries = [
  { code: "sv4a", name: "Shiny Treasure ex Box", price: "HK$3,500", delta: "+12%", dir: "up" as const },
  { code: "sv2a", name: "Pokémon Card 151 Box", price: "HK$9,360", delta: "-3%", dir: "down" as const },
  { code: "s12a", name: "VSTAR Universe Box", price: "HK$5,300", delta: "+8%", dir: "up" as const },
  { code: "sv6a", name: "Night Wanderer Box", price: "HK$2,500", delta: "+5%", dir: "up" as const },
];

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />
      <PriceTicker />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* Section 1: Hero — Smart Search + Quick Filters */}
        <HeroSearch />

        {/* Section 2: Trust Booster — How It Works (3-step escrow) */}
        <TrustBanner />

        {/* Section 3: Following Feed — personalized card slider */}
        <FollowingFeed />

        {/* Section 4: Sniper Radar — below-market deals */}
        <SniperRadar />

        {/* Section 5: Premium Escrow Market — KYC merchant listings */}
        <PremiumMarket />

        {/* Section 6: Portfolio & Daily Rewards */}
        <PortfolioRewards />

        {/* Asymmetric 3:2 split on desktop: Featured + Market Dynamics */}
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8 mb-8">
          {/* Left: Section 7 — C2C New Arrivals */}
          <section aria-labelledby="arrivals-section">
            <NewArrivals />

            {/* Featured Listings (existing CardGrid) */}
            <div className="flex items-center justify-between mb-4">
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
            <CardGrid />
          </section>

          {/* Right: Market Dynamics + Live Transaction Wall */}
          <aside className="mt-8 lg:mt-0 space-y-6">
            {/* Market Series Dynamics */}
            <section aria-labelledby="market-heading">
              <h2
                id="market-heading"
                className="font-sans font-semibold text-[20px] text-text-primary mb-4"
              >
                市場動態
              </h2>
              <div className="space-y-2">
                {marketSeries.map((series) => (
                  <Link
                    key={series.code}
                    href={`/marketplace?set=${series.code}`}
                    className="flex items-center justify-between px-4 py-3 bg-bg-card rounded-[10px] border border-[rgba(237,232,224,0.08)] hover:bg-bg-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] px-2 py-0.5 rounded-[4px] shrink-0">
                        {series.code}
                      </span>
                      <span className="font-sans text-[13px] text-text-primary truncate max-w-[140px]">
                        {series.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono text-[13px] text-text-primary block">
                        {series.price}
                      </span>
                      <span
                        className={`font-mono text-[11px] ${
                          series.dir === "up" ? "text-success" : "text-warning"
                        }`}
                      >
                        {series.dir === "up" ? "▲" : "▼"} {series.delta}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

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
    </div>
  );
}
