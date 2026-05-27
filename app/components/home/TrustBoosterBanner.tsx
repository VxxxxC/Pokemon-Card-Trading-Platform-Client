import Link from "next/link";

export function TrustBoosterBanner() {
  return (
    <section
      className="mt-6 rounded-[18px] border border-[rgba(237,232,224,0.08)] bg-bg-card overflow-hidden"
      aria-label="鑑定託管流程"
    >
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-sans text-[16px] font-semibold text-text-primary">
              鑑定託管 · 三步建立信任
            </p>
            <p className="mt-1 font-sans text-[13px] text-text-secondary">
              以中介驗證降低假卡風險，成交全程可追蹤。
            </p>
          </div>
          <Link
            href="/marketplace"
            className="shrink-0 font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
          >
            查看保障商品 →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Step
            index="01"
            title="支付訂金啟動流程"
            desc="先付 10–20% 訂金，鎖定交易意願。"
          />
          <Step
            index="02"
            title="實物細節鑑定確認"
            desc="4–6 張高清細節圖，放大檢視角位與表面。"
          />
          <Step
            index="03"
            title="自動扣尾數安全發貨"
            desc="鑑定通過後扣除餘額，系統釋放安全出貨。"
          />
        </div>
      </div>
    </section>
  );
}

function Step({ index, title, desc }: { index: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-page/35 px-4 py-4">
      <p className="font-mono text-[11px] text-brand tracking-widest">{index}</p>
      <p className="mt-1 font-sans text-[13px] font-semibold text-text-primary">
        {title}
      </p>
      <p className="mt-1 font-sans text-[12px] leading-relaxed text-text-secondary">
        {desc}
      </p>
    </div>
  );
}

