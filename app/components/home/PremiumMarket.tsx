import Image from "next/image";
import Link from "next/link";

// TODO: [API] Fetch premium escrow listings from Supabase — only `account_type='merchant'` AND `kyc_status='verified'` sellers
// TODO: [database] RLS policy: enforce `use_authentication=true` listings require verified merchant account
// TODO: [server] Stripe Connect Onboarding status must be checked via webhook before allowing premium listing

const premiumListings = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    grade: "PSA 10",
    price: "HK$3,500",
    seller: "渡邊道館",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-charizard/400/280",
    photos: 6,
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    grade: "BGS 9.5",
    price: "HK$4,050",
    seller: "京都卡牌專門店",
    badge: "殿堂收藏家",
    image: "https://picsum.photos/seed/premium-mewtwo/400/280",
    photos: 5,
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    grade: "PSA 10",
    price: "HK$2,960",
    seller: "大阪收藏家",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-umbreon/400/280",
    photos: 4,
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    grade: "PSA 9",
    price: "HK$2,180",
    seller: "名古屋交易商",
    badge: "殿堂收藏家",
    image: "https://picsum.photos/seed/premium-mimikyu/400/280",
    photos: 6,
  },
];

export function PremiumMarket() {
  return (
    <section className="mb-8" aria-labelledby="premium-heading">
      <div className="flex items-center justify-between mb-4">
        <h2
          id="premium-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          認證商家・鑑定託管保障
        </h2>
        <Link
          href="/marketplace?filter=premium"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {premiumListings.map((listing) => (
          <article
            key={listing.id}
            className="bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.30)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.50)] transition-shadow overflow-hidden"
          >
            <Link
              href={`/marketplace?card=${listing.id}`}
              className="block relative w-full aspect-[5/3.5] overflow-hidden bg-bg-elevated"
            >
              <Image
                src={listing.image}
                alt={`${listing.name} — ${listing.grade}`}
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
              <span className="absolute top-3 right-3 font-mono text-[11px] text-[#17130f] bg-brand px-2 py-0.5 rounded-[4px]">
                {listing.grade}
              </span>
              <span className="absolute bottom-3 left-3 font-mono text-[10px] text-text-secondary bg-[rgba(23,19,15,0.75)] backdrop-blur-sm px-2 py-0.5 rounded-[4px]">
                {listing.photos} 張實物圖
              </span>
            </Link>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-sans font-semibold text-[16px] text-text-primary truncate">
                    {listing.name}
                  </h3>
                  <span className="font-mono text-[12px] text-text-secondary">
                    {listing.id}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-brand bg-[rgba(212,165,116,0.12)] px-2 py-0.5 rounded-[4px]">
                  🏅 {listing.badge}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <p className="font-mono font-semibold text-[18px] text-text-primary">
                  {listing.price}
                </p>
                <span className="font-sans text-[12px] text-text-secondary">
                  {listing.seller}
                </span>
              </div>

              {/* TODO: [server] "Escrow 購買" must create Stripe Connect PaymentIntent with platform fee split */}
              {/* TODO: [API] Lock listing status to 'escrow_locked' after deposit payment */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 h-10 bg-brand text-[#17130f] font-sans font-medium text-sm rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover min-h-[44px]">
                  Escrow 購買
                </button>
                <button className="flex-1 h-10 border border-[rgba(237,232,224,0.12)] text-brand font-sans font-medium text-sm rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-bg-elevated min-h-[44px]">
                  查看詳情
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
