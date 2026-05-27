"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { WishlistButton } from "@/app/components/market/WishlistButton";
import type { CardData } from "@/app/components/cards/CardItem";

// TODO: [database] Replace with Supabase query — fetch single listing by ID from `listings` table
const ALL_LISTINGS: (CardData & {
  description: string;
  images: string[];
  condition: string;
  language: string;
  seller_rating: number;
  seller_sales: number;
})[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 45000,
    delta: 2400,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/400/560",
    seller: "渡邊道館",
    description:
      "PSA 10 完美品級 Charizard ex SAR。來自 Pokémon Card 151 系列 (sv2a)。卡面無任何瑕疵，邊角完美，中心對齊優秀。附原裝 PSA 鑑定保護殼。",
    images: [
      "https://picsum.photos/seed/poke-charizard/400/560",
      "https://picsum.photos/seed/poke-charizard-back/400/560",
      "https://picsum.photos/seed/poke-charizard-case/400/560",
      "https://picsum.photos/seed/poke-charizard-detail/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.9,
    seller_sales: 328,
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 52000,
    delta: 1000,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-mewtwo/400/560",
    seller: "京都卡牌專門店",
    description:
      "BGS 9.5 Gem Mint 級別 Mewtwo ex SAR。151 系列夢幻般的收藏品。子項目評分：邊角 9.5、表面 9.5、邊緣 10、中心 9.5。",
    images: [
      "https://picsum.photos/seed/poke-mewtwo/400/560",
      "https://picsum.photos/seed/poke-mewtwo-back/400/560",
      "https://picsum.photos/seed/poke-mewtwo-angle/400/560",
      "https://picsum.photos/seed/poke-mewtwo-cert/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.8,
    seller_sales: 156,
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 38000,
    delta: 1500,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/400/560",
    seller: "大阪收藏家",
    description:
      "PSA 10 Umbreon ex SAR，Night Wanderer 系列頂級卡牌。月光主題的特別藝術稀有卡，畫面精緻。",
    images: [
      "https://picsum.photos/seed/poke-umbreon/400/560",
      "https://picsum.photos/seed/poke-umbreon-back/400/560",
      "https://picsum.photos/seed/poke-umbreon-side/400/560",
      "https://picsum.photos/seed/poke-umbreon-full/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.7,
    seller_sales: 89,
  },
  {
    id: "sv2a-215",
    name: "Pikachu",
    set: "151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 8500,
    delta: 300,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-pikachu/400/560",
    seller: "東京TCG市場",
    description:
      "CGC 9 Pikachu AR，151 系列的人氣角色藝術稀有卡。經典皮卡丘插畫，適合收藏入門。",
    images: [
      "https://picsum.photos/seed/poke-pikachu/400/560",
      "https://picsum.photos/seed/poke-pikachu-back/400/560",
      "https://picsum.photos/seed/poke-pikachu-close/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.6,
    seller_sales: 512,
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "9" },
    price: 28000,
    delta: 3200,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-mimikyu/400/560",
    seller: "名古屋交易商",
    description:
      "PSA 9 Mimikyu ex SAR，151 系列。謎擬 Q 的特別藝術稀有版本，插畫風格獨特，市場需求持續上升。",
    images: [
      "https://picsum.photos/seed/poke-mimikyu/400/560",
      "https://picsum.photos/seed/poke-mimikyu-back/400/560",
      "https://picsum.photos/seed/poke-mimikyu-angle/400/560",
      "https://picsum.photos/seed/poke-mimikyu-case/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.5,
    seller_sales: 203,
  },
  {
    id: "sv2a-213",
    name: "Eevee",
    set: "151",
    rarity: "AR",
    grade: { authority: "RAW", score: "NM" },
    price: 6200,
    delta: 800,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-eevee/400/560",
    seller: "福岡卡牌店",
    description:
      "Near Mint 未鑑定 Eevee AR，直接從補充包開封。卡面狀態極佳，適合自行送鑑或直接收藏。",
    images: [
      "https://picsum.photos/seed/poke-eevee/400/560",
      "https://picsum.photos/seed/poke-eevee-back/400/560",
      "https://picsum.photos/seed/poke-eevee-close/400/560",
    ],
    condition: "近全新（未鑑定）",
    language: "日文",
    seller_rating: 4.4,
    seller_sales: 67,
  },
  {
    id: "sv4a-084",
    name: "Garchomp ex",
    set: "Shiny Treasure ex",
    rarity: "UR",
    grade: { authority: "PSA", score: "10" },
    price: 32000,
    delta: 1800,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-garchomp/400/560",
    seller: "札幌珍稀卡牌",
    description:
      "PSA 10 Garchomp ex UR，Shiny Treasure ex 系列。烈咬陸鯊的 Ultra Rare 版本，閃卡工藝精美。",
    images: [
      "https://picsum.photos/seed/poke-garchomp/400/560",
      "https://picsum.photos/seed/poke-garchomp-back/400/560",
      "https://picsum.photos/seed/poke-garchomp-holo/400/560",
      "https://picsum.photos/seed/poke-garchomp-case/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.8,
    seller_sales: 142,
  },
  {
    id: "sv4a-221",
    name: "Miraidon ex",
    set: "Shiny Treasure ex",
    rarity: "SR",
    grade: { authority: "BGS", score: "9" },
    price: 14500,
    delta: 650,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-miraidon/400/560",
    seller: "仙台收藏館",
    description:
      "BGS 9 Miraidon ex SR，Shiny Treasure ex 系列。密勒頓的 Super Rare 版本，整體評級優良。",
    images: [
      "https://picsum.photos/seed/poke-miraidon/400/560",
      "https://picsum.photos/seed/poke-miraidon-back/400/560",
      "https://picsum.photos/seed/poke-miraidon-angle/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.3,
    seller_sales: 78,
  },
  {
    id: "s12a-086",
    name: "Umbreon VMAX",
    set: "VSTAR Universe",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 68000,
    delta: 4200,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon-vmax/400/560",
    seller: "東京TCG市場",
    description:
      "PSA 10 Umbreon VMAX SAR，VSTAR Universe 系列的王牌卡牌。月亮伊布的特別藝術稀有版本，被譽為近年最具收藏價值的卡牌之一。",
    images: [
      "https://picsum.photos/seed/poke-umbreon-vmax/400/560",
      "https://picsum.photos/seed/poke-umbreon-vmax-back/400/560",
      "https://picsum.photos/seed/poke-umbreon-vmax-case/400/560",
      "https://picsum.photos/seed/poke-umbreon-vmax-holo/400/560",
      "https://picsum.photos/seed/poke-umbreon-vmax-cert/400/560",
    ],
    condition: "全新（已鑑定）",
    language: "日文",
    seller_rating: 4.6,
    seller_sales: 512,
  },
];

// TODO: [database] Replace with Supabase query — fetch price history from `price_history` table
const MOCK_PRICE_HISTORY = [
  { date: "2025-01", price: 42000 },
  { date: "2025-02", price: 41500 },
  { date: "2025-03", price: 43200 },
  { date: "2025-04", price: 44800 },
  { date: "2025-05", price: 45000 },
];

function BackArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#d4a574"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#50453b"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10b981"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

/* ── Escrow Stepper ────────────────────────────────────────────────── */
const ESCROW_STEPS = [
  { label: "出價", icon: "1" },
  { label: "託管中", icon: "2" },
  { label: "已發貨", icon: "3" },
  { label: "檢查中", icon: "4" },
  { label: "已完成", icon: "5" },
];

function EscrowStepper() {
  return (
    <div className="flex items-center justify-between w-full">
      {ESCROW_STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[12px] font-medium border ${
                i === 0
                  ? "bg-brand text-[#17130f] border-brand"
                  : "border-[rgba(237,232,224,0.12)] text-text-disabled"
              }`}
            >
              {step.icon}
            </div>
            <span className="font-mono text-[10px] text-text-secondary whitespace-nowrap">
              {step.label}
            </span>
          </div>
          {i < ESCROW_STEPS.length - 1 && (
            <div className="flex-1 h-px bg-[rgba(237,232,224,0.08)] mx-2 mt-[-16px]" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Simple Price Chart ────────────────────────────────────────────── */
function PriceChart({
  data,
}: {
  data: { date: string; price: number }[];
}) {
  const maxPrice = Math.max(...data.map((d) => d.price));
  const minPrice = Math.min(...data.map((d) => d.price));
  const range = maxPrice - minPrice || 1;

  return (
    <div className="flex items-end gap-1 h-[80px]">
      {data.map((d) => {
        const height = ((d.price - minPrice) / range) * 60 + 20;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-[3px] bg-brand/30 hover:bg-brand/50 transition-colors"
              style={{ height: `${height}%` }}
              title={`${d.date}: ¥${d.price.toLocaleString("zh-TW")}`}
            />
            <span className="font-mono text-[9px] text-text-disabled">
              {d.date.split("-")[1]}月
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Page Component ───────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // TODO: [database] Replace with Supabase query — .from('listings').select('*').eq('id', id).single()
  const listing = ALL_LISTINGS.find((l) => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-[100dvh] bg-bg-page flex flex-col">
        <TopNav />
        <MobileHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-14 h-14 rounded-full bg-bg-card border border-[rgba(237,232,224,0.08)] flex items-center justify-center mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#50453b"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="font-sans text-[16px] text-text-primary font-medium mb-2">
            找不到此商品
          </p>
          <p className="font-mono text-[12px] text-text-secondary mb-6">
            商品編號 {id} 不存在或已下架
          </p>
          <Link
            href="/marketplace"
            className="h-10 px-6 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-[8px] hover:bg-brand-hover active:scale-[0.98] active:translate-y-[1px] transition-transform inline-flex items-center justify-center min-h-[44px]"
          >
            返回市場
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  const formattedPrice = `¥${listing.price.toLocaleString("zh-TW")}`;
  const formattedDelta = `${listing.deltaDirection === "up" ? "▲" : "▼"} ¥${listing.delta.toLocaleString("zh-TW")}`;

  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-8">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 mb-6" aria-label="麵包屑">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-text-secondary hover:text-brand transition-colors"
          >
            <BackArrowIcon />
            返回市場
          </Link>
          <span className="font-mono text-[12px] text-text-disabled">/</span>
          <span className="font-mono text-[12px] text-text-secondary truncate">
            {listing.name}
          </span>
        </nav>

        {/* ── Desktop: 2-col / Mobile: stacked ────────────────────── */}
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8">
          {/* ── Left: Image Gallery ─────────────────────────────── */}
          <div>
            {/* Hero Image */}
            <div className="relative w-full aspect-[4/5] rounded-[12px] overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)] shadow-[0_2px_12px_rgba(0,0,0,0.50)] mb-3">
              <Image
                src={listing.images[activeImageIndex]}
                alt={`${listing.name} — 圖片 ${activeImageIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
              {/* Rarity badge overlay */}
              <div className="absolute top-4 left-4">
                <RarityBadge rarity={listing.rarity} />
              </div>
              {/* Wishlist button overlay */}
              <div className="absolute top-4 right-4">
                <WishlistButton listingId={listing.id} />
              </div>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {listing.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`shrink-0 w-16 h-20 rounded-[8px] overflow-hidden border-2 transition-all ${
                    activeImageIndex === i
                      ? "border-brand shadow-[0_0_8px_rgba(212,165,116,0.3)]"
                      : "border-[rgba(237,232,224,0.08)] hover:border-[rgba(212,165,116,0.30)]"
                  }`}
                  aria-label={`查看圖片 ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${listing.name} 縮圖 ${i + 1}`}
                    width={64}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: Product Info Panel ───────────────────────── */}
          <div className="mt-6 lg:mt-0 space-y-6">
            {/* Title & Basic Info */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="font-sans font-bold text-[24px] lg:text-[28px] text-text-primary leading-tight">
                  {listing.name}
                </h1>
                <GradeBadge
                  authority={listing.grade.authority}
                  score={listing.grade.score}
                />
              </div>
              <p className="font-mono text-[13px] text-text-secondary">
                {listing.id} · {listing.set}
              </p>
            </div>

            {/* Price Section */}
            <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4">
              <div className="flex items-end justify-between mb-1">
                <p className="font-mono font-semibold text-[28px] text-text-primary">
                  {formattedPrice}
                </p>
                <span
                  className={`font-mono text-[13px] font-medium ${
                    listing.deltaDirection === "up"
                      ? "text-success"
                      : "text-warning"
                  }`}
                >
                  {formattedDelta}
                </span>
              </div>
              <p className="font-mono text-[11px] text-text-disabled">
                含稅價格 · 買家保障適用
              </p>
            </div>

            {/* CTA Buttons */}
            {/* TODO: [server] "直接購買" must trigger escrow flow — create order in Supabase, initiate Stripe Connect PaymentIntent */}
            {/* TODO: [API] "即時出價" must open bid modal and submit to `bids` table with user auth check */}
            <div className="flex gap-3">
              <button className="flex-1 h-12 bg-brand text-[#17130f] font-sans font-semibold text-[15px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover min-h-[44px]">
                直接購買
              </button>
              <button className="flex-1 h-12 border border-[rgba(237,232,224,0.12)] text-brand font-sans font-semibold text-[15px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-bg-elevated min-h-[44px]">
                即時出價
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <ShieldIcon />
                <span className="font-mono text-[11px] text-success">
                  交易託管保障
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TruckIcon />
                <span className="font-mono text-[11px] text-text-secondary">
                  追蹤配送
                </span>
              </div>
            </div>

            {/* Escrow Process */}
            <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4">
              <h2 className="font-sans font-semibold text-[14px] text-text-primary mb-4">
                交易流程
              </h2>
              <EscrowStepper />
            </div>

            {/* Card Specifications */}
            <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4">
              <h2 className="font-sans font-semibold text-[14px] text-text-primary mb-3">
                卡牌規格
              </h2>
              <div className="space-y-2.5">
                {[
                  { label: "系列", value: listing.set },
                  { label: "稀有度", value: listing.rarity },
                  { label: "鑑定機構", value: listing.grade.authority },
                  { label: "評分", value: listing.grade.score },
                  { label: "狀態", value: listing.condition },
                  { label: "語言", value: listing.language },
                  { label: "編號", value: listing.id },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-mono text-[12px] text-text-secondary">
                      {label}
                    </span>
                    <span className="font-mono text-[13px] text-text-primary font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4">
              <h2 className="font-sans font-semibold text-[14px] text-text-primary mb-2">
                商品描述
              </h2>
              <p className="font-sans text-[14px] text-text-secondary leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Price History */}
            <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4">
              <h2 className="font-sans font-semibold text-[14px] text-text-primary mb-3">
                價格走勢
              </h2>
              <PriceChart data={MOCK_PRICE_HISTORY} />
              <p className="font-mono text-[10px] text-text-disabled mt-2 text-right">
                近 5 個月均價趨勢
              </p>
            </div>

            {/* Seller Info */}
            <div className="bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] p-4">
              <h2 className="font-sans font-semibold text-[14px] text-text-primary mb-3">
                賣家資訊
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-bg-elevated border border-[rgba(237,232,224,0.08)] flex items-center justify-center">
                  <span className="font-sans text-[14px] text-brand font-semibold">
                    {listing.seller.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-sans text-[14px] text-text-primary font-medium">
                    {listing.seller}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          filled={i < Math.round(listing.seller_rating)}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[11px] text-text-secondary">
                      {listing.seller_rating}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[rgba(237,232,224,0.08)]">
                <span className="font-mono text-[11px] text-text-secondary">
                  成交 {listing.seller_sales} 筆
                </span>
                {/* TODO: [server] Link to seller's public profile page /profile/[seller_id] */}
                <button className="font-sans text-[12px] text-brand font-medium hover:text-brand-hover transition-colors">
                  查看店鋪 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
