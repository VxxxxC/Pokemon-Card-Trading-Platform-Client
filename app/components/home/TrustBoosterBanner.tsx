/**
 * Trust Booster Banner (Section 2 from HKcardvault spec)
 * 信任基礎：鑑定託管流程懶人包 (Trust Booster Banner)
 *
 * Displays the 3-step escrow process to build trust:
 * 1. Pay 10-20% deposit to start → 2. Official grading with 4-6 detail photos → 3. Auto-deduct balance & ship
 */

export function TrustBoosterBanner() {
  const steps = [
    {
      number: "1",
      title: "支付訂金",
      description: "10-20% 啟動託管",
    },
    {
      number: "2",
      title: "官方鑑定",
      description: "4-6 張細節圖確認",
    },
    {
      number: "3",
      title: "自動扣款",
      description: "安全發貨到手",
    },
  ];

  return (
    <section
      className="bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] p-6 lg:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.30)]"
      aria-labelledby="trust-booster-heading"
    >
      <h2
        id="trust-booster-heading"
        className="font-sans font-semibold text-[18px] lg:text-[20px] text-text-primary text-center mb-6"
      >
        安心交易流程
      </h2>

      {/* 3-step horizontal flow */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        {steps.map((step, idx) => (
          <div key={step.number} className="flex items-start gap-3 sm:flex-1">
            {/* Step circle */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(212,165,116,0.15)] shrink-0">
              <span className="font-mono font-semibold text-[16px] text-brand">
                {step.number}
              </span>
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-sans font-semibold text-[14px] text-text-primary mb-1">
                {step.title}
              </h3>
              <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow connector (desktop only, not after last step) */}
            {idx < steps.length - 1 && (
              <div className="hidden sm:flex items-center mx-2 shrink-0">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-brand opacity-40"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 5L12.5 10L7.5 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optional CTA or info text */}
      <div className="mt-6 pt-5 border-t border-[rgba(237,232,224,0.08)]">
        <p className="font-sans text-[13px] text-text-secondary text-center">
          平台作為專業中介，確保買賣雙方安全交易
        </p>
      </div>
    </section>
  );
}
