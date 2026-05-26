import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { CardGrid } from "@/app/components/cards/CardGrid";
import { TransactionWall } from "@/app/components/transactions/TransactionWall";

// TODO [MOCK DATA]: Replace with Supabase query — fetch active box series from `card_series` table with live price feed
const marketSeries = [
  { code: "sv4a", name: "Shiny Treasure ex Box", price: "¥4,500", delta: "+12%", dir: "up" as const },
  { code: "sv2a", name: "Pokémon Card 151 Box", price: "¥12,000", delta: "-3%", dir: "down" as const },
  { code: "s12a", name: "VSTAR Universe Box", price: "¥6,800", delta: "+8%", dir: "up" as const },
  { code: "sv6a", name: "Night Wanderer Box", price: "¥3,200", delta: "+5%", dir: "up" as const },
];

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />
      <PriceTicker />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-8">
        {/* Hero section — card image with gradient overlay + CTA */}
        <section
          className="relative mt-5 mb-8 rounded-[16px] overflow-hidden min-h-[220px] lg:min-h-[300px] flex items-end"
          aria-labelledby="hero-heading"
        >
          <Image
            src="https://picsum.photos/seed/poke-hero-charizard/800/400"
            alt="Charizard ex SAR — 151 系列"
            fill
            className="object-cover"
            priority
          />
          {/* TODO [MOCK DATA]: Replace picsum placeholder with real card image from Supabase Storage or TCGdex CDN */}
          {/* Mobile: bottom-up gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#17130f] via-[#17130f]/55 to-transparent lg:hidden" />
          {/* Desktop: left-to-right gradient */}
          <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#17130f] via-[#17130f]/70 to-transparent" />
          <div className="relative z-10 p-6 lg:p-10 w-full lg:max-w-[560px]">
            <span className="font-mono text-[11px] text-brand uppercase tracking-widest">
              最新系列
            </span>
            <h1
              id="hero-heading"
              className="font-sans font-bold text-[26px] lg:text-[34px] text-text-primary leading-tight mt-1 mb-2"
            >
              151 系列絕版收藏
            </h1>
            <p className="font-sans text-[14px] text-text-secondary mb-5 max-w-[320px]">
              精選高分鑑定卡，實時價格透明。
            </p>
            <Link
              href="/marketplace?set=sv2a"
              className="inline-flex items-center justify-center h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover"
            >
              立即探索
            </Link>
          </div>
        </section>

        {/* Asymmetric 3:2 split on desktop */}
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8">
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
      </main>

      <BottomNav />
    </div>
  );
}
