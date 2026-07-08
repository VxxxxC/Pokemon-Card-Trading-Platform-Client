"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicProfileReviewItem } from "@/app/lib/reviews/types";

type PublicReviewPreviewCardProps = {
  review: PublicProfileReviewItem;
  variant?: "default" | "embedded";
};

export function PublicReviewPreviewCard({
  review,
  variant = "default",
}: PublicReviewPreviewCardProps) {
  const cardClassName =
    variant === "embedded"
      ? "flex flex-row gap-x-2 bg-[#17130f] rounded-xl border border-[rgba(237,232,224,0.04)] p-4"
      : "flex flex-row gap-x-2 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 hover:border-[rgba(237,232,224,0.15)] transition-colors";

  return (
    <div className={cardClassName}>
      <div className="self-start">
        <Link
          href={`/profile/${review.reviewerId}`}
          className="block w-8 h-8 rounded-full border border-white/10 hover:opacity-80 transition-opacity cursor-pointer overflow-hidden shrink-0"
          title={`查看 ${review.reviewerDisplayName} 的個人檔案`}
        >
          <Avatar className="w-full h-full">
            <AvatarImage
              src={review.reviewerAvatarUrl}
              alt={`${review.reviewerDisplayName} 的頭像`}
              className="w-full h-full object-cover rounded-full"
            />
            <AvatarFallback className="text-[10px]">
              {review.reviewerDisplayName.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex flex-row justify-between items-center mb-1.5">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${review.reviewerId}`}
              className="font-sans text-[13px] font-bold text-text-primary hover:text-brand transition-colors cursor-pointer"
              title={`查看 ${review.reviewerDisplayName} 的個人檔案`}
            >
              {review.reviewerDisplayName}
            </Link>
            <span className="font-mono text-[12px] text-brand font-bold">
              ⭐ {review.rating}
            </span>
            {review.isMerchantTx ? (
              <span className="font-sans text-[10.5px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded text-warning bg-warning/10 border border-warning/20 shadow-[0_0_12px_rgba(212,165,116,0.15)]">
                商家交易
              </span>
            ) : null}
          </div>
          <span className="font-mono text-[11px] text-text-disabled">
            {review.dateLabel}
          </span>
        </div>
        <p className="font-sans text-[13px] text-text-secondary leading-relaxed">
          {review.comment || "（無留言）"}
        </p>
      </div>
    </div>
  );
}
