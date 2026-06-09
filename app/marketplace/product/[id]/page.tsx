"use client";

import { useState, use, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { AskOrderBookRow } from "@/app/components/marketplace/AskOrderBookRow";
import { MarketChartSkeleton } from "@/app/components/shared/MarketSkeletons";
import { CChart16 } from "@/components/reui/c-chart-16";

// 🟢 純淨版盤口：回歸實物交割，只保留最核心的賣家與叫價三要素
interface SellOrder {
  readonly sellerName: string;
  readonly sellerId: string;
  readonly price: number;
}

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
  sellOrders: SellOrder[]; // 該型號卡牌全網認證商戶的掛牌賣盤
}

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
    // 🟢 擺盤數據：化繁為簡，由上至下價格便宜到貴垂直堆疊
    sellOrders: [
      { sellerName: "渡邊道館", sellerId: "PKT-8839-44A", price: 2250 },
      { sellerName: "旺角天線卡王", sellerId: "PKT-1122-33B", price: 2320 },
      { sellerName: "秋葉原海外直送店", sellerId: "PKT-4455-66C", price: 2400 },
      { sellerName: "信和執雞大師", sellerId: "PKT-7788-99D", price: 2550 },
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
    images: ["https://picsum.photos/seed/poke-mewtwo/600/420"],
    type: "超能力 (Psychic)",
    stage: "Basic (基礎)",
    weakness: "惡 x2",
    retreatCost: "◆",
    moveDamage: "心靈震撼 220",
    artist: "GIDORA",
    soldHistory: [{ date: "2026-06-02", grade: "BGS 9.5", price: 2600 }],
    chartPoints: [
      { day: 1, date: "05-01", price: 2700 },
      { day: 30, date: "06-02", price: 2600 },
    ],
    sellOrders: [
      { sellerName: "尖沙咀卡神", sellerId: "PKT-9900-11A", price: 2600 },
      { sellerName: "元朗李生精品", sellerId: "PKT-2233-44B", price: 2680 },
      { sellerName: "銅鑼灣收藏家", sellerId: "PKT-5566-77C", price: 2750 },
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
    images: ["https://picsum.photos/seed/poke-umbreon/600/420"],
    type: "惡 (Darkness)",
    stage: "Stage 1 (一階進化)",
    weakness: "草 x2",
    retreatCost: "◆◆",
    moveDamage: "月下暗殺 160",
    artist: "5ban Graphics",
    soldHistory: [{ date: "2026-06-01", grade: "PSA 10", price: 1900 }],
    chartPoints: [
      { day: 1, date: "05-01", price: 1800 },
      { day: 30, date: "06-01", price: 1900 },
    ],
    sellOrders: [
      { sellerName: "港島執雞王", sellerId: "PKT-1234-56A", price: 1900 },
      { sellerName: "將軍澳道館", sellerId: "PKT-7890-12B", price: 1950 },
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
    images: ["https://picsum.photos/seed/poke-pikachu/600/420"],
    type: "雷 (Lightning)",
    stage: "Basic (基礎)",
    weakness: "鬥 x2",
    retreatCost: "◆",
    moveDamage: "十萬伏特 120",
    artist: "Kouki Saitou",
    soldHistory: [{ date: "2026-06-02", grade: "CGC 9", price: 425 }],
    chartPoints: [
      { day: 1, date: "05-01", price: 450 },
      { day: 30, date: "06-02", price: 425 },
    ],
    sellOrders: [
      { sellerName: "星光收藏家", sellerId: "PKT-3344-55M", price: 425 },
      { sellerName: "葵涌卡牌基地", sellerId: "PKT-6677-88N", price: 440 },
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
  sellOrders: [
    { sellerName: "官方流動池", sellerId: "PKT-0000-00A", price: 1000 },
  ],
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const card = PRODUCT_POOL_DATABASE[id] || getFallbackProduct(id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 盤口交割控制窗狀態
  const [selectedAskOrder, setSelectedAskOrder] = useState<SellOrder | null>(
    null,
  );

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  // 🟢 規格 3：賣盤由上至下垂直堆疊（價低者排在最前面）
  const sortedOrders = [...card.sellOrders].sort((a, b) => a.price - b.price);

  const hasChartData = card.chartPoints.length > 0;

  // 🟢 規格 5：點擊購買，一鍵包裝商戶資訊直發 open-global-transaction 喚醒右側 ExecutionSlideOver 終端
  const handleTriggerInstantBuy = () => {
    if (!selectedAskOrder) return;

    const currentListing: MarketplaceListing = {
      id,
      name: card.name,
      set: card.set,
      rarity: card.rarity,
      grade: card.grade,
      price: selectedAskOrder.price, // 帶入該賣盤指定的一口價
      delta: card.delta,
      deltaDirection: card.deltaDirection,
      image: card.images[0],
      seller: selectedAskOrder.sellerName,
      sellerId: selectedAskOrder.sellerId,
    };

    setSelectedAskOrder(null); // 關閉中轉對話彈窗

    window.dispatchEvent(
      new CustomEvent("open-global-transaction", {
        detail: { listing: currentListing, mode: "buy" },
      }),
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#17130f]">
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 lg:pb-12 animate-fadeIn">
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
                Item Commodity Index
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

            {/* 大盤均價區塊 */}
            <div className="bg-[#26211C] p-5 rounded-2xl border border-white/5 flex items-center justify-between shadow-md">
              <div>
                <span className="font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wider block mb-1">
                  交易所現貨參考均價 (MARKET AGGREGATED INDEX)
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
            </div>

            {/* 30天歷史走勢圖 */}
            {hasChartData ? (
              <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                    全網 30 天已成交均價走勢
                  </h3>
                  <span className="font-mono text-[10px] text-brand uppercase font-bold">
                    Live Index
                  </span>
                </div>

                <div className="relative w-full h-[145px] overflow-hidden">
                  <CChart16
                    data={card.chartPoints}
                    xKey="date"
                    yKey="price"
                    height={115}
                    color="#d4a574"
                  />
                </div>
              </div>
            ) : (
              <MarketChartSkeleton />
            )}

            {/* 🟢 正宗【全網認證賣家現貨即時叫價矩陣表】純淨版 */}
            <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-5 md:p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 font-mono text-[10.5px] text-[#50453b] uppercase tracking-wider font-bold">
                <span>認證賣家商號 / 唯一代碼</span>
                <span>實時掛牌售價</span>
              </div>

              {/* 盤口垂直隊列由上至下排列 */}
              <div className="space-y-3">
                {sortedOrders.map((order, idx) => (
                  <AskOrderBookRow
                    key={order.sellerId}
                    order={order}
                    idx={idx}
                    productId={id}
                    onOpenGate={setSelectedAskOrder}
                    grade={card.grade}
                    rarity={card.rarity}
                  />
                ))}
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
                    className="flex items-center justify-between font-mono text-[12px] p-2.5 bg-[#17130f] rounded-lg border border-white/[0.04]"
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
                    className={`flex items-center justify-between p-3.5 ${idx % 2 === 0 ? "bg-[#2c2722]" : "bg-[#26211C]"} border-b border-white/[0.04]`}
                  >
                    <span className="text-[#d4c4b7]">{row.label}</span>
                    <span className="font-semibold text-[#eae1da] text-right truncate max-w-[180px]">
                      {row.val}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3.5 bg-[#26211C] border-b border-white/[0.04] sm:col-span-2">
                  <span className="text-[#d4c4b7]">稀有度及鑑定級別基準</span>
                  <div className="flex items-center gap-1.5">
                    <RarityBadge rarity={card.rarity} />
                    <GradeBadge
                      authority={card.grade.authority}
                      score={card.grade.score}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-[#2c2722] border-b border-white/[0.04] sm:col-span-2">
                  <span className="text-[#d4c4b7]">核心招式能力</span>
                  <span className="font-semibold text-[#eae1da] font-mono text-[12px]">
                    {card.moveDamage}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 互動交割窗口彈窗 */}
      {selectedAskOrder && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setSelectedAskOrder(null)}
          />

          <div className="relative bg-[#2e2925] border border-[rgba(237,232,224,0.15)] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4.5 animate-scaleUp">
            <div className="text-left space-y-1">
              <h4 className="font-sans font-black text-[16px] text-[#eae1da]">
                📦 選擇要約交割商戶
              </h4>
              <p className="font-mono text-[10px] text-[#8A8680] uppercase tracking-widest">
                VERIFIED MERCHANT HANDSHAKE GATEWAY
              </p>
            </div>

            <div className="bg-[#17130f] border border-white/5 rounded-xl p-4 space-y-3.5">
              <div className="flex flex-col text-left space-y-1">
                <span className="font-mono text-[10px] text-[#8A8680] uppercase">
                  對接賣家商號
                </span>
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = `/profile/${selectedAskOrder.sellerId}`)
                  }
                  className="font-sans font-black text-[14px] text-brand underline cursor-pointer bg-transparent border-none text-left focus:outline-none"
                >
                  {selectedAskOrder.sellerName} (@{selectedAskOrder.sellerId}) →
                </button>
              </div>

              <div className="flex flex-col text-left border-t border-white/5 pt-2.5">
                <span className="font-mono text-[10px] text-[#8A8680] uppercase">
                  選定掛牌售價
                </span>
                <span className="font-mono font-black text-[18px] text-brand mt-0.5">
                  HK$ {selectedAskOrder.price.toLocaleString("en-HK")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleTriggerInstantBuy}
                className="w-full h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-md"
              >
                ⚡ 進入交割端 / 立即購買
              </button>
              <button
                type="button"
                onClick={() => setSelectedAskOrder(null)}
                className="w-full h-10 bg-transparent border border-white/10 text-text-secondary font-sans font-bold text-[12px] rounded-xl cursor-pointer"
              >
                取消返回大盤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
