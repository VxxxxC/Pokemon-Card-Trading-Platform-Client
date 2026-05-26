import Image from "next/image";
import Link from "next/link";
import {
  fetchPokemonCards,
  toSniperDeal,
} from "@/app/lib/pokemon-data";

// Spec Section 4: Sniper Radar — below-market-price items with radar scan animation
// TODO [server]: Replace with Supabase query — WHERE price_delta_percentage <= -10, ordered by delta DESC
// TODO [server]: price_delta_percentage must be pre-calculated by backend trigger when Apify updates Mercari JP prices

const fallbackDeals = [
  { id: "sv2a-182", name: "Charizard ex", rarity: "SAR", price: 38000, marketPrice: 45000, deltaPercent: -15, image: "https://images.pokemontcg.io/sv3pt5/215_hires.png", seller: "渡邊道館", grade: "PSA 10" },
  { id: "sv6a-109", name: "Umbreon ex", rarity: "SAR", price: 31500, marketPrice: 38000, deltaPercent: -17, image: "https://images.pokemontcg.io/sv3pt5/198_hires.png", seller: "東京TCG市場", grade: "BGS 9.5" },
  { id: "sv2a-233", name: "Mimikyu ex", rarity: "SAR", price: 23800, marketPrice: 28000, deltaPercent: -15, image: "https://images.pokemontcg.io/sv3pt5/201_hires.png", seller: "名古屋交易商", grade: "PSA 9" },
  { id: "sv2a-213", name: "Eevee", rarity: "AR", price: 5200, marketPrice: 6200, deltaPercent: -16, image: "https://images.pokemontcg.io/sv3pt5/196_hires.png", seller: "福岡卡牌店", grade: "RAW NM" },
];

function RadarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
    </svg>
  );
}

export async function SniperRadar() {
  let sniperDeals;
  try {
    const apiCards = await fetchPokemonCards({
      q: "supertype:pokémon rarity:rare",
      pageSize: 4,
    });
    sniperDeals = apiCards.length > 0 ? apiCards.map(toSniperDeal) : fallbackDeals;
  } catch {
    sniperDeals = fallbackDeals;
  }
  return (
    <section className="mb-8" aria-labelledby="sniper-heading">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <RadarIcon />
            {/* Subtle radar ping animation */}
            <span className="absolute inset-0 rounded-full animate-pulse bg-[rgba(212,165,116,0.15)]" />
          </div>
          <div>
            <h2
              id="sniper-heading"
              className="font-sans font-semibold text-[20px] text-text-primary"
            >
              狙擊雷達
            </h2>
            <p className="font-sans text-[11px] text-text-secondary">
              低於日本市價・性價比極高
            </p>
          </div>
        </div>
        <Link
          href="/marketplace?filter=below-market"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sniperDeals.map((deal) => (
          <Link
            key={deal.id}
            href={`/listing/${deal.id}`}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden hover:bg-bg-elevated transition-colors group"
          >
            <div className="relative w-full aspect-[3/2] bg-bg-elevated">
              <Image
                src={deal.image}
                alt={`${deal.name} ${deal.rarity}`}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {/* Delta badge */}
              <span className="absolute top-2 left-2 font-mono text-[10px] font-bold text-[#17130f] bg-success px-2 py-0.5 rounded-[4px]">
                📉 低於日本市價 {Math.abs(deal.deltaPercent)}%
              </span>
              <span className="absolute top-2 right-2 font-mono text-[10px] text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[4px] font-semibold">
                {deal.rarity}
              </span>
            </div>
            <div className="p-3">
              <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                {deal.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[11px] text-text-secondary">{deal.id}</span>
                <span className="text-text-disabled" aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-text-secondary">{deal.grade}</span>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="font-mono font-medium text-[16px] text-brand">
                    ¥{deal.price.toLocaleString("zh-TW")}
                  </p>
                  <p className="font-mono text-[11px] text-text-disabled line-through">
                    日本市價 ¥{deal.marketPrice.toLocaleString("zh-TW")}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-success font-medium">
                  ⚡ 性價比極高
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
