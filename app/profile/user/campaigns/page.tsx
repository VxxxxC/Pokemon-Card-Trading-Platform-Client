"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { getUserRewardCoupons } from "@/app/actions/rewards";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { TopNav } from "@/app/components/navigation/TopNav";
import { FlashCampaignSection } from "@/app/components/rewards/FlashCampaignSection";
import { PointsRedemptionSection } from "@/app/components/rewards/PointsRedemptionSection";
import { RewardNotificationHost } from "@/app/components/rewards/RewardNotificationHost";

type CampaignTab = "flash" | "points";

const TAB_LABELS: Record<CampaignTab, string> = {
  flash: "限時搶券",
  points: "積分商城",
};

export default function MemberCampaignsPage() {
  const [activeTab, setActiveTab] = useState<CampaignTab>("flash");

  const reloadCoupons = useCallback(async () => {
    await getUserRewardCoupons();
  }, []);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page flex flex-col text-[#eae1da]">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 pt-4 pb-28 lg:pb-12 space-y-6 animate-fadeIn">
        <div className="font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link href="/profile/user" className="hover:text-brand transition-colors">
            👤 我的帳號總覽
          </Link>
          <span className="text-text-disabled">/</span>
          <Link href="/profile/user/rewards" className="hover:text-brand transition-colors">
            獎勵中心
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-disabled uppercase">活動商城</span>
        </div>

        <div>
          <h2 className="font-sans font-black text-[22px] lg:text-[26px] text-[#eae1da] tracking-tight">
            限時搶券 · 積分商城
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            FLASH CAMPAIGNS & POINTS REDEMPTION
          </p>
        </div>

        <div className="flex border-b border-[rgba(237,232,224,0.08)]">
          {(Object.keys(TAB_LABELS) as CampaignTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-sans text-[13.5px] font-semibold transition-all relative cursor-pointer ${
                  isActive ? "text-brand" : "text-[#d4c4b7] hover:text-[#eae1da]"
                }`}
              >
                {TAB_LABELS[tab]}
                {isActive ? (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />
                ) : null}
              </button>
            );
          })}
        </div>

        {activeTab === "flash" ? (
          <FlashCampaignSection
            onClaimed={reloadCoupons}
            paginated
            showHeading={false}
          />
        ) : (
          <PointsRedemptionSection
            onRedeemed={reloadCoupons}
            paginated
            showHeading={false}
          />
        )}
      </main>

      <BottomNav />
      <RewardNotificationHost />
    </div>
  );
}
