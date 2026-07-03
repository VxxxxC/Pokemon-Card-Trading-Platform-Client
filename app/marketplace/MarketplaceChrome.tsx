"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

function shouldHideMarketplaceNav(pathname: string | null): boolean {
  if (!pathname) return false;
  return /^\/marketplace\/product\/[^/]+$/.test(pathname);
}

export function MarketplaceChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = shouldHideMarketplaceNav(pathname);

  return (
    <div className="min-h-[100dvh] bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      {!hideNav ? <TopNav /> : null}
      {!hideNav ? <MobileHeader /> : null}
      {children}
      {!hideNav ? <BottomNav /> : null}
    </div>
  );
}
