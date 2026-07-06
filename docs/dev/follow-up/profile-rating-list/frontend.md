# Public Profile Rating List — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [transaction-reviews/backend.md](../transaction-reviews/backend.md)
- **Frontend:** ✅ Wired on `/profile/[id]/rating`
- **Route:** `profiles.id` (UUID) + `?persona=member|merchant` (default `member`)

## UI touchpoint

`app/profile/[id]/rating/page.tsx`

| Feature | Detail |
|---------|--------|
| Path param | `profiles.id` UUID |
| Query `persona` | `member` → `profiles.rating_score` + member-persona reviews; `merchant` → `merchant_shops.rating_score` + merchant-persona reviews |
| Sort | Server-side via RPC (`date-desc` default) |
| Pagination | 5 items/page mobile, 10 desktop; `Pagination` component |
| Guest access | Works without login (RPC granted to `anon`) |
| Reviewer links | `/profile/{reviewer_id}` (UUID) |
| Empty state | 「暫無公開評價紀錄」 |
| Invalid UUID / missing profile | 404-style inline message |

## Hook

```ts
import { usePublicProfileReviews } from "@/app/lib/hooks/usePublicProfileReviews";

const { reviews, aggregateRating, publicReviewCount, totalPages, isLoading, setPage } =
  usePublicProfileReviews({
    profileId,
    persona: "member", // or "merchant"
    sort: "date-desc",
    pageSize: 10,
  });
```

## Server action

```ts
import { getPublicProfileReviews } from "@/app/actions/reviews";

const result = await getPublicProfileReviews({
  profileId: "<profiles.id uuid>",
  persona: "merchant",
  sort: "rating-desc",
  page: 1,
  pageSize: 10,
});
```

## Dashboard links

| Source | Link |
|--------|------|
| User dashboard | `/profile/{profiles.id}/rating?persona=member` — **wired** via `useCurrentUserId()` |
| Merchant dashboard | `/profile/{profiles.id}/rating?persona=merchant` — pending real UUID |
| Public profile preview | `/profile/{profiles.id}/rating` (defaults to member) |

## Acceptance checklist

- [x] Rating page loads from DB (no mock reviews on this route)
- [x] Header shows `aggregate_rating` + `public_review_count` for selected persona
- [x] Sort + pagination refetch server-side
- [x] `isMerchantTx` badge when `merchant_order_id` present
- [x] Reviewer avatar via `resolveAvatarUrl`
- [x] Suspense boundary for `useSearchParams`
- [ ] Public profile `[id]/page.tsx` recent reviews strip still mock — follow-up
- [x] User dashboard rating link uses real `profiles.id` (`useCurrentUserId`)
- [ ] Merchant dashboard rating link still mock id — follow-up

## Manual test

1. Apply migration `20260706150000_profile_reviews_persona_split.sql`.
2. Complete C2C order → both parties rate → open `/profile/{seller_uuid}/rating?persona=member` as guest.
3. Complete B2C order → buyer rates merchant → open `?persona=merchant` — only B2C seller reviews appear.
4. Same user with dual identity: member and merchant scores differ when filtered by `persona`.

## Partner report

See [PARTNER_REPORT.md](./PARTNER_REPORT.md) for executive summary, P0–P3 backlog, and SQL smoke tests.
