"use client";

import { use, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileHeaderWithChat } from "@/app/components/profile/ProfileHeaderWithChat";
import {
  getPublicMemberById,
  getStorefrontListingsByMember,
} from "@/app/lib/mock-public-members";

interface ProfileIdPageProps {
  params: Promise<{ id: string }>;
}

function StarRating({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(score) ? "#d4a574" : "none"}
          stroke="#d4a574"
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

export default function PublicProfilePage({ params }: ProfileIdPageProps) {
  // 🟢 為了在 Client 組件內完美兼容 Next.js 16 異步參數協議，使用 React.use() 進行解包
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const member = getPublicMemberById(id);
  const storefrontListings = member
    ? getStorefrontListingsByMember(member)
    : [];

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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {storefrontListings.map((item) => (
              /* 🟢 核心修正 2：將商品卡片跳轉路徑，精準導向私域專屬商品詳情頁，消滅 404 地雷 */
              <Link
                key={item.id}
                href={`/marketplace/${member.id}/product/${item.id}`}
                className="block group bg-[#17130f]/40 p-2.5 rounded-xl border border-transparent hover:border-brand/20 transition-all duration-300"
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
        <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">買家評價</h2>
            <div className="flex items-center gap-1.5">
              <StarRating score={member.rating} size={15} />
              <span className="font-mono text-[14px] font-bold">
                {member.rating}
              </span>
              <span className="font-mono text-[12px] text-[#50453b]">
                ({member.reviewCount})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {member.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#17130f] rounded-xl p-4 border border-[rgba(237,232,224,0.04)]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans text-[13px] font-medium">
                    {review.reviewer}
                  </span>
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
