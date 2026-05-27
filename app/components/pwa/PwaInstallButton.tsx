"use client";

import { useMemo } from "react";
import { usePwaInstall } from "./pwa-install";

export function PwaInstallButton({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const { canInstall, isDismissed, isInstalled, promptInstall } = usePwaInstall();

  const shouldRender = useMemo(() => {
    return canInstall && !isInstalled && !isDismissed;
  }, [canInstall, isDismissed, isInstalled]);

  if (!shouldRender) return null;

  return (
    <button
      type="button"
      onClick={promptInstall}
      className={[
        "inline-flex items-center justify-center rounded-xl border border-[rgba(237,232,224,0.12)] bg-bg-card",
        "text-text-primary hover:bg-bg-elevated active:scale-[0.98] active:translate-y-px transition-transform",
        size === "sm"
          ? "h-10 px-3 font-sans text-[13px] font-semibold min-h-[44px]"
          : "h-11 px-4 font-sans text-[14px] font-semibold min-h-[44px]",
      ].join(" ")}
    >
      加到主畫面
    </button>
  );
}

