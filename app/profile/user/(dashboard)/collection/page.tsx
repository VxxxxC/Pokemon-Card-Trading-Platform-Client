"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WishlistTable } from "./components/WishlistTable";

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
}

const INITIAL_OWNED_CARDS: OwnedCard[] = [
  {
    id: "c-001",
    name: "Charizard ex SAR (噴火龍)",
    set: "Pokémon 151",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 2100,
    currentValue: 2250,
    status: "holding",
  },
  {
    id: "c-002",
    name: "Umbreon ex SAR (月亮伊布)",
    set: "Night Wanderer",
    cardNo: "sv6a-109",
    grade: "BGS 9.5",
    grader: "BGS",
    purchasePrice: 1800,
    currentValue: 1900,
    status: "holding",
  },
  {
    id: "c-003",
    name: "Pikachu AR (皮卡丘)",
    set: "Pokémon 151",
    cardNo: "sv2a-215",
    grade: "CGC 9",
    grader: "CGC",
    purchasePrice: 410,
    currentValue: 425,
    status: "holding",
  },
  {
    id: "c-004",
    name: "Eevee AR (伊布)",
    set: "Pokémon 151",
    cardNo: "sv2a-213",
    grade: "PSA 10",
    grader: "PSA",
    purchasePrice: 280,
    currentValue: 310,
    status: "listed",
  },
  {
    id: "c-005",
    name: "Mimikyu ex SAR (謎擬Q)",
    set: "Pokémon 151",
    cardNo: "sv2a-233",
    grade: "PSA 9",
    grader: "PSA",
    purchasePrice: 1250,
    currentValue: 1400,
    status: "holding",
  },
];

const portfolioSummary = {
  totalValue: 6285, // HK$ Total Valuation
  totalCost: 5840,
  unrealizedPnl: 445,
  pnlPercent: 7.62,
  cardCount: 5,
  gradedCount: 4,
  rawCount: 1,
};

function GraderBadge({ grader }: { grader: OwnedCard["grader"] }) {
  const map = {
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
  const map = {
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
  const [odometerValue, setOdometerValue] = useState(0);
  const [activeFilter, setActiveFilter] = useState("全部");

  // Rolling odometer animation loop upon component mount
  useEffect(() => {
    let start = 0;
    const end = portfolioSummary.totalValue;
    const duration = 1200; // ms
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
  }, []);

  const filteredOwned = INITIAL_OWNED_CARDS.filter((card) => {
    if (activeFilter === "已上架") return card.status === "listed";
    if (activeFilter === "已鑑定") return card.grader !== "RAW";
    if (activeFilter === "未鑑定") return card.grader === "RAW";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Portfolio Odometer Summary ── */}
      <section aria-labelledby="portfolio-heading">
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(212,165,116,0.20)] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.40)]">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-widest mb-1.5">
                AI 總身家估值 (PORTFOLIO VALUE)
              </p>
              {/* Animated rolling number */}
              <p className="font-mono font-bold text-[32px] text-[#eae1da] leading-none transition-all">
                HK$ {odometerValue.toLocaleString("en-HK")}
              </p>
              <p className="font-mono text-[13px] text-[#10b981] mt-2 inline-flex items-center gap-1 font-semibold">
                ▲ HK$ {portfolioSummary.unrealizedPnl.toLocaleString("en-HK")}{" "}
                (+{portfolioSummary.pnlPercent}% 未實現損益)
              </p>
            </div>
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 px-4 h-10 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans text-[13px] font-semibold rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shrink-0 min-h-[40px] cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              收錄新卡
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "持有卡牌", value: `${portfolioSummary.cardCount} 張` },
              {
                label: "已鑑定規格",
                value: `${portfolioSummary.gradedCount} 張`,
              },
              { label: "未鑑定 Raw", value: `${portfolioSummary.rawCount} 張` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-[#17130f] rounded-xl px-3 py-2.5 border border-[rgba(237,232,224,0.04)]"
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

      {/* Grid containing checklists and sign-in cards side-by-side */}
      <div className="items-start">
        {/* Left Side: Cards Portfolio List */}
        <section aria-labelledby="cards-heading" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2
              id="cards-heading"
              className="font-sans font-semibold text-[16px] text-[#eae1da]"
            >
              我的持有卡牌庫 ({filteredOwned.length})
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

          <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden divide-y divide-[rgba(237,232,224,0.04)]">
            {filteredOwned.map((card) => {
              const pnl = card.currentValue - card.purchasePrice;
              const pnlDir = pnl >= 0 ? "up" : "down";
              return (
                <div
                  key={card.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#39342f]/30 transition-colors"
                >
                  {/* Card placeholder thumbnail */}
                  <div className="w-9 h-12 rounded-md bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                    <span className="font-mono text-[8px] text-[#50453b] font-bold">
                      {card.grader}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-sans text-[13px] font-semibold text-[#eae1da] truncate">
                        {card.name}
                      </p>
                      <GraderBadge grader={card.grader} />
                      <StatusPill status={card.status} />
                    </div>
                    <p className="font-mono text-[11px] text-[#d4c4b7]">
                      {card.cardNo} · {card.grade}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-[14px] text-[#eae1da]">
                      HK$ {card.currentValue.toLocaleString("en-HK")}
                    </p>
                    <span
                      className={`font-mono text-[11px] inline-flex items-center gap-0.5 ${pnlDir === "up" ? "text-[#10b981]" : "text-[#ef4444]"}`}
                    >
                      {pnlDir === "up" ? "▲" : "▼"} HK${" "}
                      {Math.abs(pnl).toLocaleString("en-HK")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Wishlist Table ─────────────────────────────────────────────── */}
      <section aria-labelledby="wishlist-heading" className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="wishlist-heading"
            className="font-sans font-semibold text-[16px] text-[#eae1da] flex items-center gap-2"
          >
            <span className="text-[#d4a574]">★</span>
            追蹤願望清單
          </h2>
        </div>
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-2">
          <WishlistTable />
        </div>
      </section>
    </div>
  );
}
