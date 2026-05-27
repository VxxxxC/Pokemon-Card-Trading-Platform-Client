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
    image: "https://picsum.photos/seed/premium-charizard/200/280",
    photos: 6,
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    grade: "BGS 9.5",
    price: "HK$4,050",
    seller: "京都卡牌專門店",
    badge: "殿堂收藏家",
    image: "https://picsum.photos/seed/premium-mewtwo/200/280",
    photos: 5,
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    grade: "PSA 10",
    price: "HK$2,960",
    seller: "大阪收藏家",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-umbreon/200/280",
    photos: 4,
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    grade: "PSA 9",
    price: "HK$2,180",
    seller: "名古屋交易商",
    badge: "殿堂收藏家",
    image: "https://picsum.photos/seed/premium-mimikyu/200/280",
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

      <div className="space-y-2">
        {premiumListings.map((listing) => (
          <article
            key={listing.id}
            className="flex gap-3 items-center bg-bg-card rounded-xl border border-[rgba(237,232,224,0.08)] p-3 hover:bg-bg-elevated transition-colors"
          >
            {/* Portrait card thumbnail */}
            <Link
              href={`/marketplace?card=${listing.id}`}
              className="shrink-0 relative w-14 aspect-5/7 rounded-lg overflow-hidden bg-bg-elevated block"
            >
              <Image
                src={listing.image}
                alt={`${listing.name} — ${listing.grade}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </Link>

            {/* Card info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="font-sans font-medium text-[14px] text-text-primary truncate">
                  {listing.name}
                </h3>
                <span className="font-mono text-[10px] text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[3px] shrink-0">
                  {listing.grade}
                </span>
              </div>
              <p className="font-mono text-[11px] text-text-secondary mb-1">
                {listing.id} · {listing.seller}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-brand bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded-[3px]">
                  🏅 {listing.badge}
                </span>
                <span className="font-mono text-[10px] text-text-disabled">
                  {listing.photos} 張實物圖
                </span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
              <p className="font-mono font-semibold text-[17px] text-text-primary">
                {listing.price}
              </p>
              {/* TODO: [server] "Escrow 購買" must create Stripe Connect PaymentIntent with platform fee split */}
              {/* TODO: [API] Lock listing status to 'escrow_locked' after deposit payment */}
              <button
                type="button"
                className="px-3 py-1.5 bg-brand text-[#17130f] font-sans font-semibold text-[12px] rounded-lg hover:bg-brand-hover active:scale-[0.98] transition-transform whitespace-nowrap"
              >
                Escrow 購買
              </button>
              <Link
                href={`/marketplace?card=${listing.id}`}
                className="font-mono text-[11px] text-text-secondary hover:text-brand transition-colors"
              >
                查看詳情 →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
