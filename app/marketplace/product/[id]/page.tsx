"use client";

import { useState, use, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";
import { BuyButton } from "@/app/components/transactions/GlobalTxButtons";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { MarketChartSkeleton } from "@/app/components/shared/MarketSkeletons";

interface ProductSpec {
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
  soldHistory: { date: string; grade: string; price: number }[];
  chartPoints: { day: number; date: string; price: number }[];
}

// 🟢 核心對齊：精準映射大盤目錄頁（INITIAL_LISTINGS）的 4 款熱門資產商品 ID
const PRODUCT_POOL_DATABASE: Record<string, ProductSpec> = {
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
      "https://picsum.photos/seed/char-back/600/420",
    ],
    type: "火 (Fire)",
    stage: "Stage 2 (二階進化)",
    weakness: "水 x2",
    retreatCost: "◆◆",
    moveDamage: "爆裂燃燒 330 (Crimson Storm)",
    artist: "AKIRA EGAWA",
    soldHistory: [
      { date: "2026-06-03", grade: "PSA 10", price: 2250 },
      { date: "2026-05-26", grade: "PSA 10", price: 2210 },
      { date: "2026-05-24", grade: "PSA 10", price: 2180 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 2000 },
      { day: 10, date: "05-10", price: 2100 },
      { day: 20, date: "05-20", price: 2150 },
      { day: 30, date: "06-03", price: 2250 },
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
      "https://picsum.photos/seed/mew-back/600/420",
    ],
    type: "超能力 (Psychic)",
    stage: "Basic (基礎)",
    weakness: "惡 x2",
    retreatCost: "◆",
    moveDamage: "心靈震撼 220 (Psychic Raid)",
    artist: "GIDORA",
    soldHistory: [
      { date: "2026-06-02", grade: "BGS 9.5", price: 2600 },
      { date: "2026-05-25", grade: "BGS 9.5", price: 2650 },
      { date: "2026-05-21", grade: "PSA 10", price: 2780 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 2700 },
      { day: 10, date: "05-10", price: 2650 },
      { day: 20, date: "05-20", price: 2610 },
      { day: 30, date: "06-02", price: 2600 },
    ],
  },
  "sv6a-109": {
    name: "Umbreon ex SAR (月亮伊布)",
    jpName: "ブラッキー ex SAR",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 1900,
    delta: 75,
    deltaDirection: "up",
    images: [
      "https://picsum.photos/seed/poke-umbreon/600/420",
      "https://picsum.photos/seed/umb-corner1/600/420",
      "https://picsum.photos/seed/umb-back/600/420",
    ],
    type: "惡 (Darkness)",
    stage: "Stage 1 (一階進化)",
    weakness: "草 x2",
    retreatCost: "◆◆",
    moveDamage: "月下暗殺 160",
    artist: "5ban Graphics",
    soldHistory: [
      { date: "2026-06-01", grade: "PSA 10", price: 1900 },
      { date: "2026-05-28", grade: "PSA 10", price: 1825 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 1800 },
      { day: 15, date: "05-15", price: 1820 },
      { day: 30, date: "06-01", price: 1900 },
    ],
  },
  "sv2a-215": {
    name: "Pikachu AR (皮卡丘)",
    jpName: "ピカチュウ AR",
    set: "Pokémon 151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 425,
    delta: 15,
    deltaDirection: "down",
    images: [
      "https://picsum.photos/seed/poke-pikachu/600/420",
      "https://picsum.photos/seed/pika-back/600/420",
    ],
    type: "雷 (Lightning)",
    stage: "Basic (基礎)",
    weakness: "鬥 x2",
    retreatCost: "◆",
    moveDamage: "十萬伏特 120",
    artist: "Kouki Saitou",
    soldHistory: [
      { date: "2026-06-02", grade: "CGC 9", price: 425 },
      { date: "2026-05-29", grade: "PSA 9", price: 440 },
    ],
    chartPoints: [
      { day: 1, date: "05-01", price: 450 },
      { day: 15, date: "05-15", price: 440 },
      { day: 30, date: "06-02", price: 425 },
    ],
  },
};

const getFallbackProduct = (id: string): ProductSpec => ({
  name: `公共大盤標準商品 (${id})`,
  jpName: "未登記項目",
  set: "Pokémon TCG Base",
  rarity: "SAR",
  grade: { authority: "PSA", score: "10" },
  price: 1000,
  delta: 0,
  deltaDirection: "up",
  images: ["https://picsum.photos/seed/fallback/600/420"],
  type: "無 (Normal)",
  stage: "Basic",
  weakness: "無",
  retreatCost: "◆",
  moveDamage: "標準撞擊 50",
  artist: "公用畫師",
  soldHistory: [],
  chartPoints: [{ day: 1, date: "05-01", price: 1000 }],
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  // 🟢 符合 Next.js 16 規格之 async params 異步解包
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const card = PRODUCT_POOL_DATABASE[id] || getFallbackProduct(id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(
    null,
  );

  // SSR 安全防爆水合防線
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  // SVG K 線圖 Canvas 規格演算
  const chartWidth = 500;
  const chartHeight = 120;
  const padding = 20;
  const hasChartData = card.chartPoints.length > 0;

  const minPrice = hasChartData
    ? Math.min(...card.chartPoints.map((p) => p.price)) * 0.95
    : 0;
  const maxPrice = hasChartData
    ? Math.max(...card.chartPoints.map((p) => p.price)) * 1.05
    : 0;

  const points = hasChartData
    ? card.chartPoints.map((pt, i) => {
        const x =
          padding +
          (i / Math.max(card.chartPoints.length - 1, 1)) *
            (chartWidth - padding * 2);
        const y =
          chartHeight -
          padding -
          ((pt.price - minPrice) / Math.max(maxPrice - minPrice, 1)) *
            (chartHeight - padding * 2);
        return { x, y, ...pt };
      })
    : [];

  const pathD = points.reduce(
    (acc, pt, i) =>
      i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
    "",
  );
  const areaD = hasChartData
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : "";

  // 封裝標準大盤現貨數據（無固定單一賣家綁定，直到 Revamp 展開商家對戰表）
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
    seller: "大盤最優定價資產",
  };

  return (
    <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 lg:pb-12">
        <div className="mb-6 font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5">
          <Link
            href="/marketplace"
            className="hover:text-[#d4a574] transition-colors"
          >
            MARKETPLACE 交易所大盤
          </Link>
          <span>/</span>
          <span className="text-[#8A8680] truncate uppercase">
            {id} AGGREGATED PRODUCT
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          {/* 左側：大盤高畫質圖庫 */}
          <section className="lg:col-span-5 lg:sticky lg:top-[5.5rem] space-y-4 mb-6 lg:mb-0">
            <div className="relative w-full aspect-[5/3.8] bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-lg">
              <Image
                src={card.images[activeImageIndex]}
                alt={`${card.name} 官方圖鑑`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
                unoptimized
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="inline-flex px-2 py-1 rounded bg-[#17130f]/80 backdrop-blur-sm border border-[rgba(237,232,224,0.12)] font-mono text-[10px] font-semibold text-brand">
                  🏛️ 官方標準合約圖鑑
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {card.images.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setActiveImageIndex(i)}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative aspect-[5/3.8] bg-[#26211C] rounded-lg overflow-hidden border transition-all cursor-pointer ${activeImageIndex === i ? "border-brand ring-1 ring-brand/40" : "border-[rgba(237,232,224,0.08)]"}`}
                  aria-label={`特寫相片 ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt="細節特寫"
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </section>

          {/* 右側：走勢圖與大盤數據 */}
          <section className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5 pb-4 border-b border-[rgba(237,232,224,0.06)]">
              <span className="inline-flex font-mono text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded font-black tracking-widest uppercase border border-brand/20">
                Aggregated Commodity Pool
              </span>
              <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] leading-tight tracking-tight mt-1">
                {card.name}
              </h1>
              <div className="flex items-center gap-2 font-mono text-[12px] text-[#d4c4b7]">
                <span>{card.jpName}</span>
                <span className="text-[#50453b]">|</span>
                <span>{card.set}</span>
              </div>
            </div>

            {/* 💡 大盤價格與交易按鈕區塊 */}
            <div className="bg-[#26211C] p-5 rounded-2xl border border-[rgba(212,165,116,0.15)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
              <div>
                <span className="font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wider block mb-1">
                  交易所現貨參考價 (MARKET AGGREGATED INDEX)
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-black text-[30px] text-[#eae1da] leading-none">
                    HK$ {card.price.toLocaleString("en-HK")}
                  </p>
                  <span
                    className={`font-mono text-[13px] font-semibold ${card.deltaDirection === "up" ? "text-success" : "text-error"}`}
                  >
                    {card.deltaDirection === "up" ? "▲" : "▼"}{" "}
                    {card.deltaDirection === "up" ? "+" : "-"}${card.delta}{" "}
                    (24H)
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0 self-stretch sm:self-auto w-full sm:w-auto">
                {/* 🟢 呼叫全域無參數 Zustand 總線抽屜 */}
                <BuyButton
                  listing={currentListing}
                  className="w-full sm:w-auto h-11 px-8 text-[13.5px] font-bold"
                />
              </div>
            </div>

            {/* 30天歷史走勢圖 */}
            {hasChartData ? (
              <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                    全網 30 天已成交均價走勢
                  </h3>
                  <span className="font-mono text-[10px] text-brand uppercase font-bold">
                    Live Index
                  </span>
                </div>
                <div className="relative w-full h-[120px]">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    width="100%"
                    height="100%"
                    className="overflow-visible"
                  >
                    <defs>
                      <linearGradient
                        id="chartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#d4a574"
                          stopOpacity="0.25"
                        />
                        <stop
                          offset="100%"
                          stopColor="#d4a574"
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#chartGradient)" />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#d4a574"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
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
                  {hoveredChartIndex !== null && points[hoveredChartIndex] && (
                    <div
                      className="absolute z-20 bg-[#2e2925]/90 border border-[rgba(237,232,224,0.15)] rounded-lg p-2 shadow-lg backdrop-blur-xs font-mono text-[10px] pointer-events-none"
                      style={{
                        left: `${(points[hoveredChartIndex].x / chartWidth) * 90}%`,
                        top: `${(points[hoveredChartIndex].y / chartHeight) * 60 + 10}px`,
                      }}
                    >
                      <p className="text-[#8A8680]">
                        日期: {points[hoveredChartIndex].date}
                      </p>
                      <p className="text-brand font-semibold mt-0.5">
                        價格: HK$ {points[hoveredChartIndex].price}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <MarketChartSkeleton />
            )}

            {/* 📝 預留 Revamp 大展拳腳的區塊提示 */}
            <div className="p-3 bg-brand/5 border border-dashed border-brand/20 rounded-xl space-y-1">
              <p className="font-sans font-bold text-[11.5px] text-brand">
                📌 交易所大盤機制排班預告
              </p>
              <p className="font-sans text-[11px] text-[#d4c4b7] leading-relaxed">
                本頁面為標準卡牌大盤頁面。接下來 Revamp
                將在此處注入【全網認證賣家現貨即時叫價矩陣表】，供買家自由挑選最合適的品相、定價進行
                Deal 媒合，敬請期待！
              </p>
            </div>

            {/* 卡牌基本數值規格矩陣 */}
            <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(237,232,224,0.08)]">
                <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                  官方標準資產屬性矩陣
                </h3>
              </div>
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
                    className={`flex items-center justify-between p-3.5 ${idx % 2 === 0 ? "bg-[#2c2722]" : "bg-[#26211C]"} border-b border-[rgba(237,232,224,0.04)]`}
                  >
                    <span className="text-[#d4c4b7]">{row.label}</span>
                    <span className="font-semibold text-[#eae1da] text-right truncate max-w-[180px]">
                      {row.val}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3.5 bg-[#26211C] border-b border-[rgba(237,232,224,0.04)] sm:col-span-2">
                  <span className="text-[#d4c4b7]">稀有度及鑑定級別基準</span>
                  <div className="flex items-center gap-1.5">
                    <RarityBadge rarity={card.rarity} />
                    <GradeBadge
                      authority={card.grade.authority}
                      score={card.grade.score}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-[#2c2722] border-b border-[rgba(237,232,224,0.04)] sm:col-span-2">
                  <span className="text-[#d4c4b7]">核心招式能力</span>
                  <span className="font-semibold text-[#eae1da] font-mono text-[12px]">
                    {card.moveDamage}
                  </span>
                </div>
              </div>
            </div>

            {/* 已成交歷史 */}
            <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
              <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                最近全網已成交歷史紀錄
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
                      <span className="text-brand">{item.grade}</span>
                    </div>
                    <span className="font-bold text-success">
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
      <ExecutionSlideOver />
    </div>
  );
}
