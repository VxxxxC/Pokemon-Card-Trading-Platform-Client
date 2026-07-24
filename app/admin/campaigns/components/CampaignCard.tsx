"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export type CampaignStatus = "active" | "paused" | "expired";
export type Audience = "guest" | "member" | "vip";
export type AntiFraud = "ip" | "email_sms" | "kyc" | "stripe_device";
export type RewardType =
  | "commission_discount"
  | "cash_off"
  | "shipping"
  | "points";
export type CampaignType =
  | "首購立減"
  | "商戶邀請"
  | "佣金減免"
  | "特定卡包補貼";

export interface CampaignItem {
  id: string;
  name: string;
  type: CampaignType;
  bannerUrl?: string;
  startDate?: string;
  endDate?: string;
  audience: Audience;
  antiFraud: AntiFraud;
  tasks: string[];
  rewardType: RewardType;
  rewardValue: string;
  rewardLimit?: string;
  rewardDisplay?: string;
  reward?: string;
  clicks: number;
  redeems: number;
  roi: string;
  status: CampaignStatus;
  createdAt: string;
}

interface CampaignCardProps {
  campaign: CampaignItem;
  onToggleStatus: (id: string, newStatus?: CampaignStatus) => void;
}

const audienceDisplayMap: Record<Audience, string> = {
  guest: "全部用戶 (含未註冊訪客)",
  member: "僅限已註冊會員",
  vip: "指定等級 VIP",
};

const antiFraudDisplayMap: Record<AntiFraud, string> = {
  ip: "每個 IP 限領一次",
  email_sms: "電郵 / SMS 驗證",
  kyc: "限 KYC 實名",
  stripe_device: "限綁定相同 Stripe 信用卡與裝置",
};

const typeDisplayMap: Record<CampaignType, string> = {
  首購立減: "首購立減紅包 (拉新)",
  商戶邀請: "商戶邀請獎勵 (商家)",
  佣金減免: "熱門卡包交易減免 (促銷)",
  特定卡包補貼: "全場滿減/運費補貼",
};

export function CampaignCard({ campaign, onToggleStatus }: CampaignCardProps) {
  const statusBadge = (status: CampaignStatus) => {
    switch (status) {
      case "active":
        return <Badge variant="success">進行中</Badge>;
      case "paused":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-mono text-[10px]"
          >
            已暫停
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="default" className="text-text-disabled">
            已結束
          </Badge>
        );
      default:
        return <Badge variant="ghost">未知</Badge>;
    }
  };

  const formattedReward =
    campaign.rewardDisplay ?? campaign.reward ?? campaign.rewardValue;

  return (
    <Card className="bg-transparent border-0 border-b border-[rgba(237,232,224,0.06)] rounded-none last:border-b-0 hover:bg-bg-hover/50 transition-colors">
      <CardContent className="p-4 sm:p-5 flex flex-col gap-3.5">
        {/* ── Header: ID, Title, Type, Status & Switch / Select ───────────────────── */}
        <div className="flex items-start justify-between gap-3 w-full flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-[11px] text-text-disabled">
                #{campaign.id}
              </span>
              <h3 className="font-sans font-bold text-[15px] text-text-primary">
                {campaign.name}
              </h3>
              <Badge
                variant="outline"
                className="border-brand/30 text-brand bg-brand/10 font-mono text-[10px]"
              >
                {typeDisplayMap[campaign.type] ?? campaign.type}
              </Badge>
            </div>

            {/* Banner preview if provided */}
            {campaign.bannerUrl && (
              <div className="mt-1.5 mb-2 relative max-w-sm rounded-lg overflow-hidden border border-[rgba(237,232,224,0.1)] bg-bg-page">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={campaign.bannerUrl}
                  alt={campaign.name}
                  className="w-full h-16 object-cover opacity-85 hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {statusBadge(campaign.status)}

            {campaign.status !== "expired" ? (
              <div
                className="flex items-center gap-1.5"
                title="切換 進行中 / 已暫停"
              >
                <span className="font-mono text-[10px] text-text-secondary">
                  {campaign.status === "active" ? "開啟" : "關閉"}
                </span>
                <Switch
                  checked={campaign.status === "active"}
                  onCheckedChange={() => {
                    const nextStatus =
                      campaign.status === "active" ? "paused" : "active";
                    onToggleStatus(campaign.id, nextStatus);
                  }}
                  className="data-[state=checked]:bg-success data-[state=unchecked]:bg-bg-elevated"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Form Data Alignment Grid (Block 1-4 Details) ───────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-bg-page/70 border border-[rgba(237,232,224,0.06)] rounded-xl p-3 text-[11px]">
          {/* Target Audience & Anti-Fraud */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">👤</span>
              <span className="text-text-disabled font-mono text-[10px]">
                目標對象：
              </span>
              <span className="font-medium text-text-primary">
                {audienceDisplayMap[campaign.audience] ?? campaign.audience}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">🛡️</span>
              <span className="text-text-disabled font-mono text-[10px]">
                防刷機制：
              </span>
              <span className="font-medium text-text-primary">
                {antiFraudDisplayMap[campaign.antiFraud] ?? campaign.antiFraud}
              </span>
            </div>
          </div>

          {/* Date & Reward Config */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">📅</span>
              <span className="text-text-disabled font-mono text-[10px]">
                有效期：
              </span>
              <span className="font-mono text-text-primary">
                {campaign.startDate && campaign.endDate
                  ? `${campaign.startDate} 至 ${campaign.endDate}`
                  : "未設定固定期限"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">🎁</span>
              <span className="text-text-disabled font-mono text-[10px]">
                獎勵發放：
              </span>
              <span className="font-bold text-brand font-mono">
                {formattedReward}
                {campaign.rewardLimit
                  ? ` (限量 ${campaign.rewardLimit} 份)`
                  : ""}
              </span>
            </div>
          </div>

          {/* Trigger Tasks List */}
          {campaign.tasks && campaign.tasks.length > 0 && (
            <div className="sm:col-span-2 pt-1 border-t border-[rgba(237,232,224,0.05)] flex items-center gap-2 flex-wrap">
              <span className="text-text-disabled font-mono text-[10px]">
                觸發任務：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {campaign.tasks.map((task) => (
                  <span
                    key={task}
                    className="inline-flex items-center gap-1 bg-bg-elevated px-2 py-0.5 rounded text-[10.5px] font-sans text-text-secondary border border-[rgba(237,232,224,0.08)]"
                  >
                    <span className="text-success text-[9px]">✓</span> {task}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Performance Metrics Stats Grid ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-bg-page border border-[rgba(237,232,224,0.05)] rounded-xl p-2.5 text-center font-mono text-[11px]">
          <div>
            <span className="text-text-disabled text-[9px] block uppercase">
              獎勵內容
            </span>
            <span className="text-brand font-semibold block mt-0.5 truncate">
              {formattedReward}
            </span>
          </div>
          <div>
            <span className="text-text-disabled text-[9px] block uppercase">
              曝光點擊
            </span>
            <span className="text-text-primary font-bold block mt-0.5">
              {campaign.clicks.toLocaleString("zh-TW")}
            </span>
          </div>
          <div>
            <span className="text-text-disabled text-[9px] block uppercase">
              核銷次數
            </span>
            <span className="text-success font-bold block mt-0.5">
              {campaign.redeems.toLocaleString("zh-TW")}
            </span>
          </div>
          <div>
            <span className="text-text-disabled text-[9px] block uppercase">
              精準 ROI
            </span>
            <span className="text-brand font-black block mt-0.5">
              {campaign.roi}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <span className="font-mono text-[10px] text-text-disabled">
            創建日期：{campaign.createdAt}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
