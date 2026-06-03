"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

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
  {
    id: "sv2a-183",
    name: "Venusaur ex SAR",
    grade: "PSA 10",
    price: "HK$2,800",
    seller: "東京道館",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-venusaur/200/280",
    photos: 3,
  },
  {
    id: "sv2a-184",
    name: "Blastoise ex SAR",
    grade: "BGS 10",
    price: "HK$4,200",
    seller: "橫濱卡牌",
    badge: "殿堂收藏家",
    image: "https://picsum.photos/seed/premium-blastoise/200/280",
    photos: 8,
  },
  {
    id: "sv8a-123",
    name: "Mothim SAR",
    grade: "PSA 10",
    price: "HK$1,080",
    seller: "港卡庫",
    badge: "認證商戶",
    image: "https://picsum.photos/seed/premium-mothim/200/280",
    photos: 4,
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    grade: "CGC 10",
    price: "HK$1,200",
    seller: "中環道館",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-pikachu/200/280",
    photos: 5,
  },
  {
    id: "sv6a-095",
    name: "Ceruledge ex SAR",
    grade: "PSA 10",
    price: "HK$1,500",
    seller: "尖沙咀卡店",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-ceruledge/200/280",
    photos: 6,
  },
];
export function PremiumMarket() {
  const plugin = React.useRef(
    Autoplay({
      delay: 2000,
      playOnInit: true,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    }),
  );

  return (
    <section
      className="mb-8 w-full overflow-hidden"
      aria-labelledby="premium-heading"
    >
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

      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-3">
          {premiumListings.slice(0, 9).map((listing) => (
            <CarouselItem
              key={listing.id}
              className="pl-3 basis-[55%] sm:basis-[40%] lg:basis-[25%]"
            >
              <article className="flex flex-col h-full bg-bg-card rounded-xl border border-[rgba(237,232,224,0.08)] p-3 hover:bg-bg-elevated transition-colors">
                {/* Portrait card thumbnail */}
                <Link
                  href={`/marketplace?card=${listing.id}`}
                  className="relative w-full aspect-[5/7] rounded-lg overflow-hidden bg-bg-elevated block mb-3"
                >
                  <Image
                    src={listing.image}
                    alt={`${listing.name} — ${listing.grade}`}
                    fill
                    className="object-cover group-hover/card:scale-[1.05] transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 250px"
                  />
                </Link>

                {/* Card info */}
                <div className="flex-1 min-w-0 mb-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-sans font-bold text-[15px] text-text-primary truncate">
                      {listing.name}
                    </h3>
                    <span className="font-mono text-[10px] text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[3px] shrink-0 font-bold">
                      {listing.grade}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-text-secondary mb-2 truncate">
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
                <div className="mt-auto pt-3 border-t border-[rgba(237,232,224,0.08)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono font-black text-[18px] text-text-primary">
                      {listing.price}
                    </p>
                  </div>
                  <Link
                    href={`/marketplace?seller=${encodeURIComponent(listing.seller)}`}
                    className="w-full py-2 bg-brand text-[#17130f] font-sans font-bold text-[13px] rounded-lg hover:bg-brand-hover active:scale-[0.98] transition-all whitespace-nowrap inline-flex items-center justify-center"
                  >
                    {listing.seller}
                  </Link>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
