"use client";

import { useState, useMemo } from "react";
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

// 通過 Stripe KYC 即自動 trigger webhook 註冊商戶，故毋須人工入駐審核流程。

// ── Types Definitions ────────────────────────────────────────────────────────
type PlatformUserType = "member" | "merchant";

interface PlatformUserRecord {
  id: string;
  userType: PlatformUserType;
  /**
   * 統一顯示名稱：會員 = 顯示名；商戶 = 店舖名。
   */
  name: string;
  handle: string;
  email: string;
  stripeAccountId: string | null;
  kycStatus: "verified" | "pending" | "rejected" | null;
  updatedAt: string;
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
// Target Table: profiles, kyc_records | View / RPC: list_platform_users
const initialPlatformUsers: PlatformUserRecord[] = [
  // ── Merchants (保留現有資料，userType 標記為 merchant) ──
  {
    id: "M-001",
    userType: "merchant",
    name: "HarutoCards Premium",
    handle: "haruto_tcg",
    email: "contact@harutocards.hk",
    stripeAccountId: "acct_1NfG82H",
    kycStatus: "verified",
    updatedAt: "2025/5/21 14:00",
  },
  {
    id: "M-002",
    userType: "merchant",
    name: "AikoRare Collection",
    handle: "aiko_collector",
    email: "contact@aikorare.hk",
    stripeAccountId: "acct_1MeF83J",
    kycStatus: "verified",
    updatedAt: "2025/5/20 11:20",
  },
  {
    id: "M-003",
    userType: "merchant",
    name: "Daichi Rare Cards",
    handle: "daichi_rare",
    email: "contact@daichirare.hk",
    stripeAccountId: "acct_1KyT92K",
    kycStatus: "verified",
    updatedAt: "2025/5/19 18:05",
  },
  {
    id: "M-004",
    userType: "merchant",
    name: "KuroGamer TCG",
    handle: "kuro_gamer",
    email: "contact@kurogamer.hk",
    stripeAccountId: "acct_1PzX44L",
    kycStatus: "rejected",
    updatedAt: "2025/5/18 09:12",
  },
  {
    id: "M-005",
    userType: "merchant",
    name: "TokyoRare_HongKong",
    handle: "tokyo_rare_hk",
    email: "contact@tokyorarehk.hk",
    stripeAccountId: "acct_1QmA99M",
    kycStatus: "pending",
    updatedAt: "2025/5/17 16:30",
  },
  {
    id: "M-006",
    userType: "merchant",
    name: "Osaka_PokeMaster",
    handle: "osaka_pokemaster",
    email: "contact@osakapokemaster.hk",
    stripeAccountId: "acct_1RnB88N",
    kycStatus: "verified",
    updatedAt: "2025/5/17 10:15",
  },
  {
    id: "M-007",
    userType: "merchant",
    name: "KyotoVault_Studio",
    handle: "kyotovault",
    email: "contact@kyotovault.hk",
    stripeAccountId: "acct_1SoC77O",
    kycStatus: "verified",
    updatedAt: "2025/5/16 20:40",
  },
  {
    id: "M-008",
    userType: "merchant",
    name: "Fukuoka_TCG_Hub",
    handle: "fukuoka_hub",
    email: "contact@fukuokatcghub.hk",
    stripeAccountId: "acct_1TpD66P",
    kycStatus: "pending",
    updatedAt: "2025/5/16 14:00",
  },
  {
    id: "M-009",
    userType: "merchant",
    name: "Sapporo_Rare_Studio",
    handle: "sappororare",
    email: "contact@sappororare.hk",
    stripeAccountId: "acct_1UqE55Q",
    kycStatus: "rejected",
    updatedAt: "2025/5/15 18:25",
  },
  {
    id: "M-010",
    userType: "merchant",
    name: "Nagoya_Card_Base",
    handle: "nagoyabase",
    email: "contact@nagoyabase.hk",
    stripeAccountId: "acct_1VrF44R",
    kycStatus: "verified",
    updatedAt: "2025/5/15 12:10",
  },
  {
    id: "M-011",
    userType: "merchant",
    name: "Kobe_Collectors_HK",
    handle: "kobe_hk",
    email: "contact@kobecollectors.hk",
    stripeAccountId: "acct_1WsG33S",
    kycStatus: "verified",
    updatedAt: "2025/5/14 21:50",
  },
  {
    id: "M-012",
    userType: "merchant",
    name: "Yokohama_Rare_Vault",
    handle: "yokohama_vault",
    email: "contact@yokohamararevault.hk",
    stripeAccountId: "acct_1XtH22T",
    kycStatus: "verified",
    updatedAt: "2025/5/14 11:30",
  },
  {
    id: "M-013",
    userType: "merchant",
    name: "Sendai_Poke_Corner",
    handle: "sendai_poke",
    email: "contact@sendaipokecorner.hk",
    stripeAccountId: "acct_1YuI11U",
    kycStatus: "pending",
    updatedAt: "2025/5/13 17:05",
  },
  {
    id: "M-014",
    userType: "merchant",
    name: "Hiroshima_TCG_Store",
    handle: "hiroshima_tcg",
    email: "contact@hiroshimatcg.hk",
    stripeAccountId: "acct_1ZvJ00V",
    kycStatus: "verified",
    updatedAt: "2025/5/13 09:40",
  },
  {
    id: "M-015",
    userType: "merchant",
    name: "Chiba_Poke_Outlet",
    handle: "chiba_poke",
    email: "contact@chibapokeoutlet.hk",
    stripeAccountId: "acct_2AkK99W",
    kycStatus: "verified",
    updatedAt: "2025/5/12 16:15",
  },
  {
    id: "M-016",
    userType: "merchant",
    name: "Saitama_Card_Center",
    handle: "saitamacard",
    email: "contact@saitamacardcenter.hk",
    stripeAccountId: "acct_2BlL88X",
    kycStatus: "rejected",
    updatedAt: "2025/5/11 22:00",
  },
  {
    id: "M-017",
    userType: "merchant",
    name: "Nara_Legend_Vault",
    handle: "naralegend",
    email: "contact@naralegendvault.hk",
    stripeAccountId: "acct_2CmM77Y",
    kycStatus: "verified",
    updatedAt: "2025/5/11 13:20",
  },
  {
    id: "M-018",
    userType: "merchant",
    name: "Shizuoka_Gold_Cards",
    handle: "shizuokagold",
    email: "contact@shizuokagoldcards.hk",
    stripeAccountId: "acct_2DnN66Z",
    kycStatus: "verified",
    updatedAt: "2025/5/10 18:45",
  },

  // ── Members (一般會員；部分模擬申請成為商戶，kycStatus 為 pending) ──
  {
    id: "U-001",
    userType: "member",
    name: "陳子健",
    handle: "kin_tcg",
    email: "kin.tcg@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/21 10:15",
  },
  {
    id: "U-002",
    userType: "member",
    name: "林嘉欣",
    handle: "karen_collects",
    email: "karen.collects@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/20 22:40",
  },
  {
    id: "U-003",
    userType: "member",
    name: "中田裕介",
    handle: "yusuke_tcg",
    email: "yusuke.jp@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/20 19:05",
  },
  {
    id: "U-004",
    userType: "member",
    name: "黃少琪",
    handle: "siu_kei_vault",
    email: "siu.kei@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/19 16:30",
  },
  {
    id: "U-005",
    userType: "member",
    name: "佐藤美咲",
    handle: "misaki_cards",
    email: "misaki.cards@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/19 09:20",
  },
  {
    id: "U-006",
    userType: "member",
    name: "王思穎",
    handle: "sze_wing_hk",
    email: "sze.wing@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/18 23:10",
  },
  {
    id: "U-007",
    userType: "member",
    name: "李浩文",
    handle: "howard_tcg_hk",
    email: "howard.li@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/18 14:45",
  },
  {
    id: "U-008",
    userType: "member",
    name: "張曉嵐",
    handle: "hiu_laan_xd",
    email: "hiu.laan@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/17 21:55",
  },
  {
    id: "U-009",
    userType: "member",
    name: "渡邊健太",
    handle: "watanabe_kenta",
    email: "kenta.w@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/17 08:00",
  },
  {
    id: "U-010",
    userType: "member",
    name: "周詠彤",
    handle: "tung_tcg",
    email: "tung.chow@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/16 17:35",
  },
  {
    id: "U-011",
    userType: "member",
    name: "吳家豪",
    handle: "ka_ho_nw",
    email: "ka.ho.ng@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/16 11:10",
  },
  {
    id: "U-012",
    userType: "member",
    name: "鄭穎琳",
    handle: "wing_lam_tcg",
    email: "wing.lam@example.hk",
    stripeAccountId: null,
    kycStatus: "pending",
    updatedAt: "2025/5/15 15:00",
  },
  {
    id: "U-013",
    userType: "member",
    name: "高橋翔太",
    handle: "shota_takahashi",
    email: "shota.t@example.hk",
    stripeAccountId: null,
    kycStatus: "pending",
    updatedAt: "2025/5/15 10:25",
  },
  {
    id: "U-014",
    userType: "member",
    name: "馮芷晴",
    handle: "chi_ching_fung",
    email: "chi.ching@example.hk",
    stripeAccountId: null,
    kycStatus: "pending",
    updatedAt: "2025/5/14 18:50",
  },
  {
    id: "U-015",
    userType: "member",
    name: "梁俊彥",
    handle: "chun_yin_leung",
    email: "chun.yin@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/14 09:05",
  },
  {
    id: "U-016",
    userType: "member",
    name: "山本綾香",
    handle: "ayaka_yamamoto",
    email: "ayaka.y@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/13 20:15",
  },
  {
    id: "U-017",
    userType: "member",
    name: "許家榮",
    handle: "ka_wing_hui",
    email: "ka.wing.hui@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/13 13:40",
  },
  {
    id: "U-018",
    userType: "member",
    name: "羅敏儀",
    handle: "man_yee_lo",
    email: "man.yee@example.hk",
    stripeAccountId: null,
    kycStatus: null,
    updatedAt: "2025/5/12 16:55",
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

export default function AdminUserControlPage() {
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  // Datasets State
  const [platformUsers] = useState<PlatformUserRecord[]>(initialPlatformUsers);
  const [auditLogs, setAuditLogs] =
    useState<OverrideAuditLog[]>(initialAuditLogs);
  const [nextLogId, setNextLogId] = useState(882);

  // Search & Filter State
  const [userSearch, setUserSearch] = useState("");
  type KycFilter = "all" | "pending" | "verified" | "rejected";
  const [kycFilter, setKycFilter] = useState<KycFilter>("pending");
  const [userTypeFilter, setUserTypeFilter] = useState<{
    member: boolean;
    merchant: boolean;
  }>({ member: true, merchant: true });

  // Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Security Override Lock State
  const [isOverrideLocked, setIsOverrideLocked] = useState(true);
  const [overrideTargetUser, setOverrideTargetUser] = useState("");
  const [overrideAction, setOverrideAction] =
    useState("升級為 MERCHANT (商戶)");
  const [overrideReason, setOverrideReason] = useState("");

  // ── Type Counts ────────────────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    return {
      member: platformUsers.filter((u) => u.userType === "member").length,
      merchant: platformUsers.filter((u) => u.userType === "merchant").length,
    };
  }, [platformUsers]);

  // ── Records filtered by userType only (used for KYC pill counts) ───────────
  const typeFilteredUsers = useMemo(() => {
    return platformUsers.filter((u) => userTypeFilter[u.userType]);
  }, [platformUsers, userTypeFilter]);

  // ── Filter Counts (driven by current userType selection) ───────────────────
  const kycCounts = useMemo(() => {
    const base = typeFilteredUsers;
    return {
      all: base.length,
      pending: base.filter((u) => u.kycStatus === "pending").length,
      verified: base.filter((u) => u.kycStatus === "verified").length,
      rejected: base.filter((u) => u.kycStatus === "rejected").length,
    };
  }, [typeFilteredUsers]);

  // ── Filtered & Paginated Platform Users ────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (!userTypeFilter.member && !userTypeFilter.merchant) {
      return [];
    }

    const matchesType = (u: PlatformUserRecord) => userTypeFilter[u.userType];

    const matchesKyc =
      kycFilter === "all"
        ? () => true
        : (u: PlatformUserRecord) => u.kycStatus === kycFilter;

    const q = userSearch.toLowerCase().trim();

    return platformUsers.filter((u) => {
      if (!matchesType(u)) return false;
      if (!matchesKyc(u)) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.stripeAccountId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [platformUsers, userTypeFilter, kycFilter, userSearch]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  // 防禦：篩選後資料量縮減時自動收斂頁碼，避免停留在超出範圍的空白頁。
  // 以 render 期推導取代 useEffect + setPage，省去一次額外 re-render。
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, safePage]);

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
      id: `LOG-${String(nextLogId).padStart(3, "0")}`,
      adminEmail: "admin@hkcv.io",
      targetUser: overrideTargetUser,
      action: overrideAction,
      reason: overrideReason,
      timestamp: new Date().toLocaleString("zh-TW", { hour12: false }),
    };

    setAuditLogs([newLog, ...auditLogs]);
    setNextLogId((prev) => prev + 1);
    toast.success(`特權指令『${overrideAction}』已執行`, {
      description: "已存入 Audit Log",
    });
    setOverrideTargetUser("");
    setOverrideReason("");
  };

  const resetPagination = () => setPage(1);

  const handleSearchChange = (value: string) => {
    setUserSearch(value);
    resetPagination();
  };

  const handleFilterChange = (filter: KycFilter) => {
    setKycFilter(filter);
    resetPagination();
  };

  const handleUserTypeToggle = (type: PlatformUserType) => {
    setUserTypeFilter((prev) => ({ ...prev, [type]: !prev[type] }));
    resetPagination();
  };

  const renderCheckboxOption = (
    key: string,
    label: string,
    count: number,
    isActive: boolean,
    onToggle: () => void,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2.5 text-left py-1 group/item"
    >
      <div
        className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
          isActive
            ? "bg-brand border-brand"
            : "border-[rgba(237,232,224,0.20)] group-hover/item:border-brand/50"
        }`}
      >
        {isActive && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1612"
            strokeWidth="3.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span
        className={`font-sans text-[12px] transition-colors ${
          isActive
            ? "text-text-primary font-medium"
            : "text-text-secondary group-hover/item:text-text-primary"
        }`}
      >
        {label} ({count})
      </span>
    </button>
  );

  const isTypeFilterEmpty =
    !userTypeFilter.member && !userTypeFilter.merchant;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-100px)] space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div>
          <h1 className="font-sans font-bold text-[20px] text-text-primary">
            用戶管理
          </h1>
          <p className="font-sans text-[12px] text-text-secondary mt-0.5">
            管理全平台會員與認證商戶帳號、Stripe KYC 認證狀態
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
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
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
        {/* ── Platform Users Data Table ─────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Toolbar: Search + Type Checkboxes + Filter Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="搜尋名稱、Handle、電郵或 Stripe ID..."
                  value={userSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
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

              {/* User Type Checkboxes */}
              <div className="flex items-center gap-4 bg-[#17130f] px-3 py-1.5 rounded-xl border border-[rgba(237,232,224,0.08)]">
                {renderCheckboxOption(
                  "member",
                  "會員",
                  typeCounts.member,
                  userTypeFilter.member,
                  () => handleUserTypeToggle("member"),
                )}
                {renderCheckboxOption(
                  "merchant",
                  "商戶",
                  typeCounts.merchant,
                  userTypeFilter.merchant,
                  () => handleUserTypeToggle("merchant"),
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-[#17130f] p-1 rounded-xl border border-[rgba(237,232,224,0.08)]">
                {(
                  [
                    { key: "all", label: "全部" },
                    { key: "pending", label: "待審核" },
                    { key: "verified", label: "已認證" },
                    { key: "rejected", label: "已拒絕" },
                  ] as { key: KycFilter; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange(key)}
                    className={`min-h-[44px] px-3 py-1 rounded-lg font-sans text-[11px] transition-colors ${
                      kycFilter === key
                        ? "bg-bg-elevated text-brand font-semibold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {label} ({kycCounts[key]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
            <Table>
              <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                  <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                    名稱
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    Handle
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    電郵
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    Stripe ID
                  </TableHead>
                  <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                    Stripe KYC 狀態
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                    Last Update
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((u) => {
                  const typeLabel = u.userType === "member" ? "會員" : "商戶";
                  const typeChipClasses =
                    u.userType === "member"
                      ? "bg-bg-hover text-text-secondary border border-[rgba(237,232,224,0.12)]"
                      : "bg-brand/15 text-brand border border-brand/30";

                  return (
                    <TableRow
                      key={u.id}
                      className="border-b border-[rgba(237,232,224,0.06)] transition-colors"
                    >
                      <TableCell className="py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-md shrink-0 ${typeChipClasses}`}
                          >
                            {typeLabel}
                          </span>
                          <span className="font-sans font-semibold text-[13px] text-text-primary truncate max-w-[180px] sm:max-w-[220px]">
                            {u.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-text-secondary py-3 whitespace-nowrap">
                        @{u.handle}
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span
                          className="font-mono text-[11px] text-text-secondary truncate max-w-[160px] sm:max-w-[220px] block"
                          title={u.email}
                        >
                          {u.email}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        {u.stripeAccountId ? (
                          <span
                            className="font-mono text-[11px] text-text-disabled truncate max-w-[120px] block"
                            title={u.stripeAccountId}
                          >
                            {u.stripeAccountId}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-text-disabled">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3 whitespace-nowrap">
                        {u.kycStatus ? (
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${
                              u.kycStatus === "verified"
                                ? "text-success bg-[rgba(16,185,129,0.12)] border-success/20"
                                : u.kycStatus === "pending"
                                  ? "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20"
                                  : "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20"
                            }`}
                          >
                            {u.kycStatus === "verified"
                              ? "已認證"
                              : u.kycStatus === "pending"
                                ? "待審核"
                                : "已拒絕"}
                          </span>
                        ) : (
                          <span className="inline-block font-mono text-[9px] px-2 py-0.5 rounded border bg-bg-hover text-text-secondary border-[rgba(237,232,224,0.12)]">
                            未申請
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-disabled text-right py-3 whitespace-nowrap">
                        {u.updatedAt}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paginatedUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 align-middle"
                    >
                      <p className="font-sans text-[13px] text-text-secondary">
                        {isTypeFilterEmpty
                          ? "請至少選擇一種用戶類型以顯示名單。"
                          : "沒有符合篩選條件的用戶記錄。"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Users Table Pagination ─────────────────────────────────── */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
              <div className="font-mono text-[12px] text-text-secondary">
                顯示第{" "}
                <span className="font-bold text-text-primary">
                  {(safePage - 1) * pageSize + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-text-primary">
                  {Math.min(safePage * pageSize, filteredUsers.length)}
                </span>{" "}
                筆，共{" "}
                <span className="font-bold text-brand">
                  {filteredUsers.length}
                </span>{" "}
                筆資料
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setPage(Math.max(safePage - 1, 1))}
                  className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100"
                >
                  上一頁
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
                        safePage === p
                          ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                          : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(Math.min(safePage + 1, totalPages))}
                  className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
