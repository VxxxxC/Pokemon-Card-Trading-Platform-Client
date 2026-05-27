"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";

type FeedCard = {
  id: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  image: string;
  cta: string;
  href: string;
};

// TODO: [server] If authenticated, fetch user's followed cards/merchants and compute lowest-price listings.
const MOCK_FEED: FeedCard[] = [
  {
    id: "follow-1",
    title: "追蹤：ピカチュウ AR",
    subtitle: "最低現貨 · 認證商家",
    priceLabel: "¥38,500",
    image: "https://picsum.photos/seed/follow-1/560/420",
    cta: "查看現貨",
    href: "/marketplace?code=SV8a-123",
  },
  {
    id: "follow-2",
    title: "追蹤：リザードン ex SAR",
    subtitle: "今日新上架 · 道館主商家",
    priceLabel: "¥280,000",
    image: "https://picsum.photos/seed/follow-2/560/420",
    cta: "立即狙擊",
    href: "/marketplace?code=SV2a-182",
  },
  {
    id: "follow-3",
    title: "追蹤：ブラッキー ex SAR",
    subtitle: "現貨波動 · 已鑑定",
    priceLabel: "¥395,000",
    image: "https://picsum.photos/seed/follow-3/560/420",
    cta: "查看行情",
    href: "/marketplace?code=SV6a-109",
  },
  {
    id: "follow-4",
    title: "追蹤：ミュウツー ex SAR",
    subtitle: "低於日本市價 · 雷達命中",
    priceLabel: "¥145,000",
    image: "https://picsum.photos/seed/follow-4/560/420",
    cta: "去撿漏",
    href: "/marketplace?code=SV8a-198",
  },
];

export function FollowingFeed() {
  // TODO: [server] Replace with session check from Supabase auth.
  const isLoggedIn = false;

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cards = useMemo(() => MOCK_FEED, []);

  return (
    <section className="mt-10" aria-labelledby="following-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="following-heading"
            className="font-sans text-[18px] sm:text-[20px] font-semibold text-text-primary"
          >
            我的心水情報
          </h2>
          <p className="mt-1 font-sans text-[13px] text-text-secondary">
            {isLoggedIn
              ? "依你追蹤的卡牌與商家，動態推薦最低現貨。"
              : "登入追蹤心水神卡，降價即時通知。"}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {!isLoggedIn ? (
            <Link
              href="/auth"
              className="h-10 min-h-[44px] px-4 rounded-xl bg-brand text-bg-page font-sans text-[13px] font-semibold hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform inline-flex items-center justify-center"
            >
              登入追蹤
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => scrollerRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
            className="h-10 w-10 min-h-[44px] rounded-xl border border-[rgba(237,232,224,0.12)] bg-bg-card hover:bg-bg-elevated transition-colors"
            aria-label="向左滑動"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollerRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
            className="h-10 w-10 min-h-[44px] rounded-xl border border-[rgba(237,232,224,0.12)] bg-bg-card hover:bg-bg-elevated transition-colors"
            aria-label="向右滑動"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-4 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      >
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="snap-start shrink-0 w-[280px] sm:w-[340px] rounded-[18px] overflow-hidden border border-[rgba(237,232,224,0.08)] bg-bg-card hover:bg-bg-elevated transition-colors"
          >
            <div className="relative w-full aspect-[16/10] bg-bg-page">
              <Image
                src={card.image}
                alt=""
                fill
                sizes="340px"
                className="object-cover opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-page via-transparent to-transparent" />
            </div>
            <div className="px-4 py-4">
              <p className="font-sans text-[13px] font-semibold text-text-primary truncate">
                {card.title}
              </p>
              <p className="mt-1 font-sans text-[12px] text-text-secondary truncate">
                {card.subtitle}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[14px] font-semibold text-success">
                  {card.priceLabel}
                </span>
                <span className="font-mono text-[12px] text-brand">{card.cta} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

