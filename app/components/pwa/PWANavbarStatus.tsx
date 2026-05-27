"use client";

import { useState } from "react";
import { usePWAEnvironment } from "@/app/lib/hooks/usePWAEnvironment";

export function PWANavbarStatus() {
  const { isStandalone, isIOSBrowser, isBrowser } = usePWAEnvironment();
  const [showIOSHint, setShowIOSHint] = useState(false);

  // ── PWA APP state ──
  if (isStandalone) {
    return (
      <div className="h-8 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#26211C] border border-[rgba(237,232,224,0.06)]">
        <span className="w-2 h-2 rounded-full bg-[#d4a574] shadow-[0_0_8px_#d4a574] animate-pulse" />
        <span className="font-mono text-[11px] text-brand uppercase tracking-wider">
          PWA APP
        </span>
      </div>
    );
  }

  // ── iOS Browser state — show hint on click ──
  if (isIOSBrowser) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowIOSHint((v) => !v)}
          className="h-8 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#26211C] border border-[rgba(237,232,224,0.06)] transition-all duration-200 hover:border-[rgba(212,165,116,0.25)]"
          aria-label="iOS PWA 安裝提示"
          aria-expanded={showIOSHint}
        >
          <span className="w-2 h-2 rounded-full bg-[#d4a574]/60" />
          <span className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider">
            iOS PWA HINT
          </span>
        </button>

        {showIOSHint && (
          <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-[#26211C] border border-[rgba(237,232,224,0.10)] shadow-lg z-50">
            <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
              點擊瀏覽器底部的{" "}
              <span className="text-brand">📤 分享按鈕</span>，然後選擇
              <span className="text-brand font-medium">
                「加入主畫面」
              </span>
              以啟用全息終端 App
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Standard browser state ──
  if (isBrowser) {
    return (
      <div className="h-8 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#26211C] border border-[rgba(237,232,224,0.06)]">
        <span className="w-2 h-2 rounded-full bg-[#50453b]" />
        <span className="font-mono text-[11px] text-[#50453b] uppercase tracking-wider">
          BROWSER
        </span>
      </div>
    );
  }

  return null;
}
