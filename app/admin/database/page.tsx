import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "卡牌資料庫 — PokéTrade JP 後台",
  description: "審核卡牌條目，管理非 API 覆蓋的特殊卡牌手動錄入",
};

interface CardEntry {
  id: string;
  cardNo: string;
  name: string;
  nameJP: string;
  set: string;
  rarity: string;
  source: "tcgdex" | "justtcg" | "manual";
  cachedAt: string;
  needsReview: boolean;
}

// TODO [database]: Replace with Supabase query — fetch card entries from `card_catalog` table, with JOIN `price_cache` for cachedAt; filter by needsReview flag
const cardEntries: CardEntry[] = [
  { id: "DB-001", cardNo: "sv2a-182", name: "Charizard ex SAR",  nameJP: "リザードン ex SAR", set: "151 (sv2a)",              rarity: "SR",   source: "tcgdex", cachedAt: "2025/5/21 12:00", needsReview: false },
  { id: "DB-002", cardNo: "sv6a-109", name: "Umbreon ex SAR",    nameJP: "ブラッキー ex SAR", set: "Night Wanderer (sv6a)",   rarity: "SR",   source: "tcgdex", cachedAt: "2025/5/21 12:00", needsReview: false },
  { id: "DB-003", cardNo: "sv4a-237", name: "Gardevoir ex SAR",  nameJP: "サーナイト ex SAR", set: "Shiny Treasure (sv4a)",   rarity: "SR",   source: "tcgdex", cachedAt: "2025/5/20 08:30", needsReview: false },
  { id: "DB-004", cardNo: "promo-032", name: "Pikachu PROMO",    nameJP: "ピカチュウ PROMO",  set: "Pokémon Center 限定 2024", rarity: "PROMO",source: "manual", cachedAt: "2025/5/18 15:22", needsReview: false },
  { id: "DB-005", cardNo: "s12a-301", name: "Arceus VSTAR UR",   nameJP: "アルセウス VSTAR UR",set: "VSTAR Universe (s12a)",  rarity: "UR",   source: "tcgdex", cachedAt: "2025/5/21 12:00", needsReview: false },
  { id: "DB-006", cardNo: "gym-042",  name: "Sabrina's Gengar",  nameJP: "ナツメのゲンガー",   set: "Gym Heroes (第1弾·舊版)", rarity: "Holo", source: "manual", cachedAt: "2025/5/19 10:15", needsReview: true  },
  { id: "DB-007", cardNo: "vc2-033",  name: "Venusaur-Holo",     nameJP: "フシギバナ Holo",   set: "Base Set 2nd Edition",   rarity: "Holo", source: "manual", cachedAt: "2025/5/17 09:00", needsReview: true  },
];

const SOURCE_BADGE: Record<CardEntry["source"], { label: string; className: string }> = {
  tcgdex:   { label: "TCGdex",    className: "text-success bg-[rgba(16,185,129,0.12)]" },
  justtcg:  { label: "JustTCG",   className: "text-brand bg-[rgba(212,165,116,0.12)]" },
  manual:   { label: "手動錄入", className: "text-[#3b9eff] bg-[rgba(59,158,255,0.10)]" },
};

export default function AdminDatabasePage() {
  const needsReviewCount = cardEntries.filter((c) => c.needsReview).length;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-sans font-bold text-[22px] text-text-primary">卡牌資料庫</h1>
            <p className="font-sans text-[13px] text-text-secondary mt-0.5">
              管理卡牌條目 · 手動錄入非 API 覆蓋卡種 · 快取更新控制
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {/* TODO [server]: "更新 Top-100 快取" has no handler — must call server action to re-run TCGdex API fetch and update `price_cache` table in Supabase */}
            <button type="button" className="flex items-center gap-1.5 px-3 py-2 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-xl font-mono text-[11px] sm:text-[12px] text-text-secondary hover:text-text-primary transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span className="hidden sm:inline">更新 Top-100 快取</span>
              <span className="sm:hidden">更新快取</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {[
          { label: "總條目",     value: cardEntries.length,                          color: "text-text-primary" },
          { label: "待審核",     value: needsReviewCount,                            color: needsReviewCount > 0 ? "text-warning" : "text-text-primary" },
          { label: "API 來源",   value: cardEntries.filter((c) => c.source !== "manual").length, color: "text-success" },
          { label: "手動錄入",   value: cardEntries.filter((c) => c.source === "manual").length, color: "text-[#3b9eff]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3 text-center">
            <p className={`font-mono font-bold text-[22px] ${color}`}>{value}</p>
            <p className="font-mono text-[11px] text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Manual Entry Form ─────────────────────────────────────────── */}
      {/* TODO [server]: Manual entry form submit has no handler — must call server action to INSERT into `card_catalog` table with admin auth check */}
      <section
        aria-labelledby="manual-entry-heading"
        className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 mb-6"
      >
        <h2 id="manual-entry-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          手動新增卡牌條目
        </h2>
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="card-no-input" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              卡牌編號 <span className="text-warning">*</span>
            </label>
            <input id="card-no-input" type="text" placeholder="例：gym-042 / promo-032" className="w-full h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-text-primary placeholder-text-disabled focus:outline-none" />
          </div>
          <div>
            <label htmlFor="card-name-en" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              英文名稱 <span className="text-warning">*</span>
            </label>
            <input id="card-name-en" type="text" placeholder="例：Sabrina's Gengar" className="w-full h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-text-primary placeholder-text-disabled focus:outline-none" />
          </div>
          <div>
            <label htmlFor="card-name-jp" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              日文名稱
            </label>
            <input id="card-name-jp" type="text" placeholder="例：ナツメのゲンガー" className="w-full h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-text-primary placeholder-text-disabled focus:outline-none" />
          </div>
          <div>
            <label htmlFor="card-set" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              系列名稱 <span className="text-warning">*</span>
            </label>
            <input id="card-set" type="text" placeholder="例：Gym Heroes (第1弾·舊版)" className="w-full h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-text-primary placeholder-text-disabled focus:outline-none" />
          </div>
          <div>
            <label htmlFor="card-rarity" className="font-mono text-[12px] text-text-secondary block mb-1.5">
              稀有度
            </label>
            <select id="card-rarity" className="w-full h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-text-primary focus:outline-none appearance-none">
              <option>SAR / SR</option>
              <option>UR</option>
              <option>RR / R</option>
              <option>Holo</option>
              <option>PROMO</option>
              <option>其他</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform">
              新增條目
            </button>
          </div>
        </form>
      </section>

      {/* ── Card Entries Table ─────────────────────────────────────────── */}
      <section aria-labelledby="db-table-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="db-table-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            卡牌條目 ({cardEntries.length})
          </h2>
          <div className="flex items-center h-9 bg-bg-card border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-3 shrink-0" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="搜尋條目…" className="w-36 h-full bg-transparent px-2 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none" />
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {cardEntries.map((card, i) => {
            const { label, className } = SOURCE_BADGE[card.source];
            return (
              <div
                key={card.id}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""} ${card.needsReview ? "bg-[rgba(239,68,68,0.03)]" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] px-1.5 py-0.5 rounded shrink-0">{card.cardNo}</span>
                    <p className="font-sans text-[13px] font-medium text-text-primary truncate">{card.name}</p>
                    <span className="font-mono text-[11px] text-text-disabled">{card.nameJP}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-text-secondary">{card.set}</span>
                    <span className="font-mono text-[11px] text-text-disabled">{card.rarity}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${className}`}>{label}</span>
                    {card.needsReview && (
                      <span className="font-mono text-[10px] text-warning bg-[rgba(239,68,68,0.10)] px-1.5 py-0.5 rounded">待審核</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] text-text-disabled">{card.cachedAt}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button type="button" className="px-2 py-1 font-mono text-[11px] text-text-secondary border border-[rgba(237,232,224,0.08)] rounded-lg hover:text-text-primary hover:bg-bg-elevated transition-colors">
                    編輯
                  </button>
                  {card.needsReview && (
                    <button type="button" className="px-2 py-1 font-mono text-[11px] text-success border border-success/20 rounded-lg hover:bg-[rgba(16,185,129,0.08)] transition-colors">
                      審核
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
