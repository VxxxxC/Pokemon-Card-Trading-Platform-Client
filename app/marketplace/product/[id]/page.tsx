"use client";

import { useState, use, useSyncExternalStore, useMemo } from "react";
import Image from "next/image";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { AskOrderBookRow } from "@/app/components/marketplace/AskOrderBookRow";
import { MarketChartSkeleton } from "@/app/components/shared/MarketSkeletons";
import { CChart16 } from "@/components/reui/c-chart-16";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  INITIAL_LISTINGS,
  type UnifiedProductSpec,
  type SellOrder,
} from "@/app/lib/mock-data/cards";

// 使用底層 Base UI 拋光後的奢華 Select 組件群
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Link from "next/link";

// 定義完整的三軌複合排序 SubSortKey
type SubSortKey = "price_asc" | "grade_desc" | "rating_desc";

// 🟢 SSOT 午備實用函數：継承自 UnifiedProductSpec 的局部安全備用生成器
const getFallbackProduct = (id: string): UnifiedProductSpec => ({
  id,
  name: `公共大盤標準商品 (${id})`,
  jpName: "未登記項目",
  set: "Pokémon TCG Base",
  rarity: "SAR",
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
    {
      sellerName: "官方流動池",
      sellerId: "PKT-0000-00A",
      price: 1000,
      sellerRating: 5.0,
      customGrade: { authority: "PSA", score: "10" },
    },
  ],
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const card: UnifiedProductSpec =
    INITIAL_LISTINGS.find((l) => l.id === id) ?? getFallbackProduct(id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedAskOrder, setSelectedAskOrder] = useState<SellOrder | null>(
    null,
  );

  const [subSortKey, setSubSortKey] = useState<SubSortKey>("price_asc");
  const [onlyGraded, setOnlyGraded] = useState(false);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 執行複合權重三軌排序
  const filteredAndSortedOrders = useMemo(() => {
    let orders = [...card.sellOrders];

    // 1. 已鑑定現貨 Switch 快篩防線
    if (onlyGraded) {
      orders = orders.filter(
        (order) => order.customGrade.authority !== "Raw Card",
      );
    }

    // 2. 執行複合權重三軌排序
    return orders.sort((a, b) => {
      // 軌道 A：PSA / BGS 鑑定等級最高權重優先
      if (subSortKey === "grade_desc") {
        const scoreA =
          a.customGrade.authority === "Raw Card"
            ? 0
            : parseFloat(a.customGrade.score) || 0;
        const scoreB =
          b.customGrade.authority === "Raw Card"
            ? 0
            : parseFloat(b.customGrade.score) || 0;

        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.price - b.price; // 同分服從價格最低鐵律
      }

      // 軌道 B：賣家信譽評級最高權重優先
      if (subSortKey === "rating_desc") {
        if (b.sellerRating !== a.sellerRating)
          return b.sellerRating - a.sellerRating;
        return a.price - b.price; // 同星級服從價格最低鐵律
      }

      // 軌道 C：純淨定價由低到高秒殺排盤
      return a.price - b.price;
    });
  }, [card.sellOrders, subSortKey, onlyGraded]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasChartData = card.chartPoints.length > 0;

  // 🟢 動態大盤均價計算 (Dynamic Market Price — absolute lowest active ask)
  const marketPrice =
    card.sellOrders.length > 0
      ? Math.min(...card.sellOrders.map((o) => o.price))
      : 999_999;

  // 🟢 大盤展示參考等級：取訂單簿中第一個非 Raw Card 的鑑定等級作展示基準
  const referenceGrade = card.sellOrders.find(
    (o) => o.customGrade.authority !== "Raw Card",
  )?.customGrade ?? { authority: "PSA", score: "10" };

  const handleTriggerInstantBuy = () => {
    if (!selectedAskOrder) return;

    const currentListing: MarketplaceListing = {
      id,
      name: card.name,
      set: card.set,
      rarity: card.rarity,
      // 第三個交割尊守：精準綁定所選賣單的實際鑑定等級
      grade: selectedAskOrder.customGrade,
      // 圓滽結謁價格尊守：簿内實際可成交掛賣價
      price: selectedAskOrder.price,
      delta: card.delta,
      deltaDirection: card.deltaDirection,
      image: card.images[0],
      seller: selectedAskOrder.sellerName,
      sellerId: selectedAskOrder.sellerId,
    };

    setSelectedAskOrder(null);

    window.dispatchEvent(
      new CustomEvent("open-global-transaction", {
        detail: { listing: currentListing, mode: "buy" },
      }),
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#17130f]">
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 lg:pb-12 animate-fadeIn">
        {/* 麵包屑導航 */}
        <div className="mb-6 font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5">
          <span className="text-[#8A8680] cursor-default">
            MARKETPLACE 交易所大盤
          </span>
          <span>/</span>
          <span className="text-[#8A8680] truncate uppercase">
            {id} AGGREGATED PRODUCT
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          {/* 左側：大盤圖庫 */}
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

            {/* 大盤均價 */}
            <div className="bg-[#26211C] p-5 rounded-2xl border border-white/5 flex items-center justify-between shadow-md">
              <div>
                <span className="font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wider block mb-1">
                  交易所現貨參考均價 (MARKET AGGREGATED INDEX)
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-black text-[30px] text-[#eae1da] leading-none">
                    HK$ {marketPrice.toLocaleString("en-HK")}
                  </p>
                  <span
                    className={`font-mono text-[13px] font-semibold ${card.deltaDirection === "up" ? "text-[#22c55e]" : "text-[#ef4444]"}`}
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

            {/* 盤口即時掛單 */}
            <div className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 md:p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 font-mono text-[11px] text-[#8A8680] uppercase tracking-wider select-none gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#8A8680] uppercase tracking-wider font-bold shrink-0">
                    排序
                  </span>
                  <Select
                    value={subSortKey}
                    onValueChange={(value) =>
                      setSubSortKey(value as SubSortKey)
                    }
                  >
                    {/* 🟢 頂級修正：加裝明確的繁體中文語意映射防禦線，徹底消滅英文 Key 裸露漏洞 */}
                    <SelectTrigger className="w-44 min-w-[176px] h-8 bg-[#1A1612] border border-white/5 rounded-[6px] text-[#eae1da] font-sans text-[11.5px] hover:bg-[#2c2722] transition-colors focus-visible:ring-0 focus-visible:border-brand/40">
                      <span className="truncate">
                        {subSortKey === "price_asc" && "最平售價優先"}
                        {subSortKey === "grade_desc" && "PSA 等級最高"}
                        {subSortKey === "rating_desc" && "賣家評級最高"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="bg-[#26211C] border border-white/10 rounded-lg text-[#eae1da] font-sans text-[12px] shadow-2xl">
                      <SelectItem
                        value="price_asc"
                        className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                      >
                        最平售價優先
                      </SelectItem>
                      <SelectItem
                        value="grade_desc"
                        className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                      >
                        PSA 等級最高
                      </SelectItem>
                      <SelectItem
                        value="rating_desc"
                        className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
                      >
                        賣家評級最高
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 右側已鑑定快篩 Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  <label
                    htmlFor="graded-only-switch"
                    className="text-[10px] font-bold text-[#8A8680] cursor-pointer"
                  >
                    只顯示已鑑定現貨
                  </label>
                  <Switch
                    id="graded-only-switch"
                    checked={onlyGraded}
                    onCheckedChange={setOnlyGraded}
                    className="scale-90 data-[state=checked]:bg-brand"
                  />
                </div>
              </div>

              {/* 盤口動態掛單隊列 */}
              <div className="space-y-1">
                {filteredAndSortedOrders.length === 0 ? (
                  <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
                    沒有符合當前快篩條件的賣盤掛單
                  </div>
                ) : (
                  filteredAndSortedOrders.map((order, idx) => (
                    <div key={order.sellerId}>
                      <AskOrderBookRow
                        order={order}
                        idx={idx}
                        productId={id}
                        onOpenGate={setSelectedAskOrder}
                        grade={order.customGrade}
                        rarity={card.rarity}
                      />
                      {idx < filteredAndSortedOrders.length - 1 ? (
                        <Separator className="bg-white/5 my-1" />
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 最近成交紀錄 */}
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
                    <span className="font-bold text-[#22c55e]">
                      HK$ {item.price.toLocaleString("en-HK")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 屬性規格矩陣 */}
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
                      authority={referenceGrade.authority}
                      score={referenceGrade.score}
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
                <Link
                  href={`/profile/${selectedAskOrder.sellerId}`}
                  className="font-sans font-black text-[14px] text-brand underline cursor-pointer bg-transparent border-none text-left focus:outline-none"
                >
                  {selectedAskOrder.sellerName} (@{selectedAskOrder.sellerId}) →
                </Link>
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

            {/* 安全下放的私域現貨引流導航卡 */}
            <Link
              href={`/marketplace/${selectedAskOrder.sellerId}/product/${id}`}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-brand/20 bg-[#17130f] hover:bg-[#26211C] font-sans font-bold text-[12.5px] text-brand transition-colors cursor-pointer text-left focus:outline-none"
            >
              <span>
                🏪 查看 {selectedAskOrder.sellerName} 的{" "}
                <span className="font-black underline">{card.name}</span>
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleTriggerInstantBuy}
                className="w-full h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl cursor-pointer shadow-md focus:outline-none"
              >
                ⚡ 進入交割端 / 立即購買
              </button>
              <button
                type="button"
                onClick={() => setSelectedAskOrder(null)}
                className="w-full h-10 bg-transparent border border-white/10 text-[#8A8680] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none"
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
