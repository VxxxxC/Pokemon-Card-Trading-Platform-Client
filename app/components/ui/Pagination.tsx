"use client";

/**
 * Pagination — 全站統一奢華分頁控制器（提純選配按鈕版）
 * Uses shadcn/ui Pagination primitives wrapped in luxury dark-golden design tokens.
 * Purely client-side (onClick + state) — NO window.location.href or anchor navigation.
 *
 * Renamed from MarketPagination → Pagination (global registry unification).
 * New: `enableScroll` boolean property gate controls window/container scroll side-effects.
 */

import React from "react";
import {
  Pagination as PaginationPrimitive,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Optional label shown in the info strip (e.g. "件商品" / "筆掛單") */
  itemLabel?: string;
  /** Total number of items (for the info strip) */
  totalItems?: number;
  /** Items per page (for the info strip) */
  itemsPerPage?: number;
  /** 🟢 全新高能加裝：是否隱藏 [上一頁] / [下一頁] 按鈕，用於規避局部滾動條衝突 */
  hideControls?: boolean;
  /** 🟢 Scroll Gate: Controls window/container automatic scroll-recenter mechanics.
   *  Defaults to `true`. Pass `false` to bypass ALL scroll side-effects — pure
   *  in-place client-side data state slicing with zero viewport displacement. */
  enableScroll?: boolean;
  className?: string;
  scrollToViewId?: string;
  scrollBlock?: ScrollLogicalPosition;
}

/** Generates a compact page-number window with optional ellipsis entries. */
function buildPageWindow(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "ellipsis", total);
  } else if (current >= total - 3) {
    pages.push(
      1,
      "ellipsis",
      total - 4,
      total - 3,
      total - 2,
      total - 1,
      total,
    );
  } else {
    pages.push(
      1,
      "ellipsis",
      current - 1,
      current,
      current + 1,
      "ellipsis",
      total,
    );
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemLabel = "筆記錄",
  totalItems,
  itemsPerPage,
  hideControls = false,
  enableScroll = true, // 🟢 預設開啟：保持全站原有平滑回頂行為不變
  className,
  scrollToViewId,
  scrollBlock = "nearest",
}: PaginationProps) {
  // Do not render when there's nothing to paginate
  if (totalPages <= 1) return null;

  const pages = buildPageWindow(currentPage, totalPages);

  // Compute the visible slice range for the info strip
  const rangeStart =
    totalItems != null && itemsPerPage != null
      ? (currentPage - 1) * itemsPerPage + 1
      : null;
  const rangeEnd =
    totalItems != null && itemsPerPage != null
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : null;

  // 收束分頁行為，點擊時伴隨 smooth 回頂 / 對焦
  const handlePageAction = (targetPage: number) => {
    onPageChange(targetPage);

    // 🟢 Scroll Gate 防線：如果傳入 false，全面切斷滾動副作用，原地就地切片
    if (!enableScroll) return;

    if (typeof window !== "undefined") {
      const customId = document.getElementById(scrollToViewId!);
      if (customId) {
        // 🎯 盤口詳情頁專屬：精準平滑對焦回盤口頂部
        customId.scrollIntoView({ behavior: "smooth", block: scrollBlock });
      } else {
        // 🎯 大盤市場專屬：回歸標準全域置頂
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 pt-4 ${className ?? ""}`}>
      {/* Info strip */}
      {rangeStart != null && rangeEnd != null && totalItems != null && (
        <p className="font-mono text-[10.5px] text-[#8A8680] tracking-wider uppercase select-none">
          顯示第 <span className="text-brand font-bold">{rangeStart}</span> –{" "}
          <span className="text-brand font-bold">{rangeEnd}</span> / 共{" "}
          <span className="text-[#d4c4b7]">{totalItems}</span> {itemLabel} ·{" "}
          <span className="text-[#d4c4b7]">
            第 {currentPage} / {totalPages} 頁
          </span>
        </p>
      )}

      <PaginationPrimitive>
        <PaginationContent className="gap-1">
          {/* ← Prev (🟢 根據開關動態隱藏) */}
          {!hideControls && (
            <PaginationItem>
              <button
                type="button"
                onClick={() => handlePageAction(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 h-8 px-3 rounded-[6px] font-sans font-semibold text-[11.5px] border border-white/5 bg-[#26211C] text-[#d4c4b7] hover:bg-[#322a24] hover:border-white/10 hover:text-[#eae1da] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none focus:outline-none"
                aria-label="上一頁"
              >
                ‹ 上一頁
              </button>
            </PaginationItem>
          )}

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
                  onClick={() => handlePageAction(page)}
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
            ),
          )}

          {/* Next → (🟢 根據開關動態隱藏) */}
          {!hideControls && (
            <PaginationItem>
              <button
                type="button"
                onClick={() =>
                  handlePageAction(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 h-8 px-3 rounded-[6px] font-sans font-semibold text-[11.5px] border border-white/5 bg-[#26211C] text-[#d4c4b7] hover:bg-[#322a24] hover:border-white/10 hover:text-[#eae1da] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] select-none focus:outline-none"
                aria-label="下一頁"
              >
                下一頁 ›
              </button>
            </PaginationItem>
          )}
        </PaginationContent>
      </PaginationPrimitive>
    </div>
  );
}
