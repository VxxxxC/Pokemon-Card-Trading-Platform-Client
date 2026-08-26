"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Package,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminClearSellerSettlement,
  adminConfirmGradingIntake,
  adminFailGradingAndRefund,
  adminPassGrading,
  adminSubmitGradingOutbound,
  adminSubmitSellerReturnTracking,
  getAdminGradingAuditHistory,
  getAdminGradingTabCounts,
  searchAdminGradingOrders,
  type AdminGradingAuditRow,
  type AdminGradingOrderKind,
  type AdminGradingQueueRow,
  type AdminGradingTab,
  type AdminGradingFaultParty,
  type AdminGradingTabCounts,
} from "@/app/actions/admin-grading";
import { formatHongKongDateTime } from "@/lib/datetime/hong-kong";
import {
  DEFAULT_GRADING_OPTION_ID,
  GRADING_OPTION_GROUPS,
  getGradingOptionsByGroup,
  isRawGradingOptionId,
} from "@/lib/grading/options";
import { resolveGradingOptionId } from "@/lib/grading/resolve-option-id";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

type OrderKindFilter = "all" | AdminGradingOrderKind;

const TAB_LABELS: Record<AdminGradingTab, string> = {
  awaiting_intake: "待入庫",
  grading: "鑑定中",
  awaiting_outbound: "待出庫",
  awaiting_settlement: "待追償／寄回",
  closed: "已結案／退款",
};

const ORDER_KIND_LABELS: Record<OrderKindFilter, string> = {
  all: "全部來源",
  member: "Member C2C",
  merchant: "Merchant B2C",
};

const PAGE_SIZE = 20;

const INPUT_CLASS =
  "h-10 rounded-lg border border-white/10 bg-transparent px-3 text-[13px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-2 focus-visible:ring-brand/40 outline-none";

const BTN_OUTLINE_CLASS =
  "border-[rgba(237,232,224,0.12)] bg-transparent hover:border-brand/30 hover:bg-brand/10 hover:text-brand text-text-primary text-[12px] active:scale-[0.98]";

const BTN_BRAND_CLASS =
  "bg-brand text-bg-page hover:bg-brand-hover font-sans active:scale-[0.98]";

function formatDateTime(iso: string | null): string {
  return formatHongKongDateTime(iso);
}

function formatProductName(row: AdminGradingQueueRow): string {
  return (
    row.product_name_zh?.trim() ||
    row.product_name_ja?.trim() ||
    row.product_name_en?.trim() ||
    "—"
  );
}

function formatParty(row: AdminGradingQueueRow): string {
  if (row.order_kind === "merchant") {
    return row.shop_name?.trim() || "商戶";
  }
  return row.seller_display_name?.trim() || row.seller_username || "賣家";
}

function formatRefundPreview(row: AdminGradingQueueRow): string {
  const authFee = Number(row.auth_fee ?? 0);
  const buyerTotal = Number(row.buyer_total_amount ?? row.total_amount ?? 0);
  if (row.escrow_capture_model === "single" && buyerTotal > 0) {
    const released = Math.max(buyerTotal - authFee, 0);
    return `HK$ ${released.toLocaleString("zh-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const base = Number(row.item_subtotal ?? 0);
  const inbound = Number(row.inbound_shipping_fee ?? 0);
  const outbound = Number(row.outbound_shipping_fee ?? 0);
  const shipping = Number(row.shipping_fee ?? 0);
  const released =
    inbound + outbound > 0 ? base + inbound + outbound : base + shipping;

  return `HK$ ${released.toLocaleString("zh-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAuthFeePreview(row: AdminGradingQueueRow): string {
  return `HK$ ${Number(row.auth_fee ?? 0).toLocaleString("zh-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isSingleCaptureGradingRow(row: AdminGradingQueueRow): boolean {
  return row.escrow_capture_model === "single";
}

function formatBuyerTotalPreview(row: AdminGradingQueueRow): string {
  const total = Number(row.buyer_total_amount ?? row.total_amount ?? 0);
  return `HK$ ${total.toLocaleString("zh-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatGradingFailWarning(row: AdminGradingQueueRow, faultParty: string): string {
  if (isSingleCaptureGradingRow(row) && faultParty === "buyer") {
    return `鑑定失敗（買家責任）：將扣除鑑定費 ${formatAuthFeePreview(row)}，其餘授權金額約 ${formatRefundPreview(row)} 釋放。`;
  }
  if (isSingleCaptureGradingRow(row)) {
    return `鑑定失敗將取消授權，買家全額退回（約 ${formatBuyerTotalPreview(row)}）。`;
  }
  return `鑑定失敗將釋放未扣款餘額（卡價+運費，約 ${formatRefundPreview(row)}）。舊版分階扣款訂單之鑑定費可能不退；單次授權訂單則取消授權並全額退回。`;
}

function defaultPassGradingOptionId(row: AdminGradingQueueRow): string {
  const resolved = resolveGradingOptionId(row.grading_company, row.grading_score);
  if (!isRawGradingOptionId(resolved)) {
    return resolved;
  }
  return DEFAULT_GRADING_OPTION_ID;
}

function formatListingGrade(row: AdminGradingQueueRow): string {
  const company = row.grading_company?.trim();
  const score = row.grading_score?.trim();
  if (!company) return "—";
  return score ? `${company} ${score}` : company;
}

function isSellerFaultGradingFail(row: AdminGradingQueueRow): boolean {
  return row.auth_result === "failed" && row.fault_party === "seller";
}

function showSellerSettlementPanel(row: AdminGradingQueueRow): boolean {
  if (!isSellerFaultGradingFail(row)) {
    return false;
  }
  if (row.seller_settlement_status === "pending") {
    return true;
  }
  if (
    row.seller_settlement_status === "cleared" &&
    !row.outbound_tracking_no?.trim()
  ) {
    return true;
  }
  return false;
}

function refundStatusBadge(row: AdminGradingQueueRow): {
  label: string;
  className: string;
} | null {
  if (row.refund_status === "refunded") {
    return {
      label: "已退款",
      className:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }
  if (row.refund_status === "processing") {
    return {
      label: "處理中",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  }
  return null;
}

type AdminGradingClientProps = {
  initialRows: AdminGradingQueueRow[];
  initialTotal: number;
  initialTabCounts: AdminGradingTabCounts;
  loadError: string | null;
};

export function AdminGradingClient({
  initialRows,
  initialTotal,
  initialTabCounts,
  loadError,
}: AdminGradingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<AdminGradingTab>("awaiting_intake");
  const [orderKind, setOrderKind] = useState<OrderKindFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [tabCounts, setTabCounts] =
    useState<AdminGradingTabCounts>(initialTabCounts);
  const [selected, setSelected] = useState<AdminGradingQueueRow | null>(null);
  const [auditRows, setAuditRows] = useState<AdminGradingAuditRow[]>([]);
  const [notes, setNotes] = useState("");
  const [gradingOptionId, setGradingOptionId] = useState("");
  const [failReason, setFailReason] = useState("");
  const [faultParty, setFaultParty] = useState<AdminGradingFaultParty | "">("");
  const [carrierLiabilityParty, setCarrierLiabilityParty] = useState<
    "seller" | "platform" | ""
  >("");
  const [outboundTracking, setOutboundTracking] = useState("");
  const [fpsReference, setFpsReference] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [sellerReturnTracking, setSellerReturnTracking] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const tabChipOptions = useMemo(
    () =>
      (Object.keys(TAB_LABELS) as AdminGradingTab[]).map((key) => ({
        key,
        label: TAB_LABELS[key],
        count: tabCounts[key],
      })),
    [tabCounts],
  );

  const fetchTabCounts = useCallback(
    (filters: { orderKind: OrderKindFilter; keyword: string }) => {
      startTransition(async () => {
        const result = await getAdminGradingTabCounts({
          orderKind: filters.orderKind,
          keyword: filters.keyword,
        });
        if (!result.success) {
          return;
        }
        setTabCounts(result.data);
      });
    },
    [startTransition],
  );

  const fetchQueue = useCallback(
    (params: {
      tab: AdminGradingTab;
      orderKind: OrderKindFilter;
      keyword: string;
      page: number;
    }) => {
      startTransition(async () => {
        const result = await searchAdminGradingOrders({
          tab: params.tab,
          orderKind: params.orderKind,
          keyword: params.keyword,
          page: params.page,
          pageSize: PAGE_SIZE,
        });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        setRows(result.data.rows);
        setTotal(result.data.total);
        setPage(result.data.page);
        setTabCounts((prev) => ({
          ...prev,
          [params.tab]: result.data.total,
        }));
      });
    },
    [startTransition],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTabCounts({ orderKind, keyword });
    }, keyword ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [orderKind, keyword, fetchTabCounts]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchQueue({ tab, orderKind, keyword, page: 1 });
      setPage(1);
    }, keyword ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [tab, orderKind, keyword, fetchQueue]);

  const refreshQueue = (nextPage = page, refreshCounts = false) => {
    fetchQueue({ tab, orderKind, keyword, page: nextPage });
    if (refreshCounts) {
      fetchTabCounts({ orderKind, keyword });
    }
  };

  const loadAudit = (row: AdminGradingQueueRow) => {
    startTransition(async () => {
      const result = await getAdminGradingAuditHistory({
        orderKind: row.order_kind,
        orderId: row.order_id,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAuditRows(result.data);
    });
  };

  const openDetail = (row: AdminGradingQueueRow) => {
    setSelected(row);
    setNotes("");
    setGradingOptionId(defaultPassGradingOptionId(row));
    setFailReason("");
    setOutboundTracking(row.outbound_tracking_no ?? "");
    setFpsReference("");
    setSettlementNotes("");
    setSellerReturnTracking("");
    setAuditRows([]);
    loadAudit(row);
  };

  const runMutation = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
    options?: { keepDetailOpen?: boolean },
  ) => {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error ?? "操作失敗");
        return;
      }
      toast.success(successMessage);
      if (!options?.keepDetailOpen) {
        setSelected(null);
      }
      refreshQueue(page, true);
      router.refresh();
    });
  };

  const handleClearSellerSettlement = () => {
    if (!selected) {
      return;
    }
    const current = selected;
    startTransition(async () => {
      const result = await adminClearSellerSettlement({
        orderKind: current.order_kind,
        orderId: current.order_id,
        fpsReference,
        notes: settlementNotes,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("已確認賣方收款，請提交寄回賣家物流");
      setSelected({
        ...current,
        seller_settlement_status: "cleared",
      });
      loadAudit({ ...current, seller_settlement_status: "cleared" });
      refreshQueue(page, true);
      router.refresh();
    });
  };

  const handleSubmitSellerReturnTracking = () => {
    if (!selected) {
      return;
    }
    const current = selected;
    const trackingNo = sellerReturnTracking.trim();
    if (!trackingNo) {
      toast.error("請輸入寄回物流單號");
      return;
    }
    startTransition(async () => {
      const result = await adminSubmitSellerReturnTracking({
        orderKind: current.order_kind,
        orderId: current.order_id,
        trackingNo,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("寄回賣家物流已更新");
      setSelected(null);
      refreshQueue(page, true);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">
              鑑定工作台
            </h1>
            <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-brand">
              GRADING OPS
            </span>
          </div>
          <p className="mt-1 font-sans text-[13px] text-text-secondary">
            統一處理 Member C2C 與 Merchant B2C 鑑定訂單入庫、鑑定、出庫與退款
          </p>
        </div>
        <p className="font-mono text-[12px] text-text-secondary sm:shrink-0 sm:self-end">
          本頁顯示{" "}
          <span className="font-medium text-text-primary">{rows.length}</span> 筆
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 font-sans text-[13px] text-error">
          {loadError}
        </div>
      ) : null}

      {/* ── Filters: search → 來源 → 佇列 chips ─────────────────────── */}
      <div className="space-y-4 border-b border-white/[0.08] pb-5">
        <div className="flex w-full min-w-0 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled"
              aria-hidden="true"
            />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜尋訂單號、買家、賣家、物流單號"
              className="h-11 w-full border-white/10 bg-transparent pl-10 text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
            />
          </div>

          <Select
            value={orderKind}
            onValueChange={(value) => {
              setOrderKind(value as OrderKindFilter);
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="訂單來源"
              className="h-11 min-h-[44px] w-auto shrink-0 rounded-lg border border-white/10 bg-transparent px-3 font-sans text-[13px] text-text-primary transition-colors hover:border-brand/30 hover:bg-brand/10 focus-visible:border-brand/40 focus-visible:ring-0"
            >
              <SelectValue placeholder="全部來源">
                {ORDER_KIND_LABELS[orderKind]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORDER_KIND_LABELS) as OrderKindFilter[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {ORDER_KIND_LABELS[key]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <FilterChipRow
          label="佇列"
          options={tabChipOptions}
          active={tab}
          onSelect={(key) => {
            setTab(key);
            setPage(1);
          }}
        />
      </div>

      {/* ── Queue table ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-white/[0.08]">
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  訂單號
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  來源
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  買家
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  賣方
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  商品
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  入庫物流
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  出庫物流
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  退款
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                  更新時間
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-text-secondary" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="border-transparent hover:bg-transparent">
                  <TableCell colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-secondary">
                      <ShieldCheck className="size-8 text-brand/60" aria-hidden="true" />
                      <p className="font-sans text-[14px] text-text-primary">
                        此分頁暫無鑑定訂單
                      </p>
                      <p className="font-sans text-[12px] text-text-disabled">
                        請切換其他佇列分頁，或調整來源篩選與搜尋條件。
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const refundBadge = refundStatusBadge(row);
                  return (
                    <TableRow
                      key={`${row.order_kind}-${row.order_id}`}
                      className="border-white/[0.06] transition-colors duration-200 even:bg-transparent odd:bg-bg-card/40 hover:bg-brand/10"
                    >
                      <TableCell>
                        <span className="font-mono text-[13px] font-medium text-text-primary">
                          {row.order_number ?? row.order_id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            row.order_kind === "member"
                              ? "border-brand/25 bg-brand/10 text-brand"
                              : "border-white/10 bg-bg-elevated text-text-secondary"
                          }
                        >
                          {row.order_kind === "member" ? "C2C" : "B2C"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-sans text-[13px] text-text-primary">
                          {row.buyer_display_name ?? row.buyer_username ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-sans text-[13px] text-text-primary">
                          {formatParty(row)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="truncate font-sans text-[13px] text-text-primary">
                          {formatProductName(row)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[12px] text-text-secondary">
                          {row.inbound_tracking_no ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[12px] text-text-secondary">
                          {row.outbound_tracking_no ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {refundBadge ? (
                          <Badge
                            variant="outline"
                            className={refundBadge.className}
                          >
                            {refundBadge.label}
                          </Badge>
                        ) : (
                          <span className="font-sans text-[12px] text-text-disabled">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-[12px] text-text-secondary">
                          {formatDateTime(row.updated_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(row)}
                          className={BTN_OUTLINE_CLASS}
                        >
                          處理
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between font-mono text-[12px] text-text-secondary">
        <span>
          共 {total} 筆 · 第 {page} / {totalPages} 頁
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || page <= 1}
            onClick={() => refreshQueue(page - 1)}
            className={BTN_OUTLINE_CLASS}
          >
            上一頁
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || page >= totalPages}
            onClick={() => refreshQueue(page + 1)}
            className={BTN_OUTLINE_CLASS}
          >
            下一頁
          </Button>
        </div>
      </div>

      {/* ── Detail dialog ───────────────────────────────────────────── */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border border-white/10 bg-bg-page p-0 text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.65)]"
        >
          {selected ? (
            <>
              <DialogHeader className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <DialogTitle className="truncate font-mono text-[15px] font-bold text-text-primary sm:text-[16px]">
                      {selected.order_number ?? selected.order_id}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          selected.order_kind === "member"
                            ? "border-brand/25 bg-brand/10 text-brand"
                            : "border-white/10 text-text-secondary"
                        }
                      >
                        {selected.order_kind === "member" ? "C2C" : "B2C"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-white/10 font-mono text-[11px] text-text-secondary"
                      >
                        {selected.escrow_status}
                      </Badge>
                    </div>
                    <DialogDescription className="sr-only">
                      鑑定訂單詳情
                    </DialogDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="shrink-0 rounded-lg p-1.5 text-text-secondary transition-all hover:bg-brand/15 hover:text-brand active:scale-[0.98]"
                    aria-label="關閉"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </DialogHeader>

              <div className="space-y-4 px-5 py-4 sm:px-6">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailInline label="買家">
                    <DetailValue
                      value={selected.buyer_display_name ?? selected.buyer_username}
                    />
                  </DetailInline>
                  <DetailInline label="賣方">
                    {formatParty(selected)}
                  </DetailInline>
                  <DetailInline label="商品">
                    {formatProductName(selected)}
                  </DetailInline>
                  <DetailInline label="賣家申報">
                    <GradingBadge grade={formatListingGrade(selected)} />
                  </DetailInline>
                  <DetailInline label="金額" className="col-span-2 sm:col-span-1">
                    <span className="font-mono font-semibold text-brand">
                      HK$ {Number(selected.total_amount ?? 0).toLocaleString("zh-HK")}
                    </span>
                  </DetailInline>
                </div>

                <GradingOrderTimeline row={selected} currentTab={tab} />

                {tab === "awaiting_intake" ? (
                  <ActionPanel icon={Package} title="入庫確認" compact>
                    <Button
                      type="button"
                      disabled={isPending}
                      size="sm"
                      className={BTN_BRAND_CLASS}
                      onClick={() =>
                        runMutation(
                          () =>
                            adminConfirmGradingIntake({
                              orderKind: selected.order_kind,
                              orderId: selected.order_id,
                            }),
                          "已確認入庫",
                        )
                      }
                    >
                      確認入庫
                    </Button>
                  </ActionPanel>
                ) : null}

                {tab === "grading" ? (
                  <ActionPanel icon={ClipboardCheck} title="鑑定作業">
                    <select
                      name="gradingOptionId"
                      value={gradingOptionId}
                      onChange={(event) => setGradingOptionId(event.target.value)}
                      className={cnSelectClass("w-full")}
                    >
                      <option value="">請選擇鑑定等級（必填）</option>
                      {GRADING_OPTION_GROUPS.filter(
                        (group) => group.key !== "RAW",
                      ).map((group) => (
                        <optgroup key={group.key} label={group.label}>
                          {getGradingOptionsByGroup(group.key).map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="鑑定備註（選填）"
                      className={cnTextareaClass()}
                    />
                    <Button
                      type="button"
                      disabled={isPending || !gradingOptionId}
                      className={BTN_BRAND_CLASS}
                      onClick={() =>
                        runMutation(
                          () =>
                            adminPassGrading({
                              orderKind: selected.order_kind,
                              orderId: selected.order_id,
                              gradingOptionId,
                              notes,
                            }),
                          "鑑定已標記為通過",
                        )
                      }
                    >
                      鑑定通過
                    </Button>

                    <div className="rounded-xl border border-warning/25 bg-warning/5 p-4">
                      <p className="font-sans text-[12px] text-warning">
                        {formatGradingFailWarning(selected, faultParty)}
                      </p>
                      <select
                        name="faultParty"
                        value={faultParty}
                        onChange={(event) =>
                          setFaultParty(
                            event.target.value as AdminGradingFaultParty | "",
                          )
                        }
                        className={cnSelectClass("mt-3 w-full")}
                      >
                        <option value="">請選擇責任方（必填）</option>
                        <option value="buyer">買家</option>
                        <option value="seller">賣家</option>
                        <option value="platform">平台</option>
                        <option value="carrier">物流</option>
                        <option value="inconclusive">無法判定</option>
                      </select>
                      {faultParty === "carrier" ? (
                        <select
                          name="carrierLiabilityParty"
                          value={carrierLiabilityParty}
                          onChange={(event) =>
                            setCarrierLiabilityParty(
                              event.target.value as "seller" | "platform" | "",
                            )
                          }
                          className={cnSelectClass("mt-2 w-full")}
                        >
                          <option value="">物流承擔方（必填）</option>
                          <option value="seller">賣家物流</option>
                          <option value="platform">平台物流</option>
                        </select>
                      ) : null}
                      <textarea
                        value={failReason}
                        onChange={(event) => setFailReason(event.target.value)}
                        placeholder="失敗原因（選填）"
                        className={cnTextareaClass("mt-2 min-h-[64px]")}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        className="mt-3 active:scale-[0.98]"
                        disabled={
                          isPending ||
                          !faultParty ||
                          (faultParty === "carrier" && !carrierLiabilityParty)
                        }
                        onClick={() =>
                          runMutation(
                            async () => {
                              if (!faultParty) {
                                return { success: false, error: "請選擇責任方" };
                              }
                              if (
                                faultParty === "carrier" &&
                                !carrierLiabilityParty
                              ) {
                                return {
                                  success: false,
                                  error: "物流責任請選擇承擔方",
                                };
                              }
                              const result = await adminFailGradingAndRefund({
                                orderKind: selected.order_kind,
                                orderId: selected.order_id,
                                faultParty,
                                reason: failReason,
                                ...(faultParty === "carrier" &&
                                carrierLiabilityParty
                                  ? { carrierLiabilityParty }
                                  : {}),
                              });
                              return result.success
                                ? { success: true }
                                : { success: false, error: result.error };
                            },
                            "已釋放未扣款餘額",
                          )
                        }
                      >
                        鑑定失敗並釋放餘額
                      </Button>
                    </div>
                  </ActionPanel>
                ) : null}

                {showSellerSettlementPanel(selected) ? (
                  <ActionPanel icon={ShieldCheck} title="賣方追償與寄回">
                    <p className="font-sans text-[12px] text-text-secondary">
                      賣方責任鑑定失敗：請先確認已向賣方收取追償款項，再提交寄回賣家物流。
                    </p>
                    {selected.seller_settlement_status === "pending" ? (
                      <>
                        <input
                          value={fpsReference}
                          onChange={(event) => setFpsReference(event.target.value)}
                          placeholder="FPS 參考編號（選填）"
                          className={cnInputClass("font-mono")}
                        />
                        <textarea
                          value={settlementNotes}
                          onChange={(event) =>
                            setSettlementNotes(event.target.value)
                          }
                          placeholder="收款備註（選填）"
                          className={cnTextareaClass("min-h-[64px]")}
                        />
                        <Button
                          type="button"
                          disabled={isPending}
                          className={BTN_BRAND_CLASS}
                          onClick={handleClearSellerSettlement}
                        >
                          確認賣方已收款
                        </Button>
                      </>
                    ) : (
                      <p className="font-sans text-[12px] text-brand">
                        追償款項已確認，請填寫寄回賣家物流單號。
                      </p>
                    )}

                    <input
                      value={sellerReturnTracking}
                      onChange={(event) =>
                        setSellerReturnTracking(event.target.value)
                      }
                      placeholder="寄回賣家物流單號"
                      className={cnInputClass("font-mono")}
                    />
                    <Button
                      type="button"
                      disabled={
                        isPending ||
                        selected.seller_settlement_status !== "cleared" ||
                        !sellerReturnTracking.trim()
                      }
                      className={BTN_BRAND_CLASS}
                      onClick={handleSubmitSellerReturnTracking}
                    >
                      提交寄回賣家物流
                    </Button>
                  </ActionPanel>
                ) : null}

                {tab === "awaiting_outbound" ? (
                  <ActionPanel icon={Truck} title="出庫物流">
                    <input
                      value={outboundTracking}
                      onChange={(event) => setOutboundTracking(event.target.value)}
                      placeholder="出庫物流單號"
                      className={cnInputClass("font-mono")}
                    />
                    <Button
                      type="button"
                      disabled={isPending || !outboundTracking.trim()}
                      className={BTN_BRAND_CLASS}
                      onClick={() =>
                        runMutation(
                          () =>
                            adminSubmitGradingOutbound({
                              orderKind: selected.order_kind,
                              orderId: selected.order_id,
                              trackingNo: outboundTracking,
                            }),
                          "出庫物流已更新",
                        )
                      }
                    >
                      提交出庫物流
                    </Button>
                  </ActionPanel>
                ) : null}

                <section className="border-t border-white/[0.08] pt-3">
                  <h3 className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-text-disabled">
                    審計紀錄
                  </h3>
                  {auditRows.length === 0 ? (
                    <p className="font-sans text-[12px] text-text-disabled">
                      暫無紀錄
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {auditRows.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-white/[0.06] px-3 py-2.5"
                        >
                          <p className="font-sans text-[12px] text-text-primary">
                            {entry.action} · {entry.from_status ?? "—"} →{" "}
                            {entry.to_status ?? "—"}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-text-secondary">
                            {entry.admin_display_name ??
                              entry.admin_username ??
                              "admin"}{" "}
                            · {formatDateTime(entry.created_at)}
                          </p>
                          {entry.notes ? (
                            <p className="mt-1 font-sans text-[12px] text-text-secondary">
                              {entry.notes}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChipRow<K extends string>({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { key: K; label: string; count: number }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map(({ key, label: optionLabel, count }) => {
          const selected = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`min-h-[36px] rounded-lg border px-3 py-1.5 font-sans text-[12px] transition-colors active:scale-[0.98] ${
                selected
                  ? "border-brand/40 bg-brand/15 font-semibold text-brand"
                  : "border-transparent text-text-secondary hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
              }`}
            >
              {optionLabel} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}

function cnSelectClass(extra?: string) {
  return [INPUT_CLASS, extra].filter(Boolean).join(" ");
}

function cnInputClass(extra?: string) {
  return [INPUT_CLASS, "w-full", extra].filter(Boolean).join(" ");
}

function cnTextareaClass(extra?: string) {
  return [
    INPUT_CLASS,
    "min-h-[80px] w-full py-2 resize-y",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function cnBtnBrand(extra?: string) {
  return [BTN_BRAND_CLASS, extra].filter(Boolean).join(" ");
}

function formatDetailDisplay(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "—" || trimmed === "none" || trimmed === "null") {
    return "—";
  }
  return trimmed;
}

function DetailValue({
  value,
  mono = false,
}: {
  value: string | null | undefined;
  mono?: boolean;
}) {
  const display = formatDetailDisplay(value);
  if (display === "—") {
    return <DetailEmptyValue />;
  }
  return (
    <span className={mono ? "font-mono text-[12px]" : undefined}>{display}</span>
  );
}

function DetailInline({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 items-center gap-2 py-0.5 ${className ?? ""}`}>
      <span className="w-[4.5rem] shrink-0 font-sans text-[11px] text-text-disabled">
        {label}
      </span>
      <div className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
        {children}
      </div>
    </div>
  );
}

function DetailEmptyValue() {
  return <span className="text-text-disabled">—</span>;
}

type TimelineStepStatus = "complete" | "active" | "pending";

function GradingOrderTimeline({
  row,
  currentTab,
}: {
  row: AdminGradingQueueRow;
  currentTab: AdminGradingTab;
}) {
  const intakeComplete =
    Boolean(row.platform_received_at?.trim()) ||
    Boolean(row.inbound_tracking_no?.trim());
  const gradingComplete =
    Boolean(row.auth_graded_at?.trim()) ||
    (Boolean(row.auth_result?.trim()) &&
      formatDetailDisplay(row.auth_result) !== "—");
  const outboundComplete = Boolean(row.outbound_tracking_no?.trim());
  const settlementComplete =
    formatDetailDisplay(row.refund_status) !== "—" ||
    formatDetailDisplay(row.fault_party) !== "—" ||
    formatDetailDisplay(row.seller_settlement_status) !== "—" ||
    row.receivable_amount_hkd != null;

  const activeId =
    currentTab === "awaiting_intake"
      ? "intake"
      : currentTab === "grading"
        ? "grading"
        : currentTab === "awaiting_outbound"
          ? "outbound"
          : "settlement";

  const steps: {
    id: string;
    label: string;
    complete: boolean;
    detail: ReactNode;
  }[] = [
    {
      id: "intake",
      label: "入庫",
      complete: intakeComplete,
      detail: intakeComplete ? (
        <span className="font-mono text-[10px] text-text-secondary">
          {formatDetailDisplay(row.inbound_tracking_no)}
        </span>
      ) : (
        <span className="text-[10px] text-text-disabled">待確認</span>
      ),
    },
    {
      id: "grading",
      label: "鑑定",
      complete: gradingComplete,
      detail: gradingComplete ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-text-secondary">
            {formatDetailDisplay(row.auth_result)}
          </span>
          {row.auth_grading_company ? (
            <GradingBadge
              grade={`${row.auth_grading_company}${
                row.auth_grading_score ? ` ${row.auth_grading_score}` : ""
              }`}
            />
          ) : null}
        </div>
      ) : (
        <span className="text-[10px] text-text-disabled">待鑑定</span>
      ),
    },
    {
      id: "outbound",
      label: "出庫",
      complete: outboundComplete,
      detail: outboundComplete ? (
        <span className="font-mono text-[10px] text-text-secondary">
          {formatDetailDisplay(row.outbound_tracking_no)}
        </span>
      ) : (
        <span className="text-[10px] text-text-disabled">待出庫</span>
      ),
    },
    {
      id: "settlement",
      label: "款項",
      complete: settlementComplete,
      detail: <SettlementTimelineDetail row={row} />,
    },
  ];

  return (
    <section className="border-t border-white/[0.08] pt-3">
      <h3 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-wide text-text-disabled">
        流程狀態
      </h3>
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step, index) => {
          const status: TimelineStepStatus = step.complete
            ? "complete"
            : step.id === activeId
              ? "active"
              : "pending";

          return (
            <div key={step.id} className="flex min-w-0 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className={`h-px flex-1 ${step.complete || status === "active" ? "bg-brand/40" : "bg-white/10"}`}
                    aria-hidden="true"
                  />
                ) : null}
                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    status === "complete"
                      ? "border-success/40 bg-success/15 text-success"
                      : status === "active"
                        ? "animate-ring-pulse border-brand/50 bg-brand/15 text-brand"
                        : "border-white/15 bg-transparent text-text-disabled"
                  }`}
                >
                  {status === "complete" ? "✓" : index + 1}
                </div>
                {index < steps.length - 1 ? (
                  <div
                    className={`h-px flex-1 ${steps[index + 1].complete || steps[index + 1].id === activeId ? "bg-brand/40" : "bg-white/10"}`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <span
                className={`mt-2 font-sans text-[11px] ${status === "active" ? "font-semibold text-brand" : "text-text-secondary"}`}
              >
                {step.label}
              </span>
              <div className="mt-0.5 max-w-full px-1 text-center">{step.detail}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SettlementTimelineDetail({ row }: { row: AdminGradingQueueRow }) {
  const refund = formatDetailDisplay(row.refund_status);
  const fault = formatDetailDisplay(row.fault_party);
  const settlement = formatDetailDisplay(row.seller_settlement_status);

  if (
    refund === "—" &&
    fault === "—" &&
    settlement === "—" &&
    row.receivable_amount_hkd == null
  ) {
    return <span className="text-[10px] text-text-disabled">待結算</span>;
  }

  return (
    <div className="space-y-0.5 text-[10px] leading-snug text-text-secondary">
      {refund !== "—" ? <p>退款 {refund}</p> : null}
      {fault !== "—" ? <p>責任 {fault}</p> : null}
      {settlement !== "—" ? <p>追償 {settlement}</p> : null}
      {row.receivable_amount_hkd != null ? (
        <p className="font-mono text-brand">
          HK${" "}
          {Number(row.receivable_amount_hkd).toLocaleString("zh-HK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      ) : null}
    </div>
  );
}

function GradingBadge({ grade }: { grade: string }) {
  if (grade === "—") {
    return <span>—</span>;
  }
  return (
    <span
      className="inline-flex rounded-md bg-brand/15 px-2 py-0.5 font-mono text-[12px] font-medium text-text-primary"
    >
      {grade}
    </span>
  );
}

function ActionPanel({
  icon: Icon,
  title,
  children,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md border border-brand/20 bg-brand/10 text-brand">
            <Icon className="size-3" />
          </div>
          <h3 className="font-sans text-[13px] font-semibold text-text-primary">
            {title}
          </h3>
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="space-y-3 border-t border-white/[0.08] pt-4">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
          <Icon className="size-3.5" />
        </div>
        <h3 className="font-sans text-[13px] font-semibold text-text-primary">
          {title}
        </h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
