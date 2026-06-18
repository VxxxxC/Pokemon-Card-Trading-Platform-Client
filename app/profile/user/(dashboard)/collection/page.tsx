"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { WishlistTable } from "@/app/components/market/WishlistTable";
import { useUIStore } from "@/app/store/useUIStore";
import { type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";
// 🟢 核心對接：引流中央倉庫
import { useMockDbStore, type OwnedCard } from "@/app/store/useMockDbStore";

type ChartPoint = OwnedCard["chartPoints"][number];

const ITEMS_PER_PAGE = 5;

function getSparklinePoints(
  chartPoints: ChartPoint[],
  width = 60,
  height = 24,
): string {
  if (!chartPoints || chartPoints.length < 2) return "0,12 60,12";
  const prices = chartPoints.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min === 0 ? 1 : max - min;

  return chartPoints
    .map((point, index) => {
      const x = (index / (chartPoints.length - 1)) * width;
      const y = height - ((point.price - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function GraderBadge({ grader }: { grader: OwnedCard["grader"] }) {
  const map: Record<OwnedCard["grader"], string> = {
    PSA: "text-[#3b9eff] bg-[rgba(59,158,255,0.12)] border-[rgba(59,158,255,0.20)]",
    BGS: "text-[#a855f7] bg-[rgba(168,85,247,0.12)] border-[rgba(168,85,247,0.20)]",
    CGC: "text-[#22d3ee] bg-[rgba(34,211,238,0.12)] border-[rgba(34,211,238,0.20)]",
    RAW: "text-[#d4c4b7] bg-[#2e2925] border-[rgba(237,232,224,0.12)]",
  };
  return (
    <span
      className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded border ${map[grader]}`}
    >
      {grader}
    </span>
  );
}

function StatusPill({ status }: { status: OwnedCard["status"] }) {
  const map: Record<OwnedCard["status"], { label: string; className: string }> =
    {
      holding: { label: "持有中", className: "text-[#d4c4b7] bg-[#2e2925]" },
      listed: {
        label: "已上架",
        className: "text-[#d4a574] bg-[rgba(212,165,116,0.12)]",
      },
      grading: {
        label: "鑑定中",
        className: "text-[#10b981] bg-[rgba(16,185,129,0.12)]",
      },
    };
  const { label, className } = map[status];
  return (
    <span
      className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded ${className}`}
    >
      {label}
    </span>
  );
}

export default function UserCollectionPage() {
  const router = useRouter();

  // 🟢 核心改動：直接從全域外掛數據庫進行 QUERY 與 ALTER 聯動
  const ownedCards = useMockDbStore((state) => state.ownedCards);
  const removeCard = useMockDbStore((state) => state.removeCardFromCollection);
  const publishCardToTradingMarket = useMockDbStore(
    (state) => state.publishCardToTradingMarket,
  );

  const [odometerValue, setOdometerValue] = useState(0);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [sellTargetCard, setSellTargetCard] = useState<OwnedCard | null>(null);
  const [inputPrice, setInputPrice] = useState<string>("");
  const [selectedShipping] = useState<string[]>(["順豐到付"]);
  const [selectedPayment] = useState<string[]>(["FPS", "PayMe"]);

  const [pageState, setPageState] = useState({ page: 1, forKey: "" });
  const openAddAssetModal = useUIStore((state) => state.openAddAssetModal);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const computedSummary = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let gradedCount = 0;
    let rawCount = 0;

    ownedCards.forEach((c) => {
      totalValue += c.currentValue;
      totalCost += c.purchasePrice;
      if (c.grader === "RAW") rawCount += 1;
      else gradedCount += 1;
    });

    const unrealizedPnl = totalValue - totalCost;
    const pnlPercent =
      totalCost > 0
        ? Number(((unrealizedPnl / totalCost) * 100).toFixed(2))
        : 0;

    return {
      totalValue,
      unrealizedPnl,
      pnlPercent,
      cardCount: ownedCards.length,
      gradedCount,
      rawCount,
    };
  }, [ownedCards]);

  useEffect(() => {
    let start = 0;
    const end = computedSummary.totalValue;
    const duration = 1000;
    const increment = Math.ceil(end / (duration / 16));

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setOdometerValue(end);
      } else {
        setOdometerValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [computedSummary.totalValue]);

  const searchSuggestions = useMemo<MarketplaceListing[]>(() => {
    return ownedCards.map((c) => ({
      id: c.id,
      cardNo: c.cardNo,
      name: c.name,
      set: c.set,
      rarity: "SAR" as const,
      price: c.currentValue,
      grade: { authority: c.grader, score: c.grade.split(" ")[1] ?? "10" },
      image: `https://picsum.photos/seed/${c.id}/600/420`,
      delta: 0,
      deltaDirection: "up" as const,
      seller: "—",
    }));
  }, [ownedCards]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const activeFingerprint = `${activeFilter}|${query}`;
  const currentPage =
    pageState.forKey === activeFingerprint ? pageState.page : 1;
  const setCurrentPage = (page: number) =>
    setPageState({ page, forKey: activeFingerprint });

  const handleTriggerSellWorkflow = (card: OwnedCard) => {
    setSellTargetCard(card);
    setInputPrice(card.currentValue.toString());
  };

  const handleConfirmPublishToListing = () => {
    if (!sellTargetCard) return;

    const targetPrice = parseFloat(inputPrice) || sellTargetCard.currentValue;

    // 🟢 核心交割：向中央全局資料庫遞交出售要約配置，一鍵原子化剔除持倉並新增至出售中
    publishCardToTradingMarket(sellTargetCard, targetPrice);

    const savedCardName = sellTargetCard.name;
    setSellTargetCard(null);

    toast.success("🏛️ 商品成功發布上架！", {
      description: `【${savedCardName}】已從個人持倉移出，並以 HK$ ${targetPrice.toLocaleString()} 正式推入交易管理大盤。`,
      className:
        "bg-[#26211C] border border-brand/30 text-[#eae1da] font-sans shadow-2xl",
    });
  };

  const filteredOwned = ownedCards.filter((card) => {
    if (activeFilter === "已上架" && card.status !== "listed") return false;
    if (activeFilter === "已鑑定" && card.grader === "RAW") return false;
    if (activeFilter === "未鑑定" && card.grader !== "RAW") return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        card.name.toLowerCase().includes(q) ||
        card.cardNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOwned.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredOwned.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Odometer Header */}
      <section aria-labelledby="portfolio-heading">
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(212,165,116,0.20)] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.40)]">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-widest mb-1.5">
                AI 總身家估值 (PORTFOLIO VALUE)
              </p>
              <p className="font-mono font-bold text-[32px] text-[#eae1da] leading-none transition-all">
                HK$ {odometerValue.toLocaleString("en-HK")}
              </p>
              <p
                className={`font-mono text-[13px] mt-2 inline-flex items-center gap-1 font-semibold ${computedSummary.unrealizedPnl >= 0 ? "text-[#10b981]" : "text-error"}`}
              >
                {computedSummary.unrealizedPnl >= 0 ? "▲" : "▼"} HK${" "}
                {Math.abs(computedSummary.unrealizedPnl).toLocaleString(
                  "en-HK",
                )}{" "}
                ({computedSummary.unrealizedPnl >= 0 ? "+" : ""}
                {computedSummary.pnlPercent}% 未實現損益)
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddAssetModal("hobby")}
              className="flex items-center gap-1.5 px-4 h-10 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans text-[13px] font-semibold rounded-xl active:scale-[0.98] transition-all shrink-0 min-h-[40px] cursor-pointer focus:outline-none"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              收錄新卡
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "持有卡牌", value: `${computedSummary.cardCount} 張` },
              {
                label: "已鑑定規格",
                value: `${computedSummary.gradedCount} 張`,
              },
              { label: "未鑑定 Raw", value: `${computedSummary.rawCount} 張` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-[#17130f] rounded-xl px-3 py-2.5 border border-white/[0.02]"
              >
                <p className="font-mono text-[10px] text-[#d4c4b7] mb-0.5">
                  {label}
                </p>
                <p className="font-mono font-semibold text-[15px] text-[#eae1da]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Engine */}
      <div className="relative">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 text-[#8A8680] pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
            placeholder="搜尋持有卡牌名稱或編號..."
            className="w-full h-10 pl-10 pr-10 bg-[#26211C] border border-white/5 rounded-[10px] font-sans text-[13px] text-[#eae1da] placeholder:text-[#8A8680] focus:outline-none focus:border-[rgba(212,165,116,0.30)] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-3 text-[#8A8680] hover:text-[#eae1da] transition-colors text-[12px] focus:outline-none"
              aria-label="清除搜尋"
            >
              ✕
            </button>
          )}
        </div>
        <SmartSearch
          query={query}
          listings={searchSuggestions}
          isOpen={isSearchOpen}
          onSelect={(name) => {
            setQuery(name);
            setIsSearchOpen(false);
          }}
        />
      </div>

      {/* Ledger Table */}
      <div>
        <section aria-labelledby="cards-heading" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2
              id="cards-heading"
              className="font-sans font-semibold text-[16px] text-[#eae1da]"
            >
              我的持有卡牌庫{" "}
              <span className="font-mono text-[13px] text-[#8A8680]">
                ({filteredOwned.length})
              </span>
            </h2>
            <div className="flex gap-1">
              {["全部", "已鑑定", "未鑑定", "已上架"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  type="button"
                  className={`font-mono text-[10.5px] px-2.5 py-1 rounded-lg border transition-colors ${activeFilter === f ? "text-[#d4a574] border-[#d4a574]/40 bg-[rgba(212,165,116,0.08)]" : "text-[#d4c4b7] border-[rgba(237,232,224,0.08)] hover:text-[#eae1da]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-2 overflow-hidden">
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <table className="w-full min-w-[660px] border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(237,232,224,0.08)]">
                    {(
                      [
                        {
                          label: "卡牧資料",
                          align: "text-left",
                          extra: "pl-4 lg:pl-0 pr-3",
                        },
                        {
                          label: "鑑定規格 / 狀態",
                          align: "text-center",
                          extra: "px-3",
                        },
                        {
                          label: "收錄價格",
                          align: "text-right",
                          extra: "px-3",
                        },
                        {
                          label: "現市價格",
                          align: "text-right",
                          extra: "px-3",
                        },
                        {
                          label: "30D 走勢",
                          align: "text-center",
                          extra: "px-3",
                        },
                        {
                          label: "操作",
                          align: "text-right",
                          extra: "pr-4 lg:pr-0",
                        },
                      ] as const
                    ).map(({ label, align, extra }) => (
                      <th
                        key={label}
                        className={`font-mono text-[11px] text-[#8A8680] uppercase tracking-wider pb-3 pt-3 ${align} ${extra}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedListings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <p className="font-mono text-[13px] text-[#8A8680]">
                          {query
                            ? `找不到包含「${query}」的卡牌`
                            : "此篩選條件下沒有卡牌"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedListings.map((card) => {
                      const pnl = card.currentValue - card.purchasePrice;
                      const pnlDir = pnl >= 0 ? "up" : "down";
                      const firstChartPrice =
                        card.chartPoints[0]?.price ?? card.purchasePrice;
                      const lastChartPrice =
                        card.chartPoints.at(-1)?.price ?? card.currentValue;
                      const trend30d =
                        firstChartPrice > 0
                          ? ((lastChartPrice - firstChartPrice) /
                              firstChartPrice) *
                            100
                          : 0;
                      const trendDir = trend30d >= 0 ? "up" : "down";
                      const sparkPoints = getSparklinePoints(card.chartPoints);

                      return (
                        <tr
                          key={card.id}
                          className="border-b border-[rgba(237,232,224,0.04)] hover:bg-[#39342f]/30 transition-colors animate-fadeIn"
                        >
                          <td className="py-4 pl-4 lg:pl-0 pr-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-12 rounded-md bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                                <span className="font-mono text-[8px] text-[#50453b] font-bold">
                                  {card.grader}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-sans font-medium text-[13px] text-[#eae1da] truncate">
                                  {card.name}
                                </p>
                                <p className="font-mono text-[10px] text-[#d4c4b7]">
                                  {card.cardNo} · {card.set}
                                </p>
                                <GraderBadge grader={card.grader} />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-mono text-[9.5px] text-[#8A8680]">
                                {card.grade}
                              </span>
                              <StatusPill status={card.status} />
                            </div>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <p className="font-mono text-[13px] text-[#d4c4b7]">
                              HK$ {card.purchasePrice.toLocaleString("en-HK")}
                            </p>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <p className="font-mono font-semibold text-[14px] text-[#eae1da]">
                              HK$ {card.currentValue.toLocaleString("en-HK")}
                            </p>
                            <p
                              className={`font-mono text-[10px] ${pnlDir === "up" ? "text-[#10b981]" : "text-[#ef4444]"}`}
                            >
                              {pnl >= 0 ? "+" : ""}HK${" "}
                              {Math.abs(pnl).toLocaleString("en-HK")}
                            </p>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <svg
                                width="60"
                                height="24"
                                viewBox="0 0 60 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <polyline
                                  points={sparkPoints}
                                  fill="none"
                                  stroke={
                                    trendDir === "up" ? "#10b981" : "#ef4444"
                                  }
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span
                                className={`font-mono text-[10px] ${trendDir === "up" ? "text-[#10b981]" : "text-[#ef4444]"}`}
                              >
                                {trendDir === "up" ? "▲" : "▼"}{" "}
                                {Math.abs(trend30d).toFixed(1)}%
                              </span>
                            </div>
                          </td>

                          <td className="py-4 pl-3 pr-4 lg:pr-0 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex w-8 h-8 items-center justify-center rounded-lg border border-transparent hover:bg-[#322a24] hover:border-[rgba(237,232,224,0.10)] text-[#d4c4b7] hover:text-[#eae1da] transition-all font-mono text-[15px] focus:outline-none cursor-pointer select-none">
                                ⋯
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                side="bottom"
                                className="min-w-52"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/marketplace/product/${encodeURIComponent(card.id)}`,
                                    )
                                  }
                                >
                                  查看公開市場
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTriggerSellWorkflow(card)
                                  }
                                  className="text-brand focus:bg-[#322a24] focus:text-brand font-bold"
                                >
                                  出售收藏品
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => removeCard(card.id)}
                                >
                                  移除出資產庫
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemLabel="張卡牌"
              totalItems={filteredOwned.length}
              itemsPerPage={ITEMS_PER_PAGE}
              hideControls={false}
              enableScroll={true}
            />
          </div>
        </section>
      </div>

      {/* Wishlist Table */}
      <section aria-labelledby="wishlist-heading" className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="wishlist-heading"
            className="font-sans font-semibold text-[16px] text-[#eae1da] flex items-center gap-2"
          >
            <span className="text-[#d4a574]">★</span> 追蹤願望清單
          </h2>
        </div>
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-2">
          <WishlistTable />
        </div>
      </section>

      {/* Setup Form Dialog */}
      <Dialog
        open={sellTargetCard !== null}
        onOpenChange={(open) => {
          if (!open) setSellTargetCard(null);
        }}
      >
        <DialogContent className="bg-[#26211C] border border-white/10 rounded-2xl text-[#eae1da] max-w-sm p-6 shadow-2xl animate-scaleUp">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="font-sans font-black text-[17px] text-[#eae1da] flex items-center gap-2">
              🏷️ 建立資產出售要約
            </DialogTitle>
            <DialogDescription className="font-mono text-[10.5px] text-[#8A8680] uppercase tracking-wider">
              Setup Listing Selling Specifications
            </DialogDescription>
          </DialogHeader>

          {sellTargetCard && (
            <div className="space-y-4 py-2 font-sans text-[13px]">
              <div className="p-3 bg-[#17130f] rounded-xl border border-white/5 flex items-center gap-3">
                <div className="w-8 h-10 rounded bg-[#2c2722] border border-white/10 flex items-center justify-center font-mono text-[9px] font-bold text-brand shrink-0">
                  {sellTargetCard.grader}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#eae1da] truncate">
                    {sellTargetCard.name}
                  </p>
                  <p className="font-mono text-[11px] text-[#8A8680] mt-0.5">
                    {sellTargetCard.cardNo} · {sellTargetCard.grade}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="sell-price-input"
                  className="block font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wide"
                >
                  設定出讓一口價 (HK$)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono text-[13px] font-bold text-brand pointer-events-none">
                    HK$
                  </span>
                  <input
                    id="sell-price-input"
                    type="number"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    placeholder="輸入預期成交價格"
                    className="w-full h-11 pl-12 pr-4 bg-[#17130f] border border-white/5 rounded-xl text-[14px] font-mono font-bold text-brand focus:outline-none focus:border-brand/40 transition-colors"
                  />
                </div>
                <p className="font-mono text-[10px] text-[#8A8680]">
                  💡 建議參考全網當前估值：HK${" "}
                  {sellTargetCard.currentValue.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-3">
                <div>
                  <span className="block font-mono text-[10px] text-[#8A8680] uppercase">
                    預設支援交收物流
                  </span>
                  <div className="flex gap-1.5 mt-1">
                    {selectedShipping.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-[#2c2722] rounded text-[11px] text-[#d4c4b7] border border-white/[0.04]"
                      >
                        📦 {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-[#8A8680] uppercase">
                    預設收受付款方式
                  </span>
                  <div className="flex gap-1.5 mt-1">
                    {selectedPayment.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 bg-[#2c2722] rounded text-[11px] text-[#d4c4b7] border border-white/[0.04]"
                      >
                        ⚡ {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 pt-2 sm:space-x-0">
            <button
              type="button"
              onClick={handleConfirmPublishToListing}
              className="w-full h-11 bg-brand hover:bg-[#e8b896] text-[#1A1612] font-sans font-black text-[13.5px] rounded-xl cursor-pointer shadow-[0_4px_20px_rgba(212,165,116,0.18)] active:scale-[0.97] transition-all focus:outline-none"
            >
              🚀 確認無誤 · 正式上架發售
            </button>
            <button
              type="button"
              onClick={() => setSellTargetCard(null)}
              className="w-full h-10 bg-[#120F0C] hover:bg-[#1A1612] border border-white/[0.03] text-[#736c65] hover:text-[#eae1da] font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors focus:outline-none"
            >
              取消返回
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
