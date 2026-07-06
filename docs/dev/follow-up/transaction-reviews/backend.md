# Transaction Reviews — Backend Handoff

## Status

- **Backend:** ✅ Ready (`rpc_submit_transaction_review` **double-blind**, `rpc_get_user_reviewed_member_order_ids`, reputation triggers)
- **Frontend:** ✅ Wired on `/profile/user/trading` (`ReviewModal` + dual-track triggers)
- **Partner:** Profile page review display, chat `SYSTEM_ORDER_COMPLETED` review nudge, regen `types/supabase.ts` after migrations

## Changelog (2026-07-06)

| Change | Detail |
|--------|--------|
| **`20260706150000`** | Dual-persona rating split — `reviewee_persona` from order context; separate `profiles` / `merchant_shops` `rating_score`; `search_public_profile_reviews` RPC |
| **`getPublicProfileReviews`** | Server action — paginated public reviews by `profiles.id` + `persona` |

## Changelog (2026-07-04)

| Change | Detail |
|--------|--------|
| **`rpc_submit_transaction_review`** | SECURITY DEFINER atomic submit — validates participant, completed order, duplicate; inserts with **`is_public = false`**; reveals both reviews when buyer + seller each submitted |
| **Double-blind** | `fn_try_reveal_order_reviews` flips `is_public = true` on both rows; `rating_score` only counts public reviews |
| **`rpc_get_user_reviewed_member_order_ids`** | Batch lookup for `hasReviewedByMe` on trading list |
| **`submitTransactionReview`** | Server action in `app/actions/reviews.ts` — calls RPC with `auth.getUser()` |
| **`20260704290000`** | **Double-blind** — `fn_try_reveal_order_reviews`; insert `is_public = false`; mutual reveal; drops leaky `Allow public read reviews` policy |
| **`20260704280000`** | Review submit + reviewed-order lookup RPCs |
| **`20260704270000`** | RLS + unique indexes + `fn_refresh_profile_rating_on_review` (supplements legacy policies on remote) |
| **`20260704260000`** | `fn_aggregate_user_reputation_stats` on `member_orders` + `merchant_orders` → `profiles.completed_trades_count` / `cancelled_trades_count` |

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260704290000_transaction_reviews_double_blind.sql` | **Current** — double-blind reveal + RPC upgrade + rating trigger fix |
| `supabase/migrations/20260706150000_profile_reviews_persona_split.sql` | Persona-split ratings + `search_public_profile_reviews` |
| `supabase/migrations/20260704280000_rpc_submit_transaction_review.sql` | Initial review RPCs |
| `supabase/migrations/20260704270000_transaction_reviews_rls.sql` | RLS grants, read policies, rating refresh trigger |
| `supabase/migrations/20260704260000_merchant_order_reputation_stats.sql` | Reputation stats on order status change (C2C + B2C) |
| `app/actions/reviews.ts` | `submitTransactionReview` → RPC; returns `{ revealed }` |
| `app/actions/orders.ts` | `getUserTradingOrders` — `hasReviewedByMe` via `rpc_get_user_reviewed_member_order_ids` |

## RPC: `rpc_submit_transaction_review`

```sql
rpc_submit_transaction_review(
  p_order_id UUID,
  p_reviewee_id UUID,
  p_rating INTEGER,        -- 1..5
  p_comment TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid()
) → JSONB { success, review_id, revealed }
```

`revealed: true` when this submission completed the pair (both parties rated) and both reviews are now public.

### Double-blind rules

| State | Who can see what |
|-------|------------------|
| Only you rated | You see your own review; counterparty cannot see yours |
| Both rated | Both reviews `is_public = true`; both parties + public profile readers can see |
| `profiles.rating_score` | Averages **only** `is_public = true` reviews |

### Validation (raises → action returns `error.message`)

| Check | Error (zh) |
|-------|------------|
| `p_user_id <> auth.uid()` | 請先登入後再提交評價 |
| Self-review | 無法評價自己 |
| Rating out of range | 請選擇 1 至 5 星評分 |
| Comment > 200 chars | 留言不可超過 200 字 |
| Order not found | 找不到此訂單 |
| Order not completed | 僅能對已完成的交易提交評價 |
| Not participant | 您非此筆交易的關係人 |
| Wrong reviewee | 被評價對象與此訂單不符 |
| Duplicate review | 您已評價過此筆交易 |
| Reviewee profile missing | 找不到被評價用戶 |

### Order types

| Table | Completed state | Counterparty field |
|-------|-----------------|-------------------|
| `member_orders` | `status = 'completed'` | `seller_id` / `buyer_id` |
| `merchant_orders` | `escrow_status = 'completed_and_transferred'` | `merchant_id` / `buyer_id` |

`reviewee_persona` derived from **order context** (not `profiles.role`):

| Order | Persona |
|-------|---------|
| `member_orders` (C2C) | always `member` |
| `merchant_orders`, reviewee = merchant | `merchant` |
| `merchant_orders`, reviewee = buyer | `member` |

## RPC: `fn_try_reveal_order_reviews` (internal)

Called by `rpc_submit_transaction_review` after each insert. When **both** buyer and seller have submitted one review each for the same order:

1. `UPDATE transaction_reviews SET is_public = true` for that order
2. `fn_refresh_profile_rating_on_review` fires on `UPDATE OF is_public` → recalculates `profiles.rating_score`

## RPC: `rpc_get_user_reviewed_member_order_ids`

```sql
rpc_get_user_reviewed_member_order_ids(p_order_ids UUID[]) → SETOF UUID
```

Returns `member_order_id` values where `reviewer_id = auth.uid()`.

## RPC: `search_public_profile_reviews`

```sql
search_public_profile_reviews(
  p_profile_id UUID,
  p_persona review_persona,   -- 'member' | 'merchant'
  p_sort TEXT DEFAULT 'date-desc',
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 10
) → TABLE (review rows + aggregate_rating + pagination)
```

- `SECURITY DEFINER`; `GRANT EXECUTE TO anon, authenticated`
- Only `is_public = true` reviews for `reviewee_id = p_profile_id` and matching `reviewee_persona`
- Member aggregate from `profiles.rating_score`; merchant from `merchant_shops.rating_score`

## Server action: `getPublicProfileReviews`

```ts
import { getPublicProfileReviews } from "@/app/actions/reviews";

const result = await getPublicProfileReviews({
  profileId: string,   // profiles.id UUID
  persona: "member" | "merchant",
  sort: "date-desc" | "date-asc" | "rating-desc" | "rating-asc",
  page: number,
  pageSize: number,
});
```

## Server action: `submitTransactionReview`

```ts
import { submitTransactionReview } from "@/app/actions/reviews";

const result = await submitTransactionReview({
  orderId: string,      // member_orders.id or merchant_orders.id
  revieweeId: string,   // counterparty profiles.id
  rating: number,       // 1..5
  comment?: string,     // max 200 chars
});
// { success: true, revealed: boolean } | { success: false, error: string }
```

On success: `revalidatePath("/profile/user/trading")`, `revalidatePath("/profile/user/{revieweeId}")`.

## `UserTradingOrder.hasReviewedByMe`

Added to `getUserTradingOrders` response — `true` when current user already reviewed that `member_order_id`.

## Env / migrations

```bash
# If db push blocked by duplicate 20260704210000 timestamp, apply individually:
bunx supabase db query --linked --yes -f supabase/migrations/20260704260000_merchant_order_reputation_stats.sql
bunx supabase db query --linked --yes -f supabase/migrations/20260704270000_transaction_reviews_rls.sql
bunx supabase db query --linked --yes -f supabase/migrations/20260704280000_rpc_submit_transaction_review.sql
bunx supabase db query --linked --yes -f supabase/migrations/20260704290000_transaction_reviews_double_blind.sql
bunx supabase db query --linked --yes -f supabase/migrations/20260706150000_profile_reviews_persona_split.sql
```

**Required for reviews:** `20260704280000` + **`20260704290000`** (double-blind). `20260704270000` recommended for RLS alignment.

**Prerequisites:** `20260704210000_order_actions_rpc.sql` (`rpc_complete_member_order` creates completed orders to review).

## Known limitations

| Item | Detail |
|------|--------|
| **Legacy RLS policies** | Remote DB may have pre-existing `transaction_reviews` policies; `290000` drops `Allow public read reviews`. App uses RPC only — no direct table access. |
| **Merchant list** | `getUserTradingOrders` is member-only; B2C review RPC works but no merchant order list UI yet. |
| **Rating on profile** | `rating_score` updates **only** when reviews become `is_public` (mutual reveal or legacy public rows). `completed_trades_count` updates on order status — not retroactive. |
| **Pre-290000 rows** | Reviews inserted with `is_public = true` before double-blind migration remain public; no backfill. |
| **Types** | Regen `types/supabase.ts` to include RPC names after push. |

## How to verify (backend)

### 1. Complete order → submit review (double-blind)

1. Seller accepts offer → `member_orders.status = 'pending'`.
2. Either party calls `completeMemberOrder(orderId)`.
3. **Party A** submits review → `revealed: false`; SQL:

```sql
SELECT id, reviewer_id, reviewee_id, rating, is_public, member_order_id
FROM transaction_reviews
WHERE member_order_id = '<order-uuid>';
-- Expect 1 row, is_public = false
```

4. **Party B** submits review → `revealed: true`; same query shows **2 rows**, both `is_public = true`.

```sql
SELECT id, rating_score FROM profiles
WHERE id IN ('<buyer_id>', '<seller_id>');
-- rating_score reflects public reviews only
```

### 2. Duplicate guard

Submit same `orderId` twice → second call returns `您已評價過此筆交易`.

### 3. Reviewed IDs RPC

```sql
SELECT * FROM rpc_get_user_reviewed_member_order_ids(ARRAY['<order-uuid>']::uuid[]);
```

### 4. CI

```bash
bunx tsc --noEmit
bun run lint
bun run build:ci
```
