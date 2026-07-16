"use client";

import { useEffect } from "react";
import {
  Progress,
} from "@/components/ui/progress";
import {
  useListingSubmitStore,
  type ListingSubmitMode,
} from "@/app/store/useListingSubmitStore";

function modeTitle(mode: ListingSubmitMode): string {
  return mode === "edit" ? "更新商品" : "上架商品";
}

function phaseIcon(phase: string): string {
  switch (phase) {
    case "success":
      return "✓";
    case "error":
      return "!";
    case "uploading":
      return "↑";
    case "saving":
      return "◆";
    default:
      return "…";
  }
}

export function ListingSubmitOverlay() {
  const isOpen = useListingSubmitStore((state) => state.isOpen);
  const mode = useListingSubmitStore((state) => state.mode);
  const phase = useListingSubmitStore((state) => state.phase);
  const statusMessage = useListingSubmitStore((state) => state.statusMessage);
  const progress = useListingSubmitStore((state) => state.progress);
  const currentImageIndex = useListingSubmitStore(
    (state) => state.currentImageIndex,
  );
  const totalImages = useListingSubmitStore((state) => state.totalImages);
  const error = useListingSubmitStore((state) => state.error);
  const reset = useListingSubmitStore((state) => state.reset);

  useEffect(() => {
    if (phase !== "success") return;

    const timer = window.setTimeout(() => {
      reset();
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [phase, reset]);

  if (!isOpen) return null;

  const isIndeterminate =
    phase === "validating" || (phase === "saving" && progress < 95);
  const displayProgress: number | null =
    phase === "success" ? 100 : isIndeterminate ? null : progress;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-submit-title"
      aria-busy={phase !== "success" && phase !== "error"}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-sm rounded-2xl border border-[rgba(237,232,224,0.12)] bg-[#2e2925] p-6 shadow-2xl animate-scaleUp">
        <div className="mb-5 flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-black ${
              phase === "success"
                ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]"
                : phase === "error"
                  ? "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] text-[#f87171]"
                  : "border-[rgba(212,165,116,0.35)] bg-[rgba(212,165,116,0.10)] text-brand"
            }`}
            aria-hidden="true"
          >
            {phaseIcon(phase)}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A8680]">
              {modeTitle(mode)}
            </p>
            <h2
              id="listing-submit-title"
              className="mt-1 font-sans text-[17px] font-bold text-[#eae1da]"
            >
              {statusMessage}
            </h2>
            {phase === "uploading" && totalImages > 0 && (
              <p className="mt-1 font-mono text-[11px] text-[#8A8680]">
                相片 {currentImageIndex} / {totalImages}
              </p>
            )}
            {phase === "error" && error && (
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#f87171]">
                {error}
              </p>
            )}
          </div>
        </div>

        {phase !== "error" && (
          <div className="space-y-2">
            <Progress
              value={displayProgress}
              className={`gap-0 [&_[data-slot=progress-indicator]]:bg-brand [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-[#17130f] ${
                isIndeterminate
                  ? "[&_[data-slot=progress-indicator]]:w-1/3 [&_[data-slot=progress-indicator]]:animate-pulse"
                  : ""
              }`}
            />
            <p className="text-right font-mono text-[11px] text-[#8A8680] tabular-nums">
              {phase === "success"
                ? "100%"
                : isIndeterminate
                  ? "處理中"
                  : `${progress}%`}
            </p>
          </div>
        )}

        {phase === "error" && (
          <button
            type="button"
            onClick={reset}
            className="mt-5 h-11 w-full rounded-xl border border-white/10 font-sans text-[14px] font-bold text-[#d4c4b7] transition-colors hover:bg-white/5"
          >
            關閉
          </button>
        )}
      </div>
    </div>
  );
}
