"use client";

import { useState, useSyncExternalStore } from "react";

interface CheckInDay {
  dayNum: number;
  points: number;
  label: string;
}

const CHECK_IN_STEPS: CheckInDay[] = [
  { dayNum: 1, points: 10, label: "第1天" },
  { dayNum: 2, points: 15, label: "第2天" },
  { dayNum: 3, points: 20, label: "第3天" },
  { dayNum: 4, points: 25, label: "第4天" },
  { dayNum: 5, points: 30, label: "第5天" },
  { dayNum: 6, points: 40, label: "第6天" },
  { dayNum: 7, points: 100, label: "大禮包" },
];

export function CheckInCard() {
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
  const [consecutiveDays, setConsecutiveDays] = useState<number>(3); // 模擬已連續 3 天
  const [userPoints, setUserPoints] = useState<number>(380); // 模擬用戶初始積分

  // 利用 useSyncExternalStore 完美取代 useState + useEffect 隔離線！
  // 第一個參數是訂閱函數（這裏不需要訂閱外部 store，傳入空 no-op 即可）
  // 第二個參數是客戶端快照（Client 活化後回傳 true）
  // 第三個參數是服務端快照（Server SSR 生成時回傳 false）
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="w-full h-48 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl animate-pulse animate-duration-1000" />
    );
  }

  const handleCheckInExecute = () => {
    if (hasCheckedIn) return;

    const todayStep = CHECK_IN_STEPS[consecutiveDays];
    const rewardPoints = todayStep ? todayStep.points : 10;

    setHasCheckedIn(true);
    setConsecutiveDays((prev) => prev + 1);
    setUserPoints((prev) => prev + rewardPoints);

    alert(
      `⚡ 簽到成功！獲得今日獎勵 +${rewardPoints} 交易積分。連續簽到天數已拉伸至 ${consecutiveDays + 1} 天！`,
    );
  };

  return (
    <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] space-y-4">
      {/* 頂部資產快報 */}
      <div className="flex justify-between items-center border-b border-[rgba(237,232,224,0.06)] pb-3">
        <div className="space-y-0.5">
          <h3 className="font-sans font-black text-[15px] text-[#eae1da] flex items-center gap-1.5">
            🗓️ 每日靈魂簽到站
          </h3>
          <p className="font-mono text-[9px] text-[#8A8680] uppercase tracking-wider">
            TCG DAILY LOYALTY PROTOCOL
          </p>
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

      {/* 7天連續簽到步進網格 */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
        {CHECK_IN_STEPS.map((step, idx) => {
          // 狀態判定演算法
          const isCompleted = idx < consecutiveDays;
          const isToday = idx === consecutiveDays && !hasCheckedIn;
          const isFuture =
            idx > consecutiveDays || (idx === consecutiveDays && hasCheckedIn);

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

              {/* 積分與狀態圓核 */}
              <div className="my-1 flex items-center justify-center">
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
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

      {/* 執行打卡按鈕 */}
      <button
        type="button"
        disabled={hasCheckedIn}
        onClick={handleCheckInExecute}
        className={`w-full h-11 rounded-xl font-sans font-bold text-[13px] transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer shadow-md ${
          hasCheckedIn
            ? "bg-[#17130f] border border-[rgba(237,232,224,0.06)] text-[#50453b] cursor-not-allowed"
            : "bg-brand text-[#1A1612] hover:bg-[#e8b896]"
        }`}
      >
        {hasCheckedIn ? "✓ 明日請繼續保持收藏習慣" : "⚡ 立即簽到打卡獲取積分"}
      </button>
    </div>
  );
}
