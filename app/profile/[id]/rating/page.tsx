"use client";

import React, {
  use,
  useState,
  useSyncExternalStore,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import { MOCK_MEMBER_REVIEWS } from "@/app/lib/mock-data/member-rating";
import { Pagination } from "@/app/components/ui/Pagination";
import { getPublicMemberById } from "@/app/lib/mock-data/members";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// 引入 Shadcn UI 頂級黑金 Select 組件群
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PublicRatingPageProps {
  params: Promise<{ id: string }>;
}

type ReviewSortKey = "rating-desc" | "rating-asc" | "date-desc" | "date-asc";

const SORT_LABELS: Record<ReviewSortKey, string> = {
  "date-desc": "📅 日期：最新 → 最舊",
  "date-asc": "⏳ 日期：最舊 → 最新",
  "rating-desc": "🔥 評分：最高 → 最低",
  "rating-asc": "❄️ 評分：最低 → 最高",
};

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

// ── 🟢 Module-level totals from centralized review dataset ──────────────────
const totalReviews = MOCK_MEMBER_REVIEWS.length;

export default function PublicRatingPage({ params }: PublicRatingPageProps) {
  const router = useRouter();

  // 🟢 Next.js 16 async params contract: unwrap via React.use() in Client Components
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // Resolve member from registry for header metadata
  const member = getPublicMemberById(id);

  // Derive display score: prefer live registry rating, fall back to MOCK average
  const displayRating =
    member?.rating ??
    parseFloat(
      (
        MOCK_MEMBER_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      ).toFixed(1),
    );

  const displayReviewCount = member?.reviewCount ?? totalReviews;
  const _displayName = member?.username ?? id;

  // ── Responsive items per page via useSyncExternalStore ────────────────────
  const viewportWidth = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Mobile (<1280px) = 5 items/page, Desktop = 10 items/page
  const itemsPerPage = viewportWidth < 1280 ? 5 : 10;

  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<ReviewSortKey>("date-desc");

  // Reset pagination index on sortKey mutation to prevent out-of-bound errors
  const handleSortChange = useCallback((value: string | null) => {
    if (value) {
      setSortKey(value as ReviewSortKey);
    }
    setCurrentPage(1);
  }, []);

  // Intercept the baseline dataset inside high-performance useMemo
  const processedReviews = useMemo(() => {
    return [...MOCK_MEMBER_REVIEWS].sort((a, b) => {
      if (sortKey === "rating-desc") return b.rating - a.rating;
      if (sortKey === "rating-asc") return a.rating - b.rating;
      if (sortKey === "date-desc") {
        // Parse "YYYY年 M月" formats cleanly for deterministic numerical sorting comparison
        const parseDate = (dStr: string) => {
          const match = dStr.match(/(\d+)年\s*(\d+)月/);
          if (match) {
            return new Date(
              parseInt(match[1]),
              parseInt(match[2]) - 1,
            ).getTime();
          }
          return 0;
        };
        return parseDate(b.date) - parseDate(a.date);
      }
      if (sortKey === "date-asc") {
        const parseDate = (dStr: string) => {
          const match = dStr.match(/(\d+)年\s*(\d+)月/);
          if (match) {
            return new Date(
              parseInt(match[1]),
              parseInt(match[2]) - 1,
            ).getTime();
          }
          return 0;
        };
        return parseDate(a.date) - parseDate(b.date);
      }
      return 0;
    });
  }, [sortKey]);

  const totalPages = Math.ceil(totalReviews / itemsPerPage);

  // Drift guard: prevents index out-of-bounds when viewport crosses breakpoint mid-session
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIdx = (safeCurrentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, totalReviews);
  const visibleReviews = processedReviews.slice(startIdx, endIdx);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#17130f] flex flex-col text-[#eae1da]">
      <TopNav />
      <MobileHeader />

      <main className="mb-[5rem] flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {/* ── Back navigation ──────────────────────────────────────────── */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="返回上一頁"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card border border-white/5 transition-all cursor-pointer"
          >
            <IoChevronBack className="w-5 h-5" />
          </button>
        </div>

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-sans font-bold text-[22px] text-text-primary tracking-tight mb-3">
              全量信用評價歷史
            </h1>
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-sm inline-block">
              <p className="font-mono text-[13px] text-text-primary">
                <span className="text-[18px] mr-1.5">⭐</span>
                <span className="font-bold text-brand text-[20px]">
                  {displayRating}
                </span>
                <span className="text-text-secondary mx-1.5">/ 5.0</span>
                <span className="text-text-secondary">總體滿意度</span>
                <span className="text-text-disabled ml-2 text-[11px]">
                  (共計 {displayReviewCount} 筆真實認證評價)
                </span>
              </p>
            </div>
          </div>

          {/* 🟢 Shadcn UI Premium Dark-Golden Sorting Engine */}
          <div className="shrink-0">
            <Select value={sortKey} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48 h-9 bg-[#26211C] border border-white/5 rounded-lg text-[#eae1da] text-[12px] focus:ring-0 focus:ring-offset-0 focus:border-brand/40">
                <SelectValue placeholder="選擇排序方式">
                  {SORT_LABELS[sortKey]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#26211C] border border-white/10 rounded-lg text-[#eae1da]">
                <SelectItem value="date-desc">📅 日期：最新 → 最舊</SelectItem>
                <SelectItem value="date-asc">⏳ 日期：最舊 → 最新</SelectItem>
                <SelectItem value="rating-desc">
                  🔥 評分：最高 → 最低
                </SelectItem>
                <SelectItem value="rating-asc">❄️ 評分：最低 → 最高</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Review card list ─────────────────────────────────────────── */}
        <div className="space-y-3 mb-6">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-row gap-x-2 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 hover:border-[rgba(237,232,224,0.15)] transition-colors"
            >
              <div className="self-start">
                <Link
                  href={`/profile/${review.reviewerId || "koji_tcg"}`}
                  className="block w-8 h-8 rounded-full border border-white/10 hover:opacity-80 transition-opacity cursor-pointer overflow-hidden shrink-0"
                  title={`查看 ${review.reviewer} 的個人檔案`}
                >
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={`https://picsum.photos/seed/${review.avatarSeed || "user-yamada-ren-tcg"}/32/32`}
                      alt={`${review.reviewer} 的頭像`}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <AvatarFallback className="text-[10px]">
                      {review.reviewer.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex flex-row justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${review.reviewerId || "koji_tcg"}`}
                      className="font-sans text-[13px] font-bold text-text-primary hover:text-brand transition-colors cursor-pointer"
                      title={`查看 ${review.reviewer} 的個人檔案`}
                    >
                      {review.reviewer}
                    </Link>
                    <span className="font-mono text-[12px] text-brand font-bold">
                      ⭐ {review.rating}
                    </span>
                    {review.isMerchantTx && (
                      <span className="font-sans text-[10.5px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded text-warning bg-warning/10 border border-warning/20 shadow-[0_0_12px_rgba(212,165,116,0.15)]">
                        商家交易
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-text-disabled">
                    {review.date}
                  </span>
                </div>
                <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pagination ───────────────────────────────────────────────── */}
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemLabel="筆評價"
          totalItems={totalReviews}
          itemsPerPage={itemsPerPage}
          enableScroll={true}
        />
      </main>

      <BottomNav />
    </div>
  );
}
