"use client";

import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

export function MarketplaceChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      <TopNav />
      <MobileHeader />
      {children}
      <BottomNav />
    </div>
  );
}
