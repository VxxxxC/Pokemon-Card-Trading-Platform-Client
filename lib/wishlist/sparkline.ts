import type { MarketplacePriceChartPoint } from "@/app/lib/marketplace/types";

export function getSparklinePoints(
  chartPoints: MarketplacePriceChartPoint[],
  width = 64,
  height = 32,
): string {
  if (!chartPoints || chartPoints.length < 2) {
    return `0,${height / 2} ${width},${height / 2}`;
  }

  const prices = chartPoints.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min === 0 ? 1 : max - min;

  return chartPoints
    .map((point, index) => {
      const x = (index / (chartPoints.length - 1)) * width;
      const y = height - ((point.price - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function hasWishlistTrendData(
  trend30d: number | null,
  chartPoints: MarketplacePriceChartPoint[],
): boolean {
  return trend30d != null && chartPoints.length >= 2;
}
