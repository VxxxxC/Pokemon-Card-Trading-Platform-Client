"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { getUserRewardCoupons } from "@/app/actions/rewards";
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn text-text-primary">
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
      <RewardNotificationHost />
    </div>
  );
}
