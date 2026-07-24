"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  statusLabelMap,
  type DisputeCase,
  type DisputeStatus,
} from "../mockDisputes";

interface DisputeDetailClientProps {
  dispute: DisputeCase;
}

const ESCROW_STEPS: Array<{ key: DisputeCase["escrowStep"]; label: string }> = [
  { key: "payment", label: "付款" },
  { key: "custody", label: "保管中" },
  { key: "grading", label: "鑑定中" },
  { key: "shipped", label: "已發貨" },
  { key: "released", label: "已釋放" },
];

const STATUS_SELECT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "buyer_refunded", label: "全額退款給買家 (Refund Full)" },
  { value: "buyer_refunded_partial", label: "部分退款給買家 (Partial Refund)" },
  { value: "seller_released", label: "強制釋放款項給賣家 (Release to Seller)" },
  { value: "frozen", label: "標記完成並結案 (Mark Complete)" },
  { value: "ban", label: "強制封禁涉事違規帳號 (Ban Offending User)" },
];

function formatCurrency(n: number): string {
  return `HK$ ${n.toLocaleString("zh-HK")}`;
}

function cn(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function statusBadgeClasses(status: DisputeStatus): string {
  switch (status) {
    case "pending":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "investigating":
      return "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/20";
    case "buyer_refunded":
      return "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]/20";
    case "seller_released":
      return "bg-[rgba(212,165,116,0.12)] text-[#d4c4b7] border-white/10";
    case "frozen":
      return "bg-[#2e2925] text-[#8A8680] border-white/10";
    default:
      return "bg-[#2e2925] text-[#8A8680] border-white/10";
  }
}

function categoryBadgeClasses(category: DisputeCase["category"]): string {
  switch (category) {
    case "惡意欺詐":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "卡牌品相不符":
      return "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/20";
    case "誘導私下交易":
      return "bg-[rgba(16,185,129,0.10)] text-[#10b981] border-[#10b981]/20";
    case "物流爭議":
      return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
    default:
      return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
  }
}

function highlightSensitiveKeywords(text: string): React.ReactNode {
  const regex = /(PayMe|FPS|轉數快|WhatsApp|https?:\/\/\S+|[569]\d{3}[\s-]?\d{4})/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  text.replace(regex, (match, _group, offset) => {
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }
    parts.push(
      <span
        key={`${offset}-${match}`}
        className="rounded bg-[#ef4444]/10 px-1 text-[#ef4444]"
      >
        {match}
      </span>,
    );
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function DisputeDetailClient({
  dispute,
}: DisputeDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DisputeStatus>(dispute.status);
  const [action, setAction] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [auditLog, setAuditLog] = useState<DisputeCase["auditLog"]>(
    dispute.auditLog,
  );

  const activeStepIndex = useMemo(
    () => ESCROW_STEPS.findIndex((s) => s.key === dispute.escrowStep),
    [dispute.escrowStep],
  );

  // TODO: [Supabase Wiring] Replace mock data with real Supabase query / Server Action
  // Target Table: user_reports, orders, escrow_accounts | View / RPC: resolve_arbitration_case
  const handleSubmit = () => {
    if (!action) {
      toast.error("請先選擇仲裁判定動作。", {
        description: "你必須選擇一項最終裁定後才能執行。",
      });
      return;
    }
    if (!reason.trim()) {
      toast.error("請輸入仲裁裁決理由。", {
        description: "理由為必填項目，將寫入 Audit Log 存檔。",
      });
      return;
    }

    const selected = STATUS_SELECT_OPTIONS.find((o) => o.value === action);
    const label = selected?.label ?? action;

    let nextStatus = status;
    if (action === "buyer_refunded" || action === "buyer_refunded_partial") {
      nextStatus = "buyer_refunded";
    } else if (action === "seller_released") {
      nextStatus = "seller_released";
    } else if (action === "frozen") {
      nextStatus = "frozen";
    } else if (action === "ban") {
      nextStatus = "frozen";
    }

    setStatus(nextStatus);
    setAuditLog((prev) => [
      ...prev,
      {
        action: label,
        reason: reason.trim(),
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      },
    ]);

    toast.success(`案件 ${dispute.id} 已執行最終仲裁裁決`, {
      description: label,
    });

    setAction("");
    setReason("");
  };

  return (
    <div className="space-y-6">
      {/* ── Back Button ─────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/disputes")}
        className="text-[#d4c4b7] hover:bg-[#26211C] hover:text-[#eae1da] active:scale-[0.98]"
      >
        <ArrowLeft className="mr-1.5 size-4" />
        返回舉報與爭議列表
      </Button>

      {/* ── Case Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[18px] font-bold text-[#eae1da]">
              {dispute.id}
            </span>
            <Badge
              variant="outline"
              className={categoryBadgeClasses(dispute.category)}
            >
              {dispute.category}
            </Badge>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium",
                dispute.severity === "critical"
                  ? "border-[#ef4444]/20 bg-[#ef4444]/10 text-[#ef4444]"
                  : "border-white/10 bg-[#2e2925] text-[#d4c4b7]",
              )}
            >
              {dispute.severity === "critical" ? "緊急" : "一般"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={statusBadgeClasses(status)}>
              {statusLabelMap[status]}
            </Badge>
            <span className="font-sans text-[12px] text-[#8A8680]">
              提交於 {dispute.submittedAt}
            </span>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <h1 className="font-sans text-[20px] font-bold text-[#eae1da]">
            {dispute.cardName}
          </h1>
          <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#d4c4b7]">
            {dispute.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-sans text-[12px] text-[#8A8680]">
            <span>
              舉報方：<span className="text-[#d4c4b7]">{dispute.reporter}</span>
            </span>
            <span>
              被控方：
              <span className="text-[#d4c4b7]">
                {dispute.accused.name} {dispute.accused.handle}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[55fr_45fr]">
        {/* Left: Chat History */}
        <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              唯讀聊天室歷史
            </h2>
            <span className="font-mono text-[10px] text-[#8A8680]">
              {dispute.chatHistory.length} 則訊息
            </span>
          </div>
          <div className="space-y-4">
            {dispute.chatHistory.map((chat, index) => {
              if (chat.sender === "system") {
                return (
                  <div key={index} className="flex justify-center py-1">
                    <span className="max-w-[85%] rounded-full border border-white/[0.04] bg-[#1A1612] px-3 py-1 text-center font-sans text-[11px] italic text-[#8A8680]">
                      [系統 Escrow 通知] {chat.message} · {chat.timestamp}
                    </span>
                  </div>
                );
              }

              const isBuyer = chat.sender === "buyer";
              return (
                <div
                  key={index}
                  className={cn(
                    "flex max-w-[85%] flex-col",
                    isBuyer ? "mr-auto items-start" : "ml-auto items-end",
                  )}
                >
                  <span className="mb-0.5 px-1 font-mono text-[10px] text-[#8A8680]">
                    [{isBuyer ? "買家" : "賣家"}] {chat.name} · {chat.timestamp}
                  </span>
                  <div
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 font-sans text-[13px] leading-relaxed",
                      isBuyer
                        ? "rounded-tl-none border border-white/10 bg-[#2e2925] text-[#eae1da]"
                        : "rounded-tr-none border border-[#d4a574]/10 bg-[rgba(212,165,116,0.15)] text-[#eae1da]",
                    )}
                  >
                    {highlightSensitiveKeywords(chat.message)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Right Upper: Order & Escrow */}
          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              訂單與財務流水
            </h2>

            {/* Escrow Timeline */}
            <div className="my-5">
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
                            index < activeStepIndex
                              ? "bg-[#10b981]"
                              : "bg-white/10",
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex size-5 items-center justify-center rounded-full border text-[10px] font-bold",
                          isCompleted
                            ? "border-[#10b981] bg-[#10b981] text-[#111]"
                            : isActive
                              ? "border-[#d4a574] bg-[#d4a574] text-[#111]"
                              : "border-white/10 bg-[#26211C] text-[#8A8680]",
                        )}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-center font-sans text-[11px]",
                          isCompleted || isActive
                            ? "text-[#eae1da]"
                            : "text-[#8A8680]",
                          isActive && "font-semibold text-[#d4a574]",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-2">
              <div>
                <span className="block font-sans text-[11px] uppercase text-[#8A8680]">
                  卡牌名稱及評級
                </span>
                <span className="block font-sans text-[13px] font-medium text-[#eae1da]">
                  {dispute.cardName}
                </span>
              </div>
              <div>
                <span className="block font-sans text-[11px] uppercase text-[#8A8680]">
                  關聯訂單
                </span>
                <span className="block font-mono text-[13px] text-[#d4a574]">
                  {dispute.orderId}
                </span>
              </div>
              <div>
                <span className="block font-sans text-[11px] uppercase text-[#8A8680]">
                  Stripe Charge ID
                </span>
                <span
                  className="block truncate font-mono text-[13px] text-[#eae1da]"
                  title={dispute.stripeChargeId}
                >
                  {dispute.stripeChargeId}
                </span>
              </div>
              <div>
                <span className="block font-sans text-[11px] uppercase text-[#8A8680]">
                  託管金額
                </span>
                <span className="block font-mono text-[18px] font-semibold text-[#eae1da]">
                  {formatCurrency(dispute.escrowAmount)}
                </span>
              </div>
            </div>

            {/* Evidence */}
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <h3 className="font-sans text-[13px] font-bold text-[#eae1da]">
                佐證材料
              </h3>
              <ul className="mt-2 space-y-1.5">
                {dispute.evidence.photos.map((photo, index) => (
                  <li
                    key={index}
                    className="font-sans text-[12px] text-[#d4c4b7]"
                  >
                    <span className="mr-1 text-[#8A8680]">•</span>
                    {photo}
                  </li>
                ))}
                {dispute.evidence.videoUrl && (
                  <li className="font-sans text-[12px]">
                    <span className="mr-1 text-[#8A8680]">•</span>
                    影片證據：
                    <a
                      href={dispute.evidence.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 font-mono text-[#d4a574] underline underline-offset-2 hover:text-[#e8b896]"
                    >
                      {dispute.evidence.videoUrl}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Right Lower: Arbitration Actions */}
          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              仲裁判定動作
            </h2>
            <p className="mt-1 font-sans text-[12px] text-[#8A8680]">
              一旦做出最終裁定，款項將由 Stripe 釋放或全額返還，本操作無法撤銷。
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block font-sans text-[12px] font-medium text-[#d4c4b7]">
                  選擇仲裁結果
                </label>
                <Select
                  value={action}
                  onValueChange={(value) => setAction(value ?? "")}
                >
                  <SelectTrigger className="h-10 w-full border-white/10 bg-[#17130f] text-[#eae1da] data-placeholder:text-[#50453b]">
                    <SelectValue placeholder="請選擇一項仲裁判定動作" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#26211C]">
                    {STATUS_SELECT_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-[#d4c4b7]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block font-sans text-[12px] font-medium text-[#d4c4b7]">
                  仲裁裁決理由（必填 Audit Log 存檔）
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="請詳細說明仲裁理由，包括依據的證據與判斷..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#17130f] p-3 font-sans text-[13px] text-[#eae1da] placeholder:text-[#50453b] outline-none transition-all focus-visible:border-[#d4a574]/40 focus-visible:ring-2 focus-visible:ring-[#d4a574]/40"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="h-11 w-full bg-[#d4a574] text-[#111] hover:bg-[#e8b896] active:scale-[0.98]"
              >
                <span className="mr-2">⚖️</span>
                執行最終仲裁裁決
              </Button>
            </div>
          </div>

          {/* Audit Log */}
          <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
            <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
              審計紀錄
            </h2>
            {auditLog.length === 0 ? (
              <p className="mt-3 font-sans text-[12px] text-[#8A8680]">
                暫無審計紀錄。
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {auditLog.map((entry, index) => (
                  <li
                    key={index}
                    className="border-l-2 border-[#d4a574] bg-[#17130f] py-2 pl-3 pr-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[13px] font-medium text-[#eae1da]">
                        {entry.action}
                      </span>
                      <span className="font-mono text-[10px] text-[#8A8680]">
                        {entry.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-[12px] text-[#d4c4b7]">
                      {entry.reason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
