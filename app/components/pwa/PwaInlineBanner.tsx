"use client";

import { useSyncExternalStore } from "react";
import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";
// 🟢 引入 UI Store 準備連動教學彈窗
import { useUIStore } from "@/app/store/useUIStore";

const SNOOZE_KEY = "pwa_snooze_until";

// 狀態訂閱雷達
function subscribeSnooze(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("hkcardvault:pwa-snooze-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("hkcardvault:pwa-snooze-changed", callback);
  };
}

export function PwaInlineBanner() {
  const { promptState, onInstall } = usePwaInstall();
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

  if (promptState === "ALREADY_INSTALLED" || !isSnoozed) return null; //

  return (
    <div className="sticky top-14 lg:top-16 z-40 w-full bg-gradient-to-r from-[#d4a574] via-[#e2b98f] to-[#d4a574] text-[#17130f] shadow-[0_4px_20px_rgba(0,0,0,0.45)] border-b border-[rgba(23,19,15,0.15)] animate-fadeIn">
      <div className="w-full p-4 flex flex-row flex-wrap content-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#17130f] text-brand text-[10px] font-black">
            !
          </span>
          <p className="font-sans text-[11.5px] lg:text-[12.5px] text-[#17130f] truncate font-bold tracking-tight">
            馬上安裝 PWA 手機 App 模式，解鎖極速實時看盤體驗！
          </p>
        </div>

        {/* NOTE: "NATIVE_READY" 代表Android、non-Safari */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              promptState === "NATIVE_READY" ? onInstall : openIosPwaModal
            }
            className="shrink-0 h-6 px-3 bg-[#17130f] hover:bg-[#26211C] text-brand font-sans font-black text-[10.5px] rounded-md shadow-md transition-all active:scale-[0.96] cursor-pointer flex items-center justify-center gap-1"
          >
            ⚡ 立即啟用
          </button>
        </div>
      </div>
    </div>
  );
}
