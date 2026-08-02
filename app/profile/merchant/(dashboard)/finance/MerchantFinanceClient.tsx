"use client";

import type { MerchantFinanceSettlement } from "@/app/actions/merchant-finance";
import {
  formatPayoutStatusLabel,
  getPayoutStatusBadgeClass,
} from "@/lib/admin-payouts/format";
import type { MerchantTransferPayoutStatus } from "@/lib/admin-payouts/types";
import { truncateStripeId } from "@/lib/stripe/display";
import Link from "next/link";
import { toast } from "sonner";

type MerchantFinanceClientProps = {
  stripeConnected: boolean;
  stripeAccountId: string | null;
  stripeAccountLabel: string | null;
  monthEarned: number;
  recentSettlements: MerchantFinanceSettlement[];
};

function formatSettlementDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function normalizePayoutStatus(status: string): MerchantTransferPayoutStatus {
  if (
    status === "pending" ||
    status === "processing" ||
    status === "paid" ||
    status === "failed"
  ) {
    return status;
  }
  return "pending";
}

async function copyStripeId(label: string, id: string) {
  try {
    await navigator.clipboard.writeText(id);
    toast.success(`已複製 ${label}`);
  } catch {
    toast.error("複製失敗");
  }
}

function formatTransferLabel(tx: MerchantFinanceSettlement): string {
  if (tx.stripeTransferId) {
    return truncateStripeId(tx.stripeTransferId);
  }
  if (tx.payoutStatus === "processing") {
    return "處理中";
  }
  return "—";
}

function SettlementRow({ tx, showTopBorder }: { tx: MerchantFinanceSettlement; showTopBorder: boolean }) {
  const payoutStatus = normalizePayoutStatus(tx.payoutStatus);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${showTopBorder ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
    >
      <span className="text-[16px] w-6 text-center shrink-0 mt-0.5" aria-hidden="true">
        💳
      </span>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/merchant/orderDetail/${tx.orderId}`}>
          <p className="font-sans text-[13px] font-medium text-text-primary truncate">
            {tx.orderNumber ? `#${tx.orderNumber}` : "商戶訂單撥款"}
            {tx.cardName ? ` · ${tx.cardName}` : ""}
          </p>
        </Link>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <p className="font-mono text-[11px] text-text-secondary">
            {formatSettlementDate(tx.paidAt)}
          </p>
          <span
            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${getPayoutStatusBadgeClass(payoutStatus)}`}
          >
            {formatPayoutStatusLabel(payoutStatus)}
          </span>
        </div>
        <p className="font-mono text-[10px] text-text-secondary mt-1.5">
          Transfer{" "}
          <span className="text-brand">{formatTransferLabel(tx)}</span>
          {tx.stripeTransferId ? (
            <button
              type="button"
              onClick={() => copyStripeId("Transfer ID", tx.stripeTransferId!)}
            >
              複製
            </button>
          ) : null}
        </p>
        <p className="font-mono text-[10px] text-text-secondary mt-0.5">
          Payment Intent{" "}
          <span className="text-brand">
            {truncateStripeId(tx.stripePaymentIntentId)}
          </span>
          {tx.stripePaymentIntentId ? (
            <button
              type="button"
              onClick={() =>
                copyStripeId("Payment Intent", tx.stripePaymentIntentId!)
              }
            >
              複製
            </button>
          ) : null}
        </p>
        <p className="font-mono text-[10px] text-text-disabled mt-1">
          {tx.commissionAmount != null
            ? `平台費 HK$ ${tx.commissionAmount.toLocaleString("zh-TW")} · 實收 HK$ ${tx.amount.toLocaleString("zh-TW")}`
            : `實收 HK$ ${tx.amount.toLocaleString("zh-TW")}`}
        </p>
        {tx.payoutStatus === "failed" && tx.payoutError ? (
          <p
            className="font-mono text-[10px] text-warning mt-1 truncate"
            title={tx.payoutError}
          >
            {tx.payoutError}
          </p>
        ) : null}
      </div>
      <p className="font-mono font-semibold text-[14px] shrink-0 text-text-primary">
        +HK$ {tx.amount.toLocaleString("zh-TW")}
      </p>
    </div>
  );
}

export function MerchantFinanceClient({
  stripeConnected,
  stripeAccountId,
  stripeAccountLabel,
  monthEarned,
  recentSettlements,
}: MerchantFinanceClientProps) {
  return (
    <>
      <section aria-labelledby="finance-summary-heading" className="mb-6">
        <h2 id="finance-summary-heading" className="sr-only">
          資金概覽
        </h2>
        <div className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.20)] p-5">
          <p className="font-mono text-[11px] text-text-secondary uppercase tracking-wider mb-2">
            本月撥款收入（已結算）
          </p>
          <p className="font-mono font-bold text-[32px] lg:text-[38px] leading-none text-brand mb-2">
            HK$ {monthEarned.toLocaleString("zh-TW")}
          </p>
          <p className="font-mono text-[11px] text-text-disabled">
            以平台訂單撥款記錄為準
          </p>
        </div>
      </section>

      <section aria-labelledby="tx-heading" className="mb-6">
        <h2 id="tx-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          近期撥款記錄
        </h2>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {recentSettlements.length === 0 ? (
            <p className="px-4 py-8 text-center font-mono text-[12px] text-text-secondary">
              尚無撥款記錄
            </p>
          ) : (
            recentSettlements.map((tx, i) => (
              <SettlementRow key={tx.orderId} tx={tx} showTopBorder={i > 0} />
            ))
          )}
        </div>
      </section>

      <section
        aria-labelledby="stripe-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(99,91,255,0.25)] p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[rgba(99,91,255,0.12)] border border-[rgba(99,91,255,0.25)] flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#635bff" aria-hidden="true">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 id="stripe-heading" className="font-sans font-semibold text-[16px] text-text-primary">
              Stripe Connect 帳戶
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={
                  stripeConnected
                    ? "inline-flex items-center gap-1 font-mono text-[11px] text-success bg-[rgba(16,185,129,0.12)] border border-success/20 px-2 py-0.5 rounded-full"
                    : "inline-flex items-center gap-1 font-mono text-[11px] text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full"
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${stripeConnected ? "bg-success" : "bg-brand"}`}
                  aria-hidden="true"
                />
                {stripeConnected ? "已連結 · Express 帳戶" : "待完成收款設定"}
              </span>
            </div>
            {stripeAccountLabel ? (
              <p className="font-mono text-[11px] text-text-secondary mt-1.5">
                帳戶 ID：{stripeAccountLabel}
              </p>
            ) : null}
          </div>
          {stripeConnected ? (
            <a
              href="/api/stripe/connect/dashboard"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#635bff] bg-[rgba(99,91,255,0.10)] px-2.5 py-1.5 rounded-md border border-[rgba(99,91,255,0.25)] font-bold hover:bg-[rgba(99,91,255,0.16)] transition-colors shrink-0"
            >
              管理 Stripe 收款 →
            </a>
          ) : (
            <a
              href="/api/stripe/connect/onboard"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-brand bg-brand/10 px-2.5 py-1.5 rounded-md border border-brand/20 font-bold hover:bg-brand/15 transition-colors shrink-0"
            >
              完成 Stripe 收款設定 →
            </a>
          )}
        </div>
        {stripeAccountId ? (
          <p className="sr-only">Stripe account id {stripeAccountId}</p>
        ) : null}
      </section>
    </>
  );
}
