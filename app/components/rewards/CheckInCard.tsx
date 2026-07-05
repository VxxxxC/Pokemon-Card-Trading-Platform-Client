"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  executeDailyCheckIn,
  getGamificationStats,
} from "@/app/actions/rewards";
import { useRewardNotificationStore } from "@/app/store/useRewardNotificationStore";
import {
  CHECK_IN_STEPS,
  getCheckInCycleDayFromStreak,
} from "@/lib/constants/rewards";

export type CheckInCardStats = {
  pointsBalance: number;
  currentStreak: number;
  checkedInToday: boolean;
};

type CheckInCardProps = {
  onStatsChange?: (stats: CheckInCardStats) => void;
};

export function CheckInCard({ onStatsChange }: CheckInCardProps = {}) {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const enqueueGrants = useRewardNotificationStore((s) => s.enqueue);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    const result = await getGamificationStats();
    setIsLoading(false);

    if (!result.success) return;

    setUserPoints(result.data.pointsBalance);
    setConsecutiveDays(result.data.currentStreak);
    setHasCheckedIn(result.data.checkedInToday);
    onStatsChange?.({
      pointsBalance: result.data.pointsBalance,
      currentStreak: result.data.currentStreak,
      checkedInToday: result.data.checkedInToday,
    });
  }, [onStatsChange]);

  useEffect(() => {
    if (!isMounted) return;

    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isMounted, loadStats]);

  const handleCheckInExecute = async () => {
    if (hasCheckedIn || isSubmitting) return;

    setIsSubmitting(true);
    const result = await executeDailyCheckIn();
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setHasCheckedIn(true);
    setConsecutiveDays(result.data.currentStreak);
    setUserPoints(result.data.pointsBalance);
    onStatsChange?.({
      pointsBalance: result.data.pointsBalance,
      currentStreak: result.data.currentStreak,
      checkedInToday: true,
    });

    toast.success("簽到成功", {
      description: `今日 +${result.data.pointsEarned} PTS · 連續 ${result.data.currentStreak} 天`,
    });

    if (result.data.newlyGranted.length > 0) {
      enqueueGrants(result.data.newlyGranted);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="w-full h-48 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl animate-pulse animate-duration-1000" />
    );
  }

  const todayCycleDay = getCheckInCycleDayFromStreak(
    hasCheckedIn ? consecutiveDays : consecutiveDays + 1,
  );
  const completedCount = hasCheckedIn ? todayCycleDay : todayCycleDay - 1;

  return (
    <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex justify-between items-center border-b border-[rgba(237,232,224,0.06)] pb-3">
        <div className="space-y-0.5">
          <h3 className="font-sans font-black text-[15px] text-[#eae1da] flex items-center gap-1.5">
            每日簽到
          </h3>
        </div>
        <div className="text-right">
          <span className="font-mono text-[10px] text-[#d4c4b7] block">
            當前可用積分
          </span>
          <p className="font-mono font-black text-[18px] text-brand leading-none mt-0.5">
            {userPoints.toLocaleString()}{" "}
            <span className="text-[11px] font-sans font-bold">PTS</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
        {CHECK_IN_STEPS.map((step, idx) => {
          const isCompleted = idx < completedCount;
          const isToday = idx === completedCount && !hasCheckedIn && !isSubmitting;
          const isFuture = !isCompleted && !isToday;

          return (
            <div
              key={step.dayNum}
              className={`rounded-xl p-2.5 flex flex-col items-center justify-between border transition-all text-center min-h-[76px] ${
                isCompleted
                  ? "bg-[#10b981]/5 border-[#10b981]/30 text-[#10b981]"
                  : isToday
                    ? "bg-[rgba(212,165,116,0.08)] border-brand shadow-[0_0_12px_rgba(212,165,116,0.15)] text-brand"
                    : "bg-[#17130f] border-[rgba(237,232,224,0.06)] text-[#50453b]"
              }`}
            >
              <span
                className={`font-sans text-[10px] font-bold ${isFuture ? "text-[#50453b]" : ""}`}
              >
                {step.label}
              </span>

              <div className="my-1 flex items-center justify-center">
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span
                    className={`font-mono text-[11px] font-black ${isToday ? "text-brand" : isFuture ? "text-[#50453b]" : "text-[#d4c4b7]"}`}
                  >
                    +{step.points}
                  </span>
                )}
              </div>

              <span
                className={`font-mono text-[8.5px] uppercase tracking-wide block ${isCompleted ? "text-[#10b981]" : isToday ? "text-brand font-black animate-pulse" : "text-[#39342f]"}`}
              >
                {isCompleted ? "已簽" : isToday ? "今日" : "鎖定"}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={hasCheckedIn || isSubmitting}
        onClick={() => void handleCheckInExecute()}
        className={`w-full h-11 rounded-xl font-sans font-bold text-[13px] transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer shadow-md ${
          hasCheckedIn || isSubmitting
            ? "bg-[#17130f] border border-[rgba(237,232,224,0.06)] text-[#50453b] cursor-not-allowed"
            : "bg-brand text-[#1A1612] hover:bg-[#e8b896]"
        }`}
      >
        {hasCheckedIn
          ? "明日請繼續保持收藏習慣"
          : isSubmitting
            ? "簽到中…"
            : "立即簽到打卡獲取積分"}
      </button>
    </div>
  );
}
