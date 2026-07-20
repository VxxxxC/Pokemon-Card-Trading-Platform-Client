import type { ReviewPersona } from "@/app/lib/reviews/types";

export function resolveReviewerPublicProfileHref(
  reviewerId: string,
  reviewerPersona: ReviewPersona,
): string {
  return `/profile/${reviewerId}?persona=${reviewerPersona}`;
}

export function resolveReviewerProfileLinkTitle(
  displayName: string,
  reviewerPersona: ReviewPersona,
): string {
  const label = reviewerPersona === "merchant" ? "商戶檔案" : "會員檔案";
  return `查看 ${displayName} 的${label}`;
}
