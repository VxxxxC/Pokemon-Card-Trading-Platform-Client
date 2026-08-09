"use client";

import { useCallback, useEffect, useState, useTransition, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  claimFlashReward,
  listActiveFlashCampaigns,
} from "@/app/actions/reward-flash";
import type { FlashCampaignView } from "@/lib/admin-rewards/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type FlashCampaignSectionProps = {
  onClaimed?: () => void;
};

function rewardLabel(campaign: FlashCampaignView): string {
  if (campaign.template.type === "free_shipping") {
    const cap = Number(campaign.template.reward_value.max_subsidy_hkd ?? 0);
    return cap > 0 ? `免運（最高 HK$${cap}）` : "免運券";
  }

  const amount = Number(campaign.template.reward_value.amount_hkd ?? 0);
  return amount > 0 ? `折扣 HK$${amount}` : campaign.template.title;
}

function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Cached snapshot — getSnapshot must return the same value until the store notifies.
let flashCountdownNowMs = 0;

function subscribeFlashCountdown(onStoreChange: () => void) {
  flashCountdownNowMs = Date.now();
  const intervalId = window.setInterval(() => {
    flashCountdownNowMs = Date.now();
    onStoreChange();
  }, 1000);
  return () => window.clearInterval(intervalId);
}

function getFlashCountdownNowSnapshot() {
  return flashCountdownNowMs;
}

function getFlashCountdownNowServerSnapshot() {
  return 0;
}

export function FlashCampaignSection({ onClaimed }: FlashCampaignSectionProps) {
  const [campaigns, setCampaigns] = useState<FlashCampaignView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const now = useSyncExternalStore(
    subscribeFlashCountdown,
    getFlashCountdownNowSnapshot,
    getFlashCountdownNowServerSnapshot,
  );
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshCampaigns = useCallback(async () => {
    const result = await listActiveFlashCampaigns();
    if (!result.success) {
      setCampaigns([]);
      setLoadError(result.error);
      setIsLoading(false);
      return;
    }

    setCampaigns(result.data);
    setLoadError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCampaigns = async () => {
      setIsLoading(true);
      setLoadError(null);

      const result = await listActiveFlashCampaigns();
      if (cancelled) {
        return;
      }

      if (!result.success) {
        setCampaigns([]);
        setLoadError(result.error);
        setIsLoading(false);
        return;
      }

      setCampaigns(result.data);
      setIsLoading(false);
    };

    void loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClaim = (campaignId: string) => {
    setClaimingId(campaignId);
    startTransition(async () => {
      const result = await claimFlashReward(campaignId);
      setClaimingId(null);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("搶券成功！已加入你的優惠券錢包");
      onClaimed?.();
      await refreshCampaigns();
    });
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4">
        <div className="flex items-center gap-2 text-sm text-[#d4c4b7]">
          <Spinner className="size-4 text-brand" />
          載入限時搶券活動中…
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4 text-sm text-[#d4c4b7]">
        無法載入限時搶券：{loadError}
      </section>
    );
  }

  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
          ⚡ 限時搶券
        </h3>
        <p className="font-mono text-[9px] text-[#50453b] uppercase tracking-wider">
          FLASH REWARD CAMPAIGNS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((campaign) => {
          const startsAt = new Date(campaign.starts_at).getTime();
          const endsAt = new Date(campaign.ends_at).getTime();
          const notStarted = now < startsAt;
          const ended = now >= endsAt;
          const countdownTarget = notStarted ? startsAt : endsAt;
          const countdownPrefix = notStarted ? "距離開始" : ended ? "已結束" : "距離結束";

          return (
            <div
              key={campaign.id}
              className="rounded-2xl border border-brand/20 bg-[#26211C] p-4 space-y-3"
            >
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-[14px] text-[#eae1da]">
                  {campaign.name}
                </h4>
                <p className="font-sans text-[12px] text-brand">
                  {rewardLabel(campaign)}
                </p>
                <p className="font-sans text-[11px] text-[#d4c4b7]">
                  {campaign.template.title}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 font-mono text-[11px] text-[#d4c4b7]">
                <span>
                  剩餘 {campaign.remaining_claims} / {campaign.max_claims}
                </span>
                <span>
                  今日已搶 {campaign.user_claims_today} /{" "}
                  {campaign.max_claims_per_user}
                </span>
              </div>

              <div className="font-mono text-[12px] text-[#eae1da]">
                {countdownPrefix}
                {!ended ? (
                  <span className="ml-2 text-brand font-bold">
                    {formatCountdown(countdownTarget, now)}
                  </span>
                ) : null}
              </div>

              <Button
                type="button"
                disabled={
                  isPending ||
                  !campaign.can_claim ||
                  notStarted ||
                  ended ||
                  claimingId === campaign.id
                }
                onClick={() => handleClaim(campaign.id)}
                className="w-full"
              >
                {claimingId === campaign.id ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    搶券中…
                  </span>
                ) : campaign.can_claim ? (
                  "立即搶券"
                ) : ended ? (
                  "活動已結束"
                ) : notStarted ? (
                  "尚未開始"
                ) : campaign.remaining_claims <= 0 ? (
                  "已搶光"
                ) : (
                  "今日已達上限"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
