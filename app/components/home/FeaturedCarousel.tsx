"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
// 🟢 載入全域拍賣按鈕
import { AuctionButton } from "@/app/components/transactions/GlobalTxButtons";

// 🟢 核心修正 2：全線清洗首頁拍賣數據模型，百分之百對齊大盤型態
const featuredCards: MarketplaceListing[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 45000,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/400/560",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    set: "151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 52000,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-mewtwo/400/560",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 38000,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/400/560",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    set: "151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 8500,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-pikachu/400/560",
    seller: "東京TCG市場",
  },
];

export function FeaturedCarousel() {
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
    <div className="relative w-full overflow-hidden">
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
          {featuredCards.map((card) => (
            <CarouselItem
              key={card.id}
              className="pl-3 basis-[55%] sm:basis-[40%] lg:basis-[33.3333%]"
            >
              <article className="h-full bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden hover:border-brand/30 transition-all group/card flex flex-col">
                <Link
                  href={`/marketplace?card=${card.id}`}
                  className="block relative aspect-[5/7] bg-bg-elevated overflow-hidden"
                >
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover group-hover/card:scale-[1.05] transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 250px"
                    unoptimized
                  />

                  {/* Grade Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="font-mono text-[9px] font-bold text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[3px] shadow-lg">
                      {card.grade.authority} {card.grade.score}
                    </span>
                  </div>

                  {/* Set & Rarity */}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="font-mono text-[8px] text-text-primary bg-[rgba(23,19,15,0.75)] backdrop-blur-md px-1.5 py-0.5 rounded-[3px] border border-white/10">
                      {card.id}
                    </span>
                    <span className="font-mono text-[8px] text-brand bg-[rgba(23,19,15,0.75)] backdrop-blur-md px-1.5 py-0.5 rounded-[3px] border border-brand/20">
                      {card.rarity}
                    </span>
                  </div>
                </Link>

                <div className="p-3 flex-1 flex flex-col">
                  <div className="mb-2">
                    <h3 className="font-sans font-bold text-[13px] text-text-primary truncate leading-tight mb-1">
                      {card.name}
                    </h3>
                    <p className="font-mono font-black text-[15px] text-text-primary">
                      HK$ {card.price.toLocaleString("en-HK")}
                    </p>
                  </div>

                  <div className="mt-auto pt-2 border-t border-[rgba(237,232,224,0.06)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[10px] text-text-secondary truncate">
                        {card.seller}
                      </span>
                    </div>
                    {/* 🟢 核心修正 3：換上全域 AuctionButton，首頁拍賣即可實時點擊競投！ */}
                    <AuctionButton listing={card} className="w-full py-1.5" />
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden lg:flex -left-3 h-8 w-8 bg-[rgba(23,19,15,0.9)] border-brand/20 text-brand hover:bg-brand hover:text-[#17130f]" />
        <CarouselNext className="hidden lg:flex -right-3 h-8 w-8 bg-[rgba(23,19,15,0.9)] border-brand/20 text-brand hover:bg-brand hover:text-[#17130f]" />
      </Carousel>
    </div>
  );
}
