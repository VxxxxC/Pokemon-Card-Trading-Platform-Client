"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";
// 🟢 引入 UI Store 準備連動教學彈窗
import { useUIStore } from "@/app/store/useUIStore";

const SNOOZE_KEY = "pwa_snooze_until";

// 狀態訂閱雷達
function subscribeSnooze(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("poketrade:pwa-snooze-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("poketrade:pwa-snooze-changed", callback);
  };
}

export function PwaInlineBanner() {
  const { promptState, onInstall } = usePwaInstall();
  // 🟢 抽取全域 iOS PWA 彈窗控制 Action
  const openIosPwaModal = useUIStore((state) => state.openIosPwaModal);

  // 遵守工程標準指令：使用原生 useSyncExternalStore 精準隔離 SSR
  const isSnoozed = useSyncExternalStore(
    subscribeSnooze,
    () => {
      const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
      return Boolean(snoozeUntil && Date.now() < Number(snoozeUntil));
    },
    () => false, // 伺服器端預設為 false
  );

  // 🟢 核心安全連動線：利用與下面 return 完全同步的「外顯條件」作為守衛
  // 只有當確定不為 ALREADY_INSTALLED 且 isSnoozed 真正為 true（橫幅接力重光）時，才觸發自動彈出教學
  useEffect(() => {
    const isBannerPhysicallyVisible =
      promptState !== "ALREADY_INSTALLED" && isSnoozed;
    if (isBannerPhysicallyVisible) {
      openIosPwaModal();
    }
  }, [promptState, isSnoozed, openIosPwaModal]);

  // 完美維持老兄你原本極之正常的接力阻斷邏輯！
  if (promptState === "ALREADY_INSTALLED" || !isSnoozed) return null; //

  return (
    <div
      /* 🟢 順手對齊 v4 標準，將 bg-linear-to-r 拋光為標準的 bg-gradient-to-r */
      className="sticky top-14 lg:top-16 z-40 w-full bg-gradient-to-r from-[#d4a574] via-[#e2b98f] to-[#d4a574] text-[#17130f] shadow-[0_4px_20px_rgba(0,0,0,0.45)] border-b border-[rgba(23,19,15,0.15)] animate-fadeIn"
    >
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-8 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#17130f] text-brand text-[10px] font-black">
            !
          </span>
          <p className="font-sans text-[11.5px] lg:text-[12.5px] text-[#17130f] truncate font-bold tracking-tight">
            馬上安裝 PWA 手機 App 模式，解鎖極速實時看盤體驗！
          </p>
        </div>

        {/* 右側雙向動作按鈕卡槽 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 🟢 新增功能：翻看安裝教學按鈕 */}
          <button
            type="button"
            onClick={openIosPwaModal}
            className="h-6 px-2.5 bg-transparent hover:bg-[#17130f]/10 border border-[#17130f]/20 text-[#17130f] font-sans font-extrabold text-[10.5px] rounded-md transition-all active:scale-[0.96] cursor-pointer flex items-center justify-center gap-1 focus:outline-none"
          >
            📖 安裝教學
          </button>

          <button
            type="button"
            onClick={onInstall}
            className="shrink-0 h-6 px-3 bg-[#17130f] hover:bg-[#26211C] text-brand font-sans font-black text-[10.5px] rounded-md shadow-md transition-all active:scale-[0.96] cursor-pointer flex items-center justify-center gap-1"
          >
            ⚡ 立即啟用
          </button>
        </div>
      </div>
    </div>
  );
}
