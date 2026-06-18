"use client";

import { use, useSyncExternalStore, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileHeaderWithChat } from "@/app/components/profile/ProfileHeaderWithChat";
import { MOCK_MEMBER_REVIEWS } from "@/app/lib/mock-data/member-rating";
import {
  getPublicMemberById,
  getStorefrontListingsByMember,
} from "@/app/lib/mock-data/members";
import { IoChevronBack } from "react-icons/io5";
import { useRouter } from "next/navigation";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: ProfileIdPageProps) {
  // 🟢 為了在 Client 組件內完美兼容 Next.js 16 異步參數協議，使用 React.use() 進行解包
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const member = getPublicMemberById(id);
  const storefrontListings = member
    ? getStorefrontListingsByMember(member)
    : [];

  // 🟢 核心優化：從 centralized reviews module 讀取，按日期排序並嚴格切片為 3 筆最新評價
  const recentPublicReviews = useMemo(() => {
    const parseDate = (dStr: string) => {
      const match = dStr.match(/(\d+)年\s*(\d+)月/);
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1).getTime();
      }
      return 0;
    };
    return [...MOCK_MEMBER_REVIEWS]
      .sort((a, b) => parseDate(b.date) - parseDate(a.date))
      .slice(0, 3);
  }, []);

  // 統一採用說明書工程標準：原生 useSyncExternalStore 客戶端鎖，徹底封鎖水合 Layout Shift
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          找不到此商戶個人檔案
        </h1>
        <Link
          href="/marketplace"
          className="text-brand text-sm mt-2 hover:underline"
        >
          ← 返回交易所大盤
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#17130f] flex flex-col text-[#eae1da]">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 py-6 space-y-6 animate-fadeIn">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>

        {/* 1. 商戶名片 + 右下角懸浮 Chatbox */}
        <ProfileHeaderWithChat member={member} />

        {/* 2. 上架中商品 (Public Inventory) */}
        <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">
              上架中的商品 ({storefrontListings.length})
            </h2>
            {/* 🟢 核心修正 1：將查看全部跳轉精準駁通至該商戶的專屬市集獨立櫥窗 */}
            <Link
              href={`/marketplace/${member.id}`}
              className="font-mono text-[12px] text-brand hover:text-[#e8b896] font-bold transition-colors"
            >
              查看全部 →
            </Link>
          </div>

          {/* 🎯 Target Refactored Horizontal Scrolling Chassis */}
          <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-1 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {storefrontListings.slice(0, 5).map((item) => (
              /* 🟢 核心修正 2：將商品卡片跳轉路徑，精準導向私域專屬商品詳情頁，消滅 404 地雷 */
              <Link
                key={item.id}
                href={`/marketplace/${member.id}/product/${item.id}`}
                className="block shrink-0 w-[155px] sm:w-[175px] md:w-[195px] bg-[#17130f]/40 p-2.5 rounded-xl border border-transparent hover:border-brand/20 transition-all duration-300 snap-start group"
              >
                <div className="relative aspect-[3/4] bg-[#17130f] rounded-lg mb-2 overflow-hidden border border-[rgba(237,232,224,0.04)] group-hover:border-brand/40 transition-colors">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <h3 className="font-sans text-[12.5px] text-[#eae1da] truncate group-hover:text-brand transition-colors">
                  {item.name}
                </h3>
                <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-white/5">
                  <span className="font-mono text-[10px] text-[#10b981] font-bold">
                    {item.grade.authority} {item.grade.score}
                  </span>
                  <span className="font-mono font-black text-[13px] text-brand">
                    HK${item.price.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. 買家評價 */}
        <section
          id="rating"
          className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6 mb-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">
              最近收到的信用評價
            </h2>
            <Link
              href={`/profile/${member.id}/rating`}
              className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold transition-colors"
            >
              查看更多評價 →
            </Link>
          </div>
          <div className="space-y-3">
            {recentPublicReviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#17130f] rounded-xl p-4 border border-[rgba(237,232,224,0.04)]"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[13px] font-bold text-text-primary">
                      {review.reviewer}
                    </span>
                    <span className="font-mono text-[12px] text-brand font-bold shrink-0">
                      ⭐ {review.rating}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#50453b]">
                    {review.date}
                  </span>
                </div>
                <p className="font-sans text-[13px] text-[#d4c4b7] leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
