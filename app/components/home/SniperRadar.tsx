"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type RadarDeal = {
  id: string;
  name: string;
  rarity: string;
  listingPrice: number;
  jpAvgSoldPrice: number;
  image: string;
};

// TODO: [API] Replace `jpAvgSoldPrice` with Apify Mercari JP Sold-Out feed.
// TODO: [database] Persist `price_delta_percentage` on `listings` and index it for fast homepage queries.
const MOCK_DEALS: RadarDeal[] = [
  {
    id: "sv8a-205-sar-deal",
    name: "リザードン ex SAR",
    rarity: "SAR",
    listingPrice: 258000,
    jpAvgSoldPrice: 312000,
    image: "https://picsum.photos/seed/deal-1/640/520",
  },
  {
    id: "sv2a-189-sar-deal",
    name: "ミュウツー ex SAR",
    rarity: "SAR",
    listingPrice: 131000,
    jpAvgSoldPrice: 151000,
    image: "https://picsum.photos/seed/deal-2/640/520",
  },
  {
    id: "sv6a-109-sar-deal",
    name: "ブラッキー ex SAR",
    rarity: "SAR",
    listingPrice: 368000,
    jpAvgSoldPrice: 410000,
    image: "https://picsum.photos/seed/deal-3/640/520",
  },
  {
    id: "sv4-301-sar-deal",
    name: "コライドン ex SAR",
    rarity: "SAR",
    listingPrice: 171000,
    jpAvgSoldPrice: 198000,
    image: "https://picsum.photos/seed/deal-4/640/520",
  },
];

export function SniperRadar() {
  const [minDiscount, setMinDiscount] = useState(10);

  const deals = useMemo(() => {
    return MOCK_DEALS.map((d) => {
      const deltaPct = Math.round(((d.listingPrice - d.jpAvgSoldPrice) / d.jpAvgSoldPrice) * 100);
      return { ...d, deltaPct };
    }).filter((d) => d.deltaPct <= -minDiscount);
  }, [minDiscount]);

  return (
    <section className="mt-10" aria-labelledby="sniper-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="sniper-heading"
            className="font-sans text-[18px] sm:text-[20px] font-semibold text-text-primary"
          >
            狙擊雷達 · 破底價專區
          </h2>
          <p className="mt-1 font-sans text-[13px] text-text-secondary max-w-[60ch]">
            以日本已成交均價作參考，標記低於市價的現貨（示意）。首頁僅做快速查詢，不做即時計算。
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-[rgba(237,232,224,0.12)] bg-bg-card px-3 py-2">
          <p className="font-mono text-[11px] text-text-secondary">雷達門檻</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMinDiscount(10)}
              className={[
                "h-9 px-3 rounded-xl font-mono text-[12px] border transition-colors min-h-[44px]",
                minDiscount === 10
                  ? "bg-[rgba(212,165,116,0.16)] text-brand border-[rgba(212,165,116,0.30)]"
                  : "bg-bg-page/40 text-text-secondary border-[rgba(237,232,224,0.10)] hover:bg-bg-page/60",
              ].join(" ")}
            >
              ≤ -10%
            </button>
            <button
              type="button"
              onClick={() => setMinDiscount(15)}
              className={[
                "h-9 px-3 rounded-xl font-mono text-[12px] border transition-colors min-h-[44px]",
                minDiscount === 15
                  ? "bg-[rgba(212,165,116,0.16)] text-brand border-[rgba(212,165,116,0.30)]"
                  : "bg-bg-page/40 text-text-secondary border-[rgba(237,232,224,0.10)] hover:bg-bg-page/60",
              ].join(" ")}
            >
              ≤ -15%
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-[rgba(237,232,224,0.08)] bg-bg-card overflow-hidden">
        <div className="relative px-5 py-5 sm:px-6">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.10),transparent_55%)]" />
            <div className="absolute inset-0 animate-radar-scan bg-[linear-gradient(120deg,transparent,rgba(212,165,116,0.18),transparent)]" />
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/marketplace?deal=${encodeURIComponent(deal.id)}`}
                className="group rounded-[16px] overflow-hidden border border-[rgba(237,232,224,0.08)] bg-bg-page/35 hover:bg-bg-elevated transition-colors"
              >
                <div className="relative w-full aspect-[4/3] bg-bg-page">
                  <Image
                    src={deal.image}
                    alt={deal.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] text-text-primary bg-bg-page/70 backdrop-blur border border-[rgba(237,232,224,0.12)]">
                      📉 低於日本市價 {Math.abs(deal.deltaPct)}%
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] border border-[rgba(212,165,116,0.22)]">
                      {deal.rarity}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-4">
                  <p className="font-sans text-[13px] font-semibold text-text-primary truncate">
                    {deal.name}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] text-text-secondary">現貨價</p>
                      <p className="font-mono text-[14px] font-semibold text-success">
                        ¥{deal.listingPrice.toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-text-secondary">日本均價</p>
                      <p className="font-mono text-[12px] text-text-primary">
                        ¥{deal.jpAvgSoldPrice.toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 font-sans text-[12px] text-text-secondary">
                    ⚡ 性價比極高 · 雷達命中
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

