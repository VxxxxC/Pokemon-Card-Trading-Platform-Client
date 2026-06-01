"use client";

import Image from "next/image";
import Link from "next/link";

interface TrackedCardProps {
  id: string;
  name: string;
  cardCode: string;
  currentPrice: number;
  trend24h: number;
  sparklinePoints: string;
  sparklineDirection: "up" | "down";
  alertTag?: string | null;
  image: string;
}

// TODO: [database] Replace with Supabase query — JOIN `wishlists` + `listings` for tracked cards with live price feed
// TODO: [API] Connect to Mercari JP / SKUNK price API for real-time HKD valuations
// TODO: [server] For logged-out users, show global hot cards from a cached Edge Function
const MOCK_WISHLIST: TrackedCardProps[] = [
  {
    id: "sv8a-123",
    name: "摩魯蛾 SAR",
    cardCode: "SV8a-123",
    currentPrice: 1_080,
    trend24h: 4.5,
    sparklinePoints: "0,30 8,26 16,22 24,24 32,18 40,12 48,8 56,13 64,10",
    sparklineDirection: "up",
    alertTag: "全港最低",
    image: "https://picsum.photos/seed/wishlist-mothim/200/280",
  },
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    cardCode: "SV2a-182",
    currentPrice: 3_900,
    trend24h: -2.1,
    sparklinePoints: "0,10 8,12 16,15 24,17 32,19 40,22 48,21 56,26 64,30",
    sparklineDirection: "down",
    alertTag: "降價通知",
    image: "https://picsum.photos/seed/wishlist-charizard/200/280",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    cardCode: "SV6a-109",
    currentPrice: 3_200,
    trend24h: 1.8,
    sparklinePoints: "0,28 8,25 16,22 24,19 32,16 40,15 48,14 56,12 64,10",
    sparklineDirection: "up",
    alertTag: null,
    image: "https://picsum.photos/seed/wishlist-umbreon/200/280",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    cardCode: "SV2a-215",
    currentPrice: 680,
    trend24h: -0.7,
    sparklinePoints: "0,12 8,14 16,13 24,16 32,17 40,18 48,20 56,23 64,28",
    sparklineDirection: "down",
    alertTag: "今日新上架",
    image: "https://picsum.photos/seed/wishlist-pikachu/200/280",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    cardCode: "SV2a-233",
    currentPrice: 2_180,
    trend24h: 3.2,
    sparklinePoints: "0,30 8,24 16,20 24,16 32,14 40,10 48,8 56,6 64,4",
    sparklineDirection: "up",
    alertTag: "全港最低",
    image: "https://picsum.photos/seed/wishlist-mimikyu/200/280",
  },
];

function Sparkline({
  points,
  direction,
}: {
  points: string;
  direction: "up" | "down";
}) {
  const color = direction === "up" ? "#10b981" : "#ef4444";
  return (
    <svg
      width="48"
      height="24"
      viewBox="0 0 64 32"
      fill="none"
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WishlistCardSkeleton() {
  return (
    <div className="shrink-0 w-36 rounded-xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]">
      <div className="w-full aspect-5/7 bg-linear-to-b from-[#26211C] via-[#2e2925] to-[#26211C] animate-pulse" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3 bg-bg-elevated rounded animate-pulse w-3/4" />
        <div className="h-2.5 bg-bg-elevated rounded animate-pulse w-1/2" />
        <div className="h-3.5 bg-bg-elevated rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}

function WishlistCardItem({ card }: { card: TrackedCardProps }) {
  const formattedPrice = `HK$ ${card.currentPrice.toLocaleString("en-HK")}`;
  const trendSign = card.trend24h >= 0 ? "▲" : "▼";
  const trendFormatted = `${trendSign} ${Math.abs(card.trend24h).toFixed(1)}%`;

  return (
    <Link
      href={`/marketplace?card=${card.id}`}
      className="shrink-0 w-36 md:w-48 rounded-xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] hover:border-brand/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.60)] transition-all active:scale-[0.98] block"
    >
      {/* Card portrait image */}
      <div className="relative w-full aspect-5/7 overflow-hidden bg-bg-elevated">
        <Image
          src={card.image}
          alt={card.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 144px, 192px"
        />
        {card.alertTag && (
          <span className="absolute top-2 left-2 font-mono text-[10px] md:text-[11px] font-bold text-[#17130f] bg-brand px-2 py-0.5 rounded-sm leading-none shadow-sm">
            {card.alertTag}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-sans font-bold text-[13px] md:text-base text-text-primary truncate mb-0.5">
          {card.name}
        </p>
        <p className="font-mono text-[10px] md:text-[11px] text-text-disabled mb-2">
          {card.cardCode}
        </p>
        {/* Price + sparkline */}
        <div className="flex items-center justify-between gap-1">
          <div>
            <p className="font-mono font-bold text-[14px] md:text-lg text-brand leading-none">
              {formattedPrice}
            </p>
            <span
              className={`font-mono text-[10px] md:text-[11px] font-bold mt-1 block ${
                card.trend24h >= 0 ? "text-success" : "text-warning"
              }`}
            >
              {trendFormatted}
            </span>
          </div>
          <Sparkline
            points={card.sparklinePoints}
            direction={card.sparklineDirection}
          />
        </div>
      </div>
    </Link>
  );
}

interface WishlistTickerProps {
  isLoading?: boolean;
}

export function WishlistTicker({ isLoading = false }: WishlistTickerProps) {
  return (
    <section aria-labelledby="wishlist-ticker-heading" className="mb-8">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2
            id="wishlist-ticker-heading"
            className="font-sans font-semibold text-[20px] text-text-primary flex items-center gap-2"
          >
            <span className="text-brand" aria-hidden="true">
              ★
            </span>
            我的心水情報
          </h2>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            登入追蹤心水神卡，降價即時通知
          </p>
        </div>
        <Link
          href="/profile/user/collection"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors shrink-0 mt-1"
        >
          管理 →
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-3 scrollbar-none pb-1 -mx-1 px-1">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <WishlistCardSkeleton key={i} />
            ))
          : MOCK_WISHLIST.map((card) => (
              <WishlistCardItem key={card.id} card={card} />
            ))}
      </div>
    </section>
  );
}
