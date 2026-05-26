"use client";

import Link from "next/link";

// Spec Section 6: Portfolio & Daily Rewards — personal card box + 7-day check-in
// TODO [MOCK DATA]: Replace with Supabase query — aggregate user's card collection value from card_catalog market prices
// TODO [BACKEND]: Check-in must use server-side timezone('Asia/Hong_Kong', now()) — reject client timestamps
// TODO [BACKEND]: user_check_ins table needs UNIQUE(user_id, check_in_date) constraint + FOR UPDATE row lock

const checkInDays = [
  { day: 1, reward: "5 積分", completed: true },
  { day: 2, reward: "10 積分", completed: true },
  { day: 3, reward: "15 積分", completed: true },
  { day: 4, reward: "20 積分", completed: true },
  { day: 5, reward: "25 積分", completed: true },
  { day: 6, reward: "30 積分", completed: false },
  { day: 7, reward: "全台免運費券", completed: false },
];

export function PortfolioDashboard() {
  // TODO [BACKEND]: Check auth state — show login prompt if not authenticated
  const isLoggedIn = false;

  return (
    <section className="mb-8" aria-labelledby="portfolio-heading">
      <h2
        id="portfolio-heading"
        className="font-sans font-semibold text-[20px] text-text-primary mb-4"
      >
        個人卡盒 & 每日簽到
      </h2>

      {!isLoggedIn ? (
        /* Logged-out state: show teaser */
        <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-6 text-center">
          <p className="font-sans text-[14px] text-text-secondary mb-3">
            登入即可查看你的卡牌收藏總身家，並參與每日簽到獲取獎勵
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-10 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] transition-transform hover:bg-brand-hover min-h-[44px]"
          >
            立即登入
          </Link>
        </div>
      ) : (
        /* Logged-in state: show dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
          {/* Left: Portfolio value */}
          <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-5">
            <p className="font-sans text-[13px] text-text-secondary mb-1">
              收藏總身家
            </p>
            {/* TODO [MOCK DATA]: Replace with real calculated portfolio value */}
            <p className="font-mono font-bold text-[28px] text-text-primary">
              ¥248,500
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[12px] text-success">
                ▲ ¥12,300 (5.2%)
              </span>
              <span className="font-mono text-[11px] text-text-disabled">
                過去 7 日
              </span>
            </div>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 text-center bg-[rgba(212,165,116,0.06)] rounded-[8px] py-2">
                <p className="font-mono text-[16px] text-text-primary font-medium">23</p>
                <p className="font-sans text-[11px] text-text-disabled">持有卡牌</p>
              </div>
              <div className="flex-1 text-center bg-[rgba(212,165,116,0.06)] rounded-[8px] py-2">
                <p className="font-mono text-[16px] text-text-primary font-medium">8</p>
                <p className="font-sans text-[11px] text-text-disabled">完成交易</p>
              </div>
            </div>
          </div>

          {/* Right: 7-day check-in */}
          <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans text-[13px] text-text-secondary">
                每日簽到
              </p>
              <span className="font-mono text-[11px] text-brand">
                🔥 已連續簽到 5 日！
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {checkInDays.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-medium border transition-colors ${
                      d.completed
                        ? "bg-brand text-[#17130f] border-brand"
                        : d.day === 6
                          ? "border-brand text-brand animate-ring-pulse"
                          : "border-[rgba(237,232,224,0.12)] text-text-disabled"
                    }`}
                  >
                    {d.completed ? "✓" : d.day}
                  </div>
                  <span className="font-sans text-[9px] text-text-disabled text-center leading-tight max-w-[40px]">
                    {d.reward}
                  </span>
                </div>
              ))}
            </div>
            <p className="font-sans text-[11px] text-text-secondary mt-3 text-center">
              第 7 日即可解鎖「全台免運費券」！
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
