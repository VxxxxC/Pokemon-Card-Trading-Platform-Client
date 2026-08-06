"use client";

import { useState } from "react";
import type { AdminRewardCampaignRow, AdminRewardTemplateRow } from "@/lib/admin-rewards/types";
import { AdminRewardTemplatesClient } from "./AdminRewardTemplatesClient";
import { AdminRewardCampaignsClient } from "./AdminRewardCampaignsClient";
import { CampaignsMockTab } from "./CampaignsMockTab";

type CampaignsPageShellProps = {
  initialTemplates: AdminRewardTemplateRow[];
  initialTotal: number;
  templatesLoadError: string | null;
  initialCampaigns: AdminRewardCampaignRow[];
  campaignsTotal: number;
  campaignsLoadError: string | null;
};

type CampaignTab = "templates" | "activities" | "roi";

export function CampaignsPageShell({
  initialTemplates,
  initialTotal,
  templatesLoadError,
  initialCampaigns,
  campaignsTotal,
  campaignsLoadError,
}: CampaignsPageShellProps) {
  const [activeTab, setActiveTab] = useState<CampaignTab>("templates");

  const flashTemplates = initialTemplates.filter(
    (row) => row.distribution_mode === "flash_only",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-[24px] font-bold text-[#eae1da]">
          積分與獎勵活動
        </h1>
        <p className="mt-1 text-sm text-[#d4c4b7]">
          管理獎勵模板、限時搶券檔期與活動分析。
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
          搶券檔期
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roi")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "roi"
              ? "bg-brand text-[#17130f]"
              : "bg-[#26211C] text-[#d4c4b7] border border-white/10"
          }`}
        >
          ROI 分析（展示）
        </button>
      </div>

      {activeTab === "templates" ? (
        <AdminRewardTemplatesClient
          initialRows={initialTemplates}
          initialTotal={initialTotal}
          loadError={templatesLoadError}
        />
      ) : null}

      {activeTab === "activities" ? (
        <AdminRewardCampaignsClient
          initialCampaigns={initialCampaigns}
          initialTotal={campaignsTotal}
          flashTemplates={flashTemplates}
          loadError={campaignsLoadError}
        />
      ) : null}

      {activeTab === "roi" ? <CampaignsMockTab /> : null}
    </div>
  );
}
