import Link from "next/link";

// TODO: [API] Fetch sniper radar data from backend — compare HK seller prices vs Mercari JP sold prices via Apify scraper
// TODO: [server] Backend Edge Function must run IQR algorithm to filter outlier prices every hour
// TODO: [database] Pre-compute `price_delta_percentage` in `listings` table via DB trigger, index on `WHERE price_delta_percentage <= -10`

const sniperDeals = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    hkPrice: "HK$3,500",
    jpRef: "約 ¥67,800 JP",
    discount: "低於日本市價 18%",
    condition: "【美品 S】",
    seller: "渡邊道館",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    hkPrice: "HK$2,960",
    jpRef: "約 ¥55,200 JP",
    discount: "低於日本市價 12%",
    condition: "【美品 S】",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    hkPrice: "HK$2,180",
    jpRef: "約 ¥42,500 JP",
    discount: "低於日本市價 15%",
    condition: "【微傷 A】",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-197",
    name: "Lucario ex SAR",
    hkPrice: "HK$1,440",
    jpRef: "約 ¥27,300 JP",
    discount: "低於日本市價 11%",
    condition: "【美品 S】",
    seller: "東京TCG市場",
  },
];

export function SniperRadar() {
  return (
    <section className="mb-8" aria-labelledby="sniper-heading">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
          </span>
          <h2
            id="sniper-heading"
            className="font-sans font-semibold text-[20px] text-text-primary"
          >
            狙擊雷達・破底價專區
          </h2>
        </div>
        <Link
          href="/marketplace?filter=sniper"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sniperDeals.map((deal) => (
          <Link
            key={deal.id}
            href={`/marketplace?card=${deal.id}`}
            className="flex items-center gap-4 px-4 py-3.5 bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] hover:bg-bg-elevated transition-colors active:scale-[0.99]"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-sans text-[14px] font-medium text-text-primary truncate">
                  {deal.name}
                </span>
                <span className="font-mono text-[10px] text-text-secondary shrink-0">
                  {deal.condition}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-text-disabled">
                  {deal.id}
                </span>
                <span className="text-text-disabled" aria-hidden="true">·</span>
                <span className="font-sans text-[11px] text-text-secondary truncate">
                  {deal.seller}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-semibold text-[16px] text-text-primary">
                {deal.hkPrice}
              </p>
              <p className="font-mono text-[10px] text-text-secondary">
                {deal.jpRef}
              </p>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-success mt-0.5">
                📉 {deal.discount}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
