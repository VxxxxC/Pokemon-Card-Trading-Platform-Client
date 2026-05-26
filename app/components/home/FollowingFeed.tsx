"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  fetchPokemonCards,
  toFollowingCard,
} from "@/app/lib/pokemon-data";

// Spec Section 3: My Following Feed — horizontal slider
// TODO [server]: Replace with Supabase query — logged-in: user's followed cards lowest prices; logged-out: global hot recommendations
// TODO [database]: Requires compound index on user_favorites (user_id, listing_id) and (user_id, merchant_id)

const fallbackCards = [
  { id: "sv2a-182", name: "Charizard ex", rarity: "SAR", price: 45000, image: "https://images.pokemontcg.io/sv3pt5/215_hires.png", seller: "渡邊道館" },
  { id: "sv2a-189", name: "Mewtwo ex", rarity: "SAR", price: 52000, image: "https://images.pokemontcg.io/sv3pt5/222_hires.png", seller: "京都卡牌專門店" },
  { id: "sv6a-109", name: "Umbreon ex", rarity: "SAR", price: 38000, image: "https://images.pokemontcg.io/sv3pt5/198_hires.png", seller: "東京TCG市場" },
  { id: "sv2a-215", name: "Pikachu", rarity: "AR", price: 8500, image: "https://images.pokemontcg.io/sv3pt5/207_hires.png", seller: "大阪收藏家" },
  { id: "sv2a-233", name: "Mimikyu ex", rarity: "SAR", price: 28000, image: "https://images.pokemontcg.io/sv3pt5/201_hires.png", seller: "名古屋交易商" },
  { id: "sv2a-213", name: "Eevee", rarity: "AR", price: 6200, image: "https://images.pokemontcg.io/sv3pt5/196_hires.png", seller: "福岡卡牌店" },
];

export function FollowingFeed() {
  // TODO [server]: Check auth state — show personalized feed if logged in
  const isLoggedIn = false;
  const [hotCards, setHotCards] = useState(fallbackCards);

  useEffect(() => {
    fetchPokemonCards({ q: "supertype:pokémon rarity:rare", pageSize: 8 })
      .then((cards) => {
        if (cards.length > 0) {
          setHotCards(cards.map(toFollowingCard));
        }
      })
      .catch(() => {
        // Keep fallback data on error
      });
  }, []);

  return (
    <section className="mb-8" aria-labelledby="following-heading">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="following-heading"
            className="font-sans font-semibold text-[20px] text-text-primary"
          >
            {isLoggedIn ? "我的心水情報" : "熱門推薦"}
          </h2>
          {!isLoggedIn && (
            <p className="font-sans text-[12px] text-text-secondary mt-0.5">
              <Link href="/auth" className="text-brand hover:text-brand-hover transition-colors">
                登入追蹤心水神卡
              </Link>
              ，降價即時通知
            </p>
          )}
        </div>
        <Link
          href="/marketplace"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      {/* Horizontal scrolling card slider */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {hotCards.map((card) => (
          <Link
            key={card.id}
            href={`/listing/${card.id}`}
            className="shrink-0 w-[156px] bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden hover:bg-bg-elevated transition-colors group"
          >
            <div className="relative w-full aspect-[5/7] bg-bg-elevated">
              <Image
                src={card.image}
                alt={`${card.name} ${card.rarity}`}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                sizes="156px"
              />
              <span className="absolute top-2 right-2 font-mono text-[10px] text-[#17130f] bg-brand px-1.5 py-0.5 rounded-[4px] font-semibold">
                {card.rarity}
              </span>
            </div>
            <div className="p-3">
              <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                {card.name}
              </p>
              <p className="font-mono text-[11px] text-text-secondary truncate">
                {card.id}
              </p>
              <p className="font-mono font-medium text-[14px] text-brand mt-1">
                ¥{card.price.toLocaleString("zh-TW")}
              </p>
              <p className="font-sans text-[11px] text-text-disabled truncate mt-0.5">
                {card.seller}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
