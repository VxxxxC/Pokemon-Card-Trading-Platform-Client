"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

// Mock official standard databases mapped by Card ID
const CARD_SPECS_DATABASE: Record<string, {
  name: string;
  jpName: string;
  set: string;
  rarity: "SAR" | "UR" | "SR" | "AR";
  grade: { authority: string; score: string };
  price: number;
  delta: number;
  deltaDirection: "up" | "down";
  images: string[];
  type: string;
  stage: string;
  weakness: string;
  retreatCost: string;
  moveDamage: string;
  artist: string;
  seller: string;
  sellerRating: number;
  sellerTrades: number;
  sellerRank: "專業道館主" | "資深收藏家" | "傳奇卡師";
  soldHistory: { date: string; grade: string; price: number }[];
  chartPoints: { day: number; date: string; price: number }[];
}> = {
  "sv2a-182": {
    name: "Charizard ex SAR (噴火龍)",
    jpName: "リザードン ex SAR",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 2250,
    delta: 120,
    deltaDirection: "up",
    images: [
      "https://picsum.photos/seed/poke-charizard/600/420",
      "https://picsum.photos/seed/char-corner1/600/420",
      "https://picsum.photos/seed/char-corner2/600/420",
      "https://picsum.photos/seed/char-edge1/600/420",
      "https://picsum.photos/seed/char-back/600/420",
    ],
    type: "火 (Fire)",
    stage: "Stage 2 (二階進化)",
    weakness: "水 x2",
    retreatCost: "◆◆",
    moveDamage: "爆裂燃燒 330 (Crimson Storm)",
    artist: "AKIRA EGAWA",
    seller: "渡邊道館",
    sellerRating: 4.9,
    sellerTrades: 120,
    sellerRank: "專業道館主",
    soldHistory: [
      { date: "2026-05-26", grade: "PSA 10", price: 2210 },
      { date: "2026-05-24", grade: "PSA 10", price: 2180 },
      { date: "2026-05-20", grade: "BGS 9.5", price: 1980 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 2000 },
      { day: 5, date: "05-05", price: 2050 },
      { day: 10, date: "05-10", price: 2100 },
      { day: 15, date: "05-15", price: 2080 },
      { day: 20, date: "05-20", price: 2150 },
      { day: 25, date: "05-25", price: 2200 },
      { day: 30, date: "05-28", price: 2250 },
    ],
  },
  "sv2a-189": {
    name: "Mewtwo ex SAR (超夢)",
    jpName: "ミュウツー ex SAR",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 2600,
    delta: 50,
    deltaDirection: "down",
    images: [
      "https://picsum.photos/seed/poke-mewtwo/600/420",
      "https://picsum.photos/seed/mew-corner1/600/420",
      "https://picsum.photos/seed/mew-corner2/600/420",
      "https://picsum.photos/seed/mew-back/600/420",
    ],
    type: "超能力 (Psychic)",
    stage: "Basic (基礎)",
    weakness: "惡 x2",
    retreatCost: "◆",
    moveDamage: "心靈震撼 220 (Psychic Raid)",
    artist: "GIDORA",
    seller: "京都卡牌專門店",
    sellerRating: 4.85,
    sellerTrades: 95,
    sellerRank: "資深收藏家",
    soldHistory: [
      { date: "2026-05-25", grade: "BGS 9.5", price: 2650 },
      { date: "2026-05-21", grade: "PSA 10", price: 2780 },
      { date: "2026-05-15", grade: "BGS 9.5", price: 2590 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 2700 },
      { day: 5, date: "05-05", price: 2680 },
      { day: 10, date: "05-10", price: 2650 },
      { day: 15, date: "05-15", price: 2630 },
      { day: 20, date: "05-20", price: 2610 },
      { day: 25, date: "05-25", price: 2620 },
      { day: 30, date: "05-28", price: 2600 },
    ],
  },
};

// Fallback template for any card search IDs not in mock database
const getFallbackCard = (id: string): typeof CARD_SPECS_DATABASE["sv2a-182"] => {
  return {
    name: `精選卡牌 (${id})`,
    jpName: "ポケモンカード精選",
    set: "Pokémon TCG Base",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 1500,
    delta: 50,
    deltaDirection: "up",
    images: [
      "https://picsum.photos/seed/poke-fallback/600/420",
      "https://picsum.photos/seed/poke-fallback-b/600/420",
    ],
    type: "無 (Normal)",
    stage: "Basic",
    weakness: "格鬥 x2",
    retreatCost: "◆",
    moveDamage: "重壓攻擊 120",
    artist: "TOKIYA",
    seller: "東京TCG市場",
    sellerRating: 4.9,
    sellerTrades: 240,
    sellerRank: "專業道館主",
    soldHistory: [
      { date: "2026-05-20", grade: "PSA 10", price: 1480 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 1400 },
      { day: 15, date: "05-15", price: 1450 },
      { day: 30, date: "05-28", price: 1500 },
    ],
  };
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const card = CARD_SPECS_DATABASE[id] || getFallbackCard(id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  // Slideover trigger states
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<"buy" | "bid" | null>(null);

  // SVG Sparkline dimensions
  const chartWidth = 500;
  const chartHeight = 120;
  const padding = 20;

  const minPrice = Math.min(...card.chartPoints.map((p) => p.price)) * 0.95;
  const maxPrice = Math.max(...card.chartPoints.map((p) => p.price)) * 1.05;

  // Generate SVG Points mapping
  const points = card.chartPoints.map((pt, i) => {
    const x = padding + (i / (card.chartPoints.length - 1)) * (chartWidth - padding * 2);
    const y =
      chartHeight -
      padding -
      ((pt.price - minPrice) / (maxPrice - minPrice)) * (chartHeight - padding * 2);
    return { x, y, ...pt };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ""
  );

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  const triggerTransaction = (mode: "buy" | "bid") => {
    setSlideOverMode(mode);
    setIsSlideOverOpen(true);
  };

  const currentListing: MarketplaceListing = {
    id,
    name: card.name,
    set: card.set,
    rarity: card.rarity,
    grade: card.grade,
    price: card.price,
    delta: card.delta,
    deltaDirection: card.deltaDirection,
    image: card.images[0],
    seller: card.seller,
  };

  return (
    <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 lg:pb-12">
        {/* Breadcrumb navigator */}
        <div className="mb-6 font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5">
          <Link href="/marketplace" className="hover:text-[#d4a574] transition-colors">
            MARKETPLACE探索
          </Link>
          <span>/</span>
          <span className="text-[#8A8680] truncate uppercase">{id} DETAIL</span>
        </div>

        {/* ── Asymmetric Layout ── */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          
          {/* Left Column (Sticky Photos Exhibit - Width: 5/12) */}
          <section className="lg:col-span-5 lg:sticky lg:top-[5.5rem] space-y-4 mb-6 lg:mb-0">
            {/* Display Magnifier viewport */}
            <div className="relative w-full aspect-[5/3.8] bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.60)]">
              <Image
                src={card.images[activeImageIndex]}
                alt={`${card.name} 放大展台`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              {/* Evidence condition seal label */}
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="inline-flex px-2 py-1 rounded bg-[#17130f]/80 backdrop-blur-sm border border-[rgba(237,232,224,0.12)] font-mono text-[10px] font-semibold text-[#d4c4b7]">
                  【美品 S】實物品相存證
                </span>
              </div>
            </div>

            {/* Micro thumbnail grid navigation */}
            <div className="grid grid-cols-5 gap-2">
              {card.images.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setActiveImageIndex(i)}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative aspect-[5/3.8] bg-[#26211C] rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    activeImageIndex === i
                      ? "border-[#d4a574] ring-1 ring-[#d4a574]/40"
                      : "border-[rgba(237,232,224,0.08)] hover:border-[#d4a574]/40"
                  }`}
                  aria-label={`查看實物特寫相片 ${i + 1}`}
                >
                  <Image src={img} alt="角落細節" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            <p className="font-mono text-[10px] text-[#50453b] text-center tracking-wider leading-relaxed">
              ⚠️ 本卡實物相片由私人賣家提交，包含卡牌四角(Corners)與微距刮痕細節。平台第三方鑑定確認品相前將進行比對鎖定。
            </p>
          </section>

          {/* Right Column (Terminal specs transaction panel - Width: 7/12) */}
          <section className="lg:col-span-7 space-y-6">
            {/* Headline Details */}
            <div className="space-y-1.5 pb-4 border-b border-[rgba(237,232,224,0.06)]">
              <h1 className="font-sans font-bold text-[24px] lg:text-[28px] text-[#eae1da] leading-tight">
                {card.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[12px] text-[#d4c4b7]">{card.jpName}</span>
                <span className="font-mono text-[12px] text-[#50453b]">|</span>
                <span className="font-mono text-[12px] text-[#d4c4b7]">{card.set}</span>
              </div>
            </div>

            {/* Merchant Identity Module */}
            <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.06)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0">
                  <Image src="https://picsum.photos/seed/dealer-avatar/80/80" alt="商家頭像" fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-sans font-semibold text-[14px] text-[#eae1da]">{card.seller}</p>
                    <span className="inline-flex items-center gap-0.5 font-sans text-[11px] text-[#d4a574] font-semibold bg-[rgba(212,165,116,0.12)] px-1.5 py-0.2 rounded">
                      🏅 {card.sellerRank}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-[#d4c4b7] mt-0.5">
                    ⭐ {card.sellerRating} 好評率 ({card.sellerTrades}+ 筆已完成交易)
                  </p>
                </div>
              </div>
              <Link
                href={`/profile/PKT-8839-44A`}
                className="shrink-0 h-8 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] hover:bg-[#39342f] text-[#d4c4b7] font-sans font-medium text-[11px] flex items-center justify-center transition-colors"
              >
                前往店舖
              </Link>
            </div>

            {/* Spot Price details */}
            <div className="bg-[#26211C] p-5 rounded-2xl border border-[rgba(212,165,116,0.20)] flex items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wider block mb-1">
                  港幣現貨最低起價 (SPOT VALUE)
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-bold text-[32px] text-[#eae1da] leading-none">
                    HK$ {card.price.toLocaleString("en-HK")}
                  </p>
                  <span
                    className={`font-mono text-[13px] font-semibold ${
                      card.deltaDirection === "up" ? "text-[#10b981]" : "text-[#ef4444]"
                    }`}
                  >
                    {card.deltaDirection === "up" ? "▲" : "▼"} {card.deltaDirection === "up" ? "+" : "-"}$
                    {card.delta} (24H)
                  </span>
                </div>
                <p className="font-mono text-[10px] text-[#50453b] mt-1.5">
                  更新時間：[SERVER_TIME_RESOLVED]
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => triggerTransaction("buy")}
                  className="h-11 px-6 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[13px] rounded-lg active:scale-[0.98] transition-transform min-h-[44px] cursor-pointer"
                >
                  ⚡ 直接購買
                </button>
                <button
                  onClick={() => triggerTransaction("bid")}
                  className="h-11 px-6 border border-[#d4a574] text-[#d4a574] hover:bg-[rgba(212,165,116,0.08)] font-sans font-bold text-[13px] rounded-lg active:scale-[0.98] transition-transform min-h-[44px] cursor-pointer"
                >
                  📈 即時出價
                </button>
              </div>
            </div>

            {/* Custom Interactive SVG Sparkline Historical Chart */}
            <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                  Mercari JP 30天歷史走勢圖
                </h3>
                <span className="font-mono text-[11px] text-[#d4c4b7]">
                  日版已成交均價 (JPY換算HKD)
                </span>
              </div>

              {/* Sparkline Graphic Area */}
              <div className="relative w-full h-[120px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  width="100%"
                  height="100%"
                  className="overflow-visible"
                >
                  {/* Linear Gradient Definitions */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a574" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#d4a574" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient underlying area */}
                  <path d={areaD} fill="url(#chartGradient)" />

                  {/* Main Line path */}
                  <path d={pathD} fill="none" stroke="#d4a574" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Dot anchors */}
                  {points.map((pt, i) => (
                    <circle
                      key={pt.day}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredChartIndex === i ? 6 : 3.5}
                      fill={hoveredChartIndex === i ? "#eae1da" : "#26211C"}
                      stroke="#d4a574"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredChartIndex(i)}
                      onMouseLeave={() => setHoveredChartIndex(null)}
                    />
                  ))}
                </svg>

                {/* Floating Glassmorphic Tooltip */}
                {hoveredChartIndex !== null && (
                  <div
                    className="absolute z-20 bg-[#2e2925]/90 border border-[rgba(237,232,224,0.15)] rounded-lg p-2 shadow-lg backdrop-blur-xs font-mono text-[10px] pointer-events-none"
                    style={{
                      left: `${(points[hoveredChartIndex].x / chartWidth) * 90}%`,
                      top: `${(points[hoveredChartIndex].y / chartHeight) * 60 + 10}px`,
                    }}
                  >
                    <p className="text-[#8A8680]">日期: {points[hoveredChartIndex].date}</p>
                    <p className="text-[#d4a574] font-semibold mt-0.5">
                      均價: HK$ {points[hoveredChartIndex].price}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Standard Specifications Grid Table */}
            <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(237,232,224,0.08)]">
                <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                  卡牌標準數據規格矩陣
                </h3>
              </div>

              {/* High density spec matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 font-sans text-[13px]">
                {[
                  { label: "系列名稱", val: card.set },
                  { label: "日版原名", val: card.jpName },
                  { label: "卡牌屬性", val: card.type },
                  { label: "進化階段", val: card.stage },
                  { label: "弱點屬性", val: card.weakness },
                  { label: "撤退成本", val: card.retreatCost },
                  { label: "官方畫師", val: card.artist },
                ].map((row, idx) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between p-3.5 ${
                      idx % 2 === 0 ? "bg-[#2c2722]" : "bg-[#26211C]"
                    } border-b border-[rgba(237,232,224,0.04)]`}
                  >
                    <span className="text-[#d4c4b7]">{row.label}</span>
                    <span className="font-semibold text-[#eae1da] text-right truncate max-w-[180px]">{row.val}</span>
                  </div>
                ))}

                {/* Special badges rows */}
                <div className="flex items-center justify-between p-3.5 bg-[#26211C] border-b border-[rgba(237,232,224,0.04)] sm:col-span-2">
                  <span className="text-[#d4c4b7]">鑑定等級及稀有度</span>
                  <div className="flex items-center gap-1.5">
                    <RarityBadge rarity={card.rarity} />
                    <GradeBadge authority={card.grade.authority} score={card.grade.score} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#2c2722] border-b border-[rgba(237,232,224,0.04)] sm:col-span-2">
                  <span className="text-[#d4c4b7]">核心招式傷害</span>
                  <span className="font-semibold text-[#eae1da] font-mono text-[12px]">{card.moveDamage}</span>
                </div>
              </div>
            </div>

            {/* Sold Transactions history ledger */}
            <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
              <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                最近平台已成交歷史
              </h3>
              <div className="space-y-2">
                {card.soldHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between font-mono text-[12px] p-2.5 bg-[#17130f] rounded-lg border border-[rgba(237,232,224,0.04)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#8A8680]">{item.date}</span>
                      <span className="text-[#50453b]">|</span>
                      <span className="text-[#d4a574]">{item.grade}</span>
                    </div>
                    <span className="font-bold text-[#10b981]">
                      HK$ {item.price.toLocaleString("en-HK")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      </main>

      <BottomNav />

      {/* Slideover checkout forms */}
      <ExecutionSlideOver
        listing={currentListing}
        mode={slideOverMode}
        onClose={() => {
          setIsSlideOverOpen(false);
          setSlideOverMode(null);
        }}
      />
    </div>
  );
}
