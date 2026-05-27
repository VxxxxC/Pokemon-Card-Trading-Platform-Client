"use client";

/**
 * My Following Feed (Section 3 from HKcardvault spec)
 * 動態再行銷：我的心水情報 (My Following Feed)
 *
 * - Logged in: Show user's followed cards at lowest prices + followed merchants' new listings
 * - Logged out: Show global hot recommendations + prompt to login for personalized tracking
 * - Horizontal scrolling card slider
 */

import Link from "next/link";
import Image from "next/image";
import { RarityBadge } from "../cards/RarityBadge";
import { GradeBadge } from "../cards/GradeBadge";

// TODO [MOCK DATA]: Replace with actual user auth check and Supabase query
const isLoggedIn = false; // Placeholder

// TODO [MOCK DATA]: Replace with Supabase query on `user_favorites` JOIN `listings` for logged-in users
// TODO [BACKEND]: Must use compound index on (user_id, listing_id) and (user_id, merchant_id) per HKcardvault spec Section 3
const followedCards = [
  {
    id: "sv2a-182",
    name: "Charizard ex",
    set: "151",
    rarity: "SAR" as const,
    grade: { authority: "PSA" as const, score: "10" },
    price: 45000,
    image: "https://picsum.photos/seed/follow-charizard/300/200",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex",
    set: "151",
    rarity: "SAR" as const,
    grade: { authority: "BGS" as const, score: "9.5" },
    price: 52000,
    image: "https://picsum.photos/seed/follow-mewtwo/300/200",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex",
    set: "Night Wanderer",
    rarity: "SAR" as const,
    grade: { authority: "PSA" as const, score: "10" },
    price: 38000,
    image: "https://picsum.photos/seed/follow-umbreon/300/200",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu",
    set: "151",
    rarity: "AR" as const,
    grade: { authority: "CGC" as const, score: "9" },
    price: 8500,
    image: "https://picsum.photos/seed/follow-pikachu/300/200",
    seller: "東京TCG市場",
  },
];

export function MyFollowingFeed() {
  const cards = isLoggedIn ? followedCards : followedCards; // Same data for demo

  return (
    <section aria-labelledby="following-feed-heading" className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          id="following-feed-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          {isLoggedIn ? "我的關注" : "熱門推薦"}
        </h2>
        {!isLoggedIn && (
          <Link
            href="/auth"
            className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
          >
            登入追蹤 →
          </Link>
        )}
      </div>

      {/* Horizontal scrolling card slider */}
      <div className="overflow-x-auto pb-3 scrollbar-hide">
        <div className="flex gap-4 w-max">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/listing/${card.id}`}
              className="block w-[280px] bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.30)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.45)] hover:scale-[1.02] transition-all"
            >
              {/* Card image */}
              <div className="relative h-[160px] bg-bg-elevated">
                <Image
                  src={card.image}
                  alt={`${card.name} - ${card.set}`}
                  fill
                  className="object-cover"
                />
                {/* Rarity badge overlay */}
                <div className="absolute top-2 left-2">
                  <RarityBadge rarity={card.rarity} />
                </div>
              </div>

              {/* Card info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-semibold text-[14px] text-text-primary truncate">
                      {card.name}
                    </h3>
                    <p className="font-mono text-[11px] text-text-secondary truncate">
                      {card.set}
                    </p>
                  </div>
                  <GradeBadge authority={card.grade.authority} score={card.grade.score} />
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-[16px] text-text-primary">
                    ¥{card.price.toLocaleString("zh-TW")}
                  </span>
                  <span className="font-sans text-[11px] text-text-secondary truncate max-w-[100px]">
                    {card.seller}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Login prompt for non-authenticated users */}
      {!isLoggedIn && (
        <div className="mt-4 p-4 bg-bg-card rounded-[10px] border border-[rgba(237,232,224,0.08)] text-center">
          <p className="font-sans text-[13px] text-text-secondary">
            登入後可追蹤心水神卡，降價即時通知
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-9 px-5 mt-3 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover"
          >
            立即登入
          </Link>
        </div>
      )}
    </section>
  );
}
