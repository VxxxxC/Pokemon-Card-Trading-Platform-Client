"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Shield,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { AdminOrderRowItem, AdminOrderStatus } from "../types";
import {
  ORDER_STATUS_LABELS,
  GRADING_STATUS_LABELS,
  PERSONA_LABELS,
} from "../mockOrders";
import {
  formatCurrency,
  orderStatusBadgeClasses,
  gradingStatusBadgeClasses,
  personaBadgeClasses,
} from "../utils";

interface OrderDetailClientProps {
  order: AdminOrderRowItem;
}

const ESCROW_STEPS: Array<{ key: AdminOrderStatus | "released"; label: string }> = [
  { key: "pending", label: "付款" },
  { key: "custody", label: "倉庫託管" },
  { key: "grading", label: "鑑定中" },
  { key: "shipped", label: "已發貨" },
  { key: "released", label: "已釋放" },
];

function getActiveStepIndex(status: AdminOrderStatus): number {
  if (status === "cancelled") return -1;
  if (status === "completed") return ESCROW_STEPS.findIndex((s) => s.key === "released");
  return ESCROW_STEPS.findIndex((s) => s.key === status);
}

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const [orderState, setOrderState] = useState<AdminOrderRowItem>(order);
  const [outboundInput, setOutboundInput] = useState(order.outboundTrackingNo ?? "");

  const activeStepIndex = useMemo(
    () => getActiveStepIndex(orderState.status),
    [orderState.status],
  );

  // ── Financial Release Notice ──────────────────────────────────────────────
  const renderReleaseNotice = () => {
    if (!orderState.buyerReceivedConfirmed) {
      return (
        <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card border-l-4 border-l-brand p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 shrink-0" />
            <p className="font-sans text-[13px] leading-relaxed text-text-secondary">
              買家尚未按下「已收到商品」。Escrow 資金現暫留於平台 Stripe 託管帳戶中，待買家確認收貨後釋放。
            </p>
          </div>
        </div>
      );
    }

    if (orderState.sellerPersona === "merchant") {
      return (
        <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[rgba(16,185,129,0.08)] border-l-4 border-l-success p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 shrink-0" />
            <p className="font-sans text-[13px] leading-relaxed text-success">
              買家已確認收貨。平台已透過 Stripe Connect 自動將款項 ({formatCurrency(orderState.totalPaid)}) 分賬至商戶子帳戶。
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[rgba(245,158,11,0.08)] border-l-4 border-l-warning p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-sans text-[13px] leading-relaxed text-warning">
              買家已確認收貨。由於賣家非認證商戶（無 Stripe Connect 帳戶），請管理員前往「財務與結算管控台」經由銀行 FPS 執行人手銷帳放款。
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => router.push("/admin/payouts")}
            className="shrink-0 min-h-[44px] bg-warning text-[#17130f] hover:bg-warning/90 font-semibold text-xs active:scale-[0.98] transition-[color,background-color,transform] duration-150"
          >
            前往結算控制台
          </Button>
        </div>
      </div>
    );
  };

  // ── Grading Actions ───────────────────────────────────────────────────────
  const handlePass = () => {
    setOrderState((prev) => ({ ...prev, gradingStatus: "passed_authentic" }));
    toast.success(`訂單 ${orderState.orderNumber} 已標記為「已鑑定-真品」`);
  };

  const handleFail = () => {
    setOrderState((prev) => ({ ...prev, gradingStatus: "failed_fake" }));
    toast.error(`訂單 ${orderState.orderNumber} 已標記為「已鑑定-偽品」`);
  };

  const handleSaveOutbound = () => {
    // TODO: [Supabase Wiring] Persist outboundTrackingNo to orders table
    setOrderState((prev) => ({ ...prev, outboundTrackingNo: outboundInput.trim() || null }));
    toast.success("平台速遞單號已儲存");
  };

  return (
    <div className="space-y-6">
      {/* ── Back Button ─────────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/orders")}
        className="text-text-secondary hover:bg-bg-card hover:text-text-primary active:scale-[0.98] transition-[color,background-color,transform] duration-150"
      >
        <ArrowLeft className="mr-1.5 size-4" />
        返回訂單列表
      </Button>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[18px] font-bold text-text-primary">
            {orderState.orderNumber}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "font-sans text-[12px] px-2 py-0.5 rounded border",
              orderStatusBadgeClasses(orderState.status),
            )}
          >
            {ORDER_STATUS_LABELS[orderState.status]}
          </Badge>
        </div>
        <span className="font-sans text-[12px] text-text-secondary">
          建立於 {orderState.createdAt}
        </span>
      </div>

      {/* ── Dual-Persona Profile Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Buyer Card */}
        <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand font-sans text-[18px] font-bold">
              {orderState.buyerName.charAt(0)}
            </div>
            <div>
              <h2 className="font-sans text-[15px] font-bold text-text-primary">
                買家資料
              </h2>
              <p className="font-sans text-[14px] font-medium text-text-primary">
                {orderState.buyerName}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-text-secondary">買家 ID</span>
              <span className="font-mono text-[12px] text-text-secondary truncate max-w-[200px]">
                {orderState.buyerId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-text-secondary">Escrow 已付金額</span>
              <span className="font-mono text-[20px] font-bold text-brand">
                {formatCurrency(orderState.totalPaid)}
              </span>
            </div>
          </div>
        </div>

        {/* Seller Card */}
        <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-bg-elevated text-text-primary font-sans text-[18px] font-bold border border-white/10">
              {orderState.sellerName.charAt(0)}
            </div>
            <div>
              <h2 className="font-sans text-[15px] font-bold text-text-primary">
                賣家資料
              </h2>
              <div className="flex items-center gap-2">
                <p className="font-sans text-[14px] font-medium text-text-primary">
                  {orderState.sellerName}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-sans px-1.5 py-0 rounded",
                    personaBadgeClasses(orderState.sellerPersona),
                  )}
                >
                  {PERSONA_LABELS[orderState.sellerPersona]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-text-secondary">賣家 ID</span>
              <span className="font-mono text-[12px] text-text-secondary truncate max-w-[200px]">
                {orderState.sellerId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-text-secondary">放款方式</span>
              <span className="font-sans text-[13px] text-text-primary">
                {orderState.payoutMethod === "stripe_connect"
                  ? "Stripe Connect 自動分賬"
                  : "銀行 FPS 人手銷帳"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial Release Notice ────────────────────────────────────────── */}
      {renderReleaseNotice()}

      {/* ── Order Details Card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <h2 className="font-sans text-[15px] font-bold text-text-primary mb-4">
          訂單詳情
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="block font-sans text-[11px] uppercase text-text-disabled tracking-wider">
              卡牌名稱
            </span>
            <span className="block font-sans text-[14px] font-medium text-text-primary mt-0.5">
              {orderState.cardName}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[11px] uppercase text-text-disabled tracking-wider">
              評級
            </span>
            <span className="block font-mono text-[14px] text-text-primary mt-0.5">
              {orderState.cardGrade}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[11px] uppercase text-text-disabled tracking-wider">
              商品金額
            </span>
            <span className="block font-mono text-[14px] font-semibold text-text-primary mt-0.5">
              {formatCurrency(orderState.itemPrice)}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[11px] uppercase text-text-disabled tracking-wider">
              鑑定服務費
            </span>
            <span className="block font-mono text-[14px] text-text-secondary mt-0.5">
              {orderState.appraisalFee > 0
                ? formatCurrency(orderState.appraisalFee)
                : "—"}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[11px] uppercase text-text-disabled tracking-wider">
              實付總額
            </span>
            <span className="block font-mono text-[18px] font-bold text-brand mt-0.5">
              {formatCurrency(orderState.totalPaid)}
            </span>
          </div>
          <div>
            <span className="block font-sans text-[11px] uppercase text-text-disabled tracking-wider">
              訂單類型
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-sans text-[13px] text-text-primary">
                {orderState.orderKind === "merchant" ? "商戶訂單" : "個人訂單"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-sans px-1.5 py-0 rounded",
                  orderState.useAuthentication
                    ? "bg-brand/10 text-brand border-brand/30"
                    : "bg-bg-elevated text-text-secondary border-white/10",
                )}
              >
                {orderState.useAuthentication ? "已購鑑定服務" : "無鑑定服務"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logistics & Grading Console ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <h2 className="font-sans text-[15px] font-bold text-text-primary mb-4">
          物流與鑑定控制台
        </h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Inbound Tracking */}
          <div className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-4 text-brand" />
              <span className="font-sans text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                賣家速遞單號
              </span>
            </div>
            <span className="font-mono text-[14px] text-text-primary">
              {orderState.inboundTrackingNo ?? "尚未提供"}
            </span>
          </div>

          {/* Outbound Tracking */}
          <div className="rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="size-4 text-brand" />
              <span className="font-sans text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                平台速遞單號
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                placeholder="輸入 SF 速遞單號"
                value={outboundInput}
                onChange={(e) => setOutboundInput(e.target.value)}
                className="h-10 bg-bg-card border-white/10 text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40 font-mono"
              />
              <Button
                type="button"
                onClick={handleSaveOutbound}
                className="h-10 px-4 bg-brand text-[#17130f] hover:bg-brand-hover font-semibold text-xs active:scale-[0.98] transition-[color,background-color,transform] duration-150"
              >
                儲存
              </Button>
            </div>
          </div>
        </div>

        {/* Grading Status */}
        <div className="mt-6 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="size-4 text-brand" />
            <span className="font-sans text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
              鑑定狀態
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Badge
              variant="outline"
              className={cn(
                "text-[13px] px-3 py-1 rounded-lg border",
                gradingStatusBadgeClasses(orderState.gradingStatus),
              )}
            >
              {GRADING_STATUS_LABELS[orderState.gradingStatus]}
            </Badge>

            {orderState.gradingStatus === "pending_grading" && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handlePass}
                  className="min-h-[44px] h-10 px-4 bg-success text-[#17130f] hover:bg-success/90 font-bold text-xs active:scale-[0.98] transition-[color,background-color,transform] duration-150"
                >
                  <CheckCircle className="mr-1.5 size-4" />
                  鑑定通過 - 真品
                </Button>
                <Button
                  type="button"
                  onClick={handleFail}
                  className="min-h-[44px] h-10 px-4 bg-error text-[#17130f] hover:bg-error/90 font-bold text-xs active:scale-[0.98] transition-[color,background-color,transform] duration-150"
                >
                  <XCircle className="mr-1.5 size-4" />
                  鑑定不通過 - 偽品
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Escrow Progress Stepper ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <h2 className="font-sans text-[15px] font-bold text-text-primary mb-5">
          Escrow 資金釋放進度
        </h2>
        <div className="relative flex items-start justify-between">
          {ESCROW_STEPS.map((step, index) => {
            const isCompleted = index < activeStepIndex;
            const isActive = index === activeStepIndex;
            const isLast = index === ESCROW_STEPS.length - 1;

            return (
              <div
                key={step.key}
                className="relative flex flex-1 flex-col items-center"
              >
                {!isLast && (
                  <div
                    className={cn(
                      "absolute top-[10px] left-[50%] h-px w-full",
                      isCompleted ? "bg-success" : "bg-white/10",
                      !isCompleted && "border-t border-dashed border-white/10 bg-transparent",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex size-6 items-center justify-center rounded-full border text-[10px] font-bold transition-[color,background-color,border-color,transform] duration-150",
                    isCompleted
                      ? "border-success bg-success text-[#17130f]"
                      : isActive
                        ? "border-brand bg-brand text-[#17130f] animate-ring-pulse"
                        : "border-white/10 bg-bg-card text-text-disabled",
                  )}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span
                  className={cn(
                    "mt-2 text-center font-sans text-[11px]",
                    isCompleted || isActive
                      ? "text-text-primary"
                      : "text-text-disabled",
                    isActive && "font-semibold text-brand",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
