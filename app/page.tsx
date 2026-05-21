import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { CardGrid } from "@/app/components/cards/CardGrid";
import { TransactionWall } from "@/app/components/transactions/TransactionWall";

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] flex flex-col">
      <TopNav activePath="/" />
      <MobileHeader />
      <PriceTicker />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        {/* Asymmetric 3:2 split on desktop — card listings left, transaction wall right */}
        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8">
          {/* Left: Featured Listings */}
          <section aria-labelledby="featured-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="featured-heading"
                className="font-sans font-semibold text-[20px] text-[#202124]"
              >
                精選上架
              </h2>
              <a
                href="/search"
                className="font-mono text-[12px] text-[#2563EB] hover:underline"
              >
                すべて見る →
              </a>
            </div>
            <CardGrid />
          </section>

          {/* Right: Live Transaction Wall */}
          <aside aria-labelledby="transactions-heading" className="mt-8 lg:mt-0">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="transactions-heading"
                className="font-sans font-semibold text-[20px] text-[#202124]"
              >
                最新成交
              </h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#16A34A]">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"
                  aria-hidden="true"
                />
                リアルタイム
              </span>
            </div>
            <TransactionWall />
          </aside>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
