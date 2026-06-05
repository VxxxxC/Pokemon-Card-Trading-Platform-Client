"use client";

import { useSyncExternalStore } from "react";
import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";

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

  // 遵守工程標準指令：使用原生 useSyncExternalStore 精準隔離 SSR，完全杜絕級聯重繪
  const isSnoozed = useSyncExternalStore(
    subscribeSnooze,
    () => {
      const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
      return Boolean(snoozeUntil && Date.now() < Number(snoozeUntil));
    },
    () => false,
  );

  if (promptState === "ALREADY_INSTALLED" || !isSnoozed) return null;

  return (
    <div
      /* 🟢 核心修正 1：精密計算響應式 Sticky 位移 (對齊頂導航高度)，z-40 確保位於下拉選單後方但高於主大盤 */
      /* 🟢 核心修正 2：換上極致吸睛的流金漸變 bg-linear-to-r，搭配強烈的下墜陰影 */
      className="sticky top-14 lg:top-16 z-40 w-full bg-linear-to-r from-[#d4a574] via-[#e2b98f] to-[#d4a574] text-[#17130f] shadow-[0_4px_20px_rgba(0,0,0,0.45)] border-b border-[rgba(23,19,15,0.15)] animate-fadeIn"
    >
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-8 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {/* 高反差極黑提示圓點 */}
          <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#17130f] text-brand text-[10px] font-black">
            !
          </span>
          {/* 金融高對比黑體字，商品名稱特別加粗底線 */}
          <p className="font-sans text-[11.5px] lg:text-[12.5px] text-[#17130f] truncate font-bold tracking-tight">
            馬上安裝PWA手機App模式，享受流暢體驗！
          </p>
        </div>

        {/* 反向黑底金字的高亮動作按鈕 */}
        <button
          type="button"
          onClick={onInstall}
          className="shrink-0 h-6 px-3 bg-[#17130f] hover:bg-[#26211C] text-brand font-sans font-black text-[10.5px] rounded-md shadow-md transition-all active:scale-[0.96] cursor-pointer flex items-center justify-center gap-1"
        >
          ⚡ 立即啟用
        </button>
      </div>
    </div>
  );
}
