import Link from "next/link";

// TODO: [API] Fetch Tokyo market reference data from Apify scraper — Mercari JP sold-out prices converted to HKD
// TODO: [server] Edge Function: daily exchange rate cache (HKD to JPY), serve via memory cache for high-concurrency reads
// TODO: [database] Store scraped Mercari sold prices in `mercari_price_history` table with IQR-cleaned averages

const marketRefs = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    hkPrice: "HK$4,280",
    jpPrice: "¥82,500",
    trend: "up" as const,
    trendPct: "+3.2%",
    volume: "128 筆",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    hkPrice: "HK$5,120",
    jpPrice: "¥98,000",
    trend: "down" as const,
    trendPct: "-1.8%",
    volume: "87 筆",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    hkPrice: "HK$3,380",
    jpPrice: "¥64,500",
    trend: "up" as const,
    trendPct: "+5.1%",
    volume: "95 筆",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    hkPrice: "HK$2,560",
    jpPrice: "¥49,000",
    trend: "up" as const,
    trendPct: "+2.7%",
    volume: "72 筆",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    hkPrice: "HK$680",
    jpPrice: "¥13,200",
    trend: "down" as const,
    trendPct: "-0.5%",
    volume: "215 筆",
  },
];

export function TokyoMarketIndex() {
  return (
    <section className="mb-8" aria-labelledby="tokyo-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="tokyo-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          日本東京連線市價參考
        </h2>
        <Link
          href="/marketplace?view=market-index"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          完整行情 →
        </Link>
      </div>

      <div className="bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.30)] overflow-hidden">
        {/* Header row */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-[rgba(237,232,224,0.08)]">
          <span className="font-mono text-[11px] text-text-disabled">卡牌</span>
          <span className="font-mono text-[11px] text-text-disabled text-right w-[90px]">港幣參考</span>
          <span className="font-mono text-[11px] text-text-disabled text-right w-[80px]">日圓成交</span>
          <span className="font-mono text-[11px] text-text-disabled text-right w-[70px]">成交量</span>
        </div>

        {marketRefs.map((ref, i) => (
          <Link
            key={ref.id}
            href={`/marketplace?card=${ref.id}`}
            className={`flex items-center justify-between sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-3 hover:bg-bg-elevated transition-colors ${
              i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""
            }`}
          >
            {/* Card info */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded-[4px] shrink-0">
                {ref.id}
              </span>
              <span className="font-sans text-[13px] text-text-primary truncate">
                {ref.name}
              </span>
              <span
                className={`font-mono text-[11px] shrink-0 ${
                  ref.trend === "up" ? "text-success" : "text-warning"
                }`}
              >
                {ref.trend === "up" ? "▲" : "▼"} {ref.trendPct}
              </span>
            </div>

            {/* Prices - visible on mobile as stacked */}
            <div className="text-right shrink-0 sm:w-[90px]">
              <span className="font-mono text-[14px] text-text-primary font-medium">
                {ref.hkPrice}
              </span>
            </div>
            <div className="hidden sm:block text-right w-[80px]">
              <span className="font-mono text-[12px] text-text-secondary">
                {ref.jpPrice}
              </span>
            </div>
            <div className="hidden sm:block text-right w-[70px]">
              <span className="font-mono text-[11px] text-text-disabled">
                {ref.volume}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
