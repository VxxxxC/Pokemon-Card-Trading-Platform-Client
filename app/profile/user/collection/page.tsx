import type { Metadata } from "next";
import Link from "next/link";
import { WishlistTable } from "./components/WishlistTable";

export const metadata: Metadata = {
  title: "我的收藏庫 — PokéTrade JP",
  description: "管理個人持有卡牌，查看總身家估值",
};

interface OwnedCard {
  id: string;
  name: string;
  set: string;
  cardNo: string;
  grade: string;
  grader: "PSA" | "BGS" | "CGC" | "RAW";
  purchasePrice: number;
  currentValue: number;
  status: "holding" | "listed" | "grading";
}

// TODO: [database] Replace with Supabase query — fetch user's own card collection from `user_collections` table with JOIN `listings` for current prices
const ownedCards: OwnedCard[] = [
  { id: "c-001", name: "Charizard ex SAR",     set: "151",           cardNo: "sv2a-182", grade: "PSA 10",  grader: "PSA", purchasePrice: 42_400, currentValue: 49_800, status: "holding" },
  { id: "c-002", name: "Umbreon ex SAR",        set: "Night Wanderer",cardNo: "sv6a-109", grade: "BGS 9.5", grader: "BGS", purchasePrice: 38_000, currentValue: 41_200, status: "holding" },
  { id: "c-003", name: "Pikachu AR",            set: "151",           cardNo: "sv2a-215", grade: "CGC 9",   grader: "CGC", purchasePrice:  8_500, currentValue:  8_200, status: "holding" },
  { id: "c-004", name: "Eevee Heroes SAR Set",  set: "Eevee Heroes",  cardNo: "s6a-207",  grade: "PSA 10",  grader: "PSA", purchasePrice: 78_000, currentValue: 92_000, status: "listed"  },
  { id: "c-005", name: "Mimikyu ex SAR",        set: "151",           cardNo: "sv2a-233", grade: "PSA 9",   grader: "PSA", purchasePrice: 25_300, currentValue: 28_500, status: "holding" },
  { id: "c-006", name: "Mew ex SAR",            set: "151",           cardNo: "sv2a-205", grade: "RAW NM",  grader: "RAW", purchasePrice:  6_200, currentValue:  7_100, status: "grading" },
  { id: "c-007", name: "Gardevoir ex SAR",      set: "Shiny Treasure",cardNo: "sv4a-237", grade: "PSA 10",  grader: "PSA", purchasePrice: 35_000, currentValue: 38_500, status: "holding" },
  { id: "c-008", name: "Espeon ex SAR",         set: "Eevee Heroes",  cardNo: "s6a-209",  grade: "BGS 9",   grader: "BGS", purchasePrice: 28_000, currentValue: 31_000, status: "holding" },
];

// TODO: [database] Replace with Supabase aggregation — compute portfolio summary stats from `user_collections` JOIN `price_history` for current valuations
const portfolioSummary = {
  totalValue:      295_300,
  totalCost:       261_400,
  unrealizedPnl:    33_900,
  pnlPercent:        12.97,
  cardCount:             8,
  gradedCount:           7,
  rawCount:              1,
};

function GraderBadge({ grader }: { grader: OwnedCard["grader"] }) {
  const map = {
    PSA: "text-[#3b9eff] bg-[rgba(59,158,255,0.12)] border-[rgba(59,158,255,0.20)]",
    BGS: "text-[#a855f7] bg-[rgba(168,85,247,0.12)] border-[rgba(168,85,247,0.20)]",
    CGC: "text-[#22d3ee] bg-[rgba(34,211,238,0.12)] border-[rgba(34,211,238,0.20)]",
    RAW: "text-text-secondary bg-bg-elevated border-[rgba(237,232,224,0.12)]",
  };
  return (
    <span className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded border ${map[grader]}`}>
      {grader}
    </span>
  );
}

function StatusPill({ status }: { status: OwnedCard["status"] }) {
  const map = {
    holding: { label: "持有中",  className: "text-text-secondary bg-bg-elevated" },
    listed:  { label: "已上架",  className: "text-brand bg-[rgba(212,165,116,0.12)]" },
    grading: { label: "鑑定中",  className: "text-success bg-[rgba(16,185,129,0.12)]" },
  };
  const { label, className } = map[status];
  return (
    <span className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded ${className}`}>
      {label}
    </span>
  );
}

export default function UserCollectionPage() {
  return (
    <>
      {/* ── Portfolio Summary ──────────────────────────────────────────── */}
      <section aria-labelledby="portfolio-heading" className="mb-6">
        <div className="bg-bg-card rounded-2xl border border-[rgba(212,165,116,0.20)] p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono text-[11px] text-text-secondary uppercase tracking-widest mb-1">
                總身家估值
              </p>
              <p className="font-mono font-bold text-[32px] text-text-primary leading-none">
                ¥{portfolioSummary.totalValue.toLocaleString("zh-TW")}
              </p>
              <p className="font-mono text-[13px] text-success mt-1">
                ▲ ¥{portfolioSummary.unrealizedPnl.toLocaleString("zh-TW")} (+{portfolioSummary.pnlPercent}% 未實現損益)
              </p>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-2 bg-brand text-[#17130f] font-sans text-[13px] font-semibold rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新增
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "持有卡牌",   value: `${portfolioSummary.cardCount} 張` },
              { label: "已鑑定",     value: `${portfolioSummary.gradedCount} 張` },
              { label: "未鑑定",     value: `${portfolioSummary.rawCount} 張` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-elevated rounded-xl px-3 py-2.5">
                <p className="font-mono text-[10px] text-text-secondary mb-0.5">{label}</p>
                <p className="font-mono font-semibold text-[15px] text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Card Grid ─────────────────────────────────────────────────── */}
      <section aria-labelledby="cards-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="cards-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            我的卡牌 ({ownedCards.length})
          </h2>
          <div className="flex gap-2">
            {["全部", "已鑑定", "未鑑定", "已上架"].map((f) => (
              <button
                key={f}
                type="button"
                className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                  f === "全部"
                    ? "text-brand border-brand/30 bg-[rgba(212,165,116,0.08)]"
                    : "text-text-secondary border-[rgba(237,232,224,0.08)] hover:text-text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {ownedCards.map((card, i) => {
            const pnl = card.currentValue - card.purchasePrice;
            const pnlDir = pnl >= 0 ? "up" : "down";
            return (
              <div
                key={card.id}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
              >
                {/* Card placeholder thumbnail */}
                <div className="w-9 h-12 rounded-md bg-bg-elevated border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-text-disabled">{card.set.slice(0, 3).toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-sans text-[13px] font-medium text-text-primary truncate">{card.name}</p>
                    <GraderBadge grader={card.grader} />
                    <StatusPill status={card.status} />
                  </div>
                  <p className="font-mono text-[11px] text-text-secondary">{card.cardNo} · {card.grade}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-[14px] text-text-primary">
                    ¥{card.currentValue.toLocaleString("zh-TW")}
                  </p>
                  <span className={`font-mono text-[11px] ${pnlDir === "up" ? "text-success" : "text-warning"}`}>
                    {pnlDir === "up" ? "▲" : "▼"} ¥{Math.abs(pnl).toLocaleString("zh-TW")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Wishlist Table ─────────────────────────────────────────────── */}
      <section aria-labelledby="wishlist-heading" className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="wishlist-heading"
            className="font-sans font-semibold text-[16px] text-text-primary flex items-center gap-2"
          >
            <span className="text-brand" aria-hidden="true">★</span>
            願望清單
          </h2>
          <span className="font-mono text-[11px] text-text-disabled">
            {/* TODO: [database] Replace with real wishlist count from Supabase */}
            5 張追蹤中
          </span>
        </div>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-2">
          <WishlistTable />
        </div>
      </section>
    </>
  );
}
