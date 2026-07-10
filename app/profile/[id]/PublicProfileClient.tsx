"use client";

import Image from "next/image";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ProfileHeaderWithChat } from "@/app/components/profile/ProfileHeaderWithChat";
import { PublicReviewPreviewCard } from "@/app/components/profile/PublicReviewPreviewCard";
import { PriceSpreadBadge } from "@/app/components/marketplace/PriceSpreadBadge";
import type { PublicProfilePageBootstrap } from "@/app/actions/profile";
import { IoChevronBack } from "react-icons/io5";
import { useRouter } from "next/navigation";

type PublicProfileClientProps = {
  initialData: PublicProfilePageBootstrap | null;
  bootstrapError?: string;
};

function SectionWarning({ message }: { message: string }) {
  return (
    <p className="font-sans text-[13px] text-warning mb-4">{message}</p>
  );
}

export function PublicProfileClient({
  initialData,
  bootstrapError,
}: PublicProfileClientProps) {
  const router = useRouter();

  if (!initialData) {
    return (
      <div className="min-h-dvh bg-[#17130f] text-[#eae1da] flex flex-col items-center justify-center">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          {bootstrapError ?? "找不到此用戶檔案"}
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

  const {
    profile,
    reviewPersona,
    listings,
    totalListingCount,
    recentReviews,
    warnings,
  } = initialData;

  const listingsWarning = warnings.listings;
  const reviewsWarning = warnings.reviews;

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

        <ProfileHeaderWithChat
          member={{
            id: profile.id,
            username: profile.username,
            handle: profile.handle,
            joinDate: profile.joinDate,
            avatarSeed: profile.id,
            avatarUrl: profile.avatarUrl,
            level: profile.level,
            completedTrades: profile.completedTrades,
            bio: profile.bio,
            badges: profile.badges,
            rating: profile.rating,
            reviewCount: profile.reviewCount,
          }}
        />

        <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">
              上架中的商品 ({totalListingCount})
            </h2>
            <Link
              href={`/marketplace/${profile.id}`}
              className="font-mono text-[12px] text-brand hover:text-[#e8b896] font-bold transition-colors"
            >
              查看全部 →
            </Link>
          </div>

          {listingsWarning ? <SectionWarning message={listingsWarning} /> : null}

          {listings.length === 0 ? (
            <p className="font-sans text-[13px] text-text-secondary py-4">
              暫無上架商品
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-3 pt-1 scrollbar-none snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
              {listings.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${profile.id}/product/${item.id}`}
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
                  <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-white/5 gap-1">
                    <span className="font-mono text-[10px] text-[#10b981] font-bold truncate">
                      {item.grade.authority} {item.grade.score}
                    </span>
                    <div className="flex flex-col items-end min-w-0">
                      <span className="font-mono font-black text-[13px] text-brand">
                        HK${item.price.toLocaleString()}
                      </span>
                      <PriceSpreadBadge
                        priceVsMarketPct={item.priceVsMarketPct}
                        className="text-[10px]"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section
          id="rating"
          className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-6 mb-20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans font-bold text-[16px]">
              最近收到的信用評價
            </h2>
            <Link
              href={`/profile/${profile.id}/rating?persona=${reviewPersona}`}
              className="font-mono text-[12px] text-brand hover:text-brand-hover font-bold transition-colors"
            >
              查看更多評價 →
            </Link>
          </div>

          {reviewsWarning ? <SectionWarning message={reviewsWarning} /> : null}

          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <p className="font-sans text-[13px] text-text-secondary text-center py-6">
                暫無公開評價紀錄
              </p>
            ) : (
              recentReviews.map((review) => (
                <PublicReviewPreviewCard
                  key={review.id}
                  review={review}
                  variant="embedded"
                />
              ))
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
