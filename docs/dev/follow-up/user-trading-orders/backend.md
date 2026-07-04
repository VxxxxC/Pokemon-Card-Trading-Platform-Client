# User Trading Orders — Backend Handoff

## Status

- **Backend:** ✅ Ready (list + **cancel/complete** order actions + `hasReviewedByMe`)
- **Frontend:** 🟡 Partial — list + order row actions + review modal wired; order detail still mock
- **Partner:** Order detail page, remove mock when stable, profile review display — see [transaction-reviews](../transaction-reviews/)

## Changelog (2026-07-04)

| Change | Detail |
|--------|--------|
| **Migration `20260704250000`** | `member_orders.order_number` + `merchant_orders.order_number` (UNIQUE + indexes); RLS `member_orders_participant_read`; `rpc_accept_offer` auto-generates `ORD-2026-XXXXXX` on accept |
| **`getUserTradingOrders`** | Persona / tab status / fuzzy search + **`hasReviewedByMe`** via `rpc_get_user_reviewed_member_order_ids`; returns **`createdAt`** from `member_orders.created_at` |
| **Migration `20260704210000_order_actions_rpc`** | `fn_enforce_member_order_transitions` (seller may complete); `rpc_cancel_member_order`, `rpc_complete_member_order` |
| **`cancelMemberOrder` / `completeMemberOrder`** | Server actions in `app/actions/orders.ts` |
| **Migration `20260704260000`** | `fn_aggregate_user_reputation_stats` on `member_orders` + `merchant_orders` → `profiles` trade counts |
| **Migration `20260704300000`** | `get_user_chat_inbox()` includes `member_order_id` on messages — enables chat `SYSTEM_ORDER_COMPLETED` card + review CTA |
| **`acceptOffer` payload** | RPC `order` row now includes `order_number` after migration (no action code change required) |

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260704250000_member_orders_order_number.sql` | Schema + RLS + `rpc_accept_offer` order number injection |
| `supabase/migrations/20260704210000_order_actions_rpc.sql` | Cancel/complete RPCs + order status trigger guard |
| `supabase/migrations/20260704260000_merchant_order_reputation_stats.sql` | Reputation aggregation triggers |
| `app/actions/orders.ts` | `getUserTradingOrders`, **`cancelMemberOrder`**, **`completeMemberOrder`** |
| `app/actions/chat.ts` | Inbox message select includes `member_order_id` (table fallback path) |
| `app/actions/offers.ts` | *(unchanged)* `acceptOffer` → `rpc_accept_offer` — benefits from migration |
| `supabase/migrations/20260704300000_get_user_chat_inbox_member_order_id.sql` | Inbox RPC returns `member_order_id` on `chat_messages` |
| `supabase/migrations/20260703180000_member_orders_trade_history_read.sql` | Prerequisite — completed orders public read (still applies) |

## DB schema

### `member_orders.order_number`

| Column | Type | Notes |
|--------|------|-------|
| `order_number` | `TEXT UNIQUE` | Human-facing ID, e.g. `ORD-2026-A1B2C3` |

### RLS (SELECT)

| Policy | Rule |
|--------|------|
| `member_orders_completed_read_authenticated` | Any authenticated user may read `status = 'completed'` |
| `member_orders_participant_read` | Buyer or seller may read **their own** orders (any status) |

Policies are OR-combined — participants see all their orders; others only see completed rows.

### `rpc_accept_offer` (updated)

On seller accept:

1. Validates pending offer + listing ownership (`listings.seller_id = p_seller_id`)
2. Sets offer `accepted`, listing `inactive`
3. Inserts `member_orders` with `status = 'pending'`, `expires_at = now() + 14 days`, **`order_number = 'ORD-2026-' || 6-char hash`**
4. Inserts `SYSTEM_OFFER_ACCEPTED` chat message with `member_order_id`

Returns:

```json
{
  "order": { "...member_orders row including order_number..." },
  "message_id": "<uuid>"
}
```

## Server action: `getUserTradingOrders`

```ts
import {
  getUserTradingOrders,
  type GetUserTradingOrdersInput,
  type UserTradingOrder,
} from "@/app/actions/orders";
```

### Input

```ts
type GetUserTradingOrdersInput = {
  persona: "all" | "buy" | "sell";
  tabStatus: "all" | "pending" | "completed" | "cancelled";
  searchQuery?: string;
};
```

| Param | Filter logic |
|-------|----------------|
| `persona: "buy"` | `buyer_id = auth.uid()` |
| `persona: "sell"` | `seller_id = auth.uid()` |
| `persona: "all"` | `buyer_id = uid OR seller_id = uid` |
| `tabStatus: "pending"` | `status IN ('pending', 'in_custody', 'grading')` |
| `tabStatus: "completed"` | `status = 'completed'` |
| `tabStatus: "cancelled"` | `status = 'cancelled'` |
| `tabStatus: "all"` | no status filter |
| `searchQuery` | `ilike` on `order_number` **OR** catalog fields (`name_ja`, `name_en`, `name_zh`, `card_number`, `display_id`) via embedded `listings.product_catalog` |

Auth: always uses `supabase.auth.getUser()` — never trusts client-supplied user id.

### Success response

```ts
{
  success: true,
  data: UserTradingOrder[];
}
```

### `UserTradingOrder` shape

| Field | Source |
|-------|--------|
| `id` | `member_orders.id` (UUID — use for detail routes) |
| `orderNumber` | `member_orders.order_number` |
| `buyerId` / `sellerId` | order row |
| `finalPrice` | `member_orders.final_price` |
| `status` | `member_orders.status` |
| `createdAt` | `member_orders.created_at` (ISO string; frontend formats as locale date + 24h time) |
| `expiresAt` | `member_orders.expires_at` |
| `persona` | `"buy"` if current user is buyer, else `"sell"` |
| `hasReviewedByMe` | `true` if current user already submitted `transaction_reviews` for this order |
| `counterparty` | Opposite party's `profiles` (`displayName`, `username`, `id` for review) |
| `listing` | `grading_company`, `grading_score`, `use_authentication` |
| `product` | Catalog name, card number, set, display id, resolved image URL |

### Error envelope

```ts
{ success: false, error: string }
```

| Condition | `error` |
|-----------|---------|
| Supabase env missing (SSR guard) | `未登入` |
| Not authenticated | `請登入以查閱訂單` |
| Auth failure | `無法驗證登入狀態` |
| Query error | `無法載入訂單` |
| Unexpected | `無法連線至訂單服務` |

## Server actions: `cancelMemberOrder` / `completeMemberOrder`

```ts
import { cancelMemberOrder, completeMemberOrder } from "@/app/actions/orders";

await cancelMemberOrder(orderId);   // seller only — RPC validates
await completeMemberOrder(orderId); // buyer or seller
// { success: true } | { success: false, error: string }
```

| Action | RPC | Revalidate |
|--------|-----|------------|
| `cancelMemberOrder` | `rpc_cancel_member_order(p_order_id, p_user_id)` | `/marketplace`, `/profile/user/trading` |
| `completeMemberOrder` | `rpc_complete_member_order(p_order_id, p_user_id)` | `/profile/user/trading` |

RPC side effects:

- **Cancel:** order → `cancelled`, listing → `active`, chat `SYSTEM_ORDER_CANCELLED` (`is_system_warning = true`, `member_order_id` set)
- **Complete:** order → `completed`, chat `SYSTEM_ORDER_COMPLETED` (`member_order_id` set, `is_system_warning = false`), reputation trigger fires

Chat message on complete (from `rpc_complete_member_order`):

```sql
INSERT INTO chat_messages (room_id, sender_id, content, member_order_id, is_system_warning)
VALUES (v_room_id, p_user_id, 'SYSTEM_ORDER_COMPLETED', p_order_id, false);
```

Frontend maps this to `type: "system_order_completed"` with `orderData.orderId` — see [transaction-reviews/frontend.md](../transaction-reviews/frontend.md).

## Env / migrations

```bash
bunx supabase db push
# Regenerate types after push:
bunx supabase gen types typescript --local > types/supabase.ts
```

**Required migrations:**

- `20260704250000_member_orders_order_number.sql`
- `20260704210000_order_actions_rpc.sql` (cancel/complete)

**Chat inbox wiring (complete-order UI in chat):**

- `20260704300000_get_user_chat_inbox_member_order_id.sql` — inbox RPC + table select must expose `member_order_id`

**Optional / related:**

- `20260704260000_merchant_order_reputation_stats.sql`
- `20260704280000_rpc_submit_transaction_review.sql` — see [transaction-reviews/backend.md](../transaction-reviews/backend.md)

> **Note:** Two files share timestamp `20260704210000` (`order_actions_rpc` vs `rpc_send_chat_message`). If `db push` fails, apply via `bunx supabase db query --linked -f <file>`.

**Prerequisites:** `20260704150000`, `20260704230000`, `20260703180000`

## Known limitations

| Item | Detail |
|------|--------|
| **`in_custody` / `grading` enum** | Filtered in action + UI badges, but **not yet** in `member_order_state` enum (`pending`, `meetup_arranged`, `completed`, `cancelled` only). Add enum migration when escrow flow ships. |
| **`order_number` in types** | `types/supabase.ts` may lack `order_number` until CLI regen — action uses extended query row type. |
| **No order detail action** | List only; `app/profile/user/orderDetail/[id]/page.tsx` still mock. |
| **Merchant orders** | `merchant_orders.order_number` column added; no list action yet. |

## How to verify (backend)

### 1. Migration + accept flow

```bash
bunx supabase db push
```

1. Log in as **buyer** → make offer on a listing.
2. Log in as **seller** → accept offer in chat.
3. SQL check:

```sql
SELECT id, order_number, status, final_price, buyer_id, seller_id
FROM member_orders
ORDER BY created_at DESC
LIMIT 5;
```

Expect `order_number` like `ORD-2026-XXXXXX`, `status = 'pending'`.

### 2. Server action (logged-in session)

From a temporary script or browser console via a test route:

```ts
const result = await getUserTradingOrders({
  persona: "all",
  tabStatus: "pending",
});
// result.success === true
// result.data[0].orderNumber, .product.cardName, .counterparty.displayName, .createdAt
```

### 3. Complete → chat system message

1. Call `completeMemberOrder(orderId)` from trading page or chat.
2. SQL check:

```sql
SELECT id, content, member_order_id, room_id
FROM chat_messages
WHERE content = 'SYSTEM_ORDER_COMPLETED'
ORDER BY created_at DESC
LIMIT 3;
```

Expect `member_order_id` = completed order UUID. Reopen chat — completion card renders (not raw `SYSTEM_ORDER_COMPLETED` text).

### 4. Search

```ts
await getUserTradingOrders({
  persona: "all",
  tabStatus: "all",
  searchQuery: "ORD-2026",
});
await getUserTradingOrders({
  persona: "all",
  tabStatus: "all",
  searchQuery: "皮卡丘",
});
```

### 5. RLS smoke test

As participant — should return own pending orders:

```sql
-- as authenticated buyer/seller via app; direct SQL needs auth.uid()
SELECT count(*) FROM member_orders WHERE status = 'pending';
```

### 6. CI

```bash
bunx tsc --noEmit
bun run lint
bun run build:ci
```
