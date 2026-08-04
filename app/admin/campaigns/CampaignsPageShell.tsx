"use client";

import { useState } from "react";
import type { AdminRewardTemplateRow } from "@/lib/admin-rewards/types";
import { AdminRewardTemplatesClient } from "./AdminRewardTemplatesClient";
import { CampaignsMockTab } from "./CampaignsMockTab";

type CampaignsPageShellProps = {
  initialTemplates: AdminRewardTemplateRow[];
  initialTotal: number;
  templatesLoadError: string | null;
};

type CampaignTab = "templates" | "activities";

export function CampaignsPageShell({
  initialTemplates,
  initialTotal,
  templatesLoadError,
}: CampaignsPageShellProps) {
  const [activeTab, setActiveTab] = useState<CampaignTab>("templates");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-[24px] font-bold text-[#eae1da]">
          積分與獎勵活動
        </h1>
        <p className="mt-1 text-sm text-[#d4c4b7]">
          管理獎勵模板與（Phase 3）限時搶券活動。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "templates"
              ? "bg-brand text-[#17130f]"
              : "bg-[#26211C] text-[#d4c4b7] border border-white/10"
          }`}
        >
          獎勵模板
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activities")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "activities"
              ? "bg-brand text-[#17130f]"
              : "bg-[#26211C] text-[#d4c4b7] border border-white/10"
          }`}
        >
          活動管理（Phase 3 搶券 · Mock）
        </button>
      </div>

      {activeTab === "templates" ? (
        <AdminRewardTemplatesClient
          initialRows={initialTemplates}
          initialTotal={initialTotal}
          loadError={templatesLoadError}
        />
      ) : (
        <CampaignsMockTab />
      )}
    </div>
  );
}
