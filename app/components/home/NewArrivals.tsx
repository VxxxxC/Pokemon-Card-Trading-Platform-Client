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
      <div className="flex items-center justify-between mb-4">
        <h2
          id="arrivals-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {newArrivals.map((item) => (
          <article
            key={item.id}
            className="bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.30)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.50)] transition-shadow overflow-hidden"
          >
            <Link
              href={`/marketplace?card=${item.id}`}
              className="block relative w-full aspect-[5/3.5] overflow-hidden bg-bg-elevated"
            >
              <Image
                src={item.image}
                alt={`${item.name} — ${item.rarity}`}
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
              <span className="absolute top-3 left-3 font-mono text-[11px] text-text-primary bg-[rgba(23,19,15,0.75)] backdrop-blur-sm px-2 py-0.5 rounded-[4px]">
                {item.condition}
              </span>
              <span className="absolute top-3 right-3 font-mono text-[11px] text-text-primary">
                {item.rarity}
              </span>
            </Link>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="font-sans font-semibold text-[14px] text-text-primary truncate">
                    {item.name}
                  </h3>
                  <span className="font-mono text-[11px] text-text-secondary">
                    {item.id} · {item.set}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-text-disabled shrink-0">
                  {item.timeAgo}
                </span>
              </div>

              <div className="flex items-end justify-between mt-3">
                <p className="font-mono font-semibold text-[18px] text-text-primary">
                  {item.price}
                </p>
                <span className="font-sans text-[12px] text-text-secondary truncate max-w-[100px]">
                  {item.seller}
                </span>
              </div>

              {/* TODO: [server] "直接購買" triggers escrow flow — Stripe PaymentIntent for deposit */}
              {/* TODO: [API] "即時出價" submits to `bids` table with auth check */}
              <div className="mt-3 flex gap-2">
                <button className="flex-1 h-10 bg-brand text-[#17130f] font-sans font-medium text-sm rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover min-h-[44px]">
                  直接購買
                </button>
                <button className="flex-[0.6] h-10 border border-[rgba(237,232,224,0.12)] text-brand font-sans font-medium text-[12px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-bg-elevated min-h-[44px]">
                  即時出價
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
