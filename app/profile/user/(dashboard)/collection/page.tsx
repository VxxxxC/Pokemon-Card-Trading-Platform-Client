"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { WishlistTable } from "@/app/components/market/WishlistTable";
import { useUIStore } from "@/app/store/useUIStore";
import {
  INITIAL_LISTINGS,
  type UnifiedProductSpec,
} from "@/app/lib/mock-data/cards";
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

// ── Type Aliases ───────────────────────────────────────────────────────────────
// Derived from the canonical SSOT — zero interface duplication (copilot-instructions.md §2)
type ChartPoint = UnifiedProductSpec["chartPoints"][number];

// ── Core Data Model ────────────────────────────────────────────────────────────
// TODO [MOCK DATA]: Replace PORTFOLIO_REGISTRY + INITIAL_LISTINGS join with
//                  Supabase query on `user_collection` JOIN `card_catalog` tables
// TODO [API]:      Connect to grading service API to fetch live grade/status updates

interface OwnedCard {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW";
  purchasePrice: number; // HKD
  currentValue: number; // HKD
  status: "holding" | "listed" | "grading";
  /** 30-day price history from INITIAL_LISTINGS SSOT — powers the sparkline engine */
  chartPoints: ChartPoint[];
}

// Portfolio metadata registry — only portfolio-specific fields (grade, pricing, status).
// All base card data (name, set, cardNo, chartPoints) is joined from INITIAL_LISTINGS at runtime.
type PortfolioMeta = {
  id: string;
  grade: string;
  grader: OwnedCard["grader"];
  purchasePrice: number;
  currentValue: number;
  status: OwnedCard["status"];
};

const PORTFOLIO_REGISTRY: PortfolioMeta[] = [
  {
    id: "sv2a-182",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2100,
    currentValue: 2250,
    status: "holding",
  },
  {
    id: "sv6a-109",
    grade: "BGS 9.5",
    grader: "BGS",
    purchasePrice: 1800,
    currentValue: 1900,
    status: "holding",
  },
  {
    id: "sv2a-215",
    grade: "CGC 9",
    grader: "CGC",
    purchasePrice: 410,
    currentValue: 425,
    status: "holding",
  },
  {
    id: "sv2a-189",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2480,
    currentValue: 2350,
    status: "listed",
  },
  {
    id: "sv2a-205",
    grade: "PSA 9",
    grader: "PSA",
    purchasePrice: 880,
    currentValue: 950,
    status: "holding",
  },
  {
    id: "sv3pt5-067",
    grade: "BGS 9.5",
    grader: "BGS",
    purchasePrice: 1300,
    currentValue: 1380,
    status: "holding",
  },
  {
    id: "sv3w-085",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2650,
    currentValue: 2950,
    status: "holding",
  },
  {
    id: "sv4pt5-086",
    grade: "PSA 9",
    grader: "PSA",
    purchasePrice: 2400,
    currentValue: 2550,
    status: "grading",
  },
];

/** Hydrates OwnedCard[] by joining PORTFOLIO_REGISTRY with INITIAL_LISTINGS SSOT */
function buildInitialOwnedCards(): OwnedCard[] {
  return PORTFOLIO_REGISTRY.flatMap<OwnedCard>((meta) => {
    const card = INITIAL_LISTINGS.find((c) => c.id === meta.id);
    if (!card) return [];
    return [
      {
        id: meta.id,
        name: card.name,
        set: card.set,
        cardNo: card.cardNo ?? meta.id,
        grade: meta.grade,
        grader: meta.grader,
        purchasePrice: meta.purchasePrice,
        currentValue: meta.currentValue,
        status: meta.status,
        chartPoints: card.chartPoints,
      },
    ];
  });
}

/** Max cards displayed per table page — compound pagination guard threshold */
const ITEMS_PER_PAGE = 5;

// ── Sparkline Math Projection Engine ──────────────────────────────────────────
/**
 * Dynamically maps a chartPoints price array into SVG polyline coordinates.
 * Inverts the Y axis (SVG 0,0 = top-left) and normalises to a fixed viewport.
 * Returns a flat line if chartPoints has fewer than 2 entries.
 */
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
      // Invert Y axis: SVG 0,0 starts from top-left corner
      const y = height - ((point.price - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

// ── Main Page Component ────────────────────────────────────────────────────────

export default function UserCollectionPage() {
  const router = useRouter();

  // ── Core state ──────────────────────────────────────────────────────────────
  // Function form of useState: buildInitialOwnedCards() runs once at mount only
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>(() =>
    buildInitialOwnedCards(),
  );
  const [odometerValue, setOdometerValue] = useState(0);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // React 19 compound state bucket — zero-useEffect pagination synchronization
  const [pageState, setPageState] = useState({ page: 1, forKey: "" });

  const openAddAssetModal = useUIStore((state) => state.openAddAssetModal);

  // 金融級安全水合守衛 — React 19 官方 useSyncExternalStore 快照機制
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // ── Computed summary ─────────────────────────────────────────────────────────
  const computedSummary = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let gradedCount = 0;
    let rawCount = 0;

    ownedCards.forEach((c) => {
      totalValue += c.currentValue;
      totalCost += c.purchasePrice;
      if (c.grader === "RAW") {
        rawCount += 1;
      } else {
        gradedCount += 1;
      }
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

  // 動態滾動數字里程錶 (legitimate side-effect: manages setInterval)
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

  // 全域事件廣播接收器 — captures asset additions from any entry point
  // TODO [BACKEND]: Replace CustomEvent with Supabase real-time subscription
  useEffect(() => {
    const handleAssetAdded = (e: Event) => {
      const customEvent = e as CustomEvent<OwnedCard>;
      if (customEvent.detail) {
        setOwnedCards((prev) => [
          {
            ...customEvent.detail,
            // Guard: new cards dispatched pre-chartPoints may arrive without it
            chartPoints: customEvent.detail.chartPoints ?? [],
          },
          ...prev,
        ]);
      }
    };

    window.addEventListener(
      "global-asset-successfully-added",
      handleAssetAdded,
    );
    return () =>
      window.removeEventListener(
        "global-asset-successfully-added",
        handleAssetAdded,
      );
  }, []);

  // ── Smart Search Suggestions ──────────────────────────────────────────────
  // DRY TypeScript: derives MarketplaceListing[] from OwnedCard[] via runtime mapping.
  // Uses existing canonical type — zero interface duplication.
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

  // ── Hydration guard ──────────────────────────────────────────────────────────
  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── React 19 Zero-useEffect Pagination Fingerprint Engine ──────────────────
  const activeFingerprint = `${activeFilter}|${query}`;
  const currentPage =
    pageState.forKey === activeFingerprint ? pageState.page : 1;
  const setCurrentPage = (page: number) =>
    setPageState({ page, forKey: activeFingerprint });

  // ── Action handlers ──────────────────────────────────────────────────────────
  const removeCard = (id: string) =>
    setOwnedCards((prev) => prev.filter((c) => c.id !== id));

  const listCard = (id: string) =>
    setOwnedCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "listed" as const } : c)),
    );

  // ── Dual-axis filter engine ──────────────────────────────────────────────────
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

  // ── Pagination slice ──────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredOwned.length / ITEMS_PER_PAGE);
  const paginatedListings = filteredOwned.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* ── Portfolio Odometer Summary ─────────────────────────────────────── */}
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
                className={`font-mono text-[13px] mt-2 inline-flex items-center gap-1 font-semibold ${
                  computedSummary.unrealizedPnl >= 0
                    ? "text-[#10b981]"
                    : "text-error"
                }`}
              >
                {computedSummary.unrealizedPnl >= 0 ? "▲" : "▼"} HK${" "}
                {Math.abs(computedSummary.unrealizedPnl).toLocaleString(
                  "en-HK",
                )}{" "}
                ({computedSummary.unrealizedPnl >= 0 ? "+" : ""}
                {computedSummary.pnlPercent}% 未實現損益)
              </p>
            </div>

            {/* [收錄新卡] 按鈕 */}
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

      {/* ── 智慧搜尋欄 — between odometer stats and filter tab menu ───────────── */}
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

      {/* ── 卡牌庫看板區 ──────────────────────────────────────────────────────── */}
      <div>
        <section aria-labelledby="cards-heading" className="space-y-4">
          {/* Section Heading + Filter Tabs */}
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
                  className={`font-mono text-[10.5px] px-2.5 py-1 rounded-lg border transition-colors ${
                    activeFilter === f
                      ? "text-[#d4a574] border-[#d4a574]/40 bg-[rgba(212,165,116,0.08)]"
                      : "text-[#d4c4b7] border-[rgba(237,232,224,0.08)] hover:text-[#eae1da]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Portfolio Ledger Table Matrix ────────────────────────────────── */}
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

                      // 30D trend derived from canonical chartPoints
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
                          {/* Col 1: 卡牧資料 */}
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
                              </div>
                            </div>
                          </td>

                          {/* Col 2: 鑑定規格 / 狀態 */}
                          <td className="py-4 px-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <GraderBadge grader={card.grader} />
                              <StatusPill status={card.status} />
                              <span className="font-mono text-[9.5px] text-[#8A8680]">
                                {card.grade}
                              </span>
                            </div>
                          </td>

                          {/* Col 3: 收錄價格 */}
                          <td className="py-4 px-3 text-right">
                            <p className="font-mono text-[13px] text-[#d4c4b7]">
                              HK$ {card.purchasePrice.toLocaleString("en-HK")}
                            </p>
                          </td>

                          {/* Col 4: 現市價格 — mirrors WishlistTable Col 4 structure */}
                          <td className="py-4 px-3 text-right">
                            <p className="font-mono font-semibold text-[14px] text-[#eae1da]">
                              HK$ {card.currentValue.toLocaleString("en-HK")}
                            </p>
                            <p
                              className={`font-mono text-[10px] ${
                                pnlDir === "up"
                                  ? "text-[#10b981]"
                                  : "text-[#ef4444]"
                              }`}
                            >
                              {pnl >= 0 ? "+" : ""}HK${" "}
                              {Math.abs(pnl).toLocaleString("en-HK")}
                            </p>
                          </td>

                          {/* Col 5: 30D 走勢 — dynamic sparkline from INITIAL_LISTINGS chartPoints */}
                          <td className="py-4 px-3">
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
                                className={`font-mono text-[10px] ${
                                  trendDir === "up"
                                    ? "text-[#10b981]"
                                    : "text-[#ef4444]"
                                }`}
                              >
                                {trendDir === "up" ? "▲" : "▼"}{" "}
                                {Math.abs(trend30d).toFixed(1)}%
                              </span>
                            </div>
                          </td>

                          {/* Col 6: 操作 */}
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
                                      `/marketplace?q=${encodeURIComponent(card.name)}`,
                                    )
                                  }
                                >
                                  📈 查看全網大盤走勢
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => listCard(card.id)}
                                >
                                  🏪 上架交易市場
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => removeCard(card.id)}
                                >
                                  🚨 移除出資產庫
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
            {/* ── Pagination — React 19-compliant compound state ─────────────────── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemLabel="張卡牌"
              totalItems={filteredOwned.length}
              itemsPerPage={ITEMS_PER_PAGE}
              hideControls={false}
              enableScroll={true} // 🟢 Enable smooth automatic back-to-top on asset page switch
            />
          </div>
        </section>
      </div>

      {/* ── Wishlist Table ─────────────────────────────────────────────────── */}
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
    </div>
  );
}
