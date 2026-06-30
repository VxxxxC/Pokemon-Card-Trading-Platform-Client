"use client";

import { useState, use, useSyncExternalStore, useMemo } from "react";
import { useUIStore } from "@/app/store/useUIStore";
import { Pagination } from "@/app/components/ui/Pagination";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { GradeBadge } from "@/app/components/cards/GradeBadge";
import { AskOrderBookRow } from "@/app/components/marketplace/AskOrderBookRow";
import { MarketChartSkeleton } from "@/app/components/shared/MarketSkeletons";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";

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
// 🟢 核心對齊：引入 Next.js 官方原生頂級聲明式導航組件
import Link from "next/link";
import { TrustBanner } from "@/app/components/home/TrustBanner";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { IoChevronBack } from "react-icons/io5";

// 定義完整的三軌複合排序 SubSortKey
type SubSortKey = "price_asc" | "grade_desc" | "rating_desc";

// 🟢 SSOT 局部安全備用生成器
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
      sellerId: "HKCV-0000-00A",
      price: 1000,
      sellerRating: 5.0,
      customGrade: { authority: "PSA", score: "10" },
    },
  ],
});

interface PageProps {
  params: Promise<{ id: string }>;
}

const chartConfig = {
  skuPrice: {
    label: "售價 (HK$)",
    color: "#d4a574",
  },
} satisfies ChartConfig;

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const mockRole = useUIStore((state) => state.mockRole);
  const isGuest = mockRole === "GUEST";

  const card: UnifiedProductSpec =
    INITIAL_LISTINGS.find((l) => l.id === id) ?? getFallbackProduct(id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateOrder, setGateOrder] = useState<SellOrder | null>(null);

  const [subSortKey, setSubSortKey] = useState<SubSortKey>("price_asc");
  const [onlyGraded, setOnlyGraded] = useState(false);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("ALL");

  // 🟢 訂單簿分頁狀態
  const [orderPageState, setOrderPageState] = useState({ page: 1, forKey: "" });
  const [historyPage, setHistoryPage] = useState(1);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 🟢 核心對齊：硬核對齊側邊欄，鎖死 7 大黃金鑑定規格晶片列
  const availableGrades = useMemo(() => {
    return ["ALL", "PSA 10", "PSA 9", "CGC 10", "CGC 9", "RAW", "OTHER"];
  }, []);

  // 執行複合權重三軌排序
  const filteredAndSortedOrders = useMemo(() => {
    let orders = [...card.sellOrders];

    // 1. 已鑑定現貨 Switch 快篩防線
    if (onlyGraded) {
      orders = orders.filter(
        (order) => order.customGrade.authority !== "Raw Card",
      );
    }

    // 1.5 鑑定等級 Variant 排除性過濾篩選管道重構
    if (selectedGradeFilter !== "ALL") {
      orders = orders.filter((order) => {
        const authority = (order.customGrade?.authority || "").toUpperCase().trim();
        const score = (order.customGrade?.score || "").toUpperCase().trim();
        const combinedGradeStr = `${authority} ${score}`.trim(); // e.g., "PSA 10"

        const isPsa = authority.startsWith("PSA");
        const isCgc = authority.startsWith("CGC");
        const isRaw = authority === "RAW" || authority.includes("RAW") || authority === "RAW CARD";

        // 分流 A：如果選取的是 RAW
        if (selectedGradeFilter === "RAW") {
          return isRaw;
        }

        // 分流 B：如果選取的是 OTHER（長尾捕捉網，排除三大常規）
        if (selectedGradeFilter === "OTHER") {
          return !isPsa && !isCgc && !isRaw;
        }

        // 分流 C：標準常規鑑定規格精準比對 (PSA 10, PSA 9, CGC 10, CGC 9)
        const filterUpper = selectedGradeFilter.toUpperCase().trim();
        return combinedGradeStr === filterUpper || authority === filterUpper;
      });
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
  }, [card.sellOrders, subSortKey, onlyGraded, selectedGradeFilter]);

  // 🟢 交易歷史分頁計算引擎
  const historyPerPage = 5;
  const totalHistoryPages = Math.ceil(card.soldHistory.length / historyPerPage);

  // Derive active paginated segment array dynamically
  const paginatedHistory = useMemo(() => {
    return card.soldHistory.slice(
      (historyPage - 1) * historyPerPage,
      historyPage * historyPerPage,
    );
  }, [card.soldHistory, historyPage]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasChartData = card.chartPoints.length > 0;

  // 🟢 訂單簿分頁計算引擎
  const orderFilterKey = `${subSortKey}|${String(onlyGraded)}|${selectedGradeFilter}`;
  const orderPage =
    orderPageState.forKey === orderFilterKey ? orderPageState.page : 1;

  const setOrderPage = (page: number) => {
    setOrderPageState({ page, forKey: orderFilterKey });
  };

  const ordersPerPage = 5;
  const totalOrderPages = Math.ceil(
    filteredAndSortedOrders.length / ordersPerPage,
  );

  // 当当前页切片数据
  const paginatedOrders = filteredAndSortedOrders.slice(
    (orderPage - 1) * ordersPerPage,
    orderPage * ordersPerPage,
  );

  // 🟢 演算法核心提純：提取「全網絕對最優掛單」，保證頂部橫幅在任何分頁都鎖定全網最低價真理值
  const globalBestAskOrder = filteredAndSortedOrders[0];

  // 🟢 動態大盤均價計算
  const marketPrice =
    card.sellOrders.length > 0
      ? Math.min(...card.sellOrders.map((o) => o.price))
      : 999_999;

  // 🟢 大盤展示參考等級
  const referenceGrade = card.sellOrders.find(
    (o) => o.customGrade.authority !== "Raw Card",
  )?.customGrade ?? { authority: "PSA", score: "10" };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#17130f]">
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-32 lg:pb-12 animate-fadeIn">
        <button
          type="button"
          onClick={() => router.back()}
          className="-mt-2 mb-2 h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>
        {/* 🟢 頂級修正：活化 Breadcrumb 導航鏈條，全面注入高級黑金 hover 微光質感，100% 規避 PWA 閃爍 Loading 債 */}
        <div className="mb-6 font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link
            href="/marketplace"
            className="text-[#eae1da] hover:text-brand transition-colors duration-200 font-bold tracking-wide cursor-pointer"
          >
            MARKETPLACE{" "}
          </Link>
          <span className="text-[#50453b] font-sans font-normal">/</span>
          <span className="text-[#8A8680] truncate uppercase cursor-default">
            {id}
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
                <span className="inline-flex px-2 py-1 rounded bg-[#17130f]/80 backdrop-blur-sm border border border-[rgba(237,232,224,0.12)] font-mono text-[10px] font-semibold text-brand">
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
            {/* TODO: 如果未login，加上blur效果及增加button redirect用戶至login page */}
            {hasChartData ? (
              <div className="relative overflow-hidden bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
                {isGuest && (
                  <div className="absolute inset-0 bg-[#17130f]/60 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center select-none animate-fadeIn">
                    <p className="font-sans font-bold text-[14px] text-[#eae1da] mb-3">
                      登入免費查閱完整市場大盤走勢
                    </p>
                    <Link
                      href={`/auth?redirect=${encodeURIComponent(`/marketplace/product/${id}`)}`}
                      className="inline-flex items-center justify-center h-9 px-4 bg-brand text-[#1A1612] font-sans font-bold text-[12px] rounded-lg shadow-md hover:bg-[#e8b896] transition-all active:scale-[0.97] cursor-pointer"
                    >
                      登入 / 註冊
                    </Link>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                    全網 30 天已成交均價走勢
                  </h3>
                  <span className="font-mono text-[10px] text-brand uppercase font-bold">
                    Live Index
                  </span>
                </div>

                <div className="lg:h-72 w-full">
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={card.chartPoints}>
                        <defs>
                          <linearGradient
                            id="priceChart"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#d4a574"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#d4a574"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          vertical={false}
                          stroke="rgba(255,255,255,0.04)"
                        />

                        <XAxis
                          dataKey="date"
                          scale="band"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          style={{
                            fill: "#8A8680",
                            fontSize: 10,
                            fontFamily: "monospace",
                          }}
                        />

                        <YAxis
                          yAxisId="priceId"
                          hide
                          includeHidden
                          label={"價格 (HK$)"}
                          orientation="right"
                          domain={[0, "auto"]}
                          tickCount={6}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          style={{
                            fill: "#d4a574",
                            fontSize: 10,
                            fontFamily: "monospace",
                          }}
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                        />
                        <ChartTooltip
                          cursor={{ fill: "#ffffff", opacity: 0.2 }}
                          content={
                            <ChartTooltipContent
                              className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]"
                              labelClassName="text-sm"
                            />
                          }
                        />

                        <Area
                          yAxisId="priceId"
                          type="monotone"
                          dataKey="price"
                          fill="url(#priceChart)"
                          stroke={"#d4a574"}
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
            ) : (
              <MarketChartSkeleton />
            )}

            {/* 盤口即時掛單艙體容器 */}
            <div
              id="live-order-book-panel"
              className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 md:p-6 space-y-4 shadow-lg scroll-mt-24"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-3 font-mono text-[11px] text-[#8A8680] uppercase tracking-wider select-none gap-4">
                <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto shrink-0">
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
                      className="text-[10px] font-bold text-[#8A8680] cursor-pointer select-none"
                    >
                      只顯示已鑑定
                    </label>
                    <Switch
                      id="graded-only-switch"
                      checked={onlyGraded}
                      onCheckedChange={setOnlyGraded}
                      className="scale-90 data-[state=checked]:bg-brand"
                    />
                  </div>
                </div>

                {/* 🎯 Target Injected SNKRDUNK-Style Dynamic Grade Variant Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-1 px-1 w-full md:w-auto max-w-full shrink-0 select-none">
                  {availableGrades.map((gradeTag) => {
                    const isActive = selectedGradeFilter === gradeTag;
                    return (
                      <button
                        key={gradeTag}
                        type="button"
                        onClick={() => setSelectedGradeFilter(gradeTag)}
                        className={`font-mono text-[11px] font-bold h-8 px-3.5 rounded-full border transition-all shrink-0 active:scale-[0.96] cursor-pointer focus:outline-none ${
                          isActive
                            ? "bg-brand border-brand text-[#1A1612] shadow-[0_2px_10px_rgba(212,165,116,0.25)]"
                            : "bg-[#1A1612] border-white/5 text-[#8A8680] hover:text-[#eae1da] hover:border-white/10"
                        }`}
                      >
                        {gradeTag === "ALL" ? "全部規格 (ALL)" : gradeTag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 金色最優價 Banner */}
              {globalBestAskOrder && (
                <div className="mb-1 text-left animate-fadeIn">
                  <span className="font-mono text-[10px] text-brand uppercase font-black tracking-widest block mb-1">
                    最優現貨掛牌價
                  </span>
                  <p className="font-mono font-black text-[34px] md:text-[42px] text-[#d4a574] tracking-tight leading-none">
                    HK$ {globalBestAskOrder.price.toLocaleString("en-HK")}
                  </p>
                </div>
              )}

              {/* 盤口動態掛單隊列 */}
              <div className="space-y-1">
                {filteredAndSortedOrders.length === 0 ? (
                  <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
                    沒有符合當前快篩條件的賣盤掛單
                  </div>
                ) : (
                  paginatedOrders.map((order, idx) => {
                    const globalIdx = (orderPage - 1) * ordersPerPage + idx;

                    return (
                      <AskOrderBookRow
                        key={order.sellerId}
                        order={order}
                        idx={globalIdx}
                        productId={id}
                        onOpenGate={(o) => {
                          setGateOrder(o);
                          setIsGateOpen(true);
                        }}
                        grade={order.customGrade}
                        rarity={card.rarity}
                      />
                    );
                  })
                )}
              </div>

              {/* 訂單簿分頁控制器 */}
              <Pagination
                currentPage={orderPage}
                totalPages={totalOrderPages}
                onPageChange={setOrderPage}
                itemLabel="筆掛單"
                totalItems={filteredAndSortedOrders.length}
                itemsPerPage={ordersPerPage}
                enableScroll={true}
                scrollToViewId="live-order-book-panel"
                className="mt-2 pb-1"
              />
            </div>

            {/* 最近成交紀錄 */}
            {/* TODO: 如果未login，加上blur效果及增加button redirect用戶至login page */}
            <div className="relative overflow-hidden bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
              {isGuest && (
                <div className="absolute inset-0 bg-[#17130f]/60 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center select-none animate-fadeIn">
                  <p className="font-sans font-medium text-[13px] text-[#eae1da] mb-2.5">
                    登入解鎖全港歷史交割真理數據
                  </p>
                  <Link
                    href={`/auth?redirect=${encodeURIComponent(`/marketplace/product/${id}`)}`}
                    className="inline-flex items-center justify-center h-9 px-4 bg-brand text-[#1A1612] font-sans font-bold text-[12px] rounded-lg shadow-md hover:bg-[#e8b896] transition-all active:scale-[0.97] cursor-pointer"
                  >
                    登入 / 註冊
                  </Link>
                  <Link
                    href={`/auth?redirect=${encodeURIComponent(`/marketplace/product/${id}`)}`}
                    className="font-sans text-[11px] text-brand underline mt-2 block cursor-pointer"
                  >
                    已有帳號？立即登入
                  </Link>
                </div>
              )}
              <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                最近全網已成交歷史紀錄
              </h3>
              <div className="space-y-2">
                {paginatedHistory.map((item, idx) => (
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

              {/* 🎯 Target Injected History Ledger Pagination Controller */}
              <Pagination
                currentPage={historyPage}
                totalPages={totalHistoryPages}
                onPageChange={setHistoryPage}
                itemLabel="筆成交紀錄"
                totalItems={card.soldHistory.length}
                itemsPerPage={historyPerPage}
                enableScroll={false} // Kept false to prevent disruptive viewport jumps on small boxes
                className="mt-3 pt-1"
              />
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
            <TrustBanner />
          </section>
        </div>
      </main>

      {/* 交割終端 SlideOver — 由 AskOrderBookRow 點擊觸發，props-based 架構 */}
      <ExecutionSlideOver
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        order={gateOrder}
        card={card}
        productId={id}
      />
    </div>
  );
}
