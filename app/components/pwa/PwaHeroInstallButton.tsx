"use client";

import { usePwaInstall } from "@/app/lib/hooks/usePwaInstall";

export function PwaHeroInstallButton() {
  const { canInstall, onInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={onInstall}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[rgba(212,165,116,0.30)] bg-[rgba(212,165,116,0.08)] font-sans text-[12px] text-brand hover:bg-[rgba(212,165,116,0.16)] hover:border-brand active:scale-[0.97] transition-all"
      aria-label="加到主螢幕 — 安裝 PWA 應用程式"
    >
      <HomeScreenIcon />
      加到主螢幕
    </button>
  );
}

function HomeScreenIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
