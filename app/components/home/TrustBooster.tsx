// Spec Section 2: Trust Booster Banner — 3-step How It Works

function DepositIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function InspectIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ShipIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

const steps = [
  {
    icon: DepositIcon,
    step: "1",
    title: "支付訂金啟動",
    description: "支付 10-20% 訂金，資金安全鎖定於 Stripe 託管帳戶",
  },
  {
    icon: InspectIcon,
    step: "2",
    title: "官方實體鑑定",
    description: "賣家上傳 4-6 張細節高清實物照片，專業鑑定確認品質",
  },
  {
    icon: ShipIcon,
    step: "3",
    title: "自動扣尾款發貨",
    description: "鑑定通過後系統自動扣除餘額，安全包裝即時發貨",
  },
];

export function TrustBooster() {
  return (
    <section className="mb-8" aria-labelledby="trust-heading">
      <h2
        id="trust-heading"
        className="font-sans font-semibold text-[20px] text-text-primary mb-4"
      >
        鑑定託管流程
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div
            key={s.step}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-5 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-full bg-[rgba(212,165,116,0.08)] flex items-center justify-center mb-3 relative">
              <s.icon />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand text-[#17130f] font-mono text-[11px] font-bold flex items-center justify-center">
                {s.step}
              </span>
            </div>
            <h3 className="font-sans font-semibold text-[15px] text-text-primary mb-1">
              {s.title}
            </h3>
            <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
              {s.description}
            </p>
          </div>
        ))}
      </div>
      {/* Connector line for desktop */}
      <div className="hidden sm:flex items-center justify-center mt-3">
        <div className="flex items-center gap-1 font-mono text-[11px] text-text-disabled">
          <span>訂金鎖定</span>
          <span className="text-brand">→</span>
          <span>實物鑑定</span>
          <span className="text-brand">→</span>
          <span>安全發貨</span>
        </div>
      </div>
    </section>
  );
}
