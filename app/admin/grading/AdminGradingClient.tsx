"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminClearSellerSettlement,
  adminConfirmGradingIntake,
  adminFailGradingAndRefund,
  adminPassGrading,
  adminSubmitGradingOutbound,
  adminSubmitSellerReturnTracking,
  getAdminGradingAuditHistory,
  searchAdminGradingOrders,
  type AdminGradingAuditRow,
  type AdminGradingOrderKind,
  type AdminGradingQueueRow,
  type AdminGradingTab,
  type AdminGradingFaultParty,
} from "@/app/actions/admin-grading";
import { formatHongKongDateTime } from "@/lib/datetime/hong-kong";
import {
  DEFAULT_GRADING_OPTION_ID,
  GRADING_OPTION_GROUPS,
  getGradingOptionsByGroup,
  isRawGradingOptionId,
} from "@/lib/grading/options";
import { resolveGradingOptionId } from "@/lib/grading/resolve-option-id";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE = 20;

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

type AdminGradingClientProps = {
  initialRows: AdminGradingQueueRow[];
  initialTotal: number;
  loadError: string | null;
};

export function AdminGradingClient({
  initialRows,
  initialTotal,
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

  const refreshQueue = (nextPage = page) => {
    startTransition(async () => {
      const result = await searchAdminGradingOrders({
        tab,
        orderKind,
        keyword,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setRows(result.data.rows);
      setTotal(result.data.total);
      setPage(result.data.page);
    });
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
      refreshQueue(page);
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
      refreshQueue(page);
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
      refreshQueue(page);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-sans text-2xl font-bold text-white">鑑定工作台</h1>
        <p className="mt-1 text-sm text-text-secondary">
          統一處理 Member C2C 與 Merchant B2C 鑑定訂單
        </p>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {loadError}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as AdminGradingTab[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => {
              setTab(tabKey);
              setPage(1);
              startTransition(() => {
                void searchAdminGradingOrders({
                  tab: tabKey,
                  orderKind,
                  keyword,
                  page: 1,
                  pageSize: PAGE_SIZE,
                }).then((result) => {
                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  setRows(result.data.rows);
                  setTotal(result.data.total);
                  setPage(1);
                });
              });
            }}
            className={
              tab === tabKey
                ? "rounded-lg border border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-semibold text-brand"
                : "rounded-lg border border-white/10 px-3 py-1.5 text-xs text-text-secondary hover:bg-white/5"
            }
          >
            {TAB_LABELS[tabKey]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={orderKind}
          onChange={(event) => {
            const next = event.target.value as OrderKindFilter;
            setOrderKind(next);
            setPage(1);
            startTransition(() => {
              void searchAdminGradingOrders({
                tab,
                orderKind: next,
                keyword,
                page: 1,
                pageSize: PAGE_SIZE,
              }).then((result) => {
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                setRows(result.data.rows);
                setTotal(result.data.total);
                setPage(1);
              });
            });
          }}
          className="h-9 rounded-lg border border-white/10 bg-[#1A1612] px-3 text-xs text-text-primary"
        >
          <option value="all">全部來源</option>
          <option value="member">Member C2C</option>
          <option value="merchant">Merchant B2C</option>
        </select>

        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜尋訂單號、買家、賣家、物流單號"
          className="h-9 min-w-[240px] flex-1 rounded-lg border border-white/10 bg-[#1A1612] px-3 text-xs text-text-primary placeholder:text-text-disabled"
        />

        <Button
          type="button"
          disabled={isPending}
          onClick={() => refreshQueue(1)}
          className="h-9"
        >
          搜尋
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>訂單號</TableHead>
              <TableHead>來源</TableHead>
              <TableHead>買家</TableHead>
              <TableHead>賣方</TableHead>
              <TableHead>商品</TableHead>
              <TableHead>入庫物流</TableHead>
              <TableHead>出庫物流</TableHead>
              <TableHead>退款</TableHead>
              <TableHead>更新時間</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-text-secondary">
                  此分頁暫無訂單
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={`${row.order_kind}-${row.order_id}`}>
                  <TableCell className="font-mono text-xs">
                    {row.order_number ?? row.order_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {row.order_kind === "member" ? "C2C" : "B2C"}
                  </TableCell>
                  <TableCell>
                    {row.buyer_display_name ?? row.buyer_username ?? "—"}
                  </TableCell>
                  <TableCell>{formatParty(row)}</TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {formatProductName(row)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.inbound_tracking_no ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.outbound_tracking_no ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.refund_status === "refunded"
                      ? "已退款"
                      : row.refund_status === "processing"
                        ? "處理中"
                        : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTime(row.updated_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDetail(row)}
                    >
                      處理
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-text-secondary">
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
          >
            上一頁
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || page >= totalPages}
            onClick={() => refreshQueue(page + 1)}
          >
            下一頁
          </Button>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#17130f] p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selected.order_number ?? selected.order_id}
                </h2>
                <p className="text-xs text-text-secondary">
                  {selected.order_kind === "member" ? "Member C2C" : "Merchant B2C"} ·{" "}
                  {selected.escrow_status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-text-secondary hover:text-white"
              >
                關閉
              </button>
            </div>

            <div className="grid gap-3 text-sm text-text-secondary md:grid-cols-2">
              <p>買家：{selected.buyer_display_name ?? selected.buyer_username ?? "—"}</p>
              <p>賣方：{formatParty(selected)}</p>
              <p>商品：{formatProductName(selected)}</p>
              <p>賣家申報：{formatListingGrade(selected)}</p>
              <p>
                金額：HK$ {Number(selected.total_amount ?? 0).toLocaleString("zh-HK")}
              </p>
              <p>入庫：{selected.inbound_tracking_no ?? "—"}</p>
              <p>出庫：{selected.outbound_tracking_no ?? "—"}</p>
              <p>鑑定結果：{selected.auth_result ?? "—"}</p>
              {selected.auth_grading_company ? (
                <p>
                  平台鑑定：
                  {selected.auth_grading_company}
                  {selected.auth_grading_score
                    ? ` ${selected.auth_grading_score}`
                    : ""}
                </p>
              ) : null}
              <p>退款狀態：{selected.refund_status}</p>
              {selected.fault_party ? (
                <p>責任方：{selected.fault_party}</p>
              ) : null}
              {selected.seller_settlement_status ? (
                <p>賣方追償：{selected.seller_settlement_status}</p>
              ) : null}
              {selected.receivable_amount_hkd != null ? (
                <p>
                  追償金額：HK${" "}
                  {Number(selected.receivable_amount_hkd).toLocaleString("zh-HK", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              ) : null}
            </div>

            {tab === "awaiting_intake" ? (
              <div className="mt-4">
                <Button
                  type="button"
                  disabled={isPending}
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
              </div>
            ) : null}

            {tab === "grading" ? (
              <div className="mt-4 space-y-3">
                <select
                  name="gradingOptionId"
                  value={gradingOptionId}
                  onChange={(event) => setGradingOptionId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 text-xs text-text-primary"
                >
                  <option value="">請選擇鑑定等級（必填）</option>
                  {GRADING_OPTION_GROUPS.filter((group) => group.key !== "RAW").map(
                    (group) => (
                      <optgroup key={group.key} label={group.label}>
                        {getGradingOptionsByGroup(group.key).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ),
                  )}
                </select>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="鑑定備註（選填）"
                  className="min-h-[80px] w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 py-2 text-xs text-text-primary"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={isPending || !gradingOptionId}
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
                </div>

                <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <p className="text-xs text-warning">
                    {formatGradingFailWarning(selected, faultParty)}
                  </p>
                  <select
                    name="faultParty"
                    value={faultParty}
                    onChange={(event) =>
                      setFaultParty(event.target.value as AdminGradingFaultParty | "")
                    }
                    className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 text-xs text-text-primary"
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
                      className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 text-xs text-text-primary"
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
                    className="mt-2 min-h-[64px] w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 py-2 text-xs text-text-primary"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-2"
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
                          if (faultParty === "carrier" && !carrierLiabilityParty) {
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
                            ...(faultParty === "carrier" && carrierLiabilityParty
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
              </div>
            ) : null}

            {showSellerSettlementPanel(selected) ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-text-secondary">
                  賣方責任鑑定失敗：請先確認已向賣方收取追償款項，再提交寄回賣家物流。
                </p>
                {selected.seller_settlement_status === "pending" ? (
                  <>
                    <input
                      value={fpsReference}
                      onChange={(event) => setFpsReference(event.target.value)}
                      placeholder="FPS 參考編號（選填）"
                      className="h-10 w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 font-mono text-xs text-text-primary"
                    />
                    <textarea
                      value={settlementNotes}
                      onChange={(event) => setSettlementNotes(event.target.value)}
                      placeholder="收款備註（選填）"
                      className="min-h-[64px] w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 py-2 text-xs text-text-primary"
                    />
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={handleClearSellerSettlement}
                    >
                      確認賣方已收款
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-brand">
                    追償款項已確認，請填寫寄回賣家物流單號。
                  </p>
                )}

                <input
                  value={sellerReturnTracking}
                  onChange={(event) => setSellerReturnTracking(event.target.value)}
                  placeholder="寄回賣家物流單號"
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 font-mono text-xs text-text-primary"
                />
                <Button
                  type="button"
                  disabled={
                    isPending ||
                    selected.seller_settlement_status !== "cleared" ||
                    !sellerReturnTracking.trim()
                  }
                  onClick={handleSubmitSellerReturnTracking}
                >
                  提交寄回賣家物流
                </Button>
              </div>
            ) : null}

            {tab === "awaiting_outbound" ? (
              <div className="mt-4 space-y-3">
                <input
                  value={outboundTracking}
                  onChange={(event) => setOutboundTracking(event.target.value)}
                  placeholder="出庫物流單號"
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#1A1612] px-3 font-mono text-xs text-text-primary"
                />
                <Button
                  type="button"
                  disabled={isPending || !outboundTracking.trim()}
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
              </div>
            ) : null}

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-white">審計紀錄</h3>
              {auditRows.length === 0 ? (
                <p className="text-xs text-text-secondary">暫無紀錄</p>
              ) : (
                <div className="space-y-2">
                  {auditRows.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <p className="text-text-primary">
                        {entry.action} · {entry.from_status ?? "—"} →{" "}
                        {entry.to_status ?? "—"}
                      </p>
                      <p className="text-text-secondary">
                        {entry.admin_display_name ?? entry.admin_username ?? "admin"} ·{" "}
                        {formatDateTime(entry.created_at)}
                      </p>
                      {entry.notes ? (
                        <p className="mt-1 text-text-secondary">{entry.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
