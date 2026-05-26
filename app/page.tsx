import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { CardGrid } from "@/app/components/cards/CardGrid";
import { TransactionWall } from "@/app/components/transactions/TransactionWall";
import { HeroSection } from "@/app/components/home/HeroSection";
import { TrustBooster } from "@/app/components/home/TrustBooster";
import { FollowingFeed } from "@/app/components/home/FollowingFeed";
import { SniperRadar } from "@/app/components/home/SniperRadar";
import { TrustedSellers } from "@/app/components/home/TrustedSellers";
import { PortfolioDashboard } from "@/app/components/home/PortfolioDashboard";
import { NewArrivals } from "@/app/components/home/NewArrivals";
import { TokyoMarketIndex } from "@/app/components/home/TokyoMarketIndex";
import { Footer } from "@/app/components/home/CommunityNews";
import { fetchPokemonCards, toMarketSeries } from "@/app/lib/pokemon-data";

// TODO [server]: Replace with Supabase query — fetch active box series from `card_series` table with live price feed
const fallbackSeries = [
  { code: "sv4a", name: "Shiny Treasure ex Box", price: "¥4,500", delta: "+12%", dir: "up" as const },
  { code: "sv2a", name: "Pokémon Card 151 Box", price: "¥12,000", delta: "-3%", dir: "down" as const },
  { code: "s12a", name: "VSTAR Universe Box", price: "¥6,800", delta: "+8%", dir: "up" as const },
  { code: "sv6a", name: "Night Wanderer Box", price: "¥3,200", delta: "+5%", dir: "up" as const },
];

export default async function HomePage() {
  let marketSeries;
  try {
    const apiCards = await fetchPokemonCards({
      q: "supertype:pokémon",
      pageSize: 4,
    });
    // Deduplicate by set id
    const seenSets = new Set<string>();
    const uniqueBySet = apiCards.filter((c) => {
      if (seenSets.has(c.set.id)) return false;
      seenSets.add(c.set.id);
      return true;
    });
    marketSeries =
      uniqueBySet.length >= 4
        ? uniqueBySet.slice(0, 4).map(toMarketSeries)
        : fallbackSeries;
  } catch {
    marketSeries = fallbackSeries;
  }
  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      {/* Spec Global Top: 實時成交走馬燈 (Market Pulse Ticker) */}
      <PriceTicker />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* ── Spec Section 1: Hero & Smart Search (with Quick Filter Chips) ── */}
        <HeroSection />

        {/* ── Spec Section 2: Trust Booster Banner (3-step How It Works) ── */}
        <TrustBooster />

        {/* ── Spec Section 3: My Following Feed (horizontal card slider) ── */}
        <FollowingFeed />

        {/* ── Spec Section 4: Sniper Radar (below-market-price deals) ── */}
        <SniperRadar />

        {/* ── Spec Section 5: Premium Escrow Market (KYC merchant cards) ── */}
        <TrustedSellers />

        {/* ── Spec Section 5 (cont.): Featured Listings + Market Dynamics ── */}
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8 mb-8">
          {/* Left: Featured Listings */}
          <section aria-labelledby="featured-heading">
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

        {/* ── Spec Section 6: Portfolio & Daily Rewards ── */}
        <PortfolioDashboard />

        {/* ── Spec Section 7: New Arrivals C2C ── */}
        <NewArrivals />

        {/* ── Spec Section 8: Tokyo Market Reference Index ── */}
        <TokyoMarketIndex />
      </main>

      {/* ── Footer ── */}
      <Footer />

      <BottomNav />
    </div>
  );
}
