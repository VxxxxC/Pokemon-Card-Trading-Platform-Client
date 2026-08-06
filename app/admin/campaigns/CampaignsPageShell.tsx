"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminCheckInProgramClient } from "./AdminCheckInProgramClient";
import { AdminRewardActivitiesClient } from "./AdminRewardActivitiesClient";
import {
  type CampaignTab,
  campaignTabToQuery,
} from "./campaign-tabs";
import type { CheckInProgramRow } from "@/lib/admin-check-in-program/types";
import type { AdminRewardActivityRow } from "@/lib/admin-rewards/types";

type CampaignsPageShellProps = {
  initialActivities: AdminRewardActivityRow[];
  activitiesTotal: number;
  activitiesLoadError: string | null;
  initialCheckInProgram: CheckInProgramRow | null;
  checkInLoadError: string | null;
  initialTab: CampaignTab;
};

export function CampaignsPageShell({
  initialActivities,
  activitiesTotal,
  activitiesLoadError,
  initialCheckInProgram,
  checkInLoadError,
  initialTab,
}: CampaignsPageShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CampaignTab>(initialTab);

  const handleTabChange = (tab: CampaignTab) => {
    setActiveTab(tab);
    const query = campaignTabToQuery(tab);
    router.replace(query ? `/admin/campaigns?tab=${query}` : "/admin/campaigns");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-[24px] font-bold text-[#eae1da]">
          積分與獎勵活動
        </h1>
        <p className="mt-1 text-sm text-[#d4c4b7]">
          管理獎勵活動（自動發放、限時搶領）與簽到計劃。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("activities")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "activities"
              ? "bg-brand text-[#17130f]"
              : "bg-[#26211C] text-[#d4c4b7] border border-white/10"
          }`}
        >
          獎勵活動
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("check_in")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "check_in"
              ? "bg-brand text-[#17130f]"
              : "bg-[#26211C] text-[#d4c4b7] border border-white/10"
          }`}
        >
          簽到計劃
        </button>
      </div>

      {activeTab === "activities" ? (
        <AdminRewardActivitiesClient
          initialRows={initialActivities}
          initialTotal={activitiesTotal}
          loadError={activitiesLoadError}
        />
      ) : null}

      {activeTab === "check_in" ? (
        <AdminCheckInProgramClient
          initialRow={initialCheckInProgram}
          loadError={checkInLoadError}
        />
      ) : null}
    </div>
  );
}
