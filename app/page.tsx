import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { PriceTicker } from "@/app/components/ticker/PriceTicker";
import { HeroSmartSearch } from "@/app/components/home/HeroSmartSearch";
import { TrustBoosterBanner } from "@/app/components/home/TrustBoosterBanner";
import { FollowingFeed } from "@/app/components/home/FollowingFeed";
import { SniperRadar } from "@/app/components/home/SniperRadar";
import { PremiumEscrowMarket } from "@/app/components/home/PremiumEscrowMarket";
import { PortfolioAndRewards } from "@/app/components/home/PortfolioAndRewards";
import { NewArrivals } from "@/app/components/home/NewArrivals";
import { TokyoMarketIndex } from "@/app/components/home/TokyoMarketIndex";

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />
      <PriceTicker />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pb-28 lg:pb-10">
        <div className="mt-5">
          <HeroSmartSearch />
          <TrustBoosterBanner />
          <FollowingFeed />
          <SniperRadar />
          <PremiumEscrowMarket />
          <PortfolioAndRewards />
          <NewArrivals />
          <TokyoMarketIndex />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
