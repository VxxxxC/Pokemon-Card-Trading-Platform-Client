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

const featuredCards = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    set: "151",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$45,000",
    image: "https://picsum.photos/seed/poke-charizard/400/560",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    set: "151",
    rarity: "SAR",
    grade: "BGS 9.5",
    price: "HK$52,000",
    image: "https://picsum.photos/seed/poke-mewtwo/400/560",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$38,000",
    image: "https://picsum.photos/seed/poke-umbreon/400/560",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    set: "151",
    rarity: "AR",
    grade: "CGC 9",
    price: "HK$8,500",
    image: "https://picsum.photos/seed/poke-pikachu/400/560",
    seller: "東京TCG市場",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    set: "151",
    rarity: "SAR",
    grade: "PSA 9",
    price: "HK$28,000",
    image: "https://picsum.photos/seed/poke-mimikyu/400/560",
    seller: "名古屋交易商",
  },
  {
    id: "sv2a-213",
    name: "Eevee AR",
    set: "151",
    rarity: "AR",
    grade: "RAW NM",
    price: "HK$6,200",
    image: "https://picsum.photos/seed/poke-eevee/400/560",
    seller: "福岡卡牌店",
  },
  {
    id: "sv8a-125",
    name: "Rayquaza ex SAR",
    set: "Terastal Fest ex",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$12,500",
    image: "https://picsum.photos/seed/poke-rayquaza/400/560",
    seller: "神獸專門店",
  },
  {
    id: "sv4a-330",
    name: "Gardevoir ex SAR",
    set: "Shiny Treasure ex",
    rarity: "SAR",
    grade: "BGS 10",
    price: "HK$8,800",
    image: "https://picsum.photos/seed/poke-gardevoir/400/560",
    seller: "閃色收藏家",
  },
  {
    id: "sv3-199",
    name: "Charizard ex SAR",
    set: "Ruler of the Black Flame",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$15,800",
    image: "https://picsum.photos/seed/poke-zard3/400/560",
    seller: "黑炎道館",
  },
  {
    id: "sv2a-201",
    name: "Dragonite SAR",
    set: "151",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$9,200",
    image: "https://picsum.photos/seed/poke-dragonite/400/560",
    seller: "快龍速遞",
  },
  {
    id: "sv5k-092",
    name: "Walking Wake ex SAR",
    set: "Wild Force",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$5,500",
    image: "https://picsum.photos/seed/poke-wake/400/560",
    seller: "古代收藏家",
  },
  {
    id: "sv5m-091",
    name: "Iron Leaves ex SAR",
    set: "Cyber Judge",
    rarity: "SAR",
    grade: "PSA 10",
    price: "HK$4,800",
    image: "https://picsum.photos/seed/poke-leaves/400/560",
    seller: "未來研究所",
  },
];

export function FeaturedCarousel() {
  const plugin = React.useRef(
    Autoplay({
      delay: 4000,
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
          {featuredCards.slice(0, 12).map((card) => (
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
                  />
                  {/* Grade Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="font-mono text-[9px] font-bold text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[3px] shadow-lg">
                      {card.grade}
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
                      {card.price}
                    </p>
                  </div>
                  <div className="mt-auto pt-2 border-t border-[rgba(237,232,224,0.06)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[10px] text-text-secondary truncate">
                        {card.seller}
                      </span>
                    </div>
                    <button className="w-full py-1.5 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-brand font-sans font-bold text-[11px] rounded-[6px] hover:bg-brand hover:text-[#17130f] transition-all active:scale-[0.97]">
                      立即競投
                    </button>
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Navigation Arrows - Compact Style */}
        <CarouselPrevious className="hidden lg:flex -left-3 h-8 w-8 bg-[rgba(23,19,15,0.9)] border-brand/20 text-brand hover:bg-brand hover:text-[#17130f]" />
        <CarouselNext className="hidden lg:flex -right-3 h-8 w-8 bg-[rgba(23,19,15,0.9)] border-brand/20 text-brand hover:bg-brand hover:text-[#17130f]" />
      </Carousel>
    </div>
  );
}
