"use client";

type MerchantFinanceClientProps = {
  stripeConnected: boolean;
  stripeAccountId: string | null;
  stripeAccountLabel: string | null;
};

// TODO: [server] Replace with Supabase query — fetch merchant's Stripe Connect payout summary via Stripe API (stripe.balance.retrieve for connected account)
const financeSummary = {
  totalEarned: 384_600,
};

// TODO: [database] Replace with Supabase query — fetch merchant's transaction history from `payout_transactions` table, ordered by date DESC
const transactions = [
  { id: "TXN-001", type: "payout" as const, desc: "Stripe 提款結算", amount: 45_000, date: "2025/5/15", status: "completed" as const },
  { id: "TXN-002", type: "sale" as const, desc: "Charizard ex SAR 成交", amount: 49_800, date: "2025/5/14", status: "completed" as const },
  { id: "TXN-003", type: "commission" as const, desc: "佣金扣減 (5%) — sv2a-182", amount: 2_490, date: "2025/5/14", status: "deducted" as const },
  { id: "TXN-004", type: "subsidy" as const, desc: "運費補貼 x3", amount: 600, date: "2025/5/13", status: "credited" as const },
  { id: "TXN-005", type: "sale" as const, desc: "Umbreon ex SAR 成交", amount: 38_200, date: "2025/5/13", status: "completed" as const },
  { id: "TXN-006", type: "commission" as const, desc: "佣金扣減 (5%) — sv6a-109", amount: 1_910, date: "2025/5/13", status: "deducted" as const },
  { id: "TXN-007", type: "payout" as const, desc: "Stripe 提款結算", amount: 32_000, date: "2025/5/10", status: "completed" as const },
];

type TxType = "payout" | "sale" | "commission" | "subsidy";
type TxStatus = "completed" | "deducted" | "credited";

const TX_ICON: Record<TxType, string> = {
  payout: "💳",
  sale: "🟢",
  commission: "🔴",
  subsidy: "🎁",
};

const TX_COLOR: Record<TxStatus, string> = {
  completed: "text-text-primary",
  deducted: "text-warning",
  credited: "text-success",
};

const TX_PREFIX: Record<TxStatus, string> = {
  completed: "+",
  deducted: "-",
  credited: "+",
};

export function MerchantFinanceClient({
  stripeConnected,
  stripeAccountId,
  stripeAccountLabel,
}: MerchantFinanceClientProps) {
  return (
    <>
      <section aria-labelledby="finance-summary-heading" className="mb-6">
        <h2 id="finance-summary-heading" className="sr-only">
          資金概覽
        </h2>
        <div className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.20)] p-5">
          <p className="font-mono text-[11px] text-text-secondary uppercase tracking-wider mb-2">
            本月總收入
          </p>
          <p className="font-mono font-bold text-[32px] lg:text-[38px] leading-none text-brand mb-2">
            ¥{financeSummary.totalEarned.toLocaleString("zh-TW")}
          </p>
          <p className="font-mono text-[11px] text-success">▲ +24% vs 上月</p>
        </div>
      </section>

      <section aria-labelledby="tx-heading" className="mb-6">
        <h2 id="tx-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          資金流水記錄
        </h2>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
            >
              <span className="text-[16px] w-6 text-center shrink-0" aria-hidden="true">
                {TX_ICON[tx.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                  {tx.desc}
                </p>
                <p className="font-mono text-[11px] text-text-secondary">{tx.date}</p>
              </div>
              <p className={`font-mono font-semibold text-[14px] shrink-0 ${TX_COLOR[tx.status]}`}>
                {TX_PREFIX[tx.status]}¥{tx.amount.toLocaleString("zh-TW")}
              </p>
            </div>
          ))}
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
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[12px] text-[#635bff] border border-[rgba(99,91,255,0.30)] rounded-xl hover:bg-[rgba(99,91,255,0.08)] transition-colors shrink-0"
            >
              前往 Stripe 管理收款
            </a>
          ) : (
            <a
              href="/api/stripe/connect/onboard"
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-[12px] text-brand border border-brand/30 rounded-xl hover:bg-brand/10 transition-colors shrink-0"
            >
              完成 Stripe 收款設定
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
