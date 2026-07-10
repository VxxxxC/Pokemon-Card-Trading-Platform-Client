type PriceSpreadBadgeProps = {
  priceVsMarketPct: number | null | undefined;
  className?: string;
};

export function formatPriceSpreadLabel(
  priceVsMarketPct: number | null | undefined,
): string | null {
  if (priceVsMarketPct == null || priceVsMarketPct === 0) {
    return null;
  }

  const sign = priceVsMarketPct < 0 ? "▼" : "▲";
  return `${sign} ${Math.abs(priceVsMarketPct).toFixed(1)}%`;
}

export function PriceSpreadBadge({
  priceVsMarketPct,
  className = "",
}: PriceSpreadBadgeProps) {
  const label = formatPriceSpreadLabel(priceVsMarketPct);
  if (!label) {
    return null;
  }

  const colorClass =
    priceVsMarketPct != null && priceVsMarketPct < 0
      ? "text-[#10b981]"
      : "text-[#ef4444]";

  return (
    <span
      className={`font-mono whitespace-nowrap flex items-center gap-0.5 ${colorClass} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
