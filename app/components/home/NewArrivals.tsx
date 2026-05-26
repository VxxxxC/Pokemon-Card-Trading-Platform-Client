import Image from "next/image";
import Link from "next/link";

// Spec Section 7: New Arrivals — C2C latest listings waterfall
// TODO [MOCK DATA]: Replace with Supabase query — fetch latest C2C listings ordered by created_at DESC
// TODO [BACKEND]: Cover thumbnails must be WebP compressed via Edge Function + bunny.net CDN
// TODO [BACKEND]: "直接購買" sets listing status to 'escrow_locked' — RLS blocks other buyers from paying

const c2cListings = [
  {
    id: "c2c-001",
    name: "Mew ex",
    set: "151",
    rarity: "SAR",
    price: 15800,
    image: "https://picsum.photos/seed/c2c-mew/300/200",
    seller: "玩家A***",
    timeAgo: "3分鐘前",
  },
  {
    id: "c2c-002",
    name: "Rayquaza VMAX",
    set: "VMAX Climax",
    rarity: "UR",
    price: 22500,
    image: "https://picsum.photos/seed/c2c-rayquaza/300/200",
    seller: "收藏家B***",
    timeAgo: "8分鐘前",
  },
  {
    id: "c2c-003",
    name: "Gardevoir ex",
    set: "sv3",
    rarity: "SAR",
    price: 19200,
    image: "https://picsum.photos/seed/c2c-gardevoir/300/200",
    seller: "玩家C***",
    timeAgo: "15分鐘前",
  },
  {
    id: "c2c-004",
    name: "Sylveon VMAX",
    set: "Eevee Heroes",
    rarity: "SA",
    price: 35000,
    image: "https://picsum.photos/seed/c2c-sylveon/300/200",
    seller: "投資者D***",
    timeAgo: "22分鐘前",
  },
  {
    id: "c2c-005",
    name: "Arceus VSTAR",
    set: "Star Birth",
    rarity: "UR",
    price: 12500,
    image: "https://picsum.photos/seed/c2c-arceus/300/200",
    seller: "玩家E***",
    timeAgo: "31分鐘前",
  },
  {
    id: "c2c-006",
    name: "Giratina VSTAR",
    set: "Lost Abyss",
    rarity: "UR",
    price: 18000,
    image: "https://picsum.photos/seed/c2c-giratina/300/200",
    seller: "收藏家F***",
    timeAgo: "45分鐘前",
  },
];

export function NewArrivals() {
  return (
    <section className="mb-8" aria-labelledby="arrivals-heading">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="arrivals-heading"
            className="font-sans font-semibold text-[20px] text-text-primary"
          >
            最新 C2C 現貨上架
          </h2>
          <p className="font-sans text-[11px] text-text-secondary mt-0.5">
            私人玩家最新發布散件
          </p>
        </div>
        <Link
          href="/marketplace?type=c2c"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {c2cListings.map((listing) => (
          <article
            key={listing.id}
            className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden hover:bg-bg-elevated transition-colors group"
          >
            <Link
              href={`/listing/${listing.id}`}
              className="block relative w-full aspect-[3/2] bg-bg-elevated"
            >
              <Image
                src={listing.image}
                alt={`${listing.name} — ${listing.set}`}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="absolute top-2 right-2 font-mono text-[10px] text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[4px] font-semibold">
                {listing.rarity}
              </span>
              <span className="absolute bottom-2 left-2 font-mono text-[10px] text-text-primary bg-[rgba(23,19,15,0.80)] backdrop-blur-sm px-2 py-0.5 rounded-[4px]">
                {listing.timeAgo}
              </span>
            </Link>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-sans text-[14px] font-medium text-text-primary truncate">
                    {listing.name}
                  </p>
                  <span className="font-mono text-[11px] text-text-secondary">
                    {listing.set}
                  </span>
                </div>
                <p className="font-mono font-medium text-[16px] text-brand shrink-0">
                  ¥{listing.price.toLocaleString("zh-TW")}
                </p>
              </div>
              <p className="font-sans text-[11px] text-text-disabled mb-3">
                賣家：{listing.seller}
              </p>

              {/* Spec: "直接購買" as primary bright CTA, "即時出價" as secondary */}
              {/* TODO [BACKEND]: 直接購買 triggers Stripe escrow PaymentIntent + listing lock */}
              <div className="flex gap-2">
                <button className="flex-1 h-9 bg-brand text-[#17130f] font-sans font-medium text-[13px] rounded-[8px] active:scale-[0.98] transition-transform hover:bg-brand-hover min-h-[44px]">
                  直接購買
                </button>
                <button className="flex-[0.6] h-9 border border-[rgba(237,232,224,0.12)] text-brand font-sans text-[12px] rounded-[8px] active:scale-[0.98] transition-transform hover:bg-bg-elevated min-h-[44px]">
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
