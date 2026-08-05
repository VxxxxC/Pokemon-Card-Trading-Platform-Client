"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RewardCampaignScheduleStep() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-[#17130f] px-4 py-3 text-sm text-[#d4c4b7]">
        搶券檔期（開始/結束時間、場次庫存、每人限搶）將於 Phase 3 接入。你現在可以先完成模板定義並發布；稍後可為同一模板新增多個檔期。
      </div>

      <div className="grid gap-3 sm:grid-cols-2 opacity-50 pointer-events-none">
        <div>
          <Label htmlFor="campaign-starts">活動開始</Label>
          <Input id="campaign-starts" type="datetime-local" disabled />
        </div>
        <div>
          <Label htmlFor="campaign-ends">活動結束</Label>
          <Input id="campaign-ends" type="datetime-local" disabled />
        </div>
        <div>
          <Label htmlFor="campaign-stock">場次庫存</Label>
          <Input id="campaign-stock" type="number" disabled placeholder="100" />
        </div>
        <div>
          <Label htmlFor="campaign-per-user">每人限搶</Label>
          <Input id="campaign-per-user" type="number" disabled placeholder="1" />
        </div>
      </div>
    </div>
  );
}
