"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import Link from "next/link";
import { MOCK_MEMBER_REVIEWS } from "@/app/lib/mock-data/member-rating";
import { Pagination } from "@/app/components/ui/Pagination";

// ── 🟢 Hydration-safe viewport width snapshot via useSyncExternalStore ──────
function getSnapshot() {
  return typeof window !== "undefined" ? window.innerWidth : 1280;
}

function getServerSnapshot() {
  return 1280; // SSR fallback: treat as desktop
}

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

// ── 🟢 Compute overall average rating from dataset ──────────────────────────
const totalReviews = MOCK_MEMBER_REVIEWS.length;
const averageRating = (
  MOCK_MEMBER_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews
).toFixed(1);

export default function UserRatingPage() {
  const viewportWidth = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Responsive items per page: Mobile (<1280px) = 5, Desktop = 10
  const itemsPerPage = viewportWidth < 1280 ? 5 : 10;

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalReviews / itemsPerPage);

  // Reset to page 1 if itemsPerPage changes (viewport resize crosses breakpoint)
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIdx = (safeCurrentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalReviews);
  const visibleReviews = MOCK_MEMBER_REVIEWS.slice(startIdx, endIdx);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-bg-page px-4 py-6 max-w-3xl mx-auto">
      {/* ── Back navigation ────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/profile/user"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-text-secondary hover:text-brand transition-colors"
        >
          <span aria-hidden="true">←</span>
          <span>返回個人總覽</span>
        </Link>
      </div>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-sans font-bold text-[22px] text-text-primary tracking-tight mb-3">
          全量信用評價歷史
        </h1>
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-sm inline-block">
          <p className="font-mono text-[13px] text-text-primary">
            <span className="text-[18px] mr-1.5">⭐</span>
            <span className="font-bold text-brand text-[20px]">{averageRating}</span>
            <span className="text-text-secondary mx-1.5">/ 5.0</span>
            <span className="text-text-secondary">總體滿意度</span>
            <span className="text-text-disabled ml-2 text-[11px]">
              (共計 {totalReviews} 筆真實認證評價)
            </span>
          </p>
        </div>
      </div>

      {/* ── Review card list ───────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-sans text-[13px] font-bold text-text-primary truncate">
                  {review.reviewer}
                </span>
                <span className="font-mono text-[12px] text-brand font-bold shrink-0">
                  ⭐ {review.rating}
                </span>
                {review.isMerchantTx && (
                  <span className="font-mono text-[9.5px] text-text-disabled bg-bg-elevated px-1.5 py-0.5 rounded border border-[rgba(237,232,224,0.06)] shrink-0">
                    商家交易
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-text-disabled shrink-0">
                {review.date}
              </span>
            </div>
            <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemLabel="筆評價"
        totalItems={totalReviews}
        itemsPerPage={itemsPerPage}
        enableScroll={true}
      />
    </div>
  );
}
