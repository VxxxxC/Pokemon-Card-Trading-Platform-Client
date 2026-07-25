"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types Definitions ────────────────────────────────────────────────────────
interface StripeKycRecord {
  id: string;
  shopName: string;
  handle: string;
  stripeAccountId: string;
  kycStatus: "verified" | "pending" | "restricted";
  payoutStatus: "enabled" | "suspended";
  totalTrades: number;
  rating: number;
  updatedAt: string;
}

interface MerchantOnboardingApp {
  id: string;
  applicantName: string;
  handle: string;
  shopName: string;
  submittedAt: string;
  docType: string;
  totalTrades: number;
  rating: number;
  status: "pending" | "approved" | "rejected";
}

interface OverrideAuditLog {
  id: string;
  adminEmail: string;
  targetUser: string;
  action: string;
  reason: string;
  timestamp: string;
}

// ── Initial Mock Datasets ────────────────────────────────────────────────────
// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: stripe_connect_accounts, kyc_applications | View / RPC: list_merchant_kyc_records
const initialStripeRecords: StripeKycRecord[] = [
  {
    id: "M-001",
    shopName: "HarutoCards Premium",
    handle: "@haruto_tcg",
    stripeAccountId: "acct_1NfG82H",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 142,
    rating: 4.9,
    updatedAt: "2025/5/21 14:00",
  },
  {
    id: "M-002",
    shopName: "AikoRare Collection",
    handle: "@aiko_collector",
    stripeAccountId: "acct_1MeF83J",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 88,
    rating: 4.8,
    updatedAt: "2025/5/20 11:20",
  },
  {
    id: "M-003",
    shopName: "Daichi Rare Cards",
    handle: "@daichi_rare",
    stripeAccountId: "acct_1KyT92K",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 215,
    rating: 4.95,
    updatedAt: "2025/5/19 18:05",
  },
  {
    id: "M-004",
    shopName: "KuroGamer TCG",
    handle: "@kuro_gamer",
    stripeAccountId: "acct_1PzX44L",
    kycStatus: "restricted",
    payoutStatus: "suspended",
    totalTrades: 32,
    rating: 3.9,
    updatedAt: "2025/5/18 09:12",
  },
  {
    id: "M-005",
    shopName: "TokyoRare_HongKong",
    handle: "@tokyo_rare_hk",
    stripeAccountId: "acct_1QmA99M",
    kycStatus: "pending",
    payoutStatus: "suspended",
    totalTrades: 15,
    rating: 4.5,
    updatedAt: "2025/5/17 16:30",
  },
  {
    id: "M-006",
    shopName: "Osaka_PokeMaster",
    handle: "@osaka_pokemaster",
    stripeAccountId: "acct_1RnB88N",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 120,
    rating: 4.85,
    updatedAt: "2025/5/17 10:15",
  },
  {
    id: "M-007",
    shopName: "KyotoVault_Studio",
    handle: "@kyotovault",
    stripeAccountId: "acct_1SoC77O",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 175,
    rating: 4.92,
    updatedAt: "2025/5/16 20:40",
  },
  {
    id: "M-008",
    shopName: "Fukuoka_TCG_Hub",
    handle: "@fukuoka_hub",
    stripeAccountId: "acct_1TpD66P",
    kycStatus: "pending",
    payoutStatus: "suspended",
    totalTrades: 8,
    rating: 4.2,
    updatedAt: "2025/5/16 14:00",
  },
  {
    id: "M-009",
    shopName: "Sapporo_Rare_Studio",
    handle: "@sappororare",
    stripeAccountId: "acct_1UqE55Q",
    kycStatus: "restricted",
    payoutStatus: "suspended",
    totalTrades: 24,
    rating: 3.7,
    updatedAt: "2025/5/15 18:25",
  },
  {
    id: "M-010",
    shopName: "Nagoya_Card_Base",
    handle: "@nagoyabase",
    stripeAccountId: "acct_1VrF44R",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 290,
    rating: 4.98,
    updatedAt: "2025/5/15 12:10",
  },
  {
    id: "M-011",
    shopName: "Kobe_Collectors_HK",
    handle: "@kobe_hk",
    stripeAccountId: "acct_1WsG33S",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 160,
    rating: 4.88,
    updatedAt: "2025/5/14 21:50",
  },
  {
    id: "M-012",
    shopName: "Yokohama_Rare_Vault",
    handle: "@yokohama_vault",
    stripeAccountId: "acct_1XtH22T",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 95,
    rating: 4.75,
    updatedAt: "2025/5/14 11:30",
  },
  {
    id: "M-013",
    shopName: "Sendai_Poke_Corner",
    handle: "@sendai_poke",
    stripeAccountId: "acct_1YuI11U",
    kycStatus: "pending",
    payoutStatus: "suspended",
    totalTrades: 12,
    rating: 4.4,
    updatedAt: "2025/5/13 17:05",
  },
  {
    id: "M-014",
    shopName: "Hiroshima_TCG_Store",
    handle: "@hiroshima_tcg",
    stripeAccountId: "acct_1ZvJ00V",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 82,
    rating: 4.81,
    updatedAt: "2025/5/13 09:40",
  },
  {
    id: "M-015",
    shopName: "Chiba_Poke_Outlet",
    handle: "@chiba_poke",
    stripeAccountId: "acct_2AkK99W",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 135,
    rating: 4.9,
    updatedAt: "2025/5/12 16:15",
  },
  {
    id: "M-016",
    shopName: "Saitama_Card_Center",
    handle: "@saitamacard",
    stripeAccountId: "acct_2BlL88X",
    kycStatus: "restricted",
    payoutStatus: "suspended",
    totalTrades: 19,
    rating: 3.8,
    updatedAt: "2025/5/11 22:00",
  },
  {
    id: "M-017",
    shopName: "Nara_Legend_Vault",
    handle: "@naralegend",
    stripeAccountId: "acct_2CmM77Y",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 210,
    rating: 4.96,
    updatedAt: "2025/5/11 13:20",
  },
  {
    id: "M-018",
    shopName: "Shizuoka_Gold_Cards",
    handle: "@shizuokagold",
    stripeAccountId: "acct_2DnN66Z",
    kycStatus: "verified",
    payoutStatus: "enabled",
    totalTrades: 64,
    rating: 4.7,
    updatedAt: "2025/5/10 18:45",
  },
];

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: kyc_applications | View / RPC: list_kyc_applications
const initialOnboardingApps: MerchantOnboardingApp[] = [
  {
    id: "KYC-2025-041",
    applicantName: "鈴木 Haruto",
    handle: "@haruto_tcg",
    shopName: "HarutoCards Premium",
    submittedAt: "2025/5/21 09:14",
    docType: "日本護照",
    totalTrades: 42,
    rating: 4.8,
    status: "pending",
  },
  {
    id: "KYC-2025-040",
    applicantName: "中村 Aiko",
    handle: "@aiko_collector",
    shopName: "AikoRare Collection",
    submittedAt: "2025/5/20 16:52",
    docType: "政府身份證",
    totalTrades: 18,
    rating: 4.6,
    status: "pending",
  },
  {
    id: "KYC-2025-039",
    applicantName: "渡辺 Ren",
    handle: "@ren_cards",
    shopName: "渡辺カード専門店",
    submittedAt: "2025/5/19 11:30",
    docType: "駕駛執照",
    totalTrades: 65,
    rating: 5.0,
    status: "pending",
  },
  {
    id: "KYC-2025-038",
    applicantName: "林 Wei-Chen",
    handle: "@weichen_tcg",
    shopName: "Taiwan x Japan TCG",
    submittedAt: "2025/5/18 14:05",
    docType: "商業登記證",
    totalTrades: 31,
    rating: 4.9,
    status: "pending",
  },
  {
    id: "KYC-2025-037",
    applicantName: "佐藤 Mio",
    handle: "@mio_pokéshop",
    shopName: "Mio PokéShop",
    submittedAt: "2025/5/17 09:22",
    docType: "日本護照",
    totalTrades: 12,
    rating: 4.5,
    status: "pending",
  },
  {
    id: "KYC-2025-036",
    applicantName: "高橋 Daichi",
    handle: "@daichi_rare",
    shopName: "Daichi Rare Cards",
    submittedAt: "2025/5/15 17:48",
    docType: "政府身份證",
    totalTrades: 89,
    rating: 4.95,
    status: "approved",
  },
  {
    id: "KYC-2025-035",
    applicantName: "陳 Ka-Wai",
    handle: "@kawai_tcg",
    shopName: "Ka Wai Poke Vault",
    submittedAt: "2025/5/14 15:30",
    docType: "香港永久居民身份證",
    totalTrades: 54,
    rating: 4.85,
    status: "pending",
  },
  {
    id: "KYC-2025-034",
    applicantName: "伊藤 Nana",
    handle: "@nana_tcg",
    shopName: "NanaTCG 精品店",
    submittedAt: "2025/5/12 10:11",
    docType: "駕駛執照",
    totalTrades: 5,
    rating: 3.8,
    status: "rejected",
  },
  {
    id: "KYC-2025-033",
    applicantName: "小林 Kenji",
    handle: "@kenji_cards",
    shopName: "Kenji Japan Collectibles",
    submittedAt: "2025/5/11 20:00",
    docType: "日本護照",
    totalTrades: 77,
    rating: 4.92,
    status: "approved",
  },
  {
    id: "KYC-2025-032",
    applicantName: "黃 Chun-Yin",
    handle: "@cy_poke",
    shopName: "Chun Yin Rare TCG",
    submittedAt: "2025/5/11 11:45",
    docType: "商業登記證",
    totalTrades: 28,
    rating: 4.7,
    status: "pending",
  },
  {
    id: "KYC-2025-031",
    applicantName: "山本 Yui",
    handle: "@yuki_tcg",
    shopName: "Yui Poke Paradise",
    submittedAt: "2025/5/10 18:20",
    docType: "駕駛執照",
    totalTrades: 92,
    rating: 4.98,
    status: "approved",
  },
  {
    id: "KYC-2025-030",
    applicantName: "張 Kin-Man",
    handle: "@km_vault",
    shopName: "Kin Man Card Vault",
    submittedAt: "2025/5/09 14:15",
    docType: "香港永久居民身份證",
    totalTrades: 15,
    rating: 4.1,
    status: "rejected",
  },
  {
    id: "KYC-2025-029",
    applicantName: "加藤 Riku",
    handle: "@riku_shop",
    shopName: "Riku TCG Studio",
    submittedAt: "2025/5/08 22:05",
    docType: "政府身份證",
    totalTrades: 38,
    rating: 4.75,
    status: "pending",
  },
  {
    id: "KYC-2025-028",
    applicantName: "李 Siu-Lung",
    handle: "@siulung_poke",
    shopName: "Dragon TCG HK",
    submittedAt: "2025/5/08 10:30",
    docType: "商業登記證",
    totalTrades: 110,
    rating: 4.9,
    status: "approved",
  },
  {
    id: "KYC-2025-027",
    applicantName: "吉田 Hinata",
    handle: "@hinata_cards",
    shopName: "Hinata Rare Hub",
    submittedAt: "2025/5/07 16:50",
    docType: "日本護照",
    totalTrades: 22,
    rating: 4.6,
    status: "pending",
  },
  {
    id: "KYC-2025-026",
    applicantName: "吳 Wing-Sze",
    handle: "@wingsze_tcg",
    shopName: "Wing Sze Poke Shop",
    submittedAt: "2025/5/06 12:00",
    docType: "香港永久居民身份證",
    totalTrades: 45,
    rating: 4.82,
    status: "approved",
  },
  {
    id: "KYC-2025-025",
    applicantName: "松本 Kaito",
    handle: "@kaito_vault",
    shopName: "Kaito Card Master",
    submittedAt: "2025/5/05 19:10",
    docType: "駕駛執照",
    totalTrades: 8,
    rating: 3.9,
    status: "rejected",
  },
  {
    id: "KYC-2025-024",
    applicantName: "鄭 Ho-Yin",
    handle: "@hoyin_tcg",
    shopName: "Ho Yin TCG Station",
    submittedAt: "2025/5/05 09:25",
    docType: "商業登記證",
    totalTrades: 60,
    rating: 4.88,
    status: "approved",
  },
  {
    id: "KYC-2025-023",
    applicantName: "井上 Sakura",
    handle: "@sakura_poke",
    shopName: "Sakura Poke Boutique",
    submittedAt: "2025/5/04 15:40",
    docType: "日本護照",
    totalTrades: 33,
    rating: 4.78,
    status: "pending",
  },
  {
    id: "KYC-2025-022",
    applicantName: "郭 Tsz-Kin",
    handle: "@tszkin_vault",
    shopName: "Tsz Kin Card Vault",
    submittedAt: "2025/5/03 11:15",
    docType: "香港永久居民身份證",
    totalTrades: 84,
    rating: 4.95,
    status: "approved",
  },
];

// TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
// Target Table: audit_logs | View / RPC: list_admin_audit_logs
const initialAuditLogs: OverrideAuditLog[] = [
  {
    id: "LOG-881",
    adminEmail: "admin@hkcv.io",
    targetUser: "USR-0042 (KuroGamer TCG)",
    action: "強制封禁其 Stripe Connect 帳戶",
    reason: "收到 3 宗假卡舉報，暫停放款等待調查",
    timestamp: "2025/5/21 11:30",
  },
  {
    id: "LOG-880",
    adminEmail: "admin@hkcv.io",
    targetUser: "USR-0012 (Daichi Rare Cards)",
    action: "升級為 MERCHANT (商戶)",
    reason: "人工確認實體店營業執照無誤",
    timestamp: "2025/5/19 14:15",
  },
];

function AdminMerchantsContent({ tabParam }: { tabParam: string | null }) {
  const [activeTab, setActiveTab] = useState<"stripe" | "onboarding">(
    tabParam === "onboarding" ? "onboarding" : "stripe",
  );

  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  // Datasets State
  const [stripeRecords] = useState<StripeKycRecord[]>(initialStripeRecords);
  const [onboardingApps, setOnboardingApps] = useState<MerchantOnboardingApp[]>(
    initialOnboardingApps,
  );
  const [auditLogs, setAuditLogs] =
    useState<OverrideAuditLog[]>(initialAuditLogs);

  // Search & Filter State
  const [stripeSearch, setStripeSearch] = useState("");
  const [onboardingSearch, setOnboardingSearch] = useState("");
  const [onboardingFilter, setOnboardingFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >(tabParam === "onboarding" ? "pending" : "all");

  // Pagination State
  const [stripePage, setStripePage] = useState(1);
  const [onboardingPage, setOnboardingPage] = useState(1);
  const pageSize = 10;

  // Selection Checkboxes
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());

  // Security Override Lock State
  const [isOverrideLocked, setIsOverrideLocked] = useState(true);
  const [overrideTargetUser, setOverrideTargetUser] = useState("");
  const [overrideAction, setOverrideAction] =
    useState("升級為 MERCHANT (商戶)");
  const [overrideReason, setOverrideReason] = useState("");

  // ── Filtered Datasets ──────────────────────────────────────────────────────
  const filteredStripe = useMemo(() => {
    return stripeRecords.filter(
      (s) =>
        s.shopName.toLowerCase().includes(stripeSearch.toLowerCase()) ||
        s.handle.toLowerCase().includes(stripeSearch.toLowerCase()) ||
        s.stripeAccountId.toLowerCase().includes(stripeSearch.toLowerCase()),
    );
  }, [stripeRecords, stripeSearch]);

  const filteredOnboarding = useMemo(() => {
    return onboardingApps.filter((a) => {
      const matchesSearch =
        a.shopName.toLowerCase().includes(onboardingSearch.toLowerCase()) ||
        a.applicantName
          .toLowerCase()
          .includes(onboardingSearch.toLowerCase()) ||
        a.handle.toLowerCase().includes(onboardingSearch.toLowerCase()) ||
        a.id.toLowerCase().includes(onboardingSearch.toLowerCase());

      if (onboardingFilter === "all") return matchesSearch;
      return matchesSearch && a.status === onboardingFilter;
    });
  }, [onboardingApps, onboardingSearch, onboardingFilter]);

  // ── Paginated Datasets ──────────────────────────────────────────────────────
  const totalStripePages = Math.ceil(filteredStripe.length / pageSize) || 1;
  const paginatedStripe = useMemo(() => {
    const start = (stripePage - 1) * pageSize;
    return filteredStripe.slice(start, start + pageSize);
  }, [filteredStripe, stripePage, pageSize]);

  const totalOnboardingPages =
    Math.ceil(filteredOnboarding.length / pageSize) || 1;
  const paginatedOnboarding = useMemo(() => {
    const start = (onboardingPage - 1) * pageSize;
    return filteredOnboarding.slice(start, start + pageSize);
  }, [filteredOnboarding, onboardingPage, pageSize]);

  // ── Multi-select Handlers ──────────────────────────────────────────────────

  const toggleSelectAllApps = () => {
    if (selectedAppIds.size === filteredOnboarding.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredOnboarding.map((a) => a.id)));
    }
  };

  const toggleSelectAppRow = (id: string) => {
    const next = new Set(selectedAppIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAppIds(next);
  };

  // ── Onboarding Actions ─────────────────────────────────────────────────────
  const handleApproveApp = (id: string) => {
    setOnboardingApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "approved" as const } : a,
      ),
    );
    toast.success(`已批准申請 ${id}`, {
      description: "用戶已正式升級為商戶 (MERCHANT)",
    });
  };

  const handleRejectApp = (id: string) => {
    setOnboardingApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "rejected" as const } : a,
      ),
    );
    toast.warning(`已駁回申請 ${id}，已通知用戶重新補交資料。`);
  };

  const handleBatchApproveApps = () => {
    if (selectedAppIds.size === 0) return;
    setOnboardingApps((prev) =>
      prev.map((a) =>
        selectedAppIds.has(a.id) ? { ...a, status: "approved" } : a,
      ),
    );
    toast.success(`已批量批准 ${selectedAppIds.size} 筆商戶入駐申請！`);
    setSelectedAppIds(new Set());
  };

  // ── Override Actions ───────────────────────────────────────────────────────
  const handleExecuteOverride = () => {
    if (!overrideTargetUser.trim()) {
      toast.error("請輸入目標用戶 ID 或 Handle");
      return;
    }
    if (!overrideReason.trim()) {
      toast.error("強制執行特權覆寫時必須填寫『操作理由』以備審計");
      return;
    }

    const newLog: OverrideAuditLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      adminEmail: "admin@hkcv.io",
      targetUser: overrideTargetUser,
      action: overrideAction,
      reason: overrideReason,
      timestamp: new Date().toLocaleString("zh-TW", { hour12: false }),
    };

    setAuditLogs([newLog, ...auditLogs]);
    toast.success(`特權指令『${overrideAction}』已執行`, {
      description: "已存入 Audit Log",
    });
    setOverrideTargetUser("");
    setOverrideReason("");
  };

  const pendingCount = onboardingApps.filter(
    (a) => a.status === "pending",
  ).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div>
          <h1 className="font-sans font-bold text-[20px] text-text-primary">
            商戶與 KYC 審查
          </h1>
          <p className="font-sans text-[12px] text-text-secondary mt-0.5">
            管理 Stripe KYC 狀態、商戶提現證照人工複審、以及特殊權限變更覆寫控制
          </p>
        </div>

        {/* 
          ── Privilege Override Toggle Button (Standalone) ── 
        <button
          type="button"
          onClick={() => setIsOverrideOpen((prev) => !prev)}
          className={`shrink-0 flex items-center gap-2 h-9 px-3.5 rounded-xl font-sans text-xs font-semibold border transition-all active:scale-[0.98] ${
            isOverrideOpen
              ? "bg-warning text-[#17130f] border-warning shadow-md shadow-warning/10"
              : "bg-bg-elevated text-warning border-warning/20 hover:bg-[rgba(239,68,68,0.10)]"
          }`}
        >
          <span>⚠️</span>
          <span className="inline">權限覆寫</span>
          <span className="font-mono text-[10px]">
            {isOverrideLocked ? "🔒" : "🔓"}
          </span>
        </button>
          */}
      </div>

      {/* ── Full-Width Segmented Tab Selector ───────────────────────────────── */}
      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab("stripe")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "stripe"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">💳 Stripe 認證狀態</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {stripeRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("onboarding")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "onboarding"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">🪪 商戶入駐審核</span>
            {pendingCount > 0 && (
              <span className="font-mono text-[10px] bg-warning text-[#17130f] font-bold px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                {pendingCount} 待審
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOverrideOpen && (
          <>
            {/* Backdrop blur layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: "linear" }}
              className="fixed inset-0 z-60 bg-[#17130f]/90 backdrop-blur-sm"
              onClick={() => setIsOverrideOpen(false)}
              aria-hidden="true"
            />

            {/* Overlay window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.5,
                ease: "linear",
              }}
              className="fixed inset-0 z-[70] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[min(92vw,1100px)] sm:max-h-[min(85vh,800px)] sm:rounded-2xl bg-bg-card border border-[rgba(237,232,224,0.08)] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Overlay header */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[rgba(237,232,224,0.08)] bg-[rgba(239,68,68,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="text-warning text-[20px]">⚠️</span>
                  <h2 className="font-sans font-bold text-[16px] text-warning">
                    管理員特權覆寫面板
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOverrideOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                  aria-label="關閉"
                >
                  ✕
                </button>
              </div>

              {/* Overlay body */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Control Panel */}
                  <div className="bg-[rgba(239,68,68,0.04)] rounded-2xl border border-warning/20 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                        解鎖後可強制繞過標準 KYC
                        流程，直接修改用戶角色權限或封禁其 Stripe Connect
                        金流通道。**所有操作均會強制存入不可篡改的審計日誌
                        (Audit Log)。**
                      </p>

                      {/* Safety Lock Toggle Switch */}
                      <div className="bg-bg-card rounded-xl border border-[rgba(239,68,68,0.15)] p-4 flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-text-disabled uppercase block">
                            覆寫安全鎖狀態
                          </span>
                          <span
                            className={`font-sans font-bold text-[13px] ${isOverrideLocked ? "text-success" : "text-warning"}`}
                          >
                            {isOverrideLocked
                              ? "🔒 系統已安全鎖定"
                              : "🔓 已解除安全鎖"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOverrideLocked(!isOverrideLocked);
                            toast(
                              isOverrideLocked
                                ? "特權覆寫安全鎖已解除"
                                : "特權覆寫安全鎖已重新啟用",
                            );
                          }}
                          className={`h-9 px-3.5 font-sans font-semibold text-[11px] rounded-xl border transition-all active:scale-[0.98] ${
                            isOverrideLocked
                              ? "bg-[rgba(239,68,68,0.10)] text-warning border-warning/20 hover:bg-[rgba(239,68,68,0.15)]"
                              : "bg-success text-[#111] border-transparent hover:bg-success/90"
                          }`}
                        >
                          {isOverrideLocked ? "解除鎖定" : "重啟安全鎖"}
                        </button>
                      </div>

                      {/* Override Command Form */}
                      {!isOverrideLocked ? (
                        <div className="bg-bg-card rounded-xl border border-[rgba(237,232,224,0.12)] p-4 space-y-3 animate-fade-in">
                          <span className="font-sans font-bold text-[12px] text-text-primary block border-b border-[rgba(237,232,224,0.08)] pb-2">
                            執行特權覆寫指令
                          </span>
                          <div className="space-y-2.5">
                            <div>
                              <label className="font-mono text-[10px] text-text-disabled block mb-1">
                                目標用戶 (ID / Handle / Email)
                              </label>
                              <input
                                type="text"
                                placeholder="例: USR-0042 或 @kuro_gamer"
                                value={overrideTargetUser}
                                onChange={(e) =>
                                  setOverrideTargetUser(e.target.value)
                                }
                                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-lg px-3 font-mono text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                              />
                            </div>

                            <div>
                              <label className="font-mono text-[10px] text-text-disabled block mb-1">
                                特權指令類型
                              </label>
                              <select
                                value={overrideAction}
                                onChange={(e) =>
                                  setOverrideAction(e.target.value)
                                }
                                className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-lg px-2 font-sans text-xs text-text-primary focus:outline-none"
                              >
                                <option>升級為 MERCHANT (商戶)</option>
                                <option>降級為 USER (一般會員)</option>
                                <option>強制免 KYC 提現放行</option>
                                <option>強制封禁其 Stripe Connect 帳戶</option>
                                <option>重置 Stripe KYC 連結狀態</option>
                              </select>
                            </div>

                            <div>
                              <label className="font-mono text-[10px] text-text-disabled block mb-1">
                                操作理由 (必填 Audit Log 存檔)
                              </label>
                              <textarea
                                rows={2}
                                placeholder="請輸入本次人工覆寫的詳細理由..."
                                value={overrideReason}
                                onChange={(e) =>
                                  setOverrideReason(e.target.value)
                                }
                                className="w-full bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-lg p-2.5 font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleExecuteOverride}
                              className="w-full h-9 bg-warning text-[#17130f] font-sans font-bold text-xs rounded-lg active:scale-[0.98] hover:bg-warning/90 transition-all shadow-md shadow-warning/10"
                            >
                              🚀 執行特權覆寫指令
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-[rgba(237,232,224,0.06)] bg-bg-page text-center space-y-1">
                          <p className="font-sans text-xs text-text-disabled">
                            指令輸入框已隱藏
                          </p>
                          <p className="font-mono text-[10px] text-text-disabled">
                            請先點擊上方『解除鎖定』按鈕以進行覆寫操作
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Audit Log Table (Span 2 Cols) */}
                  <div className="lg:col-span-2 bg-bg-page rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-sans font-bold text-[14px] text-text-primary mb-1">
                        特權覆寫審計日誌 (Audit Logs)
                      </h3>
                      <p className="font-sans text-[11px] text-text-secondary mb-3">
                        不可篡改的全站管理員操作歷史軌跡
                      </p>

                      <div className="rounded-xl border border-[rgba(237,232,224,0.08)] overflow-x-scroll no-scrollbar">
                        <Table>
                          <TableHeader className="bg-bg-elevated/50">
                            <TableRow className="border-b border-[rgba(237,232,224,0.08)]">
                              <TableHead className="font-mono text-[11px] text-text-secondary h-9">
                                日誌編號
                              </TableHead>
                              <TableHead className="font-sans text-[11px] text-text-secondary h-9">
                                管理員
                              </TableHead>
                              <TableHead className="font-mono text-[11px] text-text-secondary h-9">
                                目標用戶
                              </TableHead>
                              <TableHead className="font-sans text-[11px] text-text-secondary h-9">
                                特權動作
                              </TableHead>
                              <TableHead className="font-sans text-[11px] text-text-secondary h-9">
                                操作理由
                              </TableHead>
                              <TableHead className="font-mono text-[11px] text-text-secondary h-9 text-right">
                                時間
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.map((log) => (
                              <TableRow
                                key={log.id}
                                className="border-b border-[rgba(237,232,224,0.06)] hover:bg-bg-elevated/30"
                              >
                                <TableCell className="font-mono text-[10px] text-text-disabled py-2.5">
                                  #{log.id}
                                </TableCell>
                                <TableCell className="font-mono text-[11px] text-text-secondary py-2.5 whitespace-nowrap">
                                  {log.adminEmail}
                                </TableCell>
                                <TableCell className="font-mono text-[11px] text-brand font-bold py-2.5 whitespace-nowrap">
                                  {log.targetUser}
                                </TableCell>
                                <TableCell className="font-sans text-[11px] text-warning font-semibold py-2.5 whitespace-nowrap">
                                  {log.action}
                                </TableCell>
                                <TableCell className="font-sans text-[11px] text-text-primary py-2.5 max-w-[200px] truncate">
                                  {log.reason}
                                </TableCell>
                                <TableCell className="font-mono text-[10px] text-text-disabled text-right py-2.5 whitespace-nowrap">
                                  {log.timestamp}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Data Table Container (Full Height Flex) ────────────────── */}
      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        {/* ── TAB 1: Stripe認證狀態 Data Table ─────────────────────────── */}
        {activeTab === "stripe" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Toolbar: Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="搜尋店舖名稱、Handle 或 Stripe ID..."
                  value={stripeSearch}
                  onChange={(e) => {
                    setStripeSearch(e.target.value);
                    setStripePage(1);
                  }}
                  className="w-full h-9 pl-9 pr-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-2.5 text-text-disabled"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                  <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="w-10 text-center"></TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      商戶店舖名稱
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      用戶 Handle
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      Stripe Account ID
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                      Stripe KYC 狀態
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                      提現權限
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      成交筆數 / 評分
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      最後更新時間
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStripe.map((s) => {
                    return (
                      <TableRow
                        key={s.id}
                        className={`border-b border-[rgba(237,232,224,0.06)] transition-colors`}
                      >
                        <TableCell className="w-10 text-center py-3"></TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {s.shopName}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-text-secondary py-3 whitespace-nowrap">
                          {s.handle}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {s.stripeAccountId}
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${
                              s.kycStatus === "verified"
                                ? "text-success bg-[rgba(16,185,129,0.12)] border-success/20"
                                : s.kycStatus === "pending"
                                  ? "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20"
                                  : "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20"
                            }`}
                          >
                            {s.kycStatus === "verified"
                              ? "已驗證 (VERIFIED)"
                              : s.kycStatus === "pending"
                                ? "待驗證"
                                : "已限制 (RESTRICTED)"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${
                              s.payoutStatus === "enabled"
                                ? "text-success bg-[rgba(16,185,129,0.12)] border-success/20"
                                : "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20"
                            }`}
                          >
                            {s.payoutStatus === "enabled" ? "已啟用" : "已暫停"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-text-primary text-right py-3 whitespace-nowrap">
                          {s.totalTrades} 筆 · ★ {s.rating}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled text-right py-3 whitespace-nowrap">
                          {s.updatedAt}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── Stripe Table Pagination ─────────────────────────────────── */}
            {filteredStripe.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
                <div className="font-mono text-[12px] text-text-secondary">
                  顯示第{" "}
                  <span className="font-bold text-text-primary">
                    {(stripePage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-text-primary">
                    {Math.min(stripePage * pageSize, filteredStripe.length)}
                  </span>{" "}
                  筆，共{" "}
                  <span className="font-bold text-brand">
                    {filteredStripe.length}
                  </span>{" "}
                  筆資料
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={stripePage === 1}
                    onClick={() =>
                      setStripePage((prev) => Math.max(prev - 1, 1))
                    }
                    className="h-8 px-2.5 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上一頁
                  </button>
                  {Array.from(
                    { length: totalStripePages },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStripePage(p)}
                      className={`h-8 w-8 rounded-lg font-mono text-xs font-semibold transition-all ${
                        stripePage === p
                          ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                          : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={stripePage === totalStripePages}
                    onClick={() =>
                      setStripePage((prev) =>
                        Math.min(prev + 1, totalStripePages),
                      )
                    }
                    className="h-8 px-2.5 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: 商戶入駐審核 Data Table ─────────────────────────────── */}
        {activeTab === "onboarding" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Toolbar: Search + Filter Tabs + Batch Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="搜尋申請人、店舖名稱..."
                    value={onboardingSearch}
                    onChange={(e) => {
                      setOnboardingSearch(e.target.value);
                      setOnboardingPage(1);
                    }}
                    className="w-full h-9 pl-9 pr-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                  />
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="absolute left-3 top-2.5 text-text-disabled"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#17130f] p-1 rounded-xl border border-[rgba(237,232,224,0.08)]">
                  {(["all", "pending", "approved", "rejected"] as const).map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setOnboardingFilter(filter);
                          setOnboardingPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-sans text-[11px] transition-colors ${
                          onboardingFilter === filter
                            ? "bg-bg-elevated text-brand font-semibold"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {filter === "all"
                          ? "全部"
                          : filter === "pending"
                            ? "待審核"
                            : filter === "approved"
                              ? "已批准"
                              : "已拒絕"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Batch Action Toolbar */}
              {selectedAppIds.size > 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                    已選 {selectedAppIds.size} 筆
                  </span>
                  <button
                    onClick={handleBatchApproveApps}
                    className="h-9 px-3.5 bg-success text-[#111] font-sans font-bold text-xs rounded-xl hover:bg-success/90 transition-transform whitespace-nowrap shadow-md shadow-success/10"
                  >
                    ✓ 批量批准升級
                  </button>
                </div>
              )}
            </div>

            {/* Data Table */}
            <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                  <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredOnboarding.length > 0 &&
                          selectedAppIds.size === filteredOnboarding.length
                        }
                        onChange={toggleSelectAllApps}
                        className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      申請單號
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      店舖名稱
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      申請人 / Handle
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      提交證件類別
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      歷史成交 / 評分
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      提交時間
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                      審核狀態
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOnboarding.map((app) => {
                    const isSelected = selectedAppIds.has(app.id);
                    const isPending = app.status === "pending";
                    return (
                      <TableRow
                        key={app.id}
                        className={`border-b border-[rgba(237,232,224,0.06)] transition-colors ${
                          isSelected
                            ? "bg-[rgba(212,165,116,0.08)]"
                            : "hover:bg-bg-elevated/40"
                        }`}
                      >
                        <TableCell className="w-10 text-center py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectAppRow(app.id)}
                            className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3">
                          #{app.id}
                        </TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {app.shopName}
                        </TableCell>
                        <TableCell className="font-sans text-[12px] text-text-secondary py-3 whitespace-nowrap">
                          {app.applicantName}{" "}
                          <span className="font-mono text-[10px] text-text-disabled">
                            ({app.handle})
                          </span>
                        </TableCell>
                        <TableCell className="font-sans text-[12px] text-text-primary py-3 whitespace-nowrap">
                          {app.docType}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-text-primary text-right py-3 whitespace-nowrap">
                          {app.totalTrades} 筆 · ★ {app.rating}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {app.submittedAt}
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${
                              app.status === "pending"
                                ? "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20"
                                : app.status === "approved"
                                  ? "text-success bg-[rgba(16,185,129,0.12)] border-success/20"
                                  : "text-text-secondary bg-bg-elevated border-transparent"
                            }`}
                          >
                            {app.status === "pending"
                              ? "待審核"
                              : app.status === "approved"
                                ? "已批准"
                                : "已拒絕"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3 whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                toast.info(
                                  `正在讀取 ${app.id} 證件檔案 (${app.docType})...`,
                                )
                              }
                              className="h-7 px-2 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary font-mono text-[10px] rounded-lg transition-colors"
                            >
                              📄 證照
                            </button>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveApp(app.id)}
                                  className="h-7 px-2.5 bg-success text-[#111] font-sans font-bold text-[10px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform"
                                >
                                  ✓ 批准
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectApp(app.id)}
                                  className="h-7 px-2.5 bg-[rgba(239,68,68,0.10)] text-warning font-mono text-[10px] rounded-lg border border-warning/20 hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.98] transition-transform"
                                >
                                  ✕ 駁回
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── Onboarding Table Pagination ─────────────────────────────── */}
            {filteredOnboarding.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
                <div className="font-mono text-[12px] text-text-secondary">
                  顯示第{" "}
                  <span className="font-bold text-text-primary">
                    {(onboardingPage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-text-primary">
                    {Math.min(
                      onboardingPage * pageSize,
                      filteredOnboarding.length,
                    )}
                  </span>{" "}
                  筆，共{" "}
                  <span className="font-bold text-brand">
                    {filteredOnboarding.length}
                  </span>{" "}
                  筆資料
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={onboardingPage === 1}
                    onClick={() =>
                      setOnboardingPage((prev) => Math.max(prev - 1, 1))
                    }
                    className="h-8 px-2.5 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上一頁
                  </button>
                  {Array.from(
                    { length: totalOnboardingPages },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOnboardingPage(p)}
                      className={`h-8 w-8 rounded-lg font-mono text-xs font-semibold transition-all ${
                        onboardingPage === p
                          ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                          : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={onboardingPage === totalOnboardingPages}
                    onClick={() =>
                      setOnboardingPage((prev) =>
                        Math.min(prev + 1, totalOnboardingPages),
                      )
                    }
                    className="h-8 px-2.5 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MerchantsPageContentWithKey() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  return (
    <AdminMerchantsContent key={tabParam || "default"} tabParam={tabParam} />
  );
}

export default function AdminMerchantsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-text-secondary font-mono text-xs">
          載入商戶資料中...
        </div>
      }
    >
      <MerchantsPageContentWithKey />
    </Suspense>
  );
}
