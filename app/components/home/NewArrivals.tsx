"use client";

import Link from "next/link";
import Image from "next/image";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
// 載入全新拋光防爆嘅全域原子級動作掣
import {
  BuyButton,
  BidButton,
} from "@/app/components/transactions/GlobalTxButtons";

const newArrivals: MarketplaceListing[] = [
  {
    id: "sv4a-330",
    name: "Gardevoir ex",
    set: "Shiny Treasure ex",
    rarity: "SAR",
    grade: { authority: "RAW", score: "【美品 S】" },
    price: 880,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-gardevoir/400/280",
    seller: "卡牌玩家HK",
  },
  {
    id: "sv2a-210",
    name: "Mew ex",
    set: "151",
    rarity: "SR",
    grade: { authority: "RAW", score: "【微傷 A】" },
    price: 520,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-mew/400/280",
    seller: "收藏達人",
  },
  {
    id: "sv6a-095",
    name: "Ceruledge ex",
    set: "Night Wanderer",
    rarity: "SR",
    grade: { authority: "RAW", score: "【美品 S】" },
    price: 380,
    delta: 0,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/c2c-ceruledge/400/280",
    seller: "旺角卡店",
  },
];

export function NewArrivals() {
  return (
    <section className="mb-8" aria-labelledby="arrivals-heading">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            id="arrivals-heading"
            className="font-sans font-bold text-[18px] md:text-[22px] text-[#eae1da]"
          >
            最新 C2C 現貨上架
          </h2>
          <p className="font-mono text-[10px] text-text-disabled uppercase tracking-wider mt-0.5">
            FRESHLY UNBOXED PRIVATE LISTINGS
          </p>
        </div>
        <Link
          href="/marketplace?filter=c2c&sort=newest"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      {/* 🟢 核心修復：強制加裝 [&::-webkit-scrollbar]:hidden 尾綴與直入 Style 屬性，雙重防線徹底擊殺露底 Scrollbar！ */}
      <div
        className="flex overflow-x-auto gap-4 scrollbar-none [&::-webkit-scrollbar]:hidden pb-4 -mx-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {newArrivals.map((item) => (
          <article
            key={item.id}
            className="shrink-0 w-[175px] sm:w-[195px] md:w-[225px] bg-[#26211C] rounded-[14px] border border-[rgba(237,232,224,0.08)] shadow-[0_1px_4px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.55)] hover:border-brand/30 transition-all overflow-hidden group flex flex-col justify-between"
          >
            <div>
              <Link
                href={`/marketplace?card=${item.id}`}
                className="block relative w-full aspect-[3/4] overflow-hidden bg-[#1A1612]"
              >
                <Image
                  src={item.image}
                  alt={`${item.name} — ${item.rarity}`}
                  fill
                  className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
                  sizes="(max-width: 768px) 180px, 230px"
                  unoptimized
                />
                <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-bold text-text-primary bg-[rgba(23,19,15,0.85)] backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-white/10">
                  {item.grade.score}
                </span>
                <span className="absolute top-2.5 right-2.5 font-mono text-[10px] font-bold text-brand bg-[#26211C]/90 backdrop-blur-md px-2 py-0.5 rounded-[4px] leading-none border border-brand/30">
                  {item.rarity}
                </span>
                <span className="absolute bottom-0 right-0 left-0 text-center font-mono text-[10px] text-text-disabled bg-[rgba(23,19,15,0.75)] backdrop-blur-md py-1">
                  剛剛上架
                </span>
              </Link>

              <div className="p-3.5 space-y-1.5">
                <div>
                  <h3 className="font-sans font-bold text-[13.5px] md:text-[14.5px] text-[#eae1da] truncate leading-tight mb-0.5">
                    {item.name}
                  </h3>
                  <span className="font-mono text-[10px] text-text-disabled block truncate">
                    {item.set}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <p className="font-mono font-bold text-[14.5px] md:text-[16px] text-[#eae1da] leading-none">
                    HK$ {item.price.toLocaleString()}
                  </p>
                  <span className="font-sans text-[10px] text-text-secondary truncate max-w-[75px] text-right">
                    {item.seller}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-3.5 pb-4 pt-1 flex flex-col sm:flex-row gap-2 w-full">
              <BuyButton listing={item} className="w-full py-1.5 h-8.5" />
              <BidButton listing={item} className="w-full py-1.5 h-8.5" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
