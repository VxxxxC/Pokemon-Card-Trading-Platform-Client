"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Accordion } from "@/app/components/ui/Accordion";

import {
  CampaignCard,
  type CampaignItem,
  type CampaignStatus,
  type Audience,
  type AntiFraud,
  type RewardType,
} from "./components/CampaignCard";

interface AuditRow {
  id: string;
  campaignCode: string;
  campaignName: string;
  user: string;
  action: string;
  orderId: string;
  commission: number;
  gmv: number;
  redeemedAt: string;
  riskStatus?: string;
}

type DateRange = "7d" | "1m" | "3m" | "6m" | "12m";

function getCampaignNumericId(id: string): number {
  const match = id.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function sortCampaignsDescending(items: CampaignItem[]): CampaignItem[] {
  return [...items].sort((a, b) => {
    const numA = getCampaignNumericId(a.id);
    const numB = getCampaignNumericId(b.id);
    if (numA !== numB) {
      return numB - numA;
    }
    const dateA = new Date(a.createdAt.replace(/\//g, "-")).getTime();
    const dateB = new Date(b.createdAt.replace(/\//g, "-")).getTime();
    return dateB - dateA;
  });
}

const dateRangeOptions: { key: DateRange; label: string }[] = [
  { key: "7d", label: "7日" },
  { key: "1m", label: "1個月" },
  { key: "3m", label: "3個月" },
  { key: "6m", label: "6個月" },
  { key: "12m", label: "12個月" },
];

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: campaigns | View / RPC: list_campaigns
const initialCampaigns: CampaignItem[] = [
  {
    id: "CMP-01",
    name: "2026年夏季首購禮",
    type: "首購立減",
    bannerUrl: "https://picsum.photos/seed/cmp01/600/200",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    audience: "guest",
    antiFraud: "stripe_device",
    tasks: ["點擊兌換按鈕", "輸入 Promo Code"],
    rewardType: "cash_off",
    rewardValue: "100",
    rewardLimit: "2000",
    rewardDisplay: "立減 HK$ 100",
    reward: "立減 HK$100",
    clicks: 3820,
    redeems: 1240,
    roi: "284%",
    status: "active",
    createdAt: "2026/06/01",
  },
  {
    id: "CMP-02",
    name: "商戶春季入駐紅包",
    type: "商戶邀請",
    bannerUrl: "",
    startDate: "2026-05-15",
    endDate: "2026-07-15",
    audience: "member",
    antiFraud: "kyc",
    tasks: ["完成 KYC 實名驗證"],
    rewardType: "points",
    rewardValue: "300",
    rewardLimit: "500",
    rewardDisplay: "提現免手續費券 * 3",
    reward: "提現免手續費券 * 3",
    clicks: 1240,
    redeems: 320,
    roi: "192%",
    status: "active",
    createdAt: "2026/05/15",
  },
  {
    id: "CMP-03",
    name: "夜巡 (sv6a) 單卡免佣",
    type: "佣金減免",
    bannerUrl: "https://picsum.photos/seed/cmp03/600/200",
    startDate: "2026-06-10",
    endDate: "2026-09-30",
    audience: "member",
    antiFraud: "ip",
    tasks: ["累積交易金額滿額"],
    rewardType: "commission_discount",
    rewardValue: "5",
    rewardLimit: "1000",
    rewardDisplay: "免 5% 交易佣金",
    reward: "免 5% 交易佣金",
    clicks: 5820,
    redeems: 1840,
    roi: "412%",
    status: "active",
    createdAt: "2026/06/10",
  },
  {
    id: "CMP-04",
    name: "2025聖誕狂歡節",
    type: "特定卡包補貼",
    bannerUrl: "",
    startDate: "2025-12-24",
    endDate: "2025-12-26",
    audience: "guest",
    antiFraud: "ip",
    tasks: ["點擊兌換按鈕"],
    rewardType: "shipping",
    rewardValue: "30",
    rewardLimit: "5000",
    rewardDisplay: "全場免運費 (HK$ 30 運費補貼)",
    reward: "全場免運費",
    clicks: 9420,
    redeems: 4200,
    roi: "154%",
    status: "expired",
    createdAt: "2025/12/24",
  },
  {
    id: "CMP-05",
    name: "新手訓練家集章特惠",
    type: "特定卡包補貼",
    bannerUrl: "https://picsum.photos/seed/cmp05/600/200",
    startDate: "2026-07-01",
    endDate: "2026-08-15",
    audience: "member",
    antiFraud: "email_sms",
    tasks: ["連續 7 日簽到", "累積交易金額滿額"],
    rewardType: "cash_off",
    rewardValue: "50",
    rewardLimit: "1500",
    rewardDisplay: "立減 HK$ 50",
    reward: "立減 HK$50",
    clicks: 2150,
    redeems: 680,
    roi: "210%",
    status: "active",
    createdAt: "2026/07/01",
  },
  {
    id: "CMP-06",
    name: "寶可夢大賽 (sv7) 紀念禮",
    type: "首購立減",
    bannerUrl: "",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    audience: "guest",
    antiFraud: "ip",
    tasks: ["輸入 Promo Code"],
    rewardType: "cash_off",
    rewardValue: "80",
    rewardLimit: "800",
    rewardDisplay: "立減 HK$ 80",
    reward: "立減 HK$80",
    clicks: 0,
    redeems: 0,
    roi: "0%",
    status: "paused",
    createdAt: "2026/07/20",
  },
  {
    id: "CMP-07",
    name: "高價 PSA 10 託管補貼",
    type: "佣金減免",
    bannerUrl: "https://picsum.photos/seed/cmp07/600/200",
    startDate: "2026-06-15",
    endDate: "2026-10-01",
    audience: "vip",
    antiFraud: "kyc",
    tasks: ["累積交易金額滿額"],
    rewardType: "commission_discount",
    rewardValue: "8",
    rewardLimit: "300",
    rewardDisplay: "免 8% 交易佣金",
    reward: "免 8% 交易佣金",
    clicks: 4100,
    redeems: 920,
    roi: "530%",
    status: "active",
    createdAt: "2026/06/15",
  },
  {
    id: "CMP-08",
    name: "舊卡換新 零手續費券",
    type: "佣金減免",
    bannerUrl: "",
    startDate: "2026-05-01",
    endDate: "2026-06-01",
    audience: "member",
    antiFraud: "ip",
    tasks: ["累積交易金額滿額"],
    rewardType: "commission_discount",
    rewardValue: "10",
    rewardLimit: "1000",
    rewardDisplay: "免 10% 交易佣金",
    reward: "免 10% 交易佣金",
    clicks: 3100,
    redeems: 890,
    roi: "310%",
    status: "expired",
    createdAt: "2026/05/01",
  },
  {
    id: "CMP-09",
    name: "VIP 典藏家專屬週年慶",
    type: "特定卡包補貼",
    bannerUrl: "https://picsum.photos/seed/cmp09/600/200",
    startDate: "2026-07-10",
    endDate: "2026-08-10",
    audience: "vip",
    antiFraud: "stripe_device",
    tasks: ["連續 7 日簽到", "完成 KYC 實名驗證"],
    rewardType: "cash_off",
    rewardValue: "200",
    rewardLimit: "500",
    rewardDisplay: "立減 HK$ 200",
    reward: "立減 HK$200",
    clicks: 1890,
    redeems: 410,
    roi: "460%",
    status: "active",
    createdAt: "2026/07/10",
  },
  {
    id: "CMP-10",
    name: "噴火龍 ex (SAR) 熱門專區立減",
    type: "首購立減",
    bannerUrl: "",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    audience: "guest",
    antiFraud: "stripe_device",
    tasks: ["點擊兌換按鈕"],
    rewardType: "cash_off",
    rewardValue: "150",
    rewardLimit: "1000",
    rewardDisplay: "立減 HK$ 150",
    reward: "立減 HK$150",
    clicks: 0,
    redeems: 0,
    roi: "0%",
    status: "paused",
    createdAt: "2026/07/22",
  },
  {
    id: "CMP-11",
    name: "跨國集運運費大補貼",
    type: "特定卡包補貼",
    bannerUrl: "https://picsum.photos/seed/cmp11/600/200",
    startDate: "2026-04-01",
    endDate: "2026-10-31",
    audience: "guest",
    antiFraud: "ip",
    tasks: ["點擊兌換按鈕"],
    rewardType: "shipping",
    rewardValue: "50",
    rewardLimit: "3000",
    rewardDisplay: "定額運費補貼 HK$ 50",
    reward: "運費補貼 HK$50",
    clicks: 8200,
    redeems: 2950,
    roi: "185%",
    status: "active",
    createdAt: "2026/04/01",
  },
  {
    id: "CMP-12",
    name: "中秋連假限時快閃回饋",
    type: "特定卡包補貼",
    bannerUrl: "",
    startDate: "2026-02-10",
    endDate: "2026-02-18",
    audience: "member",
    antiFraud: "email_sms",
    tasks: ["點擊兌換按鈕"],
    rewardType: "points",
    rewardValue: "100",
    rewardLimit: "2000",
    rewardDisplay: "平台積分 100 pt",
    reward: "平台積分 100 pt",
    clicks: 4500,
    redeems: 1980,
    roi: "220%",
    status: "expired",
    createdAt: "2026/02/10",
  },
];

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: campaign_redemptions, audit_logs | View / RPC: list_campaign_redemption_audits
const auditRows: AuditRow[] = [
  {
    id: "RDM-2026-8821",
    campaignCode: "#CMP-01",
    campaignName: "2026年夏季首購禮",
    user: "collector_a / 203.145.12.4",
    action: "輸入 Promo Code",
    orderId: "ORD-20260722-4412",
    commission: -30,
    gmv: 1200,
    redeemedAt: "2026-07-22 14:32",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8820",
    campaignCode: "#CMP-03",
    campaignName: "夜巡 (sv6a) 單卡免佣",
    user: "tcg_hunter / 103.23.55.11",
    action: "累積交易金額滿額",
    orderId: "ORD-20260722-4409",
    commission: -45,
    gmv: 2600,
    redeemedAt: "2026-07-22 13:58",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8819",
    campaignCode: "#CMP-02",
    campaignName: "商戶春季入駐紅包",
    user: "shop_newbie / 45.67.89.12",
    action: "完成 KYC 實名驗證",
    orderId: "—",
    commission: 0,
    gmv: 0,
    redeemedAt: "2026-07-22 11:20",
    riskStatus: "review",
  },
  {
    id: "RDM-2026-8818",
    campaignCode: "#CMP-01",
    campaignName: "2026年夏季首購禮",
    user: "guest_991 / 203.145.12.4",
    action: "點擊兌換按鈕",
    orderId: "ORD-20260722-4398",
    commission: -30,
    gmv: 980,
    redeemedAt: "2026-07-22 10:05",
    riskStatus: "suspicious",
  },
  {
    id: "RDM-2026-8817",
    campaignCode: "#CMP-05",
    campaignName: "新手訓練家集章特惠",
    user: "member_bb / 118.21.44.6",
    action: "連續 7 日簽到",
    orderId: "ORD-20260721-4283",
    commission: -15,
    gmv: 750,
    redeemedAt: "2026-07-21 22:17",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8816",
    campaignCode: "#CMP-03",
    campaignName: "夜巡 (sv6a) 單卡免佣",
    user: "whisperwind / 14.192.8.7",
    action: "累積交易金額滿額",
    orderId: "ORD-20260721-4277",
    commission: -60,
    gmv: 3400,
    redeemedAt: "2026-07-21 19:44",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8815",
    campaignCode: "#CMP-01",
    campaignName: "2026年夏季首購禮",
    user: "pika_fan / 210.54.33.19",
    action: "輸入 Promo Code",
    orderId: "ORD-20260721-4266",
    commission: -30,
    gmv: 1580,
    redeemedAt: "2026-07-21 16:11",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8814",
    campaignCode: "#CMP-02",
    campaignName: "商戶春季入駐紅包",
    user: "card_guru / 61.93.124.55",
    action: "完成 KYC 實名驗證",
    orderId: "—",
    commission: 0,
    gmv: 0,
    redeemedAt: "2026-07-20 09:30",
    riskStatus: "review",
  },
  {
    id: "RDM-2026-8813",
    campaignCode: "#CMP-07",
    campaignName: "高價 PSA 10 託管補貼",
    user: "mewtwo_king / 123.203.88.9",
    action: "累積交易金額滿額",
    orderId: "ORD-20260719-4102",
    commission: -120,
    gmv: 8500,
    redeemedAt: "2026-07-19 18:22",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8812",
    campaignCode: "#CMP-09",
    campaignName: "VIP 典藏家專屬週年慶",
    user: "vip_charizard / 58.152.19.4",
    action: "連續 7 日簽到",
    orderId: "ORD-20260718-3980",
    commission: -100,
    gmv: 12000,
    redeemedAt: "2026-07-18 15:40",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8811",
    campaignCode: "#CMP-11",
    campaignName: "跨國集運運費大補貼",
    user: "japan_import / 220.241.11.2",
    action: "點擊兌換按鈕",
    orderId: "ORD-20260715-3822",
    commission: -50,
    gmv: 4200,
    redeemedAt: "2026-07-15 11:05",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8810",
    campaignCode: "#CMP-05",
    campaignName: "新手訓練家集章特惠",
    user: "rookie_001 / 14.0.12.88",
    action: "點擊兌換按鈕",
    orderId: "ORD-20260710-3650",
    commission: -15,
    gmv: 600,
    redeemedAt: "2026-07-10 14:15",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8809",
    campaignCode: "#CMP-03",
    campaignName: "夜巡 (sv6a) 單卡免佣",
    user: "shadow_trader / 112.120.4.99",
    action: "累積交易金額滿額",
    orderId: "ORD-20260628-3210",
    commission: -50,
    gmv: 2800,
    redeemedAt: "2026-06-28 20:30",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8808",
    campaignCode: "#CMP-02",
    campaignName: "商戶春季入駐紅包",
    user: "hk_cardstore / 202.82.1.10",
    action: "完成 KYC 實名驗證",
    orderId: "—",
    commission: 0,
    gmv: 0,
    redeemedAt: "2026-06-15 16:50",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8807",
    campaignCode: "#CMP-08",
    campaignName: "舊卡換新 零手續費券",
    user: "old_collector / 218.102.3.4",
    action: "累積交易金額滿額",
    orderId: "ORD-20260520-2104",
    commission: -25,
    gmv: 1900,
    redeemedAt: "2026-05-20 10:12",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8806",
    campaignCode: "#CMP-01",
    campaignName: "2026年夏季首購禮",
    user: "buyer_test / 103.11.2.1",
    action: "輸入 Promo Code",
    orderId: "ORD-20260602-1088",
    commission: -30,
    gmv: 1100,
    redeemedAt: "2026-06-02 09:15",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8805",
    campaignCode: "#CMP-11",
    campaignName: "跨國集運運費大補貼",
    user: "oversea_fan / 180.217.1.5",
    action: "點擊兌換按鈕",
    orderId: "ORD-20260418-0955",
    commission: -50,
    gmv: 3500,
    redeemedAt: "2026-04-18 17:00",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8804",
    campaignCode: "#CMP-12",
    campaignName: "中秋連假限時快閃回饋",
    user: "moon_festival / 223.16.8.22",
    action: "點擊兌換按鈕",
    orderId: "ORD-20260214-0412",
    commission: -40,
    gmv: 2100,
    redeemedAt: "2026-02-14 12:30",
    riskStatus: "normal",
  },
  {
    id: "RDM-2025-8803",
    campaignCode: "#CMP-04",
    campaignName: "2025聖誕狂歡節",
    user: "xmas_shopper / 203.198.1.8",
    action: "點擊兌換按鈕",
    orderId: "ORD-20251225-9901",
    commission: -30,
    gmv: 1800,
    redeemedAt: "2025-12-25 21:00",
    riskStatus: "normal",
  },
  {
    id: "RDM-2025-8802",
    campaignCode: "#CMP-04",
    campaignName: "2025聖誕狂歡節",
    user: "santa_gift / 119.237.0.12",
    action: "點擊兌換按鈕",
    orderId: "ORD-20251224-9840",
    commission: -30,
    gmv: 1450,
    redeemedAt: "2025-12-24 18:30",
    riskStatus: "normal",
  },
];

const trendDataByRange: Record<
  DateRange,
  Array<{ date: string; claimed: number; redeemed: number }>
> = {
  "7d": [
    { date: "07/18", claimed: 95, redeemed: 42 },
    { date: "07/19", claimed: 88, redeemed: 40 },
    { date: "07/20", claimed: 102, redeemed: 46 },
    { date: "07/21", claimed: 96, redeemed: 44 },
    { date: "07/22", claimed: 110, redeemed: 50 },
    { date: "07/23", claimed: 125, redeemed: 58 },
    { date: "07/24", claimed: 130, redeemed: 62 },
  ],
  "1m": [
    { date: "07/10", claimed: 42, redeemed: 18 },
    { date: "07/11", claimed: 56, redeemed: 22 },
    { date: "07/12", claimed: 48, redeemed: 20 },
    { date: "07/13", claimed: 62, redeemed: 28 },
    { date: "07/14", claimed: 55, redeemed: 25 },
    { date: "07/15", claimed: 78, redeemed: 34 },
    { date: "07/16", claimed: 66, redeemed: 30 },
    { date: "07/17", claimed: 82, redeemed: 38 },
    { date: "07/18", claimed: 95, redeemed: 42 },
    { date: "07/19", claimed: 88, redeemed: 40 },
    { date: "07/20", claimed: 102, redeemed: 46 },
    { date: "07/21", claimed: 96, redeemed: 44 },
    { date: "07/22", claimed: 110, redeemed: 50 },
  ],
  "3m": [
    { date: "05/01", claimed: 210, redeemed: 90 },
    { date: "05/15", claimed: 280, redeemed: 115 },
    { date: "06/01", claimed: 340, redeemed: 140 },
    { date: "06/15", claimed: 410, redeemed: 185 },
    { date: "07/01", claimed: 490, redeemed: 220 },
    { date: "07/15", claimed: 580, redeemed: 260 },
  ],
  "6m": [
    { date: "02月", claimed: 520, redeemed: 210 },
    { date: "03月", claimed: 680, redeemed: 290 },
    { date: "04月", claimed: 820, redeemed: 350 },
    { date: "05月", claimed: 1050, redeemed: 460 },
    { date: "06月", claimed: 1320, redeemed: 580 },
    { date: "07月", claimed: 1650, redeemed: 720 },
  ],
  "12m": [
    { date: "25/08", claimed: 820, redeemed: 350 },
    { date: "25/10", claimed: 1100, redeemed: 480 },
    { date: "25/12", claimed: 1950, redeemed: 890 },
    { date: "26/02", claimed: 1450, redeemed: 620 },
    { date: "26/04", claimed: 1800, redeemed: 780 },
    { date: "26/06", claimed: 2400, redeemed: 1050 },
    { date: "26/07", claimed: 2900, redeemed: 1280 },
  ],
};

const costBenefitDataByRange: Record<
  DateRange,
  Array<{ period: string; cost: number; netCommission: number }>
> = {
  "7d": [
    { period: "07/18", cost: 950, netCommission: 2800 },
    { period: "07/19", cost: 880, netCommission: 2600 },
    { period: "07/20", cost: 1100, netCommission: 3400 },
    { period: "07/21", cost: 1050, netCommission: 3200 },
    { period: "07/22", cost: 1200, netCommission: 3800 },
    { period: "07/23", cost: 1350, netCommission: 4100 },
    { period: "07/24", cost: 1400, netCommission: 4300 },
  ],
  "1m": [
    { period: "6月 W1", cost: 4200, netCommission: 9800 },
    { period: "6月 W2", cost: 5600, netCommission: 12400 },
    { period: "6月 W3", cost: 3900, netCommission: 8700 },
    { period: "6月 W4", cost: 7200, netCommission: 15600 },
    { period: "7月 W1", cost: 6800, netCommission: 18200 },
    { period: "7月 W2", cost: 8100, netCommission: 22400 },
    { period: "7月 W3", cost: 6400, netCommission: 19800 },
  ],
  "3m": [
    { period: "5月", cost: 14500, netCommission: 38000 },
    { period: "6月", cost: 20900, netCommission: 46500 },
    { period: "7月", cost: 21300, netCommission: 60400 },
  ],
  "6m": [
    { period: "2月", cost: 8500, netCommission: 21000 },
    { period: "3月", cost: 11200, netCommission: 28500 },
    { period: "4月", cost: 13400, netCommission: 32000 },
    { period: "5月", cost: 14500, netCommission: 38000 },
    { period: "6月", cost: 20900, netCommission: 46500 },
    { period: "7月", cost: 21300, netCommission: 60400 },
  ],
  "12m": [
    { period: "25 Q3", cost: 22000, netCommission: 58000 },
    { period: "25 Q4", cost: 34000, netCommission: 92000 },
    { period: "26 Q1", cost: 29000, netCommission: 76000 },
    { period: "26 Q2", cost: 48800, netCommission: 116500 },
  ],
};

const funnelDataByRange: Record<
  DateRange,
  Array<{ stage: string; value: number; fill: string }>
> = {
  "7d": [
    { stage: "瀏覽活動", value: 100, fill: "#d4a574" },
    { stage: "領取優惠", value: 64, fill: "#b38b5f" },
    { stage: "實際結帳核銷", value: 31, fill: "#8c7355" },
  ],
  "1m": [
    { stage: "瀏覽活動", value: 100, fill: "#d4a574" },
    { stage: "領取優惠", value: 58, fill: "#b38b5f" },
    { stage: "實際結帳核銷", value: 24, fill: "#8c7355" },
  ],
  "3m": [
    { stage: "瀏覽活動", value: 100, fill: "#d4a574" },
    { stage: "領取優惠", value: 55, fill: "#b38b5f" },
    { stage: "實際結帳核銷", value: 22, fill: "#8c7355" },
  ],
  "6m": [
    { stage: "瀏覽活動", value: 100, fill: "#d4a574" },
    { stage: "領取優惠", value: 51, fill: "#b38b5f" },
    { stage: "實際結帳核銷", value: 20, fill: "#8c7355" },
  ],
  "12m": [
    { stage: "瀏覽活動", value: 100, fill: "#d4a574" },
    { stage: "領取優惠", value: 47, fill: "#b38b5f" },
    { stage: "實際結帳核銷", value: 18, fill: "#8c7355" },
  ],
};

const trendChartConfig = {
  claimed: { label: "每日領取", color: "#d4a574" },
  redeemed: { label: "每日核銷", color: "#10b981" },
} satisfies ChartConfig;

const costBenefitChartConfig = {
  cost: { label: "補貼成本", color: "#d4a574" },
  netCommission: { label: "淨佣金收益", color: "#10b981" },
} satisfies ChartConfig;

const funnelChartConfig = {
  value: { label: "轉換率", color: "#d4a574" },
} satisfies ChartConfig;

const taskOptionsByAudience: Record<Audience, string[]> = {
  guest: ["點擊兌換按鈕", "輸入 Promo Code", "訂閱電子報"],
  member: ["完成 KYC 實名驗證", "連續 7 日簽到", "累積交易金額滿額"],
  vip: ["完成 KYC 實名驗證", "連續 7 日簽到", "累積交易金額滿額"],
};

const audienceOptions: { value: Audience; label: string }[] = [
  { value: "guest", label: "全部用戶 含未註冊訪客" },
  { value: "member", label: "僅限已註冊會員" },
  { value: "vip", label: "指定等級 VIP" },
];

const antiFraudOptions: { value: AntiFraud; label: string }[] = [
  { value: "ip", label: "每個 IP 限領一次" },
  { value: "email_sms", label: "電郵/SMS 驗證" },
  { value: "kyc", label: "限 KYC 實名" },
  { value: "stripe_device", label: "限綁定相同 Stripe 信用卡與裝置" },
];

const rewardTypeOptions: { value: RewardType; label: string }[] = [
  { value: "commission_discount", label: "免減 n% 佣金券" },
  { value: "cash_off", label: "立減 HK$ n" },
  { value: "shipping", label: "定額運費補貼/免運費券" },
  { value: "points", label: "平台積分" },
];

export function CampaignsMockTab() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(() =>
    sortCampaignsDescending(initialCampaigns),
  );
  const [activeTab, setActiveTab] = useState<"templates" | "roi">("templates");

  // Tab 1 Search, Filter, Pagination & Accordion state
  const [statusFilter, setStatusFilter] = useState<"all" | CampaignStatus>("all");
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [templatePage, setTemplatePage] = useState(1);
  const TEMPLATE_PAGE_SIZE = 5;
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);

  // Tab 2 Date Range, Search & Pagination state
  const [dateRange, setDateRange] = useState<DateRange>("1m");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 10;

  // Form states
  const [campName, setCampName] = useState("");
  const [campBannerUrl, setCampBannerUrl] = useState("");
  const [campStartDate, setCampStartDate] = useState("");
  const [campEndDate, setCampEndDate] = useState("");
  const [campAudience, setCampAudience] = useState<Audience>("guest");
  const [campAntiFraud, setCampAntiFraud] = useState<AntiFraud>("ip");
  const [campTasks, setCampTasks] = useState<string[]>([]);
  const [campRewardType, setCampRewardType] = useState<RewardType>(
    "commission_discount",
  );
  const [campRewardValue, setCampRewardValue] = useState("");
  const [campRewardLimit, setCampRewardLimit] = useState("");

  // Metrics calculation
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const totalRedeems = campaigns.reduce((acc, c) => acc + c.redeems, 0);
  const averageRoi = useMemo(() => {
    const numeric = campaigns
      .map((c) => Number(c.roi.replace(/[^0-9.-]+/g, "")))
      .filter((n) => !Number.isNaN(n));
    if (numeric.length === 0) return "0%";
    const avg = numeric.reduce((a, b) => a + b, 0) / numeric.length;
    return `${avg.toFixed(1)}%`;
  }, [campaigns]);

  // Tab 1 Filtered campaigns (by status & searchbar query)
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((camp) => {
      // 1. Status Filter
      if (statusFilter !== "all" && camp.status !== statusFilter) {
        return false;
      }

      // 2. Searchbar Query (name, id, type, rewardDisplay)
      if (campaignSearchQuery.trim()) {
        const q = campaignSearchQuery.toLowerCase().trim();
        const idStr = camp.id.toLowerCase();
        const formattedId = `#${idStr}`;
        const nameStr = camp.name.toLowerCase();
        const typeStr = camp.type.toLowerCase();
        const rewardStr = (
          camp.rewardDisplay ??
          camp.reward ??
          camp.rewardValue ??
          ""
        ).toLowerCase();

        const matchesSearch =
          nameStr.includes(q) ||
          idStr.includes(q) ||
          formattedId.includes(q) ||
          typeStr.includes(q) ||
          rewardStr.includes(q);

        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [campaigns, statusFilter, campaignSearchQuery]);

  // Tab 1 Paginated items
  const totalTemplatePages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / TEMPLATE_PAGE_SIZE),
  );

  const paginatedCampaigns = useMemo(() => {
    const start = (templatePage - 1) * TEMPLATE_PAGE_SIZE;
    return filteredCampaigns.slice(start, start + TEMPLATE_PAGE_SIZE);
  }, [filteredCampaigns, templatePage]);

  const handleTemplatePageChange = (newPage: number) => {
    setTemplatePage(newPage);
    document
      .getElementById("template-list-anchor")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Tab 2 Datasets & Filtered audit rows
  const currentTrendData = trendDataByRange[dateRange];
  const currentCostBenefitData = costBenefitDataByRange[dateRange];
  const currentFunnelData = funnelDataByRange[dateRange];

  const filteredAuditRows = useMemo(() => {
    let rows = auditRows.filter((row) => {
      const rowDate = new Date(row.redeemedAt.replace(" ", "T"));
      const now = new Date("2026-07-24T23:59:59");
      const diffDays = (now.getTime() - rowDate.getTime()) / (1000 * 3600 * 24);
      if (dateRange === "7d") return diffDays <= 7;
      if (dateRange === "1m") return diffDays <= 31;
      if (dateRange === "3m") return diffDays <= 92;
      if (dateRange === "6m") return diffDays <= 184;
      if (dateRange === "12m") return diffDays <= 366;
      return true;
    });

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.campaignName.toLowerCase().includes(q) ||
          r.campaignCode.toLowerCase().includes(q) ||
          r.user.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [dateRange, auditSearchQuery]);

  const totalAuditPages = Math.max(
    1,
    Math.ceil(filteredAuditRows.length / AUDIT_PAGE_SIZE),
  );

  const paginatedAuditRows = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredAuditRows.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredAuditRows, auditPage]);

  const toggleTask = (task: string) => {
    setCampTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task],
    );
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!campName.trim()) {
      toast.error("請填寫活動名稱");
      return;
    }
    if (campTasks.length === 0) {
      toast.error("請至少選擇一項任務觸發條件");
      return;
    }
    if (!campRewardValue.trim()) {
      toast.error("請填寫獎勵數值");
      return;
    }

    const rewardTypeLabel =
      rewardTypeOptions.find((opt) => opt.value === campRewardType)?.label ??
      campRewardType;

    const formattedRewardDisplay = rewardTypeLabel.replace(
      "n",
      campRewardValue,
    );

    const nextId =
      campaigns.length > 0
        ? Math.max(...campaigns.map((c) => getCampaignNumericId(c.id))) + 1
        : 1;

    const newCamp: CampaignItem = {
      id: `CMP-${String(nextId).padStart(2, "0")}`,
      name: campName,
      type: "佣金減免",
      bannerUrl: campBannerUrl,
      startDate: campStartDate,
      endDate: campEndDate,
      audience: campAudience,
      antiFraud: campAntiFraud,
      tasks: campTasks,
      rewardType: campRewardType,
      rewardValue: campRewardValue,
      rewardLimit: campRewardLimit || undefined,
      rewardDisplay: formattedRewardDisplay,
      reward: formattedRewardDisplay,
      clicks: 0,
      redeems: 0,
      roi: "0%",
      status: "active",
      createdAt: new Date().toLocaleDateString("zh-TW"),
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setTemplatePage(1);
    toast.success(
      `活動範本 "${campName}" (${newCamp.id}) 建立成功，已新增至活動列表首位。`,
    );
    resetForm();
  };

  // TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
  // Target Table: campaigns | View / RPC: create_campaign
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleCreateCampaignRemote(_data: {
    name: string;
    bannerUrl: string;
    startDate: string;
    endDate: string;
    audience: Audience;
    antiFraud: AntiFraud;
    tasks: string[];
    rewardType: RewardType;
    rewardValue: number;
    rewardLimit: number | null;
  }) {
    try {
      console.log("Pending Supabase integration", _data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "遠端建立活動失敗，請稍後再試",
      );
    }
  }

  const resetForm = () => {
    setCampName("");
    setCampBannerUrl("");
    setCampStartDate("");
    setCampEndDate("");
    setCampAudience("guest");
    setCampAntiFraud("ip");
    setCampTasks([]);
    setCampRewardType("commission_discount");
    setCampRewardValue("");
    setCampRewardLimit("");
  };

  const handleToggleStatus = (id: string, newStatus?: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus =
            newStatus ?? (c.status === "active" ? "paused" : "active");

          const statusLabel =
            nextStatus === "active"
              ? "進行中"
              : nextStatus === "paused"
              ? "已暫停"
              : "已結束";

          toast.info(`已將活動 ${id} 的狀態變更為：${statusLabel}`);
          return { ...c, status: nextStatus };
        }
        return c;
      }),
    );
  };

  const sectionClass =
    "bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        ROI 分析仍為展示數據。正式限時搶券檔期請使用上方「搶券檔期」分頁管理。
      </div>

      {/* ── Global Overview Metrics ───────────────────────────────────── */}
      <section aria-labelledby="roi-heading">
        <h2
          id="roi-heading"
          className="font-sans font-semibold text-[15px] text-text-secondary mb-3"
        >
          活動 ROI 與核銷分析面板
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "領域活動件數 (ACTIVE)",
              value: `${activeCount} 個`,
              color: "text-brand",
            },
            {
              label: "全平台累計核銷 (REDEEMS)",
              value: `${totalRedeems.toLocaleString("zh-TW")} 次`,
              color: "text-success",
            },
            { label: "平均營銷 ROI", value: averageRoi, color: "text-brand" },
            {
              label: "營銷專項補貼池",
              value: "HK$ 150,000",
              color: "text-text-primary",
            },
          ].map(({ label, value, color }) => (
            <Card
              key={label}
              className="bg-bg-card border-[rgba(237,232,224,0.08)] text-center"
            >
              <CardContent className="px-4 py-3.5">
                <p className={`font-mono font-bold text-[22px] ${color}`}>
                  {value}
                </p>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Full-Width Segmented Tab Selector ───────────────────────────────── */}
      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "templates"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">🎯 活動範本</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {campaigns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("roi")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "roi"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">📊 ROI 與核銷</span>
          </button>
        </div>
      </div>

      {/* ── Date Range Selector Bar (Under Main Tab Bar for Tab 2) ────────────── */}
      {activeTab === "roi" && (
        <div className="flex items-center justify-between gap-3 bg-bg-card p-3 rounded-2xl border border-[rgba(237,232,224,0.08)] flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-sans text-xs text-text-secondary font-medium pl-1">
              時間範圍篩選：
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    setDateRange(opt.key);
                    setAuditPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-sans text-xs transition-all ${
                    dateRange === opt.key
                      ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                      : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <span className="font-mono text-[11px] text-text-disabled pr-1">
            數據已過濾：
            {dateRangeOptions.find((d) => d.key === dateRange)?.label}
          </span>
        </div>
      )}

      {/* ── TAB 1: 活動範本 ─────────────────────────────────────────── */}
      {activeTab === "templates" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
            {/* Left: New Campaign Form */}
            <section className={sectionClass}>
              <Accordion
                isOpen={isNewCampaignOpen}
                onToggle={() => setIsNewCampaignOpen((prev) => !prev)}
                className="border-b-0 py-0"
                title={
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-[16px] text-text-primary tracking-normal normal-case">
                        建立新活動
                      </span>
                    </div>
                  </div>
                }
              >
                <form
                  onSubmit={handleCreateCampaign}
                  className="space-y-5 pt-3"
                >
                  {/* Block 1: Basic Info */}
                  <div className="space-y-3">
                    <p className="font-sans font-semibold text-[13px] text-text-primary">
                      基本資料
                    </p>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] text-text-secondary">
                        活動名稱 <span className="text-warning">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={campName}
                        onChange={(e) => setCampName(e.target.value)}
                        placeholder="例：秋季新卡包集章免佣"
                        className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] text-text-secondary">
                        推廣橫額 Banner URL
                      </Label>
                      <Input
                        type="text"
                        value={campBannerUrl}
                        onChange={(e) => setCampBannerUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="font-mono text-[11px] text-text-secondary">
                          開始日期
                        </Label>
                        <Input
                          type="date"
                          value={campStartDate}
                          onChange={(e) => setCampStartDate(e.target.value)}
                          className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-[11px] text-text-secondary">
                          結束日期
                        </Label>
                        <Input
                          type="date"
                          value={campEndDate}
                          onChange={(e) => setCampEndDate(e.target.value)}
                          className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Audience & Anti-fraud */}
                  <div className="space-y-3">
                    <p className="font-sans font-semibold text-[13px] text-text-primary">
                      限制與防刷
                    </p>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] text-text-secondary">
                        目標對象 <span className="text-warning">*</span>
                      </Label>
                      <Select
                        value={campAudience}
                        onValueChange={(val) => {
                          const next = val as Audience;
                          setCampAudience(next);
                          setCampTasks([]);
                        }}
                      >
                        <SelectTrigger className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {audienceOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] text-text-secondary">
                        防刷機制 <span className="text-warning">*</span>
                      </Label>
                      <Select
                        value={campAntiFraud}
                        onValueChange={(val) =>
                          setCampAntiFraud(val as AntiFraud)
                        }
                      >
                        <SelectTrigger className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {antiFraudOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Block 3: Trigger Tasks */}
                  <div className="space-y-3">
                    <p className="font-sans font-semibold text-[13px] text-text-primary">
                      任務觸發條件
                    </p>
                    <div className="space-y-2">
                      {taskOptionsByAudience[campAudience].map((task) => (
                        <label
                          key={task}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <Checkbox
                            checked={campTasks.includes(task)}
                            onCheckedChange={() => toggleTask(task)}
                            className="border-[rgba(237,232,224,0.12)] data-[state=checked]:bg-brand data-[state=checked]:text-[#17130f]"
                          />
                          <span className="font-sans text-[12px] text-text-secondary group-hover:text-text-primary transition-colors">
                            {task}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Block 4: Reward */}
                  <div className="space-y-3">
                    <p className="font-sans font-semibold text-[13px] text-text-primary">
                      獎勵內容配置
                    </p>
                    <div className="space-y-2">
                      <Label className="font-mono text-[11px] text-text-secondary">
                        獎勵類型 <span className="text-warning">*</span>
                      </Label>
                      <Select
                        value={campRewardType}
                        onValueChange={(val) =>
                          setCampRewardType(val as RewardType)
                        }
                      >
                        <SelectTrigger className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rewardTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="font-mono text-[11px] text-text-secondary">
                          獎勵數值 <span className="text-warning">*</span>
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={campRewardValue}
                          onChange={(e) => setCampRewardValue(e.target.value)}
                          placeholder="例：5"
                          className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-[11px] text-text-secondary">
                          派發總量限制
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={campRewardLimit}
                          onChange={(e) => setCampRewardLimit(e.target.value)}
                          placeholder="例：1000"
                          className="w-full h-9 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shadow-md shadow-brand/10"
                  >
                    建立並預排發佈
                  </Button>

                  <p className="font-mono text-[10px] text-text-disabled leading-relaxed">
                    註：目前為本地 mock 流程。遠端儲存接口已預留於
                    <code className="text-brand">
                      handleCreateCampaignRemote
                    </code>
                    。
                  </p>
                </form>
              </Accordion>
            </section>

            {/* Right: Campaign List with Anchor, Filter Toolbar & Pagination */}
            <section
              aria-labelledby="template-list-heading"
              className="space-y-3"
            >
              <div id="template-list-anchor" className="scroll-mt-6">
                <div className="flex items-center justify-between pt-1 mb-3">
                  <h2
                    id="template-list-heading"
                    className="font-sans font-bold text-[15px] text-text-secondary"
                  >
                    活動列表
                  </h2>
                  <span className="font-mono text-[11px] font-normal text-text-disabled">
                    共 {filteredCampaigns.length} 個活動 (每頁 {TEMPLATE_PAGE_SIZE} 筆)
                  </span>
                </div>

                {/* Dedicated Filter Toolbar */}
                <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-3.5 space-y-3 mb-3">
                  {/* Status Filter Pills (Chips) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { key: "all", label: "全部", count: campaigns.length },
                      {
                        key: "active",
                        label: "進行中",
                        count: campaigns.filter((c) => c.status === "active").length,
                      },
                      {
                        key: "paused",
                        label: "已暫停",
                        count: campaigns.filter((c) => c.status === "paused").length,
                      },
                      {
                        key: "expired",
                        label: "已結束",
                        count: campaigns.filter((c) => c.status === "expired").length,
                      },
                    ].map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => {
                          setStatusFilter(chip.key as "all" | CampaignStatus);
                          setTemplatePage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-sans text-xs transition-all flex items-center gap-1.5 ${
                          statusFilter === chip.key
                            ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                            : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                        }`}
                      >
                        <span>{chip.label}</span>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                            statusFilter === chip.key
                              ? "bg-[#17130f]/20 text-[#17130f]"
                              : "bg-bg-elevated text-text-secondary"
                          }`}
                        >
                          {chip.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Searchbar */}
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled text-xs">
                      🔍
                    </span>
                    <Input
                      type="text"
                      value={campaignSearchQuery}
                      onChange={(e) => {
                        setCampaignSearchQuery(e.target.value);
                        setTemplatePage(1);
                      }}
                      placeholder="搜尋活動名稱、編號 (#CMP-xx)、活動類型或獎勵內容..."
                      className="w-full h-9 pl-8 pr-8 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                    />
                    {campaignSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCampaignSearchQuery("");
                          setTemplatePage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Campaign Cards list */}
              <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
                {paginatedCampaigns.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="font-sans text-sm text-text-secondary font-medium">
                      沒有符合條件的活動記錄
                    </p>
                    <p className="font-sans text-xs text-text-disabled">
                      請嘗試調整搜尋關鍵字或點擊選取其他狀態篩選頁籤
                    </p>
                  </div>
                ) : (
                  paginatedCampaigns.map((camp) => (
                    <CampaignCard
                      key={camp.id}
                      campaign={camp}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                )}
              </div>

              {/* Template List Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 p-4 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)]">
                <p className="font-mono text-xs text-text-secondary">
                  顯示第{" "}
                  <span className="text-text-primary font-bold">
                    {filteredCampaigns.length === 0
                      ? 0
                      : (templatePage - 1) * TEMPLATE_PAGE_SIZE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="text-text-primary font-bold">
                    {Math.min(
                      templatePage * TEMPLATE_PAGE_SIZE,
                      filteredCampaigns.length,
                    )}
                  </span>{" "}
                  筆，共{" "}
                  <span className="text-brand font-bold">
                    {filteredCampaigns.length}
                  </span>{" "}
                  筆活動
                </p>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={templatePage <= 1}
                    onClick={() => handleTemplatePageChange(templatePage - 1)}
                    className="h-8 px-3 text-xs bg-bg-page border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    ← 上一頁
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: totalTemplatePages },
                      (_, i) => i + 1,
                    ).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handleTemplatePageChange(pageNum)}
                        className={`h-8 min-w-[32px] px-2 rounded-lg font-mono text-xs transition-colors ${
                          templatePage === pageNum
                            ? "bg-brand text-[#17130f] font-bold"
                            : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={templatePage >= totalTemplatePages}
                    onClick={() => handleTemplatePageChange(templatePage + 1)}
                    className="h-8 px-3 text-xs bg-bg-page border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    下一頁 →
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── TAB 2: ROI與核銷 ────────────────────────────────────────── */}
      {activeTab === "roi" && (
        <div className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="bg-bg-card border-[rgba(237,232,224,0.08)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                  核銷趨勢 (
                  {dateRangeOptions.find((d) => d.key === dateRange)?.label})
                </CardTitle>
                <span className="font-mono text-[10px] text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                  即時統計
                </span>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[260px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={currentTrendData}>
                      <defs>
                        <linearGradient
                          id="claimedGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#d4a574"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#d4a574"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="redeemedGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(255,255,255,0.04)"
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        style={{
                          fill: "#8A8680",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        style={{
                          fill: "#8A8680",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      />
                      <ChartTooltip
                        cursor={{ stroke: "rgba(255,255,255,0.08)" }}
                        content={
                          <ChartTooltipContent className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]" />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="claimed"
                        stroke={trendChartConfig.claimed.color}
                        strokeWidth={2}
                        fill="url(#claimedGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="redeemed"
                        stroke={trendChartConfig.redeemed.color}
                        strokeWidth={2}
                        fill="url(#redeemedGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-[rgba(237,232,224,0.08)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                  成本收益 (
                  {dateRangeOptions.find((d) => d.key === dateRange)?.label})
                </CardTitle>
                <span className="font-mono text-[10px] text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">
                  正向 ROI
                </span>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={costBenefitChartConfig}
                  className="h-[260px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentCostBenefitData}>
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(255,255,255,0.04)"
                      />
                      <XAxis
                        dataKey="period"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        style={{
                          fill: "#8A8680",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={(v: number) =>
                          `$${(v / 1000).toFixed(1)}k`
                        }
                        style={{
                          fill: "#8A8680",
                          fontSize: 10,
                          fontFamily: "monospace",
                        }}
                      />
                      <ChartTooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        content={
                          <ChartTooltipContent className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]" />
                        }
                      />
                      <Bar
                        dataKey="cost"
                        fill={costBenefitChartConfig.cost.color}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={24}
                      />
                      <Bar
                        dataKey="netCommission"
                        fill={costBenefitChartConfig.netCommission.color}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-bg-card border-[rgba(237,232,224,0.08)] lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                  轉換分析 (
                  {dateRangeOptions.find((d) => d.key === dateRange)?.label})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={funnelChartConfig}
                  className="h-[220px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={currentFunnelData}
                      margin={{ top: 10, right: 40, bottom: 10, left: 24 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        width={100}
                        tickLine={false}
                        axisLine={false}
                        style={{
                          fill: "#d4c4b7",
                          fontSize: 12,
                          fontFamily: "sans-serif",
                        }}
                      />
                      <ChartTooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        content={
                          <ChartTooltipContent className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]" />
                        }
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        <LabelList
                          dataKey="value"
                          position="right"
                          formatter={(label) => `${label}%`}
                          className="fill-text-primary font-mono text-[12px]"
                        />
                        {currentFunnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Audit Table Section */}
          <Card className="bg-bg-card border-[rgba(237,232,224,0.08)]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                    核銷記錄
                  </CardTitle>
                </div>
                <span className="font-mono text-[11px] text-text-disabled">
                  篩選條件：
                  {dateRangeOptions.find((d) => d.key === dateRange)?.label}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {/* High-density Searchbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled text-xs">
                    🔍
                  </span>
                  <Input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => {
                      setAuditSearchQuery(e.target.value);
                      setAuditPage(1);
                    }}
                    placeholder="搜尋活動名稱、活動編號 (#CMP-xx)、用戶/IP 或訂單號..."
                    className="w-full h-9 pl-8 pr-8 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
                  />
                  {auditSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditSearchQuery("");
                        setAuditPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-text-disabled">
                  <span>共找到 {filteredAuditRows.length} 筆符合條件記錄</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                        活動編號
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                        活動名稱
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                        領取用戶 / IP
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                        觸發動作
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                        綁定訂單
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase text-right">
                        平台佣金實際扣減
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase text-right">
                        帶動 GMV
                      </TableHead>
                      <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                        核銷時間
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAuditRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-text-disabled font-sans text-xs"
                        >
                          尚無符合篩選條件的核銷記錄
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAuditRows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="bg border-[rgba(237,232,224,0.06)] hover:bg-bg-hover"
                        >
                          <TableCell className="font-mono text-[11px] text-brand font-semibold">
                            {row.campaignCode}
                          </TableCell>
                          <TableCell className="font-sans text-[12px] text-text-primary font-medium">
                            {row.campaignName}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-text-secondary">
                            {row.user}
                          </TableCell>
                          <TableCell className="font-sans text-[12px] text-text-secondary">
                            {row.action}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-brand">
                            {row.orderId}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-right text-success">
                            {row.commission === 0
                              ? "—"
                              : `HK$ ${row.commission}`}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-right text-text-primary">
                            {row.gmv === 0
                              ? "—"
                              : `HK$ ${row.gmv.toLocaleString("zh-TW")}`}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-text-disabled">
                            {row.redeemedAt}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Audit Table Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-[rgba(237,232,224,0.08)]">
                <p className="font-mono text-xs text-text-secondary">
                  顯示第{" "}
                  <span className="text-text-primary font-bold">
                    {filteredAuditRows.length === 0
                      ? 0
                      : (auditPage - 1) * AUDIT_PAGE_SIZE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="text-text-primary font-bold">
                    {Math.min(
                      auditPage * AUDIT_PAGE_SIZE,
                      filteredAuditRows.length,
                    )}
                  </span>{" "}
                  筆，共{" "}
                  <span className="text-brand font-bold">
                    {filteredAuditRows.length}
                  </span>{" "}
                  筆
                </p>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPage <= 1}
                    onClick={() =>
                      setAuditPage((prev) => Math.max(1, prev - 1))
                    }
                    className="h-8 px-3 text-xs bg-bg-page border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    ← 上一頁
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: totalAuditPages },
                      (_, i) => i + 1,
                    ).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setAuditPage(pageNum)}
                        className={`h-8 min-w-[32px] px-2 rounded-lg font-mono text-xs transition-colors ${
                          auditPage === pageNum
                            ? "bg-brand text-[#17130f] font-bold"
                            : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={auditPage >= totalAuditPages}
                    onClick={() =>
                      setAuditPage((prev) =>
                        Math.min(totalAuditPages, prev + 1),
                      )
                    }
                    className="h-8 px-3 text-xs bg-bg-page border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary disabled:opacity-40"
                  >
                    下一頁 →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
