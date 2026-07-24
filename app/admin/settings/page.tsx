"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogoutModal } from "@/app/components/profile/LogoutModal";

type AuditTab = "financials" | "security" | "audit";
type DateRange = "7d" | "30d" | "90d" | "all";
type ModuleFilter = "all" | "dispute" | "kyc" | "finance" | "system";

// Windowed pagination range: shows first / last / current ±1 with ellipsis gaps.
// Keeps the control compact even with hundreds of log pages.
function getPaginationRange(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const range: (number | "ellipsis")[] = [1];
  if (left > 2) range.push("ellipsis");
  for (let i = left; i <= right; i += 1) range.push(i);
  if (right < total - 1) range.push("ellipsis");
  range.push(total);
  return range;
}

interface AuditLogRow {
  id: string;
  adminEmail: string;
  action: string;
  targetTable: string;
  targetId: string;
  beforeSnap: Record<string, unknown> | null;
  afterSnap: Record<string, unknown> | null;
  reason: string;
  createdAt: string;
  module: ModuleFilter;
  highRisk: boolean;
  isOverride: boolean;
}

const FIXED_NOW = new Date("2026-07-24T23:59:59");

const moduleLabels: Record<Exclude<ModuleFilter, "all">, string> = {
  dispute: "爭議仲裁",
  kyc: "商戶與KYC",
  finance: "財務與結算",
  system: "系統參數",
};

const dateRangeOptions: { key: DateRange; label: string }[] = [
  { key: "7d", label: "7日" },
  { key: "30d", label: "30日" },
  { key: "90d", label: "90日" },
  { key: "all", label: "全量" },
];

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: audit_log | View / RPC: list_audit_logs
const auditRows: AuditLogRow[] = [
  {
    id: "AUD-2026-00142",
    adminEmail: "admin.lau@hkcardvault.com",
    action: "dispute.resolve",
    targetTable: "disputes",
    targetId: "DSP-2026-00891",
    beforeSnap: {
      status: "under_review",
      adjudicator_id: null,
      resolution_note: "",
    },
    afterSnap: {
      status: "resolved_buyer",
      adjudicator_id: "ADM-0001",
      resolution_note: "買家已舉證賣家未按圖出貨，裁定退款 80%",
    },
    reason:
      "買家提供開箱影片，確認卡品與listing明顯不符，依平台爭議仲裁規則執行部分退款。",
    createdAt: "2026-07-24 10:15",
    module: "dispute",
    highRisk: true,
    isOverride: false,
  },
  {
    id: "AUD-2026-00141",
    adminEmail: "risk.lee@hkcardvault.com",
    action: "user.ban",
    targetTable: "users",
    targetId: "USR-77192 / shadow_trader",
    beforeSnap: { is_banned: false, trust_score: 32, ban_reason: "" },
    afterSnap: {
      is_banned: true,
      trust_score: 0,
      ban_reason: "疑似假卡詐騙與多次未出貨投訴",
    },
    reason:
      "累計檢報達 5 次且 KYC 無法佐證實體商店，依高風險處置流程永久停權。",
    createdAt: "2026-07-24 09:42",
    module: "kyc",
    highRisk: true,
    isOverride: false,
  },
  {
    id: "AUD-2026-00140",
    adminEmail: "ops.chan@hkcardvault.com",
    action: "escrow.override",
    targetTable: "escrow_events",
    targetId: "ESC-20260723-5521",
    beforeSnap: { state: "held", release_at: "2026-07-25T12:00:00" },
    afterSnap: {
      state: "released_early",
      release_at: "2026-07-24T09:30:00",
      override_by: "ops.chan",
    },
    reason:
      "VIP 買家與星級商戶雙方確認提前收貨並同意解除託管，管理員覆寫自動釋放時間。",
    createdAt: "2026-07-24 09:30",
    module: "finance",
    highRisk: true,
    isOverride: true,
  },
  {
    id: "AUD-2026-00139",
    adminEmail: "finance.wong@hkcardvault.com",
    action: "commission.adjust",
    targetTable: "platform_settings",
    targetId: "setting.commission_rate",
    beforeSnap: { commission_rate: 5.0, updated_by: "system" },
    afterSnap: { commission_rate: 4.5, updated_by: "finance.wong" },
    reason:
      "配合夏季抽獎活動，對指定活動時段訂單下調平台佣金以提升商戶參與度。",
    createdAt: "2026-07-23 18:05",
    module: "finance",
    highRisk: false,
    isOverride: true,
  },
  {
    id: "AUD-2026-00138",
    adminEmail: "admin.lau@hkcardvault.com",
    action: "kyc.approve",
    targetTable: "kyc_submissions",
    targetId: "KYC-20260722-4412",
    beforeSnap: { status: "pending", reviewed_at: null },
    afterSnap: { status: "approved", reviewed_at: "2026-07-22T16:20:00" },
    reason:
      "商戶提交之商業登記與身分證文件齊全，照片與證件號碼比對一致，通過實名審核。",
    createdAt: "2026-07-22 16:20",
    module: "kyc",
    highRisk: false,
    isOverride: false,
  },
  {
    id: "AUD-2026-00137",
    adminEmail: "risk.lee@hkcardvault.com",
    action: "kyc.reject",
    targetTable: "kyc_submissions",
    targetId: "KYC-20260721-4299",
    beforeSnap: { status: "pending", reject_reason: "" },
    afterSnap: {
      status: "rejected",
      reject_reason: "證件翻拍模糊不清且地址證明過期",
    },
    reason:
      "兩次補件後仍無法辨識證件有效期，依 KYC 風控準則駁回申請並通知用戶重新提交。",
    createdAt: "2026-07-21 11:50",
    module: "kyc",
    highRisk: false,
    isOverride: false,
  },
  {
    id: "AUD-2026-00136",
    adminEmail: "admin.lau@hkcardvault.com",
    action: "listing.takedown",
    targetTable: "listings",
    targetId: "LIS-20260720-3318",
    beforeSnap: { status: "active", visibility: "public" },
    afterSnap: {
      status: "removed",
      visibility: "hidden",
      takedown_reason: "侵權舉報",
    },
    reason:
      "收到版權方通知，該 listing 盜用官方商品圖片且標價明顯偏離市場行情，先行下架處理。",
    createdAt: "2026-07-20 14:12",
    module: "system",
    highRisk: true,
    isOverride: false,
  },
  {
    id: "AUD-2026-00135",
    adminEmail: "finance.wong@hkcardvault.com",
    action: "order.refund",
    targetTable: "orders",
    targetId: "ORD-20260719-4102",
    beforeSnap: { status: "completed", refund_amount: 0, refunded_at: null },
    afterSnap: {
      status: "refunded",
      refund_amount: 8500,
      refunded_at: "2026-07-19T17:00:00",
    },
    reason:
      "賣家未能提供寄出單據，買家申請全額退款，經財務覆核後執行退款並結案。",
    createdAt: "2026-07-19 17:00",
    module: "finance",
    highRisk: false,
    isOverride: true,
  },
  {
    id: "AUD-2026-00134",
    adminEmail: "ops.chan@hkcardvault.com",
    action: "settings.update",
    targetTable: "platform_settings",
    targetId: "setting.fps_fee",
    beforeSnap: { fps_fee: 0, effective_from: "2026-07-01" },
    afterSnap: { fps_fee: 15, effective_from: "2026-08-01" },
    reason:
      "因應銀行手續費調整，自八月起 FPS 手動劃撥改為每筆收取 HK$15 行政費。",
    createdAt: "2026-07-18 10:30",
    module: "system",
    highRisk: false,
    isOverride: false,
  },
  {
    id: "AUD-2026-00133",
    adminEmail: "admin.lau@hkcardvault.com",
    action: "dispute.resolve",
    targetTable: "disputes",
    targetId: "DSP-2026-00872",
    beforeSnap: { status: "under_review", resolution: null },
    afterSnap: {
      status: "resolved_seller",
      resolution: "卡品爭議屬運輸碰撞，賣家無責",
    },
    reason:
      "第三方鑑定報告顯示卡牌在寄出後產生折損，無法認定賣家責任，裁定維持訂單完成。",
    createdAt: "2026-07-17 15:45",
    module: "dispute",
    highRisk: false,
    isOverride: false,
  },
  {
    id: "AUD-2026-00132",
    adminEmail: "risk.lee@hkcardvault.com",
    action: "user.ban",
    targetTable: "users",
    targetId: "USR-68041 / pika_scammer",
    beforeSnap: { is_banned: false, risk_flags: 4 },
    afterSnap: { is_banned: true, risk_flags: 4 },
    reason:
      "利用多組假帳號操縱競標價格，且 KYC 使用偽造證件，永久停權並上報執法機關。",
    createdAt: "2026-07-15 08:20",
    module: "kyc",
    highRisk: true,
    isOverride: false,
  },
  {
    id: "AUD-2026-00131",
    adminEmail: "finance.wong@hkcardvault.com",
    action: "commission.adjust",
    targetTable: "platform_settings",
    targetId: "setting.commission_rate",
    beforeSnap: { commission_rate: 4.5, promotion_id: "CMP-03" },
    afterSnap: { commission_rate: 5.0, promotion_id: null },
    reason: "夜巡 (sv6a) 單卡免佣活動結束，將平台基本佣金率恢復為正常 5.0%。",
    createdAt: "2026-07-14 23:00",
    module: "finance",
    highRisk: false,
    isOverride: true,
  },
  {
    id: "AUD-2026-00130",
    adminEmail: "ops.chan@hkcardvault.com",
    action: "settings.update",
    targetTable: "platform_settings",
    targetId: "settlement.withdrawal_schedule",
    beforeSnap: { withdrawal_schedule: "friday", cutoff_hour: 14 },
    afterSnap: { withdrawal_schedule: "friday", cutoff_hour: 12 },
    reason:
      "配合銀行截數時間調整，每週五結算提現截止時間由 14:00 提前至 12:00。",
    createdAt: "2026-07-10 09:15",
    module: "system",
    highRisk: false,
    isOverride: false,
  },
  {
    id: "AUD-2026-00129",
    adminEmail: "admin.lau@hkcardvault.com",
    action: "escrow.override",
    targetTable: "escrow_events",
    targetId: "ESC-20260709-3122",
    beforeSnap: { state: "held", dispute_flag: true },
    afterSnap: {
      state: "refunded",
      dispute_flag: true,
      override_reason: "高價卡缺貨協議退款",
    },
    reason: "雙方已達成和解並同意退回全款，管理員覆寫託管狀態直接退款予買家。",
    createdAt: "2026-07-09 16:40",
    module: "finance",
    highRisk: true,
    isOverride: true,
  },
  {
    id: "AUD-2026-00128",
    adminEmail: "ops.chan@hkcardvault.com",
    action: "kyc.approve",
    targetTable: "kyc_submissions",
    targetId: "KYC-20260708-3091",
    beforeSnap: { status: "pending", merchant_tier: "standard" },
    afterSnap: { status: "approved", merchant_tier: "trusted" },
    reason:
      "商戶歷史交易完成率高且無爭議記錄，核准升級為可信賴商戶等級並降低託管期。",
    createdAt: "2026-07-08 13:55",
    module: "kyc",
    highRisk: false,
    isOverride: false,
  },
  {
    id: "AUD-2026-00127",
    adminEmail: "risk.lee@hkcardvault.com",
    action: "listing.takedown",
    targetTable: "listings",
    targetId: "LIS-20260705-2814",
    beforeSnap: { status: "active", price: 120000 },
    afterSnap: {
      status: "removed",
      price: 120000,
      takedown_reason: "價格操縱嫌疑",
    },
    reason:
      "該 listing 短時間內大量自我抬價且無實際成交意圖，依反操縱政策下架觀察。",
    createdAt: "2026-07-05 11:10",
    module: "system",
    highRisk: true,
    isOverride: false,
  },
];

function moduleForAction(action: string): ModuleFilter {
  if (action.startsWith("dispute.")) return "dispute";
  if (action.startsWith("user.") || action.startsWith("kyc.")) return "kyc";
  if (
    action.startsWith("commission.") ||
    action.startsWith("order.") ||
    action.startsWith("escrow.")
  )
    return "finance";
  return "system";
}

function moduleFilterMatches(action: string, filter: ModuleFilter): boolean {
  if (filter === "all") return true;
  return moduleForAction(action) === filter;
}

function formatSnapshot(snap: Record<string, unknown> | null): string {
  if (!snap) return "";
  return JSON.stringify(snap, null, 2);
}

function escapeCsvCell(value: string): string {
  const needsQuoting =
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");
  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function exportAuditCsv(rows: AuditLogRow[]) {
  const headers = [
    "日誌編號",
    "操作管理員",
    "動作",
    "目標資料表",
    "目標對象",
    "操作理由",
    "操作時間",
  ];
  const line = headers.map(escapeCsvCell).join(",");
  const body = rows
    .map((row) =>
      [
        escapeCsvCell(row.id),
        escapeCsvCell(row.adminEmail),
        escapeCsvCell(row.action),
        escapeCsvCell(row.targetTable),
        escapeCsvCell(row.targetId),
        escapeCsvCell(row.reason),
        escapeCsvCell(row.createdAt),
      ].join(","),
    )
    .join("\n");
  const csv = `\uFEFF${line}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("審計軌跡 CSV 已導出，僅包含當前篩選範圍內的紀錄。");
}

export default function AdminSettingsPage() {
  // Financial inputs
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [appraisalFee, setAppraisalFee] = useState(150);
  const [fpsFee, setFpsFee] = useState(0);

  // Security thresholds
  const [maxWithdrawalLimit, setMaxWithdrawalLimit] = useState(50000);
  const [kycWithdrawalThreshold, setKycWithdrawalThreshold] = useState(10000);
  const [riskFlagsThreshold, setRiskFlagsThreshold] = useState(3);

  // Platform policy terms
  const [termsText, setTermsText] = useState(
    `歡迎使用 HKCardVault TCG 交易與收藏保管平台。\n\n本平台之交易服務條款修訂如下：\n1. 凡本平台之認證商戶（MERCHANT），每筆交易將扣除 5.0% 的佣金（不包含 Stripe 聯網信用卡通道之 1.4% 第三方交易費）。\n2. 鑑定服務由本平台專業鑑定團隊承接，PSA / BGS 標準單卡鑑定費用為固定 HK$150/張。\n3. 所有提現結算統一於每週五進行人工 FPS 劃撥，目前免除任何銀行轉賬手續費。\n4. 若單筆交易金額超過 HK$10,000，或累計提現達到此金額，用戶必須強制通過 Stripe KYC 與政府證件審批程序，方可繼續發送提現。`,
  );

  // Tabs
  const [activeTab, setActiveTab] = useState<AuditTab>("financials");

  // Audit log filters
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [auditPage, setAuditPage] = useState(1);
  const [auditJumpInput, setAuditJumpInput] = useState("");
  const AUDIT_PAGE_SIZE = 10;

  // Snapshot diff modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const handleSaveFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("✅ 核心財務變數已更新！新費率與費用參數已寫入系統核心表。");
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      "🔒 安全風控防線閾值更新成功！所有高額交易與異常提現將受到新防護限制。",
    );
  };

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(
      "📄 平台聲明與交易條款已修訂！新條款已發佈並強制更新至前台用戶協議。",
    );
  };

  const filteredAuditRows = useMemo(() => {
    let rows = auditRows.filter((row) => {
      const rowDate = new Date(row.createdAt.replace(" ", "T"));
      const diffDays =
        (FIXED_NOW.getTime() - rowDate.getTime()) / (1000 * 3600 * 24);
      if (dateRange === "7d" && diffDays > 7) return false;
      if (dateRange === "30d" && diffDays > 30) return false;
      if (dateRange === "90d" && diffDays > 90) return false;
      return true;
    });

    if (moduleFilter !== "all") {
      rows = rows.filter((row) =>
        moduleFilterMatches(row.action, moduleFilter),
      );
    }

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      rows = rows.filter(
        (row) =>
          row.adminEmail.toLowerCase().includes(q) ||
          row.targetId.toLowerCase().includes(q) ||
          row.action.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [dateRange, moduleFilter, auditSearchQuery]);

  const totalAuditPages = Math.max(
    1,
    Math.ceil(filteredAuditRows.length / AUDIT_PAGE_SIZE),
  );

  const paginatedAuditRows = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredAuditRows.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredAuditRows, auditPage]);

  const goToAuditPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalAuditPages);
    setAuditPage(clamped);
  };

  const handleAuditJump = () => {
    const parsed = Number.parseInt(auditJumpInput, 10);
    if (Number.isNaN(parsed)) {
      toast.error("請輸入有效的頁碼");
      return;
    }
    if (parsed < 1 || parsed > totalAuditPages) {
      toast.error(`頁碼超出範圍（1 - ${totalAuditPages}）`);
      return;
    }
    goToAuditPage(parsed);
    setAuditJumpInput("");
  };

  const totalCount = auditRows.length;
  const highRisk24hCount = auditRows.filter((row) => {
    const rowDate = new Date(row.createdAt.replace(" ", "T"));
    const diffDays =
      (FIXED_NOW.getTime() - rowDate.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 1 && row.highRisk;
  }).length;
  const overrideDisputeCount = auditRows.filter(
    (row) => row.isOverride || row.module === "dispute",
  ).length;

  const sectionClass =
    "bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5";

  const renderFinancialsTab = () => (
    <div className="space-y-6">
      {/* ── Section 1: 核心財務變數調校 ────────────────────────────────── */}
      <section aria-labelledby="financials-heading" className={sectionClass}>
        <h2
          id="financials-heading"
          className="font-sans font-bold text-[16px] text-text-primary mb-1"
        >
          核心財務與費用變數調校
        </h2>
        <p className="font-sans text-[12px] text-text-secondary mb-4">
          設定全平台抽佣比例、單張保管鑑定費用，以及 FPS 人手劃撥銷帳手續費
        </p>

        <form onSubmit={handleSaveFinancials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label
                htmlFor="commission-rate"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                平台基本交易佣金率
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <Input
                  id="commission-rate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) =>
                    setCommissionRate(parseFloat(e.target.value))
                  }
                  min={1}
                  max={20}
                  step={0.1}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
                <span className="font-mono text-[11px] text-text-disabled">
                  %
                </span>
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                目前費率：5.0%
              </p>
            </div>

            <div>
              <Label
                htmlFor="appraisal-fee"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                單張卡牌保管鑑定費
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                  HK$
                </span>
                <Input
                  id="appraisal-fee"
                  type="number"
                  value={appraisalFee}
                  onChange={(e) => setAppraisalFee(parseInt(e.target.value))}
                  min={50}
                  max={1000}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                包括保險與標準外殼
              </p>
            </div>

            <div>
              <Label
                htmlFor="fps-fee"
                className="font-mono text-[11px] text-text-secondary block mb-1.5"
              >
                FPS 手動劃撥手續費
              </Label>
              <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
                <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                  HK$
                </span>
                <Input
                  id="fps-fee"
                  type="number"
                  value={fpsFee}
                  onChange={(e) => setFpsFee(parseInt(e.target.value))}
                  min={0}
                  max={100}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
                />
              </div>
              <p className="font-mono text-[9px] text-text-disabled mt-1">
                設置為 0 表示免收費
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            儲存財務設定
          </Button>
        </form>
      </section>

      {/* ── Section 2: 平台聲明與條款編輯器 ────────────────────────────── */}
      <section aria-labelledby="terms-heading" className={sectionClass}>
        <h2
          id="terms-heading"
          className="font-sans font-bold text-[16px] text-text-primary mb-1"
        >
          平台聲明與交易條款編輯器
        </h2>
        <p className="font-sans text-[12px] text-text-secondary mb-4">
          編修前台用戶服務協議、商戶提現守則及隱私政策聲明（實時發佈更新）
        </p>

        <form onSubmit={handleSaveTerms} className="space-y-4">
          <div className="bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl p-3">
            <textarea
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              rows={8}
              className="w-full bg-transparent font-sans text-[12px] text-text-primary leading-relaxed placeholder-text-disabled focus:outline-none resize-none"
            />
          </div>

          <Button
            type="submit"
            className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            發佈最新條款聲明
          </Button>
        </form>
      </section>

      {/* ── Section 3: Session Control ────────────────────────────────── */}
      <section aria-labelledby="session-ctrl-heading" className={sectionClass}>
        <h2
          id="session-ctrl-heading"
          className="font-sans font-bold text-[15px] text-text-secondary mb-3"
        >
          Session Control
        </h2>
        <div className="bg-bg-page border border-[rgba(237,232,224,0.05)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] text-text-disabled uppercase block">
              管理員身份鑑權
            </span>
            <span className="font-sans text-[12px] text-text-primary mt-0.5 block">
              您目前是以安全最高權限組管理員 (Super Admin) 登入。
            </span>
          </div>
          <div className="shrink-0">
            <LogoutModal />
          </div>
        </div>
      </section>
    </div>
  );

  const renderSecurityTab = () => (
    <section aria-labelledby="security-heading" className={sectionClass}>
      <h2
        id="security-heading"
        className="font-sans font-bold text-[16px] text-text-primary mb-1"
      >
        安全風控防線閾值變更
      </h2>
      <p className="font-sans text-[12px] text-text-secondary mb-4">
        設定商戶提現、單筆交易安全審核閾值，預防洗錢與假冒交易 (Anti-Fraud)
      </p>

      <form onSubmit={handleSaveSecurity} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label
              htmlFor="max-withdrawal"
              className="font-mono text-[11px] text-text-secondary block mb-1.5"
            >
              單筆免核准最大提現限額
            </Label>
            <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
              <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                HK$
              </span>
              <Input
                id="max-withdrawal"
                type="number"
                value={maxWithdrawalLimit}
                onChange={(e) =>
                  setMaxWithdrawalLimit(parseInt(e.target.value))
                }
                min={1000}
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
              />
            </div>
            <p className="font-mono text-[9px] text-text-disabled mt-1">
              超出此額需人工專案核准
            </p>
          </div>

          <div>
            <Label
              htmlFor="kyc-threshold"
              className="font-mono text-[11px] text-text-secondary block mb-1.5"
            >
              觸發強制 KYC 累計交易額
            </Label>
            <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
              <span className="font-mono text-[11px] text-text-disabled mr-1.5">
                HK$
              </span>
              <Input
                id="kyc-threshold"
                type="number"
                value={kycWithdrawalThreshold}
                onChange={(e) =>
                  setKycWithdrawalThreshold(parseInt(e.target.value))
                }
                min={1000}
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
              />
            </div>
            <p className="font-mono text-[9px] text-text-disabled mt-1">
              未過 KYC 者超過此額鎖定交易
            </p>
          </div>

          <div>
            <Label
              htmlFor="risk-flags"
              className="font-mono text-[11px] text-text-secondary block mb-1.5"
            >
              觸發臨時封禁累計檢報數
            </Label>
            <div className="flex items-center h-10 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden px-3">
              <Input
                id="risk-flags"
                type="number"
                value={riskFlagsThreshold}
                onChange={(e) =>
                  setRiskFlagsThreshold(parseInt(e.target.value))
                }
                min={1}
                className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-[13px] text-text-primary px-0"
              />
              <span className="font-mono text-[11px] text-text-disabled">
                次
              </span>
            </div>
            <p className="font-mono text-[9px] text-text-disabled mt-1">
              商戶被控次數多於此即自動鎖卡
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="h-10 px-5 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all"
        >
          更新安全風控門檻
        </Button>
      </form>
    </section>
  );

  const renderAuditTab = () => (
    <div className="space-y-5">
      {/*_metric cards*/}
      <section aria-labelledby="audit-metrics-heading" className="sr-only">
        <h2 id="audit-metrics-heading">審計軌跡摘要</h2>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-bg-card border-[rgba(237,232,224,0.08)] text-center">
          <CardContent className="px-4 py-3.5">
            <p className="font-mono font-bold text-[22px] text-brand">
              {totalCount.toLocaleString("zh-TW")}
            </p>
            <p className="font-mono text-[11px] text-text-secondary mt-1">
              累計審計紀錄
            </p>
          </CardContent>
        </Card>
        <Card className="bg-bg-card border-[rgba(237,232,224,0.08)] text-center">
          <CardContent className="px-4 py-3.5">
            <p className="font-mono font-bold text-[22px] text-warning">
              {highRisk24hCount.toLocaleString("zh-TW")}
            </p>
            <p className="font-mono text-[11px] text-text-secondary mt-1">
              高風險操作 (24h)
            </p>
          </CardContent>
        </Card>
        <Card className="bg-bg-card border-[rgba(237,232,224,0.08)] text-center">
          <CardContent className="px-4 py-3.5">
            <p className="font-mono font-bold text-[22px] text-success">
              {overrideDisputeCount.toLocaleString("zh-TW")}
            </p>
            <p className="font-mono text-[11px] text-text-secondary mt-1">
              覆寫與仲裁執行
            </p>
          </CardContent>
        </Card>
      </div>

      {/* filter toolbar */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            type="text"
            placeholder="搜尋管理員 Email、目標 ID / handle 或動作 keyword"
            value={auditSearchQuery}
            onChange={(e) => {
              setAuditSearchQuery(e.target.value);
              setAuditPage(1);
            }}
            className="flex-1 h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
          />

          <Select
            value={moduleFilter}
            onValueChange={(val) => {
              setModuleFilter(val as ModuleFilter);
              setAuditPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-44 h-10 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12px] text-text-primary">
              <SelectValue placeholder="選擇模組" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部模組</SelectItem>
              <SelectItem value="dispute">爭議仲裁</SelectItem>
              <SelectItem value="kyc">商戶與KYC</SelectItem>
              <SelectItem value="finance">財務與結算</SelectItem>
              <SelectItem value="system">系統參數</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-sans text-xs text-text-secondary font-medium pl-1">
              時間範圍篩選：
            </span>
            {dateRangeOptions.map((opt) => (
              <Button
                key={opt.key}
                type="button"
                variant="ghost"
                onClick={() => {
                  setDateRange(opt.key);
                  setAuditPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-sans text-xs transition-all h-9 ${
                  dateRange === opt.key
                    ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                    : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => exportAuditCsv(filteredAuditRows)}
            className="h-9 px-3 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-text-primary font-sans text-xs rounded-xl hover:bg-bg-hover active:scale-[0.98] transition-all"
          >
            <span className="mr-1.5">📥</span>
            導出審計軌跡 CSV
          </Button>
        </div>
      </div>

      {/* data table */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
          <h3 className="font-sans font-bold text-[15px] text-text-secondary">
            審計軌跡列表
          </h3>
          <span className="font-mono text-[11px] text-text-disabled">
            共 {filteredAuditRows.length} 筆紀錄 (每頁 {AUDIT_PAGE_SIZE} 筆)
          </span>
        </div>

        <TooltipProvider delay={200}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                  <TableHead className="font-mono text-[11px] text-text-secondary w-[140px]">
                    日誌編號
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary">
                    操作管理員
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary">
                    觸發模組 / 動作
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary">
                    目標對象
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary">
                    操作理由
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary w-[120px]">
                    操作時間
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary text-right">
                    詳情
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAuditRows.length === 0 ? (
                  <TableRow className="border-[rgba(237,232,224,0.08)]">
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-text-secondary font-sans text-sm"
                    >
                      暫無符合篩選條件的審計紀錄
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAuditRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-[rgba(237,232,224,0.08)] hover:bg-bg-hover transition-colors"
                    >
                      <TableCell className="font-mono text-[12px] text-text-primary">
                        {row.id}
                      </TableCell>
                      <TableCell className="font-sans text-[12px] text-text-primary">
                        {row.adminEmail}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-sans text-[11px] text-text-secondary">
                            {
                              moduleLabels[
                                row.module as Exclude<ModuleFilter, "all">
                              ]
                            }
                          </span>
                          <Badge
                            variant="outline"
                            className={`w-fit rounded-md px-1.5 py-0.5 text-[10px] font-mono border ${
                              row.highRisk
                                ? "border-warning text-warning bg-warning/5"
                                : "border-text-disabled text-text-secondary bg-transparent"
                            }`}
                          >
                            {row.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-primary">
                        {row.targetTable}
                        <span className="block text-text-secondary">
                          {row.targetId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            <p className="max-w-[240px] truncate font-sans text-[12px] text-text-secondary cursor-help">
                              {row.reason}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-xs bg-bg-elevated border-[rgba(237,232,224,0.08)] text-text-primary font-sans text-xs"
                          >
                            {row.reason}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-primary whitespace-nowrap">
                        {row.createdAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(row)}
                          className="h-8 px-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover font-sans text-xs rounded-lg"
                        >
                          <span className="mr-1">🔍</span>
                          快照 Diff
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>

        {/* pagination */}
        {filteredAuditRows.length > 0 && (
          <div className="px-4 py-3 border-t border-[rgba(237,232,224,0.08)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <span className="font-mono text-[11px] text-text-disabled">
              顯示第{" "}
              <span className="text-text-secondary font-medium">
                {(auditPage - 1) * AUDIT_PAGE_SIZE + 1}
              </span>
              {" - "}
              <span className="text-text-secondary font-medium">
                {Math.min(
                  auditPage * AUDIT_PAGE_SIZE,
                  filteredAuditRows.length,
                )}
              </span>
              {" 筆，共 "}
              <span className="text-brand font-medium">
                {filteredAuditRows.length}
              </span>
              {" 筆"}
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Prev */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToAuditPage(auditPage - 1)}
                disabled={auditPage === 1}
                aria-label="上一頁"
                className="h-8 px-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:text-text-disabled disabled:hover:bg-transparent font-sans text-xs rounded-lg"
              >
                ‹ 上一頁
              </Button>

              {/* Windowed numbered pages */}
              <div className="flex items-center gap-1">
                {getPaginationRange(auditPage, totalAuditPages).map(
                  (item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        aria-hidden
                        className="h-8 min-w-8 flex items-center justify-center font-mono text-[11px] text-text-disabled select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToAuditPage(item)}
                        aria-label={`第 ${item} 頁`}
                        aria-current={auditPage === item ? "page" : undefined}
                        className={`h-8 min-w-8 px-2 rounded-lg font-mono text-[11px] transition-colors ${
                          auditPage === item
                            ? "bg-brand text-[#17130f] font-bold"
                            : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                        }`}
                      >
                        {item}
                      </button>
                    ),
                )}
              </div>

              {/* Next */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToAuditPage(auditPage + 1)}
                disabled={auditPage === totalAuditPages}
                aria-label="下一頁"
                className="h-8 px-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:text-text-disabled disabled:hover:bg-transparent font-sans text-xs rounded-lg"
              >
                下一頁 ›
              </Button>

              {/* Jump to page (only useful when many pages) */}
              {totalAuditPages > 7 && (
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="font-sans text-[11px] text-text-disabled">
                    跳至
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={totalAuditPages}
                    value={auditJumpInput}
                    onChange={(e) => setAuditJumpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAuditJump();
                      }
                    }}
                    placeholder={`${auditPage}`}
                    aria-label="跳至指定頁碼"
                    className="h-8 w-14 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-lg px-2 text-center font-mono text-[11px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="font-sans text-[11px] text-text-disabled">
                    頁
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAuditJump}
                    className="h-8 px-2.5 text-brand hover:text-brand-hover hover:bg-bg-hover font-sans text-xs rounded-lg"
                  >
                    前往
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* snapshot diff dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="bg-bg-card border-[rgba(237,232,224,0.08)] text-text-primary max-w-4xl max-h-[85dvh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="p-5 border-b border-[rgba(237,232,224,0.08)]">
            <DialogTitle className="font-sans font-bold text-[16px]">
              審計快照 Diff
            </DialogTitle>
            {selectedLog && (
              <DialogDescription className="font-mono text-[11px] text-text-secondary">
                {selectedLog.id} · {selectedLog.adminEmail} ·{" "}
                {selectedLog.action}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedLog && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* before */}
                <div className="rounded-xl border border-warning/20 bg-warning/5 overflow-hidden">
                  <div className="px-4 py-2 border-b border-warning/20 bg-warning/10">
                    <p className="font-mono text-[11px] font-semibold text-warning">
                      修改前 (Before)
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-warning">
                    {selectedLog.beforeSnap ? (
                      <pre className="font-mono text-[11px] whitespace-pre-wrap text-text-secondary">
                        {formatSnapshot(selectedLog.beforeSnap)}
                      </pre>
                    ) : (
                      <p className="font-sans text-[12px] text-text-disabled py-2">
                        — 無快照
                      </p>
                    )}
                  </div>
                </div>

                {/* after */}
                <div className="rounded-xl border border-success/20 bg-success/5 overflow-hidden">
                  <div className="px-4 py-2 border-b border-success/20 bg-success/10">
                    <p className="font-mono text-[11px] font-semibold text-success">
                      修改後 (After)
                    </p>
                  </div>
                  <div className="p-3 border-l-4 border-success">
                    {selectedLog.afterSnap ? (
                      <pre className="font-mono text-[11px] whitespace-pre-wrap text-text-secondary">
                        {formatSnapshot(selectedLog.afterSnap)}
                      </pre>
                    ) : (
                      <p className="font-sans text-[12px] text-text-disabled py-2">
                        — 無快照
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl p-3">
                <span className="font-mono text-[10px] text-text-secondary uppercase block mb-1">
                  操作理由
                </span>
                <p className="font-sans text-[12px] text-text-primary">
                  {selectedLog.reason}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="max-w-180 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="font-sans font-bold text-[24px] text-text-primary">
          營運設定
        </h1>
        <p className="font-sans text-[13px] text-text-secondary mt-0.5">
          管理員可調校平台核心佣金、安全風控閾值防線，以及審閱不可變的審計軌跡
        </p>
      </div>

      {/* ── Segmented Tab Selector ───────────────────────────────────── */}
      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: "financials", label: "核心財務與參數" },
            { key: "security", label: "防線與風險閾值" },
            { key: "audit", label: "審計軌跡" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as AuditTab)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
                activeTab === tab.key
                  ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Panels ───────────────────────────────────────────────── */}
      {activeTab === "financials" && renderFinancialsTab()}
      {activeTab === "security" && renderSecurityTab()}
      {activeTab === "audit" && renderAuditTab()}
    </div>
  );
}
