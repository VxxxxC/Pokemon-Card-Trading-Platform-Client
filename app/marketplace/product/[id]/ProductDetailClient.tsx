"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { useUIStore } from "@/app/store/useUIStore";
import { Pagination } from "@/app/components/ui/Pagination";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RarityBadge } from "@/app/components/cards/RarityBadge";
import { AskOrderBookRow } from "@/app/components/marketplace/AskOrderBookRow";
import { MarketChartSkeleton } from "@/app/components/shared/MarketSkeletons";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";
import type {
  MarketplaceMarketPriceGradeRow,
  MarketplaceProductDetail,
} from "@/app/lib/marketplace/types";
import type { MarketplaceProductListingsInitialData } from "@/app/lib/hooks/useMarketplaceProductListings";
import type { SellOrder, UnifiedProductSpec } from "@/app/lib/mock-data/cards";
import { useMarketplaceProductListings } from "@/app/lib/hooks/useMarketplaceProductListings";
import { useMarketplaceProductMarketPrice } from "@/app/lib/hooks/useMarketplaceProductMarketPrice";
import { useMarketplaceProductTradeHistory } from "@/app/lib/hooks/useMarketplaceProductTradeHistory";
import { formatElementTypeZh } from "@/lib/catalog/element-types";
import { GRADING_OPTIONS } from "@/lib/grading/options";
import { formatListingGrade } from "@/lib/marketplace/listing-display";
import { RelativeDateTime } from "@/components/shared/RelativeDateTime";
import type { ProductListingSortKey } from "@/app/lib/marketplace/types";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Link from "next/link";
import { TrustBanner } from "@/app/components/home/TrustBanner";
import { IoChevronBack, IoTrendingDown, IoTrendingUp } from "react-icons/io5";

const ProductPriceChart = dynamic(
  () =>
    import("./ProductPriceChart").then((mod) => mod.ProductPriceChart),
  {
    loading: () => <MarketChartSkeleton />,
    ssr: false,
  },
);

type SubSortKey = ProductListingSortKey;

type ProductDetailClientProps = {
  product: MarketplaceProductDetail;
  currentUserId?: string | null;
  initialListings?: MarketplaceProductListingsInitialData;
  initialMarketGrades?: MarketplaceMarketPriceGradeRow[];
};

function formatSpecValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function formatBreadcrumbLabel(product: MarketplaceProductDetail): string {
  if (product.displayId?.trim()) return product.displayId.trim();
  if (product.cardNumber?.trim()) {
    return `${product.setCode}-${product.cardNumber}`.toUpperCase();
  }
  return product.setCode;
}

function toExecutionSlideOverCard(
  product: MarketplaceProductDetail,
): UnifiedProductSpec {
  return {
    id: product.productId,
    name: product.productName,
    jpName: product.nameJa,
    set: product.setCode,
    rarity: (product.rarity ?? "SAR") as UnifiedProductSpec["rarity"],
    delta: 0,
    deltaDirection: "up",
    images:
      product.images.length > 0 ? product.images : [product.imageUrl],
    type: formatElementTypeZh(product.elementType, "—"),
    stage: formatSpecValue(product.pokemonStage),
    weakness: "—",
    retreatCost: "—",
    moveDamage: "—",
    artist: "—",
    soldHistory: [],
    chartPoints: [],
    sellOrders: [],
  };
}

export function ProductDetailClient({
  product,
  currentUserId = null,
  initialListings,
  initialMarketGrades,
}: ProductDetailClientProps) {
  const router = useRouter();
  const mockRole = useUIStore((state) => state.mockRole);
  const isGuest = mockRole === "GUEST";

  const images =
    product.images.length > 0 ? product.images : [product.imageUrl];
  const breadcrumbLabel = formatBreadcrumbLabel(product);
  const heroImage = images[0];

  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateOrder, setGateOrder] = useState<SellOrder | null>(null);
  const [gateListingId, setGateListingId] = useState<string | null>(null);

  const [subSortKey, setSubSortKey] = useState<SubSortKey>("price_asc");
  const [onlyGraded, setOnlyGraded] = useState(false);
  const [selectedGradeFilterId, setSelectedGradeFilterId] = useState("ALL");

  const [orderPageState, setOrderPageState] = useState({ page: 1, forKey: "" });
  const [historyPage, setHistoryPage] = useState(1);

  const orderFilterKey = `${subSortKey}|${String(onlyGraded)}|${selectedGradeFilterId}`;
  const orderPage =
    orderPageState.forKey === orderFilterKey ? orderPageState.page : 1;

  const setOrderPage = (page: number) => {
    setOrderPageState({ page, forKey: orderFilterKey });
  };

  const ordersPerPage = 5;
  const historyPerPage = 5;

  const {
    listings,
    meta: listingsMeta,
    lowestPrice,
    isLoading: isListingsLoading,
    isRefreshing: isListingsRefreshing,
    error: listingsError,
  } = useMarketplaceProductListings(
    {
      productId: product.productId,
      sort: subSortKey,
      onlyGraded,
      selectedGradeFilterId,
      page: orderPage,
      pageSize: ordersPerPage,
    },
    { initialData: initialListings },
  );

  const {
    availableGrades: availableMarketGrades,
    selectedGradeKey: selectedMarketGradeKey,
    setSelectedGradeKey: setSelectedMarketGradeKey,
    marketPrice: marketPriceData,
    isLoading: isMarketPriceLoading,
  } = useMarketplaceProductMarketPrice(
    { productId: product.productId },
    initialMarketGrades !== undefined
      ? { initialData: { grades: initialMarketGrades } }
      : undefined,
  );

  const chartPoints = useMemo(
    () =>
      marketPriceData.chartPoints.map((point, index) => ({
        day: index + 1,
        date: point.date,
        price: point.price,
      })),
    [marketPriceData.chartPoints],
  );

  const {
    tradeHistory,
    meta: tradeHistoryMeta,
    isLoading: isTradeHistoryLoading,
    error: tradeHistoryError,
  } = useMarketplaceProductTradeHistory({
    productId: product.productId,
    page: historyPage,
    pageSize: historyPerPage,
    enabled: !isGuest,
  });

  const gradeFilterOptions = useMemo(
    () => [
      { id: "ALL", label: "全部規格 (ALL)" },
      ...GRADING_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    ],
    [],
  );

  const orderBookRows = useMemo(
    () =>
      listings.map((row) => ({
        listingId: row.listingId,
        order: {
          sellerName: row.sellerName,
          sellerId: row.sellerId,
          price: row.price,
          sellerRating: row.sellerRating,
          reviewCount: row.sellerTotalTrades,
          customGrade: formatListingGrade(row.gradingCompany, row.gradingScore),
        } satisfies SellOrder,
      })),
    [listings],
  );

  const hasChartData = !isMarketPriceLoading && chartPoints.length > 0;
  const hasMarketPriceData =
    !isMarketPriceLoading && availableMarketGrades.length > 0;

  const marketPrice = marketPriceData.marketAvgPrice;
  const marketTrend30d = marketPriceData.marketTrend30d;
  const globalBestAskPrice = lowestPrice;

  const slideOverCard = toExecutionSlideOverCard(product);
  const productPath = `/marketplace/product/${product.productId}`;

  return (
    <div className="flex-1 w-full flex flex-col bg-[#17130f]">
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 lg:px-8 py-6 pb-6 lg:pb-12 animate-fadeIn">
        <button
          type="button"
          onClick={() => router.back()}
          className="-mt-2 mb-2 h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>
        <div className="mb-6 font-mono text-[11px] text-[#d4c4b7] flex items-center gap-1.5 select-none">
          <Link
            href="/marketplace"
            className="text-[#eae1da] hover:text-brand transition-colors duration-200 font-bold tracking-wide cursor-pointer"
          >
            MARKETPLACE{" "}
          </Link>
          <span className="text-[#50453b] font-sans font-normal">/</span>
          <span className="text-[#8A8680] truncate uppercase cursor-default">
            {breadcrumbLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-8 items-start">
          <section className="lg:col-span-5 lg:sticky lg:top-6 mb-6 lg:mb-0">
            <div className="relative w-full aspect-[4/3] bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-lg">
              <Image
                src={heroImage}
                alt={`${product.nameJa} 官方圖鑑`}
                fill
                priority
                className="object-contain p-2"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </section>

          <section className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5 pb-4 border-b border-[rgba(237,232,224,0.06)]">
              <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] leading-tight tracking-tight">
                {product.nameJa}
              </h1>
              {(product.nameZh?.trim() || product.rarity) && (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {product.nameZh?.trim() ? (
                    <span className="font-sans text-[14px] text-[#d4c4b7]">
                      {product.nameZh.trim()}
                    </span>
                  ) : null}
                  {product.rarity ? (
                    <RarityBadge rarity={product.rarity} />
                  ) : null}
                </div>
              )}
              <div className="flex items-center gap-2 font-mono text-[12px] text-[#d4c4b7] mt-1">
                <span>{product.setCode}</span>
                {product.cardNumber ? (
                  <>
                    <span className="text-[#50453b]">|</span>
                    <span>{product.cardNumber}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="bg-[#26211C] p-5 rounded-2xl border border-white/5 flex items-center justify-between shadow-md">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[10px] text-[#d4c4b7] uppercase tracking-wider block mb-1">
                  交易所現貨參考均價 (MARKET AGGREGATED INDEX)
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono font-black text-[30px] text-[#eae1da] leading-none">
                    {marketPrice != null
                      ? `HK$ ${marketPrice.toLocaleString("en-HK")}`
                      : "—"}
                  </p>
                  {marketTrend30d != null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono text-[12px] font-bold ${
                        marketTrend30d > 0
                          ? "text-[#10b981]"
                          : marketTrend30d < 0
                            ? "text-[#ef4444]"
                            : "text-[#8A8680]"
                      }`}
                    >
                      {marketTrend30d > 0 ? (
                        <IoTrendingUp className="size-3.5 shrink-0" aria-hidden />
                      ) : marketTrend30d < 0 ? (
                        <IoTrendingDown className="size-3.5 shrink-0" aria-hidden />
                      ) : null}
                      {marketTrend30d > 0 ? "+" : ""}
                      {marketTrend30d.toFixed(1)}%
                    </span>
                  ) : null}
                </div>
                {availableMarketGrades.length > 1 ? (
                  <div className="flex items-center gap-2 overflow-x-auto pt-3 scrollbar-none -mx-1 px-1">
                    {availableMarketGrades.map((gradeOption) => {
                      const isActive =
                        selectedMarketGradeKey === gradeOption.gradeKey;
                      return (
                        <button
                          key={gradeOption.gradeKey}
                          type="button"
                          onClick={() =>
                            setSelectedMarketGradeKey(gradeOption.gradeKey)
                          }
                          className={`font-mono text-[11px] font-bold h-7 px-3 rounded-full border transition-all shrink-0 active:scale-[0.96] cursor-pointer focus:outline-none ${
                            isActive
                              ? "bg-brand border-brand text-[#1A1612] shadow-[0_2px_10px_rgba(212,165,116,0.25)]"
                              : "bg-[#1A1612] border-white/5 text-[#8A8680] hover:text-[#eae1da] hover:border-white/10"
                          }`}
                        >
                          {gradeOption.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {hasChartData ? (
              <ProductPriceChart
                chartPoints={chartPoints}
                isGuest={isGuest}
                productPath={productPath}
              />
            ) : isMarketPriceLoading ? (
              <MarketChartSkeleton />
            ) : hasMarketPriceData ? (
              <div className="bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)]">
                <p className="font-sans text-[13px] text-text-disabled text-center py-8">
                  此規格暫無走勢圖資料
                </p>
              </div>
            ) : (
              <MarketChartSkeleton />
            )}

            <div
              id="live-order-book-panel"
              className="relative bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 md:p-6 space-y-4 shadow-lg scroll-mt-24"
            >
              {isListingsRefreshing ? (
                <div className="absolute inset-0 z-10 bg-[#17130f]/35 backdrop-blur-[1px] flex items-start justify-center pt-16 pointer-events-none rounded-2xl">
                  <div className="w-7 h-7 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                </div>
              ) : null}
              <div
                className={`space-y-4 transition-opacity duration-200 ${
                  isListingsRefreshing ? "opacity-60" : "opacity-100"
                }`}
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
                          {subSortKey === "grade_desc" && "鑑定等級最高"}
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
                          鑑定等級最高
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

                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-1 px-1 w-full md:w-auto max-w-full shrink-0 select-none">
                  {gradeFilterOptions.map((gradeOption) => {
                    const isActive = selectedGradeFilterId === gradeOption.id;
                    return (
                      <button
                        key={gradeOption.id}
                        type="button"
                        onClick={() => setSelectedGradeFilterId(gradeOption.id)}
                        className={`font-mono text-[11px] font-bold h-8 px-3.5 rounded-full border transition-all shrink-0 active:scale-[0.96] cursor-pointer focus:outline-none ${
                          isActive
                            ? "bg-brand border-brand text-[#1A1612] shadow-[0_2px_10px_rgba(212,165,116,0.25)]"
                            : "bg-[#1A1612] border-white/5 text-[#8A8680] hover:text-[#eae1da] hover:border-white/10"
                        }`}
                      >
                        {gradeOption.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {globalBestAskPrice != null && (
                <div className="mb-1 text-left animate-fadeIn">
                  <span className="font-mono text-[10px] text-brand uppercase font-black tracking-widest block mb-1">
                    最優現貨掛牌價
                  </span>
                  <p className="font-mono font-black text-[34px] md:text-[42px] text-[#d4a574] tracking-tight leading-none">
                    HK$ {globalBestAskPrice.toLocaleString("en-HK")}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {isListingsLoading ? (
                  <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
                    載入掛單中…
                  </div>
                ) : listingsError ? (
                  <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
                    {listingsError}
                  </div>
                ) : orderBookRows.length === 0 ? (
                  <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
                    沒有符合當前快篩條件的賣盤掛單
                  </div>
                ) : (
                  orderBookRows.map((row, idx) => {
                    const globalIdx = (orderPage - 1) * ordersPerPage + idx;
                    const isOwnListing =
                      currentUserId != null &&
                      row.order.sellerId === currentUserId;

                    return (
                      <AskOrderBookRow
                        key={row.listingId}
                        order={row.order}
                        idx={globalIdx}
                        productId={product.productId}
                        isOwnListing={isOwnListing}
                        onOpenGate={(o) => {
                          if (
                            currentUserId != null &&
                            o.sellerId === currentUserId
                          ) {
                            return;
                          }
                          setGateOrder(o);
                          setGateListingId(row.listingId);
                          setIsGateOpen(true);
                        }}
                        grade={row.order.customGrade}
                      />
                    );
                  })
                )}
              </div>

              <Pagination
                currentPage={listingsMeta.page}
                totalPages={listingsMeta.totalPages}
                onPageChange={setOrderPage}
                itemLabel="筆掛單"
                totalItems={listingsMeta.total}
                itemsPerPage={ordersPerPage}
                enableScroll={true}
                scrollToViewId="live-order-book-panel"
                className="mt-2 pb-1"
              />
              </div>
            </div>

            <div className="relative overflow-hidden bg-[#26211C] p-4 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-3">
              {isGuest && (
                <div className="absolute inset-0 bg-[#17130f]/60 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-center select-none animate-fadeIn">
                  <p className="font-sans font-medium text-[13px] text-[#eae1da] mb-2.5">
                    登入解鎖全港歷史交割真理數據
                  </p>
                  <Link
                    href={`/auth?redirect=${encodeURIComponent(productPath)}`}
                    className="inline-flex items-center justify-center h-9 px-4 bg-brand text-[#1A1612] font-sans font-bold text-[12px] rounded-lg shadow-md hover:bg-[#e8b896] transition-all active:scale-[0.97] cursor-pointer"
                  >
                    登入 / 註冊
                  </Link>
                  <Link
                    href={`/auth?redirect=${encodeURIComponent(productPath)}`}
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
                {isGuest ? null : isTradeHistoryLoading ? (
                  <div className="py-6 text-center text-text-disabled font-sans text-[13px]">
                    載入成交紀錄中…
                  </div>
                ) : tradeHistoryError ? (
                  <div className="py-6 text-center text-text-disabled font-sans text-[13px]">
                    {tradeHistoryError}
                  </div>
                ) : tradeHistory.length === 0 ? (
                  <div className="py-6 text-center text-text-disabled font-sans text-[13px]">
                    暫無成交紀錄
                  </div>
                ) : (
                  tradeHistory.map((item) => (
                    <div
                      key={item.orderId}
                      className="flex items-center justify-between font-mono text-[12px] p-2.5 bg-[#17130f] rounded-lg border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-2">
                        <RelativeDateTime
                          value={item.createdAt}
                          className="text-[#8A8680]"
                        />
                        <span className="text-[#50453b]">|</span>
                        <span className="text-brand">{item.grade}</span>
                      </div>
                      <span className="font-bold text-[#22c55e]">
                        HK$ {item.price.toLocaleString("en-HK")}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {!isGuest && tradeHistoryMeta.total > 0 ? (
                <Pagination
                  currentPage={tradeHistoryMeta.page}
                  totalPages={tradeHistoryMeta.totalPages}
                  onPageChange={setHistoryPage}
                  itemLabel="筆成交紀錄"
                  totalItems={tradeHistoryMeta.total}
                  itemsPerPage={historyPerPage}
                  enableScroll={false}
                  className="mt-3 pt-1"
                />
              ) : null}
            </div>

            <div className="bg-[#26211C] rounded-xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgba(237,232,224,0.08)]">
                <h3 className="font-sans font-semibold text-[13px] text-[#eae1da]">
                  官方標準資產屬性矩陣
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 font-sans text-[13px]">
                {[
                  { label: "系列名稱", val: product.setCode },
                  { label: "日版原名", val: product.nameJa },
                  {
                    label: "卡牌屬性",
                    val: formatElementTypeZh(product.elementType),
                  },
                  {
                    label: "進化階段",
                    val: formatSpecValue(product.pokemonStage),
                  },
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
                  <span className="text-[#d4c4b7]">稀有度</span>
                  <RarityBadge rarity={product.rarity} />
                </div>
              </div>
            </div>
            <TrustBanner />
          </section>
        </div>
      </main>

      <ExecutionSlideOver
        isOpen={isGateOpen}
        onClose={() => {
          setIsGateOpen(false);
          setGateListingId(null);
        }}
        listingId={gateListingId}
        order={gateOrder}
        card={slideOverCard}
        productId={product.productId}
      />
    </div>
  );
}
