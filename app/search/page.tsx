import type { Metadata } from "next";
import { TopNav } from "@/app/components/navigation/TopNav";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { MarketplaceHeader } from "@/app/components/marketplace/MarketplaceHeader";
import { MarketplaceGrid } from "@/app/components/marketplace/MarketplaceGrid";

export const metadata: Metadata = {
  title: "市場 · Marketplace",
  description: "Browse premium Japanese Pokémon cards — SAR, UR, AR, and sealed product.",
};

export default function SearchPage() {
  return (
    <div className="min-h-[100dvh] bg-[#17130f] flex flex-col">
      {/* Desktop nav — hidden on mobile */}
      <TopNav />

      {/* Sticky search + category pills */}
      <MarketplaceHeader />

      {/* Product grid — pb-28 clears floating BottomNav */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full pb-28 lg:pb-10">
        <MarketplaceGrid />
      </main>

      {/* Floating bottom nav (mobile) */}
      <BottomNav />
    </div>
  );
}
