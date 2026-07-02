"use client";

interface MarketplaceEmptyStateProps {
  hasActiveFilters?: boolean;
  query?: string;
  onResetFilters?: () => void;
}

export function MarketplaceEmptyState({
  hasActiveFilters = false,
  query = "",
  onResetFilters,
}: MarketplaceEmptyStateProps) {
  const trimmedQuery = query.trim();

  return (
    <div className="rounded-2xl border border-white/8 bg-[#26211C] px-6 py-14 sm:py-16 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border border-brand/20 bg-[#1A1612] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-brand/70"
          aria-hidden
        >
          <rect x="3" y="4" width="14" height="18" rx="2" />
          <path d="M7 8h6M7 12h6M7 16h4" />
          <circle cx="18" cy="18" r="4.5" />
          <path d="M20.5 20.5 22 22" strokeWidth="2" />
        </svg>
      </div>

      <h2 className="font-sans font-black text-[18px] sm:text-[20px] text-[#eae1da] tracking-tight">
        {hasActiveFilters ? "找不到符合條件的現貨" : "大盤暫無現貨標的"}
      </h2>

      <p className="font-sans text-[13px] text-[#d4c4b7] mt-2 max-w-md mx-auto leading-relaxed">
        {hasActiveFilters ? (
          <>
            {trimmedQuery ? (
              <>
                搜尋「<span className="text-brand">{trimmedQuery}</span>」沒有匹配結果。
              </>
            ) : (
              <>目前的篩選條件過於嚴格，請嘗試放寬條件。</>
            )}
            <br />
            <span className="font-mono text-[11px] text-[#8A8680]">
              僅顯示已有 active listing 的商品目錄項目
            </span>
          </>
        ) : (
          <>
            目前尚無上架中的卡牌或商品。
            <br />
            <span className="font-mono text-[11px] text-[#8A8680]">
              成為第一個賣家，或稍後再來看看
            </span>
          </>
        )}
      </p>

      {hasActiveFilters && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-xl font-sans font-bold text-[12.5px] border border-brand/40 text-brand bg-[rgba(212,165,116,0.06)] hover:border-brand hover:bg-[rgba(212,165,116,0.1)] transition-all active:scale-[0.97]"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          清除所有篩選
        </button>
      )}
    </div>
  );
}
