"use client";

type ProductMarketDataEmptyPanelProps = {
  title: string;
  message: string;
  compact?: boolean;
  badge?: string;
};

export function ProductMarketDataEmptyPanel({
  title,
  message,
  compact = false,
  badge,
}: ProductMarketDataEmptyPanelProps) {
  return (
    <div
      className={`bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] ${
        compact ? "p-4" : "p-5"
      } space-y-3`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
          {title}
        </h3>
        {badge ? (
          <span className="font-mono text-[10px] text-brand uppercase font-bold shrink-0">
            {badge}
          </span>
        ) : null}
      </div>

      <div
        className={`flex flex-col items-center justify-center text-center ${
          compact ? "py-6" : "py-8"
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-brand/20 bg-[#1A1612]">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-brand/70"
            aria-hidden
          >
            <path d="M3 3v18h18" />
            <path d="M7 16l4-6 4 3 5-7" />
          </svg>
        </div>
        <p className="font-sans text-[13px] text-text-disabled max-w-sm leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}
