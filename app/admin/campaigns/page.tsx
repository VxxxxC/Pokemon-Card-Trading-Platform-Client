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
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import {
  CampaignCard,
  type CampaignItem,
  type Audience,
  type AntiFraud,
  type RewardType,
} from "./components/CampaignCard";

interface AuditRow {
  id: string;
  campaignName: string;
  user: string;
  action: string;
  orderId: string;
  commission: number;
  gmv: number;
  redeemedAt: string;
  riskStatus: "normal" | "review" | "suspicious";
}

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
];

const auditRows: AuditRow[] = [
  {
    id: "RDM-2026-8821",
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
    campaignName: "2025聖誕狂歡節",
    user: "member_bb / 118.21.44.6",
    action: "連續 7 日簽到",
    orderId: "ORD-20260721-4283",
    commission: 0,
    gmv: 750,
    redeemedAt: "2026-07-21 22:17",
    riskStatus: "normal",
  },
  {
    id: "RDM-2026-8816",
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
    campaignName: "商戶春季入駐紅包",
    user: "card_guru / 61.93.124.55",
    action: "完成 KYC 實名驗證",
    orderId: "—",
    commission: 0,
    gmv: 0,
    redeemedAt: "2026-07-21 09:30",
    riskStatus: "review",
  },
];

const trendData = [
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
];

const costBenefitData = [
  { period: "6月 W1", cost: 4200, netCommission: 9800 },
  { period: "6月 W2", cost: 5600, netCommission: 12400 },
  { period: "6月 W3", cost: 3900, netCommission: 8700 },
  { period: "6月 W4", cost: 7200, netCommission: 15600 },
  { period: "7月 W1", cost: 6800, netCommission: 18200 },
  { period: "7月 W2", cost: 8100, netCommission: 22400 },
  { period: "7月 W3", cost: 6400, netCommission: 19800 },
];

const funnelData = [
  { stage: "瀏覽活動", value: 100, fill: "#d4a574" },
  { stage: "領取優惠", value: 58, fill: "#b38b5f" },
  { stage: "實際結帳核銷", value: 24, fill: "#8c7355" },
];

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

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState<"templates" | "roi">("templates");

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
        ? Math.max(...campaigns.map((c) => Number(c.id.replace(/\D/g, "")))) + 1
        : 1;

    const newCamp: CampaignItem = {
      id: `CMP-${String(nextId).padStart(3, "0")}`,
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
      status: "scheduled",
      createdAt: new Date().toLocaleDateString("zh-TW"),
    };

    setCampaigns([newCamp, ...campaigns]);
    toast.success(
      `活動範本 "${campName}" 建立成功，目前狀態為：預排發佈 (Scheduled)。`,
    );
    resetForm();
  };

  // TODO: Pre-built remote integration skeleton for real Supabase backend.
  // This function is intentionally not called in the current mock flow.
  // Replace handleCreateCampaign with this after the campaigns table/RPC is ready.
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
    // TODO: 接 Supabase — 呼叫 server action / RPC 寫入 campaigns 表
    try {
      console.log("Pending Supabase integration", _data);
      // const result = await createCampaignServerAction(_data);
      // if (!result.success) throw new Error(result.error);
      // toast.success("已遠端建立活動");
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

  const handleToggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "active" ? "expired" : "active";
          return { ...c, status: nextStatus };
        }
        return c;
      }),
    );
    toast.info(`已手動變更活動 ${id} 的發佈狀態。`);
  };

  const riskBadge = (status: AuditRow["riskStatus"]) => {
    switch (status) {
      case "normal":
        return <Badge variant="success">正常</Badge>;
      case "review":
        return (
          <Badge
            variant="outline"
            className="border-brand/40 text-brand bg-brand/10"
          >
            審查中
          </Badge>
        );
      case "suspicious":
        return <Badge variant="destructive">可疑</Badge>;
      default:
        return <Badge variant="ghost">未知</Badge>;
    }
  };

  const sectionClass =
    "bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5";

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">
            積分與任務活動
          </h1>
          <p className="font-sans text-xs text-text-secondary mt-0.5">
            建立、發行全平台營銷活動，配置各項積分任務與佣金折扣
          </p>
          <p className="font-sans text-xs text-text-secondary">
            營銷 ROI 精準監控
          </p>
        </div>
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
              label: "活躍活動件數 (ACTIVE)",
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

      {/* ── TAB 1: 活動範本 ─────────────────────────────────────────── */}
      {activeTab === "templates" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
            {/* Left: New Campaign Form */}
            <section className={sectionClass}>
              <div className="mb-4">
                <h2 className="font-sans font-bold text-[16px] text-text-primary">
                  新活動範本發行
                </h2>
                <p className="font-sans text-[12px] text-text-secondary mt-0.5">
                  快速配置獎勵內容、限制門檻，發行立即同步至前台「任務活動」中
                </p>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-5">
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
                  <code className="text-brand">handleCreateCampaignRemote</code>
                  。
                </p>
              </form>
            </section>

            {/* Right: Campaign List */}
            <section
              aria-labelledby="template-list-heading"
              className="space-y-3"
            >
              <h2
                id="template-list-heading"
                className="font-sans font-bold text-[15px] text-text-secondary flex items-center justify-between"
              >
                <span>活動範本列表</span>
                <span className="font-mono text-[11px] font-normal text-text-disabled">
                  共 {campaigns.length} 個範本
                </span>
              </h2>

              <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
                {campaigns.map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    campaign={camp}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
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
              <CardHeader>
                <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                  核銷趨勢
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[260px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
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
              <CardHeader>
                <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                  成本收益
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={costBenefitChartConfig}
                  className="h-[260px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costBenefitData}>
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
              <CardHeader>
                <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                  轉換漏斗
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
                      data={funnelData}
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
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Audit Table */}
          <Card className="bg-bg-card border-[rgba(237,232,224,0.08)]">
            <CardHeader>
              <CardTitle className="font-sans font-semibold text-[15px] text-text-primary">
                核銷稽核
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                      核銷單號
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
                    <TableHead className="font-mono text-[11px] text-text-secondary uppercase">
                      風控狀態
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-[rgba(237,232,224,0.06)] hover:bg-bg-hover"
                    >
                      <TableCell className="font-mono text-[11px] text-text-disabled">
                        {row.id}
                      </TableCell>
                      <TableCell className="font-sans text-[12px] text-text-primary">
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
                        {row.commission === 0 ? "—" : `HK$ ${row.commission}`}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-right text-text-primary">
                        {row.gmv === 0
                          ? "—"
                          : `HK$ ${row.gmv.toLocaleString("zh-TW")}`}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-disabled">
                        {row.redeemedAt}
                      </TableCell>
                      <TableCell>{riskBadge(row.riskStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
