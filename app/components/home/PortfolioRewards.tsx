"use client";

import Link from "next/link";
import { useUIStore } from "@/app/store/useUIStore";

// TODO: [API] Fetch user portfolio value from Supabase — aggregate `user_portfolio` table card values in HKD
// TODO: [database] Create `user_portfolio` table with card_id, quantity, condition fields; compute HKD net worth via market price API
// TODO: [server] Daily check-in: Supabase Stored Procedure using `timezone('Asia/Hong_Kong', now())` — reject client timestamps
// TODO: [database] `user_check_ins` table: UNIQUE constraint on `(user_id, check_in_date)`, use `FOR UPDATE` row-level lock

const checkInDays = [
  { day: 1, completed: true, reward: "5 積分" },
  { day: 2, completed: true, reward: "5 積分" },
  { day: 3, completed: true, reward: "10 積分" },
  { day: 4, completed: true, reward: "10 積分" },
  { day: 5, completed: true, reward: "15 積分" },
  { day: 6, completed: false, reward: "15 積分" },
  { day: 7, completed: false, reward: "免運費券" },
];

export function PortfolioRewards() {
  const mockRole = useUIStore((state) => state.mockRole);
  const isLoggedIn =
    mockRole === "USER" || mockRole === "MERCHANT" || mockRole === "ADMIN";

  if (!isLoggedIn) {
    return (
      <section
        className="mb-8 rounded-[16px] bg-bg-card border border-[rgba(237,232,224,0.08)] p-6 text-center relative overflow-hidden"
        aria-labelledby="portfolio-heading"
      >
        {/* Frosted glass overlay */}
        <div className="absolute inset-0 bg-[rgba(23,19,15,0.60)] backdrop-blur-sm z-10" />
        <div className="relative z-20">
          <h2
            id="portfolio-heading"
            className="font-sans font-semibold text-[20px] text-text-primary mb-3"
          >
            我的卡盒身家
          </h2>
          <p className="font-sans text-[14px] text-text-secondary mb-4 max-w-[320px] mx-auto">
            防潮箱裡藏著多少寶藏？登入即刻啟用「AI
            身家計算器」，一秒估算你的卡牌港幣總價值！
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover"
          >
            登入 / 註冊
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mb-8 rounded-[16px] bg-bg-card border border-[rgba(237,232,224,0.08)] p-5"
      aria-labelledby="portfolio-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          id="portfolio-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          我的卡盒身家
        </h2>
        {mockRole !== "ADMIN" ? (
          <Link
            href={`/profile/${mockRole.toLowerCase()}`}
            className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
          >
            管理收藏 →
          </Link>
        ) : null}
      </div>

      <div className="lg:flex lg:gap-6">
        {/* Portfolio summary */}
        <div className="mb-4 lg:mb-0 lg:flex-1 flex flex-row gap-6 sm:gap-8 items-start">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[12px] text-text-secondary mb-1 truncate">
              總收藏估值 (HKD)
            </p>
            <p className="font-mono font-bold text-[24px] sm:text-[28px] text-text-primary truncate">
              HK$48,620
            </p>
            <span className="font-mono text-[12px] text-success block mt-1">
              ▲ 3.2% (本月)
            </span>
          </div>

          <div className="border-l border-[rgba(237,232,224,0.12)] pl-6 sm:pl-8 flex-1 min-w-0">
            <p className="font-mono text-[12px] text-text-secondary mb-1 truncate">
              持有卡牌數量
            </p>
            <p className="font-mono font-bold text-[24px] sm:text-[28px] text-text-primary truncate">
              142{" "}
              <span className="font-sans text-[13.5px] text-text-secondary font-medium">
                張
              </span>
            </p>
            <span className="font-mono text-[12px] text-brand block mt-1">
              ★ 頂級收藏家
            </span>
          </div>
        </div>

        {/* 7-day check-in */}
        {mockRole === "USER" ? (
          <div className="lg:flex-1">
            <p className="font-sans text-[13px] text-text-secondary mb-3">
              已連續簽到 5 日！第 7 日即可解鎖「全港免運費券」！
            </p>
            <div className="flex items-center gap-1">
              {checkInDays.map((d) => (
                <div
                  key={d.day}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-[8px] ${
                    d.completed
                      ? "bg-[rgba(16,185,129,0.10)]"
                      : "bg-[rgba(237,232,224,0.04)]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      d.completed
                        ? "bg-success text-[#17130f]"
                        : "border border-text-disabled text-text-disabled"
                    }`}
                  >
                    {d.completed ? "✓" : d.day}
                  </span>
                  <span className="font-mono text-[9px] text-text-secondary">
                    {d.reward}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
