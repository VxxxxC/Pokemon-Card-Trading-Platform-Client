# Partner Report — Public Profile Rating List (Dual Persona)

**Date:** 2026-07-06  
**Flow:** Public rating history (`/profile/[id]/rating`) + persona-split reputation  
**Backend owner:** Backend track  
**Frontend owner:** Partner (merchant dashboard UUID link + profile preview strip)  
**Remote DB:** Migration **pushed** (`bunx supabase db push --yes` ✅)  
**Types:** `search_public_profile_reviews` added to `types/supabase.ts` (regen optional via `bun run supabase:types`)

---

## Executive summary

| Area | Status |
|------|--------|
| Dual-persona `reviewee_persona` + rating triggers | ✅ Deployed |
| `search_public_profile_reviews` RPC (guest-readable) | ✅ Deployed |
| `getPublicProfileReviews` server action | ✅ Shipped |
| `/profile/[id]/rating` page DB wiring | ✅ Baseline shipped |
| User dashboard → rating link | ✅ `useCurrentUserId()` → `/profile/{profiles.id}/rating?persona=member` |
| Merchant dashboard rating link | 🟡 `?persona=merchant` added; still mock `profiles.id` |
| Public profile `[id]/page.tsx` recent reviews | ⏳ Still mock |
| `ReviewModal` / trading submit flows | ✅ Unchanged (already wired) |

**Partner action:** Verify dual-persona acceptance below; wire merchant dashboard + public profile preview to real `profiles.id`; polish empty/loading states if needed.

---

## What shipped

### Database (remote)

| Migration | Purpose |
|-----------|---------|
| `20260706150000_profile_reviews_persona_split.sql` | Persona backfill; fix `rpc_submit_transaction_review`; split `profiles` / `merchant_shops` `rating_score`; `search_public_profile_reviews`; list index |

### Dual-persona model (one `profiles.id`, independent stats)

| Persona | Aggregate source | Reviews filter |
|---------|------------------|----------------|
| `member` | `profiles.rating_score` | `reviewee_persona = 'member'` (C2C + B2C buyer-side) |
| `merchant` | `merchant_shops.rating_score` | `reviewee_persona = 'merchant'` (B2C seller-side) |

`reviewee_persona` on insert (order context, **not** `profiles.role`):

| Order type | `reviewee_persona` |
|------------|-------------------|
| `member_orders` (C2C) | always `member` |
| `merchant_orders`, reviewee = merchant | `merchant` |
| `merchant_orders`, reviewee = buyer | `member` |

Only **`is_public = true`** reviews appear on the public list (double-blind reveal unchanged).

### Server actions

| Action | File | Notes |
|--------|------|-------|
| `getPublicProfileReviews({ profileId, persona, sort, page, pageSize })` | `app/actions/reviews.ts` | Calls `search_public_profile_reviews`; CI-safe when env unset |
| `submitTransactionReview` | `app/actions/reviews.ts` | Now `revalidatePath(/profile/{revieweeId}/rating)` on success |

### UI wired (baseline)

| File | Change |
|------|--------|
| `app/profile/[id]/rating/page.tsx` | Mock removed; `usePublicProfileReviews`; `?persona=member\|merchant` |
| `app/lib/hooks/usePublicProfileReviews.ts` | Fetch + pagination + sort |
| `app/lib/reviews/types.ts` | `PublicProfileReviewItem`, `ReviewPersona`, etc. |
| `app/profile/user/(dashboard)/page.tsx` | 「查看更多評價」→ `useCurrentUserId()` + `/profile/{profiles.id}/rating?persona=member` |
| `app/profile/merchant/(dashboard)/page.tsx` | Link → `?persona=merchant` (mock id — pending) |
| `app/lib/hooks/useCurrentUserId.ts` | Used by user dashboard rating CTA |

### Route contract

```
/profile/{profiles.id UUID}/rating?persona=member|merchant
```

- Default `persona=member` when query omitted
- Invalid / non-UUID `id` → inline not-found UI
- Guest can read (RPC granted to `anon`)

---

## Data flow (reference)

```
/profile/[uuid]/rating?persona=member
  → usePublicProfileReviews({ profileId, persona, sort, pageSize })
  → getPublicProfileReviews()
  → search_public_profile_reviews RPC
  → transaction_reviews (is_public, reviewee_persona)
  → JOIN profiles (reviewer display_name, avatar_path)
  → header: aggregate_rating + public_review_count

C2C complete → both rate → reveal
  → profiles.rating_score updates (member persona only)
  → merchant_shops.rating_score unchanged

B2C complete → buyer rates merchant → reveal
  → merchant_shops.rating_score updates
  → profiles.rating_score unchanged (unless buyer also has member reviews)
```

---

## Partner backlog

### P0 — Verify wired flows

- [ ] Apply / confirm migration `20260706150000` on target env (already pushed to linked remote)
- [ ] C2C: both parties submit review → guest opens `/profile/{uuid}/rating?persona=member` → both public rows visible
- [ ] C2C reveal updates `profiles.rating_score` only; `merchant_shops.rating_score` unchanged for dual-identity user
- [ ] B2C: buyer rates merchant → `?persona=merchant` shows review; `merchant_shops.rating_score` updates
- [ ] Sort (date / rating) and pagination (5 mobile / 10 desktop) refetch correctly
- [ ] `認證商戶` badge when `reviewer_persona = merchant` (not order-type `商家交易`)
- [ ] Reviewer avatar + display name follow `reviewer_persona` from RPC (B2C merchant reviewer → `merchant_shops`; else `profiles`)
- [ ] Reviewer link → `/profile/{uuid}?persona=member|merchant`
- [ ] Logged-in user: `/profile/user` → **查看更多評價** → lands on `/profile/{own-uuid}/rating?persona=member` with DB data

- [ ] Empty state: 「暫無公開評價紀錄」 (not 404)

### P1 — Wire remaining mock touchpoints

- [x] **User dashboard** — `useCurrentUserId()` → real `profiles.id` on rating link (`app/profile/user/(dashboard)/page.tsx`)
- [ ] **Merchant dashboard** — same for merchant hero rating link (`mockMerchant.id` → session UUID)
- [ ] **`app/profile/[id]/page.tsx`** — replace `MOCK_MEMBER_REVIEWS` preview strip (3 latest) with `getPublicProfileReviews` page 1 / limit 3

### P2 — Polish (partner-owned)

- [ ] Persona tab or label on public profile when user has both member + merchant shop (optional UX)
- [ ] Loading skeleton styling pass on rating page
- [ ] Confirm `next.config` allows Supabase storage avatar host for reviewer images

### P3 — Out of scope (this PR)

- Merchant order list + B2C review CTA from merchant trading UI
- Editing / deleting submitted reviews
- Showing non-public (pending reveal) reviews to counterparty on profile

---

## Hook quick reference

```tsx
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";

const profileId = useCurrentUserId();
// User dashboard CTA:
// profileId && `/profile/${profileId}/rating?persona=member`
```

```tsx
import { usePublicProfileReviews } from "@/app/lib/hooks/usePublicProfileReviews";

const {
  reviews,
  aggregateRating,
  publicReviewCount,
  totalPages,
  page,
  isLoading,
  error,
  notFound,
  setPage,
} = usePublicProfileReviews({
  profileId: "<profiles.id uuid>",
  persona: "merchant",
  sort: "date-desc",
  pageSize: 10,
});
```

```ts
import { getPublicProfileReviews } from "@/app/actions/reviews";

const result = await getPublicProfileReviews({
  profileId,
  persona: "member",
  sort: "rating-desc",
  page: 1,
  pageSize: 3, // e.g. profile preview strip
});
```

---

## SQL smoke test

```sql
-- Public member reviews for a profile
SELECT * FROM search_public_profile_reviews(
  '<profiles-uuid>'::uuid,
  'member'::review_persona,
  'date-desc',
  1,
  10
);

-- Verify persona split on scores
SELECT p.id, p.rating_score AS member_score, ms.rating_score AS merchant_score
FROM profiles p
LEFT JOIN merchant_shops ms ON ms.merchant_id = p.id
WHERE p.id = '<profiles-uuid>';
```

---

## Docs index

| Doc | Audience |
|-----|----------|
| [frontend.md](./frontend.md) | UI file map, acceptance checklist |
| [../transaction-reviews/backend.md](../transaction-reviews/backend.md) | RPC contracts, submit flow, migrations |
| [INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md) | Dashboard row |

---

## Smoke test commands

```bash
bun run dev
# Logged-in member: /profile/user → 查看更多評價 → /profile/{own-uuid}/rating?persona=member
# Guest: /profile/{any-uuid}/rating?persona=member
# Merchant view: ?persona=merchant
```

```bash
bunx tsc --noEmit
bun run lint
bun run build:ci
```
