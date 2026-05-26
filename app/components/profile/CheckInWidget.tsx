"use client";

import { useState } from "react";

const DAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

interface CheckInWidgetProps {
  readonly initialStreak?: number;
}

export function CheckInWidget({ initialStreak = 4 }: CheckInWidgetProps) {
  const [streak, setStreak] = useState(initialStreak);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const canCheckIn = !checkedInToday && streak < 7;
  const progressPct = Math.min((streak / 7) * 100, 100);

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-sans font-semibold text-[14px] text-text-primary">
            7天登入里程碑
          </h3>
          <p className="font-mono text-[11px] text-text-secondary mt-0.5">
            連續簽到 7 天獲得 500 積分
          </p>
        </div>
        <span className="font-mono text-[20px] font-semibold text-brand leading-none">
          {streak}
          <span className="font-mono text-[12px] text-text-disabled"> / 7</span>
        </span>
      </div>

      {/* Day grid */}
      <div className="flex gap-1.5 mb-3">
        {DAY_LABELS.map((day, i) => {
          const isDone = i < streak;
          const isToday = i === streak && !checkedInToday;
          return (
            <div
              key={day}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg transition-colors ${
                isDone
                  ? "bg-[rgba(212,165,116,0.15)]"
                  : isToday
                  ? "bg-[rgba(212,165,116,0.08)] border border-brand/30"
                  : "bg-bg-elevated"
              }`}
            >
              <span
                className={`font-mono text-[10px] leading-none ${
                  isDone || isToday ? "text-brand" : "text-text-disabled"
                }`}
              >
                {day}
              </span>
              {isDone ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d4a574"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="w-2 h-2 rounded-full bg-bg-hover" />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden mb-3"
        role="progressbar"
        aria-valuenow={streak}
        aria-valuemin={0}
        aria-valuemax={7}
      >
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* CTA */}
      {streak >= 7 ? (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[rgba(16,185,129,0.10)] rounded-lg border border-success/20">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-sans text-[12px] text-success">
            本週里程碑達成！已獲得 500 積分
          </span>
        </div>
      ) : canCheckIn ? (
        <button
          onClick={() => {
            // TODO [server]: Persist check-in to Supabase — call server action: supabase.from('user_streaks').upsert({ user_id, last_checkin: new Date(), streak_days: streak + 1 })
            // TODO [server]: Award points via server action: supabase.from('user_points').insert({ user_id, points: 50, reason: 'daily_checkin' })
            setStreak((s) => s + 1);
            setCheckedInToday(true);
          }}
          className="w-full h-11 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-lg active:scale-[0.98] active:translate-y-px transition-transform hover:bg-brand-hover"
        >
          今日簽到 · 獲得積分
        </button>
      ) : (
        <div className="flex items-center justify-center h-10 rounded-lg bg-bg-elevated">
          <span className="font-mono text-[12px] text-text-secondary">
            明天再來 · 保持連續紀錄 🔥
          </span>
        </div>
      )}
    </div>
  );
}
