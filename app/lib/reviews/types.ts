export type ReviewPersona = "member" | "merchant";

export type ReviewSortKey =
  | "rating-desc"
  | "rating-asc"
  | "date-desc"
  | "date-asc";

export type PublicProfileReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  dateLabel: string;
  isMerchantTx: boolean;
  reviewerId: string;
  reviewerPersona: ReviewPersona;
  reviewerDisplayName: string;
  reviewerUsername: string | null;
  reviewerAvatarUrl: string;
};

export type PublicProfileReviewsPage = {
  reviews: PublicProfileReviewItem[];
  aggregateRating: number;
  publicReviewCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
};

export type GetPublicProfileReviewsInput = {
  profileId: string;
  persona?: ReviewPersona;
  sort?: ReviewSortKey;
  page?: number;
  pageSize?: number;
  /** Skip profiles/merchant_shops rating lookup when RPC returns no review rows. */
  cachedAggregateRating?: number;
};

export type GetPublicProfileReviewsResult =
  | { success: true; data: PublicProfileReviewsPage }
  | { success: false; error: string; notFound?: boolean };
