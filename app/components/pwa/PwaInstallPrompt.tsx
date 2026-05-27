"use client";

import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";

export function PwaInstallPrompt() {
  const { canInstall, onInstall, onDismiss } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <aside className="fixed bottom-20 right-4 z-50 max-w-xs rounded-2xl border border-[rgba(226,232,240,0.6)] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] lg:bottom-6">
      <p className="font-sans text-[14px] font-medium text-[#202124]">加到主畫面</p>
      <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#5F6368]">
        安裝 PokéTrade JP，快速查看即時成交與託管進度。
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="h-10 min-h-11 rounded-lg border border-[rgba(226,232,240,0.6)] px-3 font-sans text-[13px] font-medium text-[#5F6368] active:scale-[0.98] active:translate-y-px transition-transform"
        >
          稍後
        </button>
        <button
          type="button"
          onClick={onInstall}
          className="h-10 min-h-11 rounded-lg bg-[#2563EB] px-3 font-sans text-[13px] font-medium text-white active:scale-[0.98] active:translate-y-px transition-transform"
        >
          立即安裝
        </button>
      </div>
    </aside>
  );
}
