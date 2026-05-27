"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const STORAGE_KEY = "poketrade:demo-checkin-streak";

// TODO: [database] Implement `user_check_ins` + `user_streaks` and server-side procedure using DB time (Asia/Hong_Kong).
// TODO: [server] Prevent cheating: do not rely on frontend clock; enforce UNIQUE (user_id, check_in_date) + atomic transaction.
export function PortfolioAndRewards() {
  const [streak, setStreak] = useState(() => {
    if (typeof window === "undefined") return 0;
    const value = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
    return Number.isFinite(value) ? Math.max(0, Math.min(7, value)) : 0;
  });

  const nodes = useMemo(() => Array.from({ length: 7 }, (_, i) => i + 1), []);

  return (
    <section className="mt-10" aria-labelledby="portfolio-heading">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        <div className="rounded-[18px] border border-[rgba(237,232,224,0.08)] bg-bg-card px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="portfolio-heading"
                className="font-sans text-[18px] sm:text-[20px] font-semibold text-text-primary"
              >
                資產中樞 · 個人卡盒
              </h2>
              <p className="mt-1 font-sans text-[13px] text-text-secondary max-w-[62ch]">
                登入後可查看持倉與市價估值（示意）。首頁不展示任何虛構身家數字。
              </p>
            </div>
            <Link
              href="/profile/user"
              className="shrink-0 font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
            >
              前往卡盒 →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Metric label="持有卡牌" value="登入後顯示" />
            <Metric label="總身家（估值）" value="—" />
            <Metric label="今日波動" value="—" />
          </div>
        </div>

        <div className="rounded-[18px] border border-[rgba(237,232,224,0.08)] bg-bg-card px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-sans text-[16px] font-semibold text-text-primary">
                7 日簽到里程碑
              </p>
              <p className="mt-1 font-sans text-[13px] text-text-secondary">
                {streak >= 7
                  ? "已達成里程碑：解鎖運費補貼券（示意）。"
                  : `已連續簽到 ${streak} 日（示意）。第 7 日解鎖運費補貼券。`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = Math.min(7, streak + 1);
                setStreak(next);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(STORAGE_KEY, String(next));
                }
              }}
              className="shrink-0 h-10 min-h-[44px] px-4 rounded-xl bg-brand text-bg-page font-sans text-[13px] font-semibold hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform"
            >
              Demo 簽到
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            {nodes.map((day) => {
              const isActive = day === Math.min(7, streak + 1);
              const isDone = day <= streak;
              return (
                <div key={day} className="flex-1">
                  <div
                    className={[
                      "h-2 rounded-full",
                      isDone
                        ? "bg-success"
                        : isActive
                          ? "bg-brand animate-ring-pulse"
                          : "bg-bg-page/40",
                    ].join(" ")}
                    aria-label={`第 ${day} 日`}
                  />
                  <p className="mt-1 font-mono text-[10px] text-text-secondary text-center">
                    {day}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-3 font-mono text-[11px] text-text-disabled">
            上線後改為伺服器時間簽到（防止改時區與連點作弊）。
          </p>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-page/35 px-4 py-4">
      <p className="font-mono text-[11px] text-text-secondary">{label}</p>
      <p className="mt-1 font-sans text-[14px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}
