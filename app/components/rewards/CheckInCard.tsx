"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  executeDailyCheckIn,
  getCheckInProgram,
  getGamificationStats,
} from "@/app/actions/rewards";
import { useIsMemberPersonaActive } from "@/app/lib/hooks/useIsMemberPersonaActive";
import { useRewardNotificationStore } from "@/app/store/useRewardNotificationStore";
import type { CheckInProgramMemberView } from "@/lib/admin-check-in-program/types";
import {
  CHECK_IN_POINT_LADDER,
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
  /** Skip initial fetch when overview SSR already provided points. */
  initialPointsBalance?: number;
  /** Defer gamification stats until idle (streak / check-in state). */
  deferStatsLoad?: boolean;
};

function buildStepsFromProgram(program: CheckInProgramMemberView | null) {
  const rewards = program?.dailyRewards ?? CHECK_IN_POINT_LADDER;
  return Array.from({ length: 7 }, (_, idx) => {
    const dayNum = idx + 1;
    const points = rewards[dayNum] ?? CHECK_IN_POINT_LADDER[dayNum] ?? 10;
    const completionHint =
      dayNum === 7 && program?.completionPreview?.enabled === true;
    return {
      dayNum,
      points,
      label: dayNum === 7 ? (completionHint ? "大禮包+" : "大禮包") : `第${dayNum}天`,
    };
  });
}

export function CheckInCard({
  onStatsChange,
  initialPointsBalance,
  deferStatsLoad = false,
}: CheckInCardProps = {}) {
  const isMemberPersonaActive = useIsMemberPersonaActive();
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [userPoints, setUserPoints] = useState(initialPointsBalance ?? 0);
  const [program, setProgram] = useState<CheckInProgramMemberView | null>(null);
  const [isLoading, setIsLoading] = useState(initialPointsBalance === undefined);
  const [isStreakLoading, setIsStreakLoading] = useState(
    deferStatsLoad && initialPointsBalance !== undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const enqueueGrants = useRewardNotificationStore((s) => s.enqueue);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const checkInSteps = useMemo(() => buildStepsFromProgram(program), [program]);
  const programPaused = program !== null && !program.isActive;

  const loadProgram = useCallback(async () => {
    const result = await getCheckInProgram();
    if (result.success) {
      setProgram(result.data);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (initialPointsBalance === undefined) {
      setIsLoading(true);
    } else {
      setIsStreakLoading(true);
    }

    const result = await getGamificationStats();

    if (initialPointsBalance === undefined) {
      setIsLoading(false);
    } else {
      setIsStreakLoading(false);
    }

    if (!result.success) return;

    setUserPoints(result.data.pointsBalance);
    setConsecutiveDays(result.data.currentStreak);
    setHasCheckedIn(result.data.checkedInToday);
    onStatsChange?.({
      pointsBalance: result.data.pointsBalance,
      currentStreak: result.data.currentStreak,
      checkedInToday: result.data.checkedInToday,
    });
  }, [initialPointsBalance, onStatsChange]);

  useEffect(() => {
    if (!isMounted || !isMemberPersonaActive) return;

    const runLoad = () => {
      void loadProgram();
      void loadStats();
    };

    if (deferStatsLoad) {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(runLoad, { timeout: 2000 });
        return () => window.cancelIdleCallback(id);
      }

      const timer = setTimeout(runLoad, 1500);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(runLoad, 0);
    return () => clearTimeout(timer);
  }, [isMounted, isMemberPersonaActive, loadStats, loadProgram, deferStatsLoad]);

  if (!isMemberPersonaActive) {
    return null;
  }

  const handleCheckInExecute = async () => {
    if (hasCheckedIn || isSubmitting || programPaused) return;

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

    let toastDescription = `今日 +${result.data.pointsEarned} PTS · 連續 ${result.data.currentStreak} 天`;
    const completion = result.data.completionGranted;
    if (completion?.pointsGranted && completion.pointsGranted > 0) {
      const totalPts = result.data.pointsEarned + completion.pointsGranted;
      toastDescription = `今日 +${totalPts} PTS（含簽滿獎勵 +${completion.pointsGranted}）· 連續 ${result.data.currentStreak} 天`;
    }

    toast.success("簽到成功", {
      description: toastDescription,
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

  const steps = checkInSteps.length > 0 ? checkInSteps : CHECK_IN_STEPS;
  const todayCycleDay = getCheckInCycleDayFromStreak(
    hasCheckedIn ? consecutiveDays : consecutiveDays + 1,
  );
  const completedCount = hasCheckedIn ? todayCycleDay : todayCycleDay - 1;
  const streakReady = !isStreakLoading;

  return (
    <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] space-y-4">
      {programPaused ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          簽到暫停中，請稍後再試。
        </div>
      ) : null}

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
        {steps.map((step, idx) => {
          const isCompleted = streakReady && idx < completedCount;
          const isToday =
            streakReady && idx === completedCount && !hasCheckedIn && !isSubmitting;
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
        disabled={hasCheckedIn || isSubmitting || isStreakLoading || programPaused}
        onClick={() => void handleCheckInExecute()}
        className={`w-full h-11 rounded-xl font-sans font-bold text-[13px] transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer shadow-md ${
          hasCheckedIn || isSubmitting || isStreakLoading || programPaused
            ? "bg-[#17130f] border border-[rgba(237,232,224,0.06)] text-[#50453b] cursor-not-allowed"
            : "bg-brand text-[#1A1612] hover:bg-[#e8b896]"
        }`}
      >
        {programPaused
          ? "簽到暫停"
          : isStreakLoading
            ? "載入簽到狀態…"
            : hasCheckedIn
              ? "明日請繼續保持收藏習慣"
              : isSubmitting
                ? "簽到中…"
                : "立即簽到打卡獲取積分"}
      </button>
    </div>
  );
}
