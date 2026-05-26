import Link from "next/link";
import {
  fetchPokemonCards,
  toMarketIndex,
} from "@/app/lib/pokemon-data";

// Spec Section 8: Tokyo Market Reference Index — Mercari JP sold data with mini sparklines
// TODO [API]: Connect to Apify scraper endpoint for Mercari JP real completed transaction prices

const fallbackCards = [
  { id: "sv2a-182", name: "Charizard ex SAR", jpPrice: 45000, delta: 2400, deltaDir: "up" as const, sparkline: [38, 40, 42, 41, 43, 44, 45] },
  { id: "sv2a-189", name: "Mewtwo ex SAR", jpPrice: 52000, delta: 1000, deltaDir: "down" as const, sparkline: [55, 54, 53, 54, 53, 52, 52] },
  { id: "sv6a-109", name: "Umbreon ex SAR", jpPrice: 38000, delta: 1500, deltaDir: "up" as const, sparkline: [34, 35, 36, 35, 37, 37, 38] },
  { id: "sv2a-233", name: "Mimikyu ex SAR", jpPrice: 28000, delta: 3200, deltaDir: "up" as const, sparkline: [22, 23, 24, 25, 26, 27, 28] },
  { id: "sv2a-215", name: "Pikachu AR", jpPrice: 8500, delta: 300, deltaDir: "down" as const, sparkline: [9, 9, 8.8, 8.7, 8.6, 8.5, 8.5] },
  { id: "sv2a-213", name: "Eevee AR", jpPrice: 6200, delta: 800, deltaDir: "up" as const, sparkline: [5, 5.2, 5.5, 5.8, 5.9, 6, 6.2] },
];

/** Render a tiny SVG sparkline from data points */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export async function TokyoMarketIndex() {
  let marketCards;
  try {
    const apiCards = await fetchPokemonCards({
      q: "supertype:pokémon rarity:illustration",
      pageSize: 6,
    });
    marketCards = apiCards.length > 0 ? apiCards.map(toMarketIndex) : fallbackCards;
  } catch {
    marketCards = fallbackCards;
  }
  return (
    <section className="mb-8" aria-labelledby="tokyo-heading">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="tokyo-heading"
            className="font-sans font-semibold text-[20px] text-text-primary"
          >
            東京連線市價參考
          </h2>
          <p className="font-sans text-[11px] text-text-secondary mt-0.5">
            Mercari JP 已成交真實行情（剔除未成交掛單虛高標價）
          </p>
        </div>
        <Link
          href="/marketplace?view=market-index"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          完整指數 →
        </Link>
      </div>

      <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center px-4 py-2 border-b border-[rgba(237,232,224,0.06)] text-text-disabled font-mono text-[11px]">
          <span className="flex-1">卡牌</span>
          <span className="w-[60px] text-center">趨勢</span>
          <span className="w-[90px] text-right">日本市價</span>
          <span className="w-[70px] text-right">漲跌</span>
        </div>

        {marketCards.map((card, i) => (
          <Link
            key={card.id}
            href={`/listing/${card.id}`}
            className={`flex items-center px-4 py-3 hover:bg-bg-elevated transition-colors ${
              i > 0 ? "border-t border-[rgba(237,232,224,0.06)]" : ""
            }`}
          >
            <div className="flex-1 min-w-0 pr-3">
              <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                {card.name}
              </p>
              <span className="font-mono text-[11px] text-text-secondary">
                {card.id}
              </span>
            </div>

            <div className="w-[60px] flex justify-center">
              <Sparkline
                data={card.sparkline}
                color={card.deltaDir === "up" ? "#10b981" : "#ef4444"}
              />
            </div>

            <div className="w-[90px] text-right">
              <p className="font-mono font-medium text-[14px] text-text-primary">
                ¥{card.jpPrice.toLocaleString("zh-TW")}
              </p>
            </div>

            <div className="w-[70px] text-right">
              <span
                className={`font-mono text-[12px] ${
                  card.deltaDir === "up" ? "text-success" : "text-warning"
                }`}
                aria-label={card.deltaDir === "up" ? "上升" : "下跌"}
              >
                {card.deltaDir === "up" ? "▲" : "▼"} ¥{card.delta.toLocaleString("zh-TW")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
