"use client";

import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";

/**
 * PWA Install Prompt with cooling-state defense & fallback UI.
 *
 * State A — NATIVE_READY:      Primary install button (brand color).
 * State B — BROWSER_COOLING:   Muted instructional card with manual install guide.
 * State C — ALREADY_INSTALLED: Hidden — zero layout footprint.
 */
export function PWAInstallPrompt() {
  const { promptState, onInstall } = usePwaInstall();

  // ── State C: ALREADY_INSTALLED — hide completely ──
  if (promptState === "ALREADY_INSTALLED") return null;

  // ── State A: NATIVE_READY — primary action button ──
  if (promptState === "NATIVE_READY") {
    return (
      <aside
        className="rounded-lg border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4"
        role="status"
        aria-label="PWA 安裝提示"
      >
        <button
          type="button"
          onClick={onInstall}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#d4a574] px-4 py-2.5 font-sans text-xs font-semibold text-[#17130f] transition-all hover:brightness-110 active:scale-[0.97] active:translate-y-px"
        >
          ⚡ 即刻安裝 PWA
        </button>
      </aside>
    );
  }

  // ── State B: BROWSER_COOLING — fallback instructional card ──
  return (
    <aside
      className="rounded-lg border border-[rgba(237,232,224,0.08)] bg-[#26211C] p-4"
      role="status"
      aria-label="PWA 安裝提示 — 瀏覽器冷卻期"
    >
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
