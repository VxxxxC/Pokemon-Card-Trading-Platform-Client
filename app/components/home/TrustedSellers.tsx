import Link from "next/link";

// TODO [MOCK DATA]: Replace with Supabase query — fetch top-rated merchants from `merchants` table ordered by rating DESC, limit 4
const trustedSellers = [
  {
    id: "PKT-2201-11A",
    name: "渡邊道館",
    avatar: "渡",
    rating: 4.9,
    totalTrades: 312,
    badge: "資深商戶",
  },
  {
    id: "PKT-3305-22B",
    name: "京都卡牌專門店",
    avatar: "京",
    rating: 4.8,
    totalTrades: 256,
    badge: "認證商戶",
  },
  {
    id: "PKT-4408-33C",
    name: "東京TCG市場",
    avatar: "東",
    rating: 4.9,
    totalTrades: 489,
    badge: "資深商戶",
  },
  {
    id: "PKT-5510-44D",
    name: "大阪收藏家",
    avatar: "大",
    rating: 4.7,
    totalTrades: 178,
    badge: "認證商戶",
  },
];

export function TrustedSellers() {
  return (
    <section className="mb-8" aria-labelledby="sellers-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="sellers-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          認證商戶
        </h2>
        <Link
          href="/marketplace"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {trustedSellers.map((seller) => (
          <Link
            key={seller.id}
            href={`/profile/${seller.id}`}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4 hover:bg-bg-elevated transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(212,165,116,0.15)] flex items-center justify-center font-sans font-semibold text-[14px] text-brand shrink-0">
                {seller.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[14px] font-medium text-text-primary truncate group-hover:text-brand transition-colors">
                  {seller.name}
                </p>
                <span className="font-mono text-[11px] text-text-secondary">
                  {seller.id}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.10)] px-2 py-0.5 rounded-[4px]">
                {seller.badge}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-text-primary">
                  ★ {seller.rating}
                </span>
                <span className="font-mono text-[11px] text-text-secondary">
                  {seller.totalTrades} 筆交易
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
