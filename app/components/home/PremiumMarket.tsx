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

// 🟢 核心校準：全面注入商戶專屬現貨編號（productId），與私域資料庫（MOCK_PUBLIC_MEMBERS）達成 100% 對齊
const PREMIUM_LISTINGS = [
  {
    id: "sv2a-182",
    productId: "LST-001", // 渡邊珍藏：噴火龍
    name: "Charizard ex SAR",
    grade: "PSA 10",
    price: "HK$44,800", // 同步私域專屬店鋪高價品相定價
    seller: "渡邊道館",
    sellerId: "PKT-8839-44A",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-charizard/200/280",
    photos: 6,
  },
  {
    id: "s6a-095",
    productId: "LST-002", // 渡邊珍藏：月亮伊布 VMAX
    name: "Umbreon VMAX SA",
    grade: "BGS 9.5",
    price: "HK$52,000",
    seller: "渡邊道館",
    sellerId: "PKT-8839-44A",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-mewtwo/200/280",
    photos: 5,
  },
  {
    id: "sv2a-215",
    productId: "LST-003", // 渡邊珍藏：皮卡丘
    name: "Pikachu AR",
    grade: "裸卡 (美品S)",
    price: "HK$1,200",
    seller: "渡邊道館",
    sellerId: "PKT-8839-44A",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/premium-pikachu/200/280",
    photos: 4,
  },
  {
    id: "sm4plus-119",
    productId: "LST-004", // 渡邊珍藏：莉莉艾
    name: "Lillie SR",
    grade: "PSA 9",
    price: "HK$185,000",
    seller: "渡邊道館",
    sellerId: "PKT-8839-44A",
    badge: "專業道館主",
    image: "https://picsum.photos/seed/lillie/200/280",
    photos: 6,
  },
];

export function PremiumMarket() {
  const plugin = React.useRef(
    Autoplay({
      delay: 2500,
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
        <div className="space-y-0.5">
          <h2
            id="premium-heading"
            className="font-sans font-black text-[18px] lg:text-[20px] text-text-primary tracking-tight"
          >
            認證商家・鑑定託管保障
          </h2>
          <p className="font-mono text-[9px] text-text-disabled uppercase tracking-wider">
            KYC MERCHANT GUARANTEED ESCROW POOL
          </p>
        </div>
        <Link
          href="/marketplace"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors font-bold"
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
          {PREMIUM_LISTINGS.map((listing) => (
            <CarouselItem
              key={listing.productId}
              className="pl-3 basis-full sm:basis-[40%] lg:basis-[25%]"
            >
              <article className="flex flex-col h-full bg-bg-card rounded-xl border border-[rgba(237,232,224,0.08)] p-3 hover:bg-[#26211C] transition-colors group">
                {/* 🟢 核心修正 1：點擊實物圖封面，精準引流導向該 Merchant 獨立市集櫥窗內的商品詳情頁 */}
                <Link
                  href={`/marketplace/${listing.sellerId}/product/${listing.productId}`}
                  className="relative w-full aspect-[5/7] rounded-lg overflow-hidden bg-bg-elevated block mb-3 border border-white/5"
                >
                  <Image
                    src={listing.image}
                    alt={`${listing.name} — ${listing.grade}`}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 250px"
                    unoptimized
                  />
                </Link>

                {/* 卡牌規格資訊 */}
                <div className="flex-1 min-w-0 mb-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    {/* 🟢 核心修正 2：卡牌標題同步修正，100% 直穿私域現貨詳情 */}
                    <Link
                      href={`/marketplace/${listing.sellerId}/product/${listing.productId}`}
                    >
                      <h3 className="font-sans font-bold text-[14.5px] text-text-primary truncate hover:text-brand transition-colors">
                        {listing.name}
                      </h3>
                    </Link>
                    <span className="font-mono text-[9.5px] text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[3px] shrink-0 font-black">
                      {listing.grade}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-text-disabled truncate">
                    {listing.id} · {listing.seller}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="font-mono text-[9px] font-bold text-brand bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded-[3px] border border-brand/10">
                      🏅 {listing.badge}
                    </span>
                    <span className="font-mono text-[10px] text-text-disabled">
                      {listing.photos} 張實物圖
                    </span>
                  </div>
                </div>

                {/* 售價快報與商戶私域引流入口 */}
                <div className="mt-auto pt-3 border-t border-[rgba(237,232,224,0.08)]">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <span className="font-mono text-[9px] text-text-disabled uppercase">
                      ESCROW PRICE
                    </span>
                    <p className="font-mono font-black text-[17px] text-brand">
                      {listing.price}
                    </p>
                  </div>

                  {/* 點擊賣家按鈕，直通該商戶專屬的個人市集展示櫥窗首頁 */}
                  <Link
                    href={`/marketplace/${listing.sellerId}`}
                    className="w-full h-9 bg-[#17130f] border border-white/5 text-text-secondary hover:text-brand hover:border-brand/30 font-sans font-bold text-[12px] rounded-lg transition-all whitespace-nowrap inline-flex items-center justify-center cursor-pointer"
                  >
                    🏪 進入 {listing.seller}
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
