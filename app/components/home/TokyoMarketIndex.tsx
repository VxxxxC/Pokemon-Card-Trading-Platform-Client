import Link from "next/link";

type IndexCard = {
  id: string;
  name: string;
  referencePrice: number;
  trend: number[];
};

// TODO: [API] Replace with Mercari JP sold-out aggregation (Top 100) + cached sparkline points.
// TODO: [database] Store and serve precomputed `price_history` points for each card_id.
const TOKYO_INDEX: IndexCard[] = [
  { id: "idx-1", name: "ピカチュウ AR", referencePrice: 38500, trend: [32, 30, 31, 29, 28, 27, 28, 26] },
  { id: "idx-2", name: "リザードン ex SAR", referencePrice: 312000, trend: [22, 24, 23, 25, 26, 27, 28, 29] },
  { id: "idx-3", name: "ミュウツー ex SAR", referencePrice: 151000, trend: [40, 39, 38, 37, 36, 36, 35, 34] },
  { id: "idx-4", name: "ブラッキー ex SAR", referencePrice: 410000, trend: [18, 18, 19, 18, 17, 18, 19, 20] },
];

export function TokyoMarketIndex() {
  return (
    <section className="mt-10" aria-labelledby="tokyo-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="tokyo-heading"
            className="font-sans text-[18px] sm:text-[20px] font-semibold text-text-primary"
          >
            日本東京連線市價參考
          </h2>
          <p className="mt-1 font-sans text-[13px] text-text-secondary max-w-[70ch]">
            以已成交記錄作為公允價參考，移除硬核 K 線，僅保留淡淡趨勢線（示意）。
          </p>
        </div>
        <Link
          href="/marketplace"
          className="shrink-0 font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看行情 →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOKYO_INDEX.map((item) => (
          <div
            key={item.id}
            className="rounded-[18px] border border-[rgba(237,232,224,0.08)] bg-bg-card px-5 py-5"
          >
            <p className="font-sans text-[13px] font-semibold text-text-primary truncate">
              {item.name}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-[14px] font-semibold text-text-primary">
                ¥{item.referencePrice.toLocaleString("ja-JP")}
              </p>
              <Sparkline points={item.trend} />
            </div>
            <p className="mt-2 font-mono text-[11px] text-text-secondary">
              Tokyo Ref · Sold-Out Avg
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const width = 88;
  const height = 22;
  const padding = 2;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((p - min) / range) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-brand opacity-90"
      />
    </svg>
  );
}

