"use client";

/**
 * MarketPagination — 全站統一奢華分頁控制器
 * Uses shadcn/ui Pagination primitives wrapped in luxury dark-golden design tokens.
 * Purely client-side (onClick + state) — NO window.location.href or anchor navigation.
 */

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface MarketPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional label shown in the info strip (e.g. "件商品" / "筆掛單") */
  itemLabel?: string;
  /** Total number of items (for the info strip) */
  totalItems?: number;
  /** Items per page (for the info strip) */
  itemsPerPage?: number;
  className?: string;
}

/** Generates a compact page-number window with optional ellipsis entries. */
function buildPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "ellipsis", total);
  } else if (current >= total - 3) {
    pages.push(1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "ellipsis", current - 1, current, current + 1, "ellipsis", total);
  }

  return pages;
}

export function MarketPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemLabel = "筆記錄",
  totalItems,
  itemsPerPage,
  className,
}: MarketPaginationProps) {
  // Do not render when there's nothing to paginate
  if (totalPages <= 1) return null;

  const pages = buildPageWindow(currentPage, totalPages);

  // Compute the visible slice range for the info strip
  const rangeStart = totalItems != null && itemsPerPage != null
    ? (currentPage - 1) * itemsPerPage + 1
    : null;
  const rangeEnd = totalItems != null && itemsPerPage != null
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : null;

  return (
    <div className={`flex flex-col items-center gap-3 pt-4 ${className ?? ""}`}>
      {/* Info strip */}
      {rangeStart != null && rangeEnd != null && totalItems != null && (
        <p className="font-mono text-[10.5px] text-[#8A8680] tracking-wider uppercase select-none">
          顯示第{" "}
          <span className="text-brand font-bold">{rangeStart}</span>
          {" "}–{" "}
          <span className="text-brand font-bold">{rangeEnd}</span>
          {" "}/ 共{" "}
          <span className="text-[#d4c4b7]">{totalItems}</span>
          {" "}{itemLabel}
          {" "}·{" "}
          <span className="text-[#d4c4b7]">第 {currentPage} / {totalPages} 頁</span>
        </p>
      )}

      <Pagination>
        <PaginationContent className="gap-1">
          {/* ← Prev */}
          <PaginationItem>
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 h-8 px-3 rounded-[6px] font-sans font-semibold text-[11.5px] border border-white/5 bg-[#26211C] text-[#d4c4b7] hover:bg-[#322a24] hover:border-white/10 hover:text-[#eae1da] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none focus:outline-none"
              aria-label="上一頁"
            >
              ‹ 上一頁
            </button>
          </PaginationItem>

          {/* Page number buttons */}
          {pages.map((page, idx) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ell-${idx}`}>
                <PaginationEllipsis className="text-[#8A8680] w-8 h-8" />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`w-8 h-8 rounded-[6px] font-mono text-[12px] font-bold border transition-all select-none focus:outline-none active:scale-[0.95] ${
                    currentPage === page
                      ? "bg-brand text-[#1A1612] border-brand shadow-sm shadow-brand/20"
                      : "bg-[#26211C] text-[#d4c4b7] border-white/5 hover:bg-[#322a24] hover:border-brand/30 hover:text-[#eae1da]"
                  }`}
                >
                  {page}
                </button>
              </PaginationItem>
            )
          )}

          {/* Next → */}
          <PaginationItem>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 h-8 px-3 rounded-[6px] font-sans font-semibold text-[11.5px] border border-white/5 bg-[#26211C] text-[#d4c4b7] hover:bg-[#322a24] hover:border-white/10 hover:text-[#eae1da] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none focus:outline-none"
              aria-label="下一頁"
            >
              下一頁 ›
            </button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
