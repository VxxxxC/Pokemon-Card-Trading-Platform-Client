"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  getKycDocumentSignedUrl,
  getStripePayoutBankSummary,
  retryKycProvisioning,
  reviewKycApplication,
  type AdminKycApplicationListItem,
} from "@/app/actions/admin-kyc";
import type { StripeAccountPayoutSummary } from "@/lib/stripe/account-summary";
import { KYC_DOCUMENT_TYPE_LABELS } from "@/lib/kyc/documents";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "全部",
  pending: "待審核",
  approved: "已批准",
  rejected: "已拒絕",
};

const PAGE_SIZE = 10;

function formatHandle(
  shopHandle: string | null,
  applicantUsername: string | null,
): string {
  const handle = shopHandle?.trim() || applicantUsername?.trim();
  if (!handle) return "—";
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-HK", { hour12: false });
}

function statusBadgeClasses(
  status: AdminKycApplicationListItem["status"],
): string {
  if (status === "approved") {
    return "text-success bg-[rgba(16,185,129,0.12)] border-success/20";
  }
  if (status === "pending") {
    return "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20";
  }
  return "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20";
}

function statusLabel(status: AdminKycApplicationListItem["status"]): string {
  if (status === "approved") return "已批准";
  if (status === "pending") return "待審核";
  return "已拒絕";
}

function StripePayoutPopover({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<StripeAccountPayoutSummary | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadSummary() {
    setLoading(true);
    setLoadError(null);
    const result = await getStripePayoutBankSummary(applicationId);
    setLoading(false);
    if (result.success) {
      setSummary(result.data);
    } else {
      setLoadError(result.error);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && !summary && !loading) {
      void loadSummary();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-[11px] text-text-primary hover:bg-bg-elevated"
      >
        Stripe 出款
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-3 bg-bg-card border-[rgba(237,232,224,0.12)]"
      >
        {loading ? (
          <p className="font-sans text-[12px] text-text-secondary">載入中…</p>
        ) : loadError ? (
          <p className="font-sans text-[12px] text-warning">{loadError}</p>
        ) : summary ? (
          <div className="space-y-2">
            <p className="font-sans text-[11px] text-text-secondary">
              收款：{summary.chargesEnabled ? "已啟用" : "未啟用"} · 出款：
              {summary.payoutsEnabled ? "已啟用" : "未啟用"}
            </p>
            {summary.bankAccounts.length === 0 ? (
              <p className="font-sans text-[12px] text-text-secondary">
                商戶尚未完成 Stripe onboarding 綁定出款銀行
              </p>
            ) : (
              <ul className="space-y-2">
                {summary.bankAccounts.map((bank) => (
                  <li
                    key={bank.id}
                    className="font-sans text-[12px] text-text-primary"
                  >
                    <div>
                      {bank.bankName ?? "銀行"} · ****{bank.last4}
                    </div>
                    {bank.accountHolderName ? (
                      <div className="text-text-secondary text-[11px]">
                        {bank.accountHolderName}
                      </div>
                    ) : null}
                    <div className="text-text-disabled text-[10px]">
                      {bank.currency.toUpperCase()} · {bank.status}
                      {bank.defaultForCurrency ? " · 預設" : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={summary.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-sans text-[11px] text-brand underline"
            >
              在 Stripe Dashboard 查看
            </a>
          </div>
        ) : (
          <p className="font-sans text-[12px] text-text-secondary">—</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ApplicationActions({
  application,
  onUpdated,
}: {
  application: AdminKycApplicationListItem;
  onUpdated: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function openDocument(documentId: string) {
    const result = await getKycDocumentSignedUrl(documentId);
    if (result.success) {
      window.open(result.data.url, "_blank", "noopener");
    } else {
      toast.error(result.error);
    }
  }

  function handleReview(decision: "approve" | "reject") {
    startTransition(async () => {
      const result = await reviewKycApplication(
        application.id,
        decision,
        decision === "reject" ? rejectReason : undefined,
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.decision === "approve") {
        if (result.data.stripeSyncWarning) {
          toast.warning(`已批准。${result.data.stripeSyncWarning}`);
        } else {
          toast.success(
            `已批准，Stripe 帳戶：${result.data.stripeAccountId ?? "—"}`,
          );
        }
      } else {
        toast.success("已拒絕該申請");
      }

      setShowReject(false);
      setRejectReason("");
      onUpdated();
    });
  }

  function handleRetryStripe() {
    startTransition(async () => {
      const result = await retryKycProvisioning(application.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.data.stripeSyncWarning) {
        toast.warning(result.data.stripeSyncWarning);
      } else {
        toast.success(
          `Stripe 開通成功：${result.data.stripeAccountId ?? "—"}`,
        );
      }
      onUpdated();
    });
  }

  if (application.status === "pending") {
    return (
      <div className="flex flex-col items-end gap-2 min-w-[140px]">
        <Popover>
          <PopoverTrigger
            className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-[11px] text-text-primary hover:bg-bg-elevated"
          >
            查看文件
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-56 p-2 bg-bg-card border-[rgba(237,232,224,0.12)]"
          >
            <div className="flex flex-col gap-1">
              {application.documents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openDocument(doc.id)}
                  className="text-left px-2 py-1.5 rounded-lg font-sans text-[12px] text-text-primary hover:bg-bg-elevated"
                >
                  {KYC_DOCUMENT_TYPE_LABELS[doc.documentType]}
                  {doc.stripeFileId ? " ✓" : ""}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap justify-end gap-1.5">
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => handleReview("approve")}
            className="h-9 text-[11px]"
          >
            {isPending ? "處理中…" : "批准"}
          </Button>
          {!showReject ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setShowReject(true)}
              className="h-9 text-[11px]"
            >
              拒絕
            </Button>
          ) : null}
        </div>

        {showReject ? (
          <div className="w-full space-y-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="拒絕原因（必填）"
              className="w-full h-9 px-3 rounded-lg bg-bg-page border border-[rgba(237,232,224,0.12)] font-sans text-[12px] text-text-primary"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !rejectReason.trim()}
              onClick={() => handleReview("reject")}
              className="h-9 w-full text-[11px] text-warning border-warning/30"
            >
              確認拒絕
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (application.status === "approved" && !application.stripeAccountId) {
    return (
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={handleRetryStripe}
        className="h-9 text-[11px]"
      >
        {isPending ? "重試中…" : "重試 Stripe 開通"}
      </Button>
    );
  }

  if (application.status === "approved" && application.stripeAccountId) {
    return <StripePayoutPopover applicationId={application.id} />;
  }

  if (application.status === "rejected" && application.rejectReason) {
    return (
      <span
        className="font-sans text-[11px] text-warning max-w-[160px] text-right line-clamp-2"
        title={application.rejectReason}
      >
        {application.rejectReason}
      </span>
    );
  }

  return <span className="font-sans text-[11px] text-text-disabled">—</span>;
}

export function AdminMerchantsClient({
  initialApplications,
  loadError,
}: {
  initialApplications: AdminKycApplicationListItem[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    return {
      all: initialApplications.length,
      pending: initialApplications.filter((a) => a.status === "pending").length,
      approved: initialApplications.filter((a) => a.status === "approved")
        .length,
      rejected: initialApplications.filter((a) => a.status === "rejected")
        .length,
    };
  }, [initialApplications]);

  const filtered = useMemo(() => {
    const byStatus =
      statusFilter === "all"
        ? initialApplications
        : initialApplications.filter((app) => app.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (!q) return byStatus;

    return byStatus.filter((app) => {
      const handle = formatHandle(app.shopHandle, app.applicantUsername);
      return (
        app.companyNameEn.toLowerCase().includes(q) ||
        (app.companyNameZh ?? "").toLowerCase().includes(q) ||
        handle.toLowerCase().includes(q) ||
        app.repEmail.toLowerCase().includes(q) ||
        app.brNumber.toLowerCase().includes(q) ||
        (app.stripeAccountId ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialApplications, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  function handleFilterChange(next: StatusFilter) {
    setStatusFilter(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleUpdated() {
    router.refresh();
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-100px)] space-y-4">
      <div className="flex items-end justify-between gap-4 bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div>
          <h1 className="font-sans font-bold text-[20px] text-text-primary">
            商戶與 KYC 審查
          </h1>
          <p className="font-sans text-[12px] text-text-secondary mt-0.5">
            人工審批商戶入駐申請；批准後自動開通店舖並建立 Stripe Connect 帳戶
          </p>
        </div>
      </div>

      {loadError ? (
        <p className="font-sans text-[13px] text-warning px-1">{loadError}</p>
      ) : null}

      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="搜尋公司名、Handle、電郵、BR 或 Stripe ID..."
                  value={search}
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
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <div className="flex items-center gap-1 bg-[#17130f] p-1 rounded-xl border border-[rgba(237,232,224,0.08)]">
                {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFilterChange(key)}
                    className={`min-h-[44px] px-3 py-1 rounded-lg font-sans text-[11px] transition-colors ${
                      statusFilter === key
                        ? "bg-bg-elevated text-brand font-semibold"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {FILTER_LABELS[key]} ({counts[key]})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
            <Table>
              <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                  <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                    公司名稱
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    Handle
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    電郵
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    BR 號碼
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                    Stripe Account ID
                  </TableHead>
                  <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                    申請狀態
                  </TableHead>
                  <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                    提交時間
                  </TableHead>
                  <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center font-sans text-[13px] text-text-secondary"
                    >
                      暫無{FILTER_LABELS[statusFilter]}申請
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((app) => (
                    <TableRow
                      key={app.id}
                      className="border-b border-[rgba(237,232,224,0.06)] transition-colors"
                    >
                      <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                        {app.companyNameEn}
                        {app.companyNameZh ? (
                          <span className="font-normal text-text-secondary">
                            {" "}
                            （{app.companyNameZh}）
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-[12px] text-text-secondary py-3 whitespace-nowrap">
                        {formatHandle(app.shopHandle, app.applicantUsername)}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-secondary py-3 whitespace-nowrap">
                        {app.repEmail}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-secondary py-3 whitespace-nowrap">
                        {app.brNumber}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                        {app.stripeAccountId ?? "—"}
                      </TableCell>
                      <TableCell className="text-center py-3 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${statusBadgeClasses(app.status)}`}
                        >
                          {statusLabel(app.status)}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-disabled text-right py-3 whitespace-nowrap">
                        {formatDateTime(app.submittedAt)}
                        {app.reviewedAt ? (
                          <div className="text-[10px] text-text-disabled">
                            審核 {formatDateTime(app.reviewedAt)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <ApplicationActions
                          application={app}
                          onUpdated={handleUpdated}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
              <div className="font-mono text-[12px] text-text-secondary">
                顯示第{" "}
                <span className="font-bold text-text-primary">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-text-primary">
                  {Math.min(page * PAGE_SIZE, filtered.length)}
                </span>{" "}
                筆，共{" "}
                <span className="font-bold text-brand">{filtered.length}</span>{" "}
                筆資料
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  上一頁
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all ${
                      page === p
                        ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                        : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  下一頁
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
