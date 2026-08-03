"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { listAdminPlatformUsers } from "@/app/actions/admin-user-control";
import {
  formatPlatformUserKycLabel,
} from "@/lib/admin-user-control/format";
import type {
  PlatformUserKycFilter,
  PlatformUserPage,
  PlatformUserType,
} from "@/lib/admin-user-control/types";
import {
  EMPTY_PLATFORM_USER_KYC_COUNTS,
  PLATFORM_USERS_PAGE_SIZE,
} from "@/lib/admin-user-control/types";
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

interface OverrideAuditLog {
  id: string;
  adminEmail: string;
  targetUser: string;
  action: string;
  reason: string;
  timestamp: string;
}

// TODO: [Supabase Wiring] audit_logs persistence deferred
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

type AdminUserControlClientProps = {
  initialPage: PlatformUserPage;
  loadError: string | null;
};

function emptyPlatformUserPage(): PlatformUserPage {
  return {
    rows: [],
    total: 0,
    page: 1,
    pageSize: PLATFORM_USERS_PAGE_SIZE,
    totalPages: 0,
    kycCounts: { ...EMPTY_PLATFORM_USER_KYC_COUNTS },
    typeCounts: { member: 0, merchant: 0 },
  };
}

export default function AdminUserControlClient({
  initialPage,
  loadError,
}: AdminUserControlClientProps) {
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [pageData, setPageData] = useState<PlatformUserPage>(initialPage);
  const [listError, setListError] = useState<string | null>(loadError);
  const [isRefreshing, startRefresh] = useTransition();

  const [auditLogs, setAuditLogs] =
    useState<OverrideAuditLog[]>(initialAuditLogs);
  const [nextLogId, setNextLogId] = useState(882);

  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<PlatformUserKycFilter>("pending");
  const [userTypeFilter, setUserTypeFilter] = useState<{
    member: boolean;
    merchant: boolean;
  }>({ member: true, merchant: true });

  const [page, setPage] = useState(initialPage.page);
  const pageSize = PLATFORM_USERS_PAGE_SIZE;

  const [isOverrideLocked, setIsOverrideLocked] = useState(true);
  const [overrideTargetUser, setOverrideTargetUser] = useState("");
  const [overrideAction, setOverrideAction] =
    useState("升級為 MERCHANT (商戶)");
  const [overrideReason, setOverrideReason] = useState("");

  const resolveUserTypes = useCallback((): PlatformUserType[] => {
    const types: PlatformUserType[] = [];
    if (userTypeFilter.member) {
      types.push("member");
    }
    if (userTypeFilter.merchant) {
      types.push("merchant");
    }
    return types;
  }, [userTypeFilter]);

  const effectiveSearch = debouncedUserSearch;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [userSearch]);

  const refreshUsers = useCallback(
    (nextPage: number) => {
      startRefresh(async () => {
        const result = await listAdminPlatformUsers({
          page: nextPage,
          pageSize,
          search: effectiveSearch || undefined,
          userTypes: resolveUserTypes(),
          kycFilter,
        });

        if (!result.success) {
          setListError(result.error);
          setPageData(emptyPlatformUserPage());
          return;
        }

        setListError(null);
        setPageData(result.data);
        setPage(result.data.page);
      });
    },
    [effectiveSearch, kycFilter, pageSize, resolveUserTypes],
  );

  const skipInitialRefresh = useRef(true);

  useEffect(() => {
    if (skipInitialRefresh.current) {
      skipInitialRefresh.current = false;
      return;
    }
    refreshUsers(page);
  }, [page, kycFilter, userTypeFilter, debouncedUserSearch, refreshUsers]);

  const typeCounts = pageData.typeCounts;
  const kycCounts = pageData.kycCounts;
  const paginatedUsers = pageData.rows;
  const filteredTotal = pageData.total;
  const totalPages = pageData.totalPages || 1;
  const safePage = Math.min(page, totalPages);
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

  const handleFilterChange = (filter: PlatformUserKycFilter) => {
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

      {listError ? <p>{listError}</p> : null}

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
                  ] as { key: PlatformUserKycFilter; label: string }[]
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
                  <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                    操作
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
                        {u.handle}
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
                            {formatPlatformUserKycLabel(u.kycStatus)}
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
                      <TableCell className="text-right py-3 whitespace-nowrap">
                        {u.kycStatus === "pending" && u.applicationId ? (
                          <Link
                            href={`/admin/merchants?applicationId=${u.applicationId}`}
                            className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap inline-flex items-center"
                          >
                            審核 KYC
                          </Link>
                        ) : (
                          <span className="font-mono text-[11px] text-text-disabled">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {paginatedUsers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
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
          {filteredTotal > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
              <div className="font-mono text-[12px] text-text-secondary">
                顯示第{" "}
                <span className="font-bold text-text-primary">
                  {(safePage - 1) * pageSize + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-text-primary">
                  {Math.min(safePage * pageSize, filteredTotal)}
                </span>{" "}
                筆，共{" "}
                <span className="font-bold text-brand">
                  {filteredTotal}
                </span>{" "}
                筆資料
                {isRefreshing ? "（更新中…）" : ""}
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
