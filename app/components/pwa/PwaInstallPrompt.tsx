"use client";

import { useEffect, useMemo } from "react";
import { type DeferredPromptEvent, usePwaInstall } from "./pwa-install";

export function PwaInstallPrompt() {
  const { canInstall, dismiss, isDismissed, isInstalled, promptInstall, setDeferredPrompt } =
    usePwaInstall();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [setDeferredPrompt]);

  const shouldRender = useMemo(() => {
    return !isInstalled && !isDismissed && canInstall;
  }, [canInstall, isDismissed, isInstalled]);

  if (!shouldRender) return null;

  return (
    <aside className="fixed bottom-20 right-4 z-50 max-w-xs rounded-2xl border border-[rgba(237,232,224,0.12)] bg-bg-elevated p-4 shadow-[0_8px_28px_rgba(0,0,0,0.55)] lg:bottom-6">
      <p className="font-sans text-[14px] font-semibold text-text-primary">加到主畫面</p>
      <p className="mt-1 font-sans text-[13px] leading-relaxed text-text-secondary">
        安裝 PokéTrade JP，以更快速度查看成交動態與託管進度。
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="h-10 min-h-11 rounded-lg border border-[rgba(237,232,224,0.12)] px-3 font-sans text-[13px] font-medium text-text-secondary hover:bg-bg-hover active:scale-[0.98] active:translate-y-px transition-transform"
        >
          稍後
        </button>
        <button
          type="button"
          onClick={promptInstall}
          className="h-10 min-h-11 rounded-lg bg-brand px-3 font-sans text-[13px] font-semibold text-bg-page hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform"
        >
          立即安裝
        </button>
      </div>
    </aside>
  );
}
