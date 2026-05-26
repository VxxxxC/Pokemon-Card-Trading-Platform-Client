import Link from "next/link";

// TODO [MOCK DATA]: Replace with Supabase query — fetch platform stats from `platform_stats` or aggregate queries
const platformStats = [
  { label: "上架商品", value: "1,240+", icon: CardIcon },
  { label: "活躍交易者", value: "860+", icon: UsersIcon },
  { label: "已完成交易", value: "3,580+", icon: CheckIcon },
  { label: "交易保障率", value: "100%", icon: ShieldIcon },
];

export function PlatformStats() {
  return (
    <section className="mb-8" aria-labelledby="stats-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="stats-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          平台數據
        </h2>
        <Link
          href="/settings"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          了解更多 →
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {platformStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4 flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 rounded-full bg-[rgba(212,165,116,0.10)] flex items-center justify-center mb-3">
              <stat.icon />
            </div>
            <p className="font-mono font-semibold text-[20px] text-text-primary">
              {stat.value}
            </p>
            <p className="font-sans text-[12px] text-text-secondary mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
