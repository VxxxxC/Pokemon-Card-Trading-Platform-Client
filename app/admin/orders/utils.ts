import type {
  AdminOrderStatus,
  GradingStatus,
  OrderSellerPersona,
} from "./types";
import {
  ORDER_STATUS_LABELS,
  GRADING_STATUS_LABELS,
  PERSONA_LABELS,
} from "./mockOrders";

export function formatCurrency(n: number): string {
  return `HK$ ${n.toLocaleString("zh-HK")}`;
}

export function orderStatusBadgeClasses(status: AdminOrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[#f59e0b]/20";
    case "custody":
      return "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/20";
    case "grading":
      return "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[#f59e0b]/20";
    case "shipped":
      return "bg-[rgba(59,130,246,0.12)] text-[#3b82f6] border-[#3b82f6]/20";
    case "completed":
      return "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]/20";
    case "cancelled":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    default:
      return "bg-[#2e2925] text-text-secondary border-white/10";
  }
}

export function orderStatusLabel(status: AdminOrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function gradingStatusBadgeClasses(status: GradingStatus): string {
  switch (status) {
    case "pending_grading":
      return "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[#f59e0b]/20";
    case "passed_authentic":
      return "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]/20";
    case "failed_fake":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "not_applicable":
      return "bg-[#2e2925] text-text-secondary border-white/10";
    default:
      return "bg-[#2e2925] text-text-secondary border-white/10";
  }
}

export function gradingStatusLabel(status: GradingStatus): string {
  return GRADING_STATUS_LABELS[status];
}

export function personaBadgeClasses(persona: OrderSellerPersona): string {
  return persona === "merchant"
    ? "bg-brand/10 text-brand border-brand/30"
    : "bg-bg-elevated text-text-secondary border-white/10";
}

export function personaLabel(persona: OrderSellerPersona): string {
  return PERSONA_LABELS[persona];
}
