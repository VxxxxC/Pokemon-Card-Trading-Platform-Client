import Image from "next/image";
import Link from "next/link";

// TODO: [API] Fetch C2C new arrivals from Supabase — query `listings` table WHERE `seller_type='individual'` ORDER BY `created_at` DESC
// TODO: [server] Image upload: Edge Function must convert to WebP, compress, and upload to bunny.net CDN before storing in DB
// TODO: [database] On "直接購買" success, update listing status to 'escrow_locked' atomically — RLS blocks duplicate payments

const newArrivals = [
  {
    id: "sv4a-330",
    name: "Gardevoir ex",
    set: "Shiny Treasure ex",
    rarity: "SAR",
    condition: "【美品 S】",
    price: "HK$880",
    image: "https://picsum.photos/seed/c2c-gardevoir/400/280",
    seller: "卡牌玩家HK",
    timeAgo: "5分鐘前",
  },
  {
    id: "sv2a-210",
    name: "Mew ex",
    set: "151",
    rarity: "SR",
    condition: "【微傷 A】",
    price: "HK$520",
    image: "https://picsum.photos/seed/c2c-mew/400/280",
    seller: "收藏達人",
    timeAgo: "12分鐘前",
  },
  {
    id: "sv6a-095",
    name: "Ceruledge ex",
    set: "Night Wanderer",
    rarity: "SR",
    condition: "【美品 S】",
    price: "HK$380",
    image: "https://picsum.photos/seed/c2c-ceruledge/400/280",
    seller: "旺角卡店",
    timeAgo: "28分鐘前",
  },
  {
    id: "sv3-155",
    name: "Ting-Lu ex",
    set: "Ruler of the Black Flame",
    rarity: "SR",
    condition: "【傷あり B】",
    price: "HK$210",
    image: "https://picsum.photos/seed/c2c-tinglu/400/280",
    seller: "深水埗玩家",
    timeAgo: "45分鐘前",
  },
];

export function NewArrivals() {
  return (
    <section className="mb-8" aria-labelledby="arrivals-heading">
      <div className="flex items-center justify-between mb-3">
        <h2
          id="arrivals-heading"
          className="font-sans font-semibold text-[18px] text-text-primary"
        >
          最新 C2C 現貨上架
        </h2>
        <Link
          href="/marketplace?filter=c2c&sort=newest"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      {/* Horizontal scroll strip — 2.5 cards visible on mobile, all on desktop */}
      <div className="flex overflow-x-auto gap-3 md:gap-4 scrollbar-none pb-4 -mx-1 px-1">
        {newArrivals.map((item) => (
          <article
            key={item.id}
            className="shrink-0 w-[148px] sm:w-[160px] md:w-[190px] bg-bg-card rounded-[14px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.55)] hover:border-brand/30 transition-all overflow-hidden group"
          >
            {/* Card image — portrait aspect */}
            <Link
              href={`/marketplace?card=${item.id}`}
              className="block relative w-full aspect-[3/4] overflow-hidden bg-bg-elevated"
            >
              <Image
                src={item.image}
                alt={`${item.name} — ${item.rarity}`}
                fill
                className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                sizes="(max-width: 768px) 160px, 200px"
              />
              {/* Top badges */}
              <span className="absolute top-2.5 left-2.5 font-mono text-[10px] md:text-[11px] font-bold text-text-primary bg-[rgba(23,19,15,0.85)] backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-white/10">
                {item.condition}
              </span>
              <span className="absolute top-2.5 right-2.5 font-mono text-[10px] md:text-[11px] font-bold text-brand bg-bg-elevated/90 backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-brand/30">
                {item.rarity}
              </span>
              {/* Time overlay at bottom */}
              <span className="absolute bottom-0 right-0 left-0 text-center font-mono text-[10px] text-text-disabled bg-[rgba(23,19,15,0.75)] backdrop-blur-md py-1">
                {item.timeAgo}
              </span>
            </Link>

            {/* Expanded info */}
            <div className="p-3.5">
              <h3 className="font-sans font-bold text-[13px] md:text-[15px] text-text-primary truncate leading-tight mb-1">
                {item.name}
              </h3>
              <span className="font-mono text-[10px] md:text-[11px] text-text-disabled block truncate mb-3">
                {item.set}
              </span>

              {/* Price + seller */}
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono font-black text-[15px] md:text-[18px] text-text-primary leading-none">
                  {item.price}
                </p>
                <span className="font-sans text-[11px] text-text-secondary truncate max-w-[70px] text-right">
                  {item.seller}
                </span>
              </div>

              {/* TODO: [server] "直接購買" triggers escrow flow — Stripe PaymentIntent for deposit */}
              {/* TODO: [API] "即時出價" submits to `bids` table with auth check */}
              <div className="flex gap-2">
                <button className="flex-1 h-9 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-lg active:scale-[0.97] transition-transform hover:bg-brand-hover">
                  購買
                </button>
                <button className="flex-1 h-9 border border-[rgba(237,232,224,0.15)] text-brand font-sans font-bold text-[12px] rounded-lg active:scale-[0.97] transition-transform hover:bg-bg-elevated">
                  出價
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
