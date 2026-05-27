// TODO: [server] Trust flow steps should be configurable via CMS/admin panel in Supabase

const steps = [
  {
    number: "1",
    title: "支付港幣訂金",
    description: "支付 10-20% 港幣訂金啟動鑑定流程",
    icon: ShieldIcon,
  },
  {
    number: "2",
    title: "官方實體鑑定",
    description: "4-6 張細節圖確認卡牌真偽與品相",
    icon: CheckIcon,
  },
  {
    number: "3",
    title: "安全發貨",
    description: "系統自動扣尾數，安全發貨到手",
    icon: TruckIcon,
  },
];

export function TrustBanner() {
  return (
    <section
      className="mb-8 rounded-[16px] bg-bg-card border border-[rgba(237,232,224,0.08)] px-5 py-6 lg:px-8"
      aria-labelledby="trust-heading"
    >
      <h2
        id="trust-heading"
        className="font-sans font-semibold text-[16px] text-text-primary mb-5 text-center"
      >
        鑑定託管・三步即享安心交易
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[rgba(212,165,116,0.10)] border border-[rgba(212,165,116,0.15)] flex items-center justify-center mb-3">
                <Icon />
              </div>
              <div className="font-mono text-[11px] text-brand mb-1">
                步驟 {step.number}
              </div>
              <h3 className="font-sans font-semibold text-[14px] text-text-primary mb-1">
                {step.title}
              </h3>
              <p className="font-sans text-[12px] text-text-secondary leading-relaxed max-w-[200px]">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2 2h11" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
