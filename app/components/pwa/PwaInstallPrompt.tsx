"use client";

import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";

/**
 * Floating PWA install prompt with cooling-state defense.
 * Uses the shared state machine from usePwaInstall.
 */
export function PwaInstallPrompt() {
  const { promptState, onInstall } = usePwaInstall();

  // State C: Already installed — hide completely
  if (promptState === "ALREADY_INSTALLED") return null;

  // State A: Native prompt ready — primary install button
  if (promptState === "NATIVE_READY") {
    return (
      <aside className="fixed bottom-20 right-4 z-50 max-w-xs rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4 shadow-lg lg:bottom-6">
        <p className="font-sans text-[14px] font-medium text-text-primary">
          加到主畫面
        </p>
        <p className="mt-1 font-sans text-[13px] leading-relaxed text-text-secondary">
          安裝 PokéTrade JP，快速查看即時成交與託管進度。
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onInstall}
            className="flex items-center justify-center gap-2 rounded-md bg-[#d4a574] px-4 py-2.5 font-sans text-xs font-semibold text-[#17130f] transition-all hover:brightness-110 active:scale-[0.98] active:translate-y-px"
          >
            ⚡ 即刻安裝 PWA
          </button>
        </div>
      </aside>
    );
  }

  // State B: Browser cooling — fallback instructional card
  return (
    <aside className="fixed bottom-20 right-4 z-50 max-w-xs rounded-2xl border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4 shadow-lg lg:bottom-6">
      <p className="font-sans text-xs leading-relaxed text-[#d4c4b7]">
        提示：系統偵測到安裝事件正處於瀏覽器安全冷卻期。您亦可直接點擊瀏覽器網址列右側的{" "}
        <span className="inline-block" aria-hidden="true">
          📥
        </span>{" "}
        (或{" "}
        <span className="inline-block" aria-hidden="true">
          🖥️
        </span>
        ) 圖標進行手動安裝。
      </p>
    </aside>
  );
}
