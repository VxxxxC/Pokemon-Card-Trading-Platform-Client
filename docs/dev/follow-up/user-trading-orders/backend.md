# User Trading Orders — Backend Handoff

## Status

- **Backend:** ✅ Ready (list + **detail** + **cancel/complete** order actions + `hasReviewedByMe`)
- **Frontend:** 🟡 Partial — list + order row actions + **P2P order detail** + review modal wired; overview mock strip + profile review display still pending
- **Partner:** Drop overview mock when stable, profile review display — see [transaction-reviews](../transaction-reviews/)

## Changelog

### 2026-07-07 (trading list perf)

| Change | Detail |
|--------|--------|
| **SSR bootstrap** | `UserTradingPageData` calls `searchUserTradingOrders` on server; `useUserTrading` `initialData` |
| **Perf logging** | `[trading:perf]` in `searchUserTradingOrders` — `rpcMs`, `totalMs`, `needsAction` |
| **Constants** | `lib/member-order/constants.ts` — page sizes, tab URL mapping |

### 2026-07-07 (buyer-only complete)

| Change | Detail |
|--------|--------|
| **Migration `20260707130000`** | `rpc_complete_member_order` — only `buyer_id = p_user_id`; seller complete path removed from `fn_enforce_member_order_transitions` |
| **RPC error** | Non-buyer or invalid state → `操作失敗：僅買家可確認完成交易，或訂單狀態不合法。` |
| **Frontend** | `MemberOrderCompleteConfirmDialog` — buyer handover checklist + legal disclaimer before RPC (see [frontend.md](./frontend.md)) |

### 2026-07-05 (order detail)

| Change | Detail |
|--------|--------|
| **`getMemberOrderDetail`** | Single-order read by UUID — joins `listings`, `product_catalog`, buyer/seller `profiles`; returns `MemberOrderDetail` |
| **`MemberOrderDetail`** | Extends `UserTradingOrder` with `listingId`, `listingImageUrls`, `canCancel` (seller + `pending` only) |
| **Revalidate paths** | `cancelMemberOrder` / `completeMemberOrder` also revalidate `/profile/user/orderDetail/[id]` |

### 2026-07-05

| Change | Detail |
|--------|--------|
| **Migration `20260705120000`** | `search_user_trading_orders` — paginated list + fuzzy search + filter facet counts + `has_reviewed_by_me` in one RPC |
| **`searchUserTradingOrders`** | Primary list action; returns `data`, `meta`, `filters` |
| **`getUserTradingOrders`** | Thin wrapper — page 1, `pageSize` 50 (backward compat for other callers) |

### 2026-07-05 (frontend layout)

| Change | Detail |
|--------|--------|
| **Frontend row layout** | `orderNumber` as primary list headline (`#…`); see [frontend.md](./frontend.md) |

### 2026-07-04

| Change | Detail |
|--------|--------|
| **Migration `20260704250000`** | `member_orders.order_number` + `merchant_orders.order_number` (UNIQUE + indexes); RLS `member_orders_participant_read`; `rpc_accept_offer` auto-generates `ORD-2026-XXXXXX` on accept |
| **`getUserTradingOrders`** | Persona / tab status / fuzzy search + **`hasReviewedByMe`** via `rpc_get_user_reviewed_member_order_ids`; returns **`createdAt`** from `member_orders.created_at` |
| **Migration `20260704210000_order_actions_rpc`** | `fn_enforce_member_order_transitions`; `rpc_cancel_member_order`, `rpc_complete_member_order` (superseded for complete by **`20260707130000`** — buyer-only) |
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
| `supabase/migrations/20260705120000_search_user_trading_orders.sql` | Paginated search RPC + facet counts |
| `app/actions/orders.ts` | **`searchUserTradingOrders`**, `getUserTradingOrders` (wrapper), **`getMemberOrderDetail`**, **`cancelMemberOrder`**, **`completeMemberOrder`** |
| `lib/member-order/constants.ts` | Page sizes, persona/status options, URL tab mapping |
| `lib/member-order/perf-log.ts` | Server perf instrumentation |
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

## Server action: `searchUserTradingOrders` (primary)

```ts
import {
  searchUserTradingOrders,
  type GetUserTradingOrdersInput,
  type SearchUserTradingOrdersResult,
  type UserTradingOrder,
  type TradingOrdersPaginationMeta,
  type TradingOrdersFilterCounts,
} from "@/app/actions/orders";
```

### Input

```ts
type GetUserTradingOrdersInput = {
  persona: "all" | "buy" | "sell";
  tabStatus: "all" | "pending" | "completed" | "cancelled";
  searchQuery?: string;
  page?: number;      // default 1
  pageSize?: number;  // default 8, max 50
};
```

| Param | Filter logic |
|-------|----------------|
| `persona: "buy"` | `buyer_id = auth.uid()` |
| `persona: "sell"` | `seller_id = auth.uid()` |
| `persona: "all"` | `buyer_id = uid OR seller_id = uid` |
| `tabStatus: "pending"` | `status IN ('pending', 'meetup_arranged', 'in_custody', 'grading')` |
| `tabStatus: "completed"` | `status = 'completed'` |
| `tabStatus: "cancelled"` | `status = 'cancelled'` |
| `tabStatus: "all"` | no status filter |
| `searchQuery` | `ilike` on `order_number`, catalog (`name_*`, `card_number`, `set_code`, `display_id`), counterparty `display_name` / `username` |
| `page` / `pageSize` | Server-side `LIMIT` / `OFFSET`; meta on every row |

Auth: RPC uses `auth.uid()` inside SQL (`SECURITY INVOKER` + RLS).

### Success response

```ts
{
  success: true,
  data: UserTradingOrder[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
  };
  filters: {
    persona: { all: number; buy: number; sell: number };
    status: { all: number; pending: number; completed: number; cancelled: number };
    needsAction: number;
  };
}
```

Facet counts respect `searchQuery` but cross-filter the other dimension (persona counts honor active `tabStatus`; status counts honor active `persona`).

### RPC: `search_user_trading_orders`

```sql
SELECT * FROM search_user_trading_orders(
  p_persona := 'all',
  p_tab_status := 'pending',
  p_search_query := '皮卡丘',
  p_page := 1,
  p_page_size := 8
);
```

Returns order rows + pagination columns + `count_*` facet columns (repeated per row, marketplace pattern).

`has_reviewed_by_me` computed in SQL via `transaction_reviews` — no second RPC call.

## Server action: `getMemberOrderDetail`

```ts
import {
  getMemberOrderDetail,
  type MemberOrderDetail,
  type GetMemberOrderDetailResult,
} from "@/app/actions/orders";
```

### Input

| Param | Type | Notes |
|-------|------|-------|
| `orderId` | `string` | `member_orders.id` (UUID from list row / chat) |

Auth: participant-only — query filtered by RLS (`member_orders_participant_read`); action also rejects rows where `buyer_id` / `seller_id` ≠ `auth.uid()`.

### Success response

```ts
{ success: true, data: MemberOrderDetail }
```

`MemberOrderDetail` = `UserTradingOrder` plus:

| Field | Source |
|-------|--------|
| `listingId` | `member_orders.listing_id` |
| `listingImageUrls` | Parsed from `listings.images` JSONB |
| `canCancel` | `true` when viewer is seller and `status === 'pending'` |

`hasReviewedByMe` resolved via `transaction_reviews` select (same semantics as list RPC).

### Error envelope

| Condition | `error` |
|-----------|---------|
| Empty `orderId` | `找不到此訂單` |
| Supabase env missing | `未登入` |
| Not authenticated | `請登入以查閱訂單` |
| Row not found / RLS | `找不到指定的交易訂單記錄` |
| Non-participant | `您沒有權限查閱此訂單` |
| Query error | `無法載入訂單` |

### Fulfillment mode signal (order-level)

Buyer auth opt-in is stored on the **offer**, then copied to the **order** on accept:

| Signal | Location | Notes |
|--------|----------|-------|
| `use_authentication` | `offers` | Set by **`rpc_make_offer(p_use_authentication)`** at buyer make-offer time |
| `use_authentication` | `member_orders` | Copied from offer in **`rpc_accept_offer`** |
| `use_authentication` | `listings` (joined) | Legacy listing flag — still on row; **list/detail fulfillment mode uses order-level flag** |
| `meetup_details` | `member_orders` | JSON — not yet surfaced in detail UI |
| `status` | `member_orders` | `pending` \| `meetup_arranged` \| `completed` \| `cancelled` |

`search_user_trading_orders` and `getMemberOrderDetail` expose **`order.useAuthentication`** from `member_orders.use_authentication`. `listing.useAuthentication` retained for reference only.

Detail UI branches: meetup (`MemberP2pOrder*`) vs auth escrow (`MemberAuthOrder*`) — see [frontend.md](./frontend.md).

## Server action: `getUserTradingOrders` (wrapper)

Backward-compatible helper for callers that only need a flat array (e.g. transaction-reviews docs). Delegates to `searchUserTradingOrders` with `page: 1`, `pageSize: 50`.

```ts
import {
  getUserTradingOrders,
  type GetUserTradingOrdersInput,
  type UserTradingOrder,
} from "@/app/actions/orders";
```

### Legacy input (no pagination params required)

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
| `useAuthentication` | **`member_orders.use_authentication`** — buyer opted into platform auth at offer time |
| `counterparty` | Opposite party's `profiles` (`displayName`, `username`, `id` for review) |
| `listing` | `grading_company`, `grading_score`, `use_authentication` (listing row; secondary) |
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
await completeMemberOrder(orderId); // buyer only — RPC validates
// { success: true } | { success: false, error: string }
```

| Action | RPC | Who | Revalidate |
|--------|-----|-----|------------|
| `cancelMemberOrder` | `rpc_cancel_member_order(p_order_id, p_user_id)` | Seller | `/marketplace`, `/profile/user/trading`, `/profile/user/orderDetail/[id]` |
| `completeMemberOrder` | `rpc_complete_member_order(p_order_id, p_user_id)` | **Buyer** | `/profile/user/trading`, `/profile/user/orderDetail/[id]` |

RPC side effects:

- **Cancel:** order → `cancelled`, listing → `active`, chat `SYSTEM_ORDER_CANCELLED` (`is_system_warning = true`, `member_order_id` set)
- **Complete:** order → `completed`, listing → `sold`, chat `SYSTEM_ORDER_COMPLETED` (`member_order_id` set, `is_system_warning = false`), reputation trigger fires

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
- `20260705120000_search_user_trading_orders.sql` (paginated list search)
- **`20260705130000_member_orders_offers_use_authentication.sql`** (offer + order auth flag; accept inherit; list RPC)
- **`20260705140000_rpc_make_offer_use_authentication.sql`** (buyer toggle at make-offer)
- **`20260705185000_rpc_complete_member_order_listing_sold.sql`** (complete → `listings.status = sold` + backfill)
- **`20260707130000_complete_member_order_buyer_only.sql`** (complete restricted to buyer; trigger guard updated)

**Chat inbox wiring (complete-order UI in chat):**

- `20260704300000_get_user_chat_inbox_member_order_id.sql` — inbox RPC + table select must expose `member_order_id`

**Optional / related:**

- `20260704260000_merchant_order_reputation_stats.sql`
- `20260704280000_rpc_submit_transaction_review.sql` — see [transaction-reviews/backend.md](../transaction-reviews/backend.md)

> **Note:** `rpc_send_chat_message` uses timestamp `20260704210500` (renamed from duplicate `20260704210000`; `order_actions_rpc` keeps `20260704210000`).

**Prerequisites:** `20260704150000`, `20260704230000`, `20260703180000`

## Known limitations

| Item | Detail |
|------|--------|
| **`in_custody` / `grading` enum** | Filtered in action + UI badges, but **not yet** in `member_order_state` enum (`pending`, `meetup_arranged`, `completed`, `cancelled` only). Add enum migration when full escrow state machine ships. |
| **`order_number` in types** | `types/supabase.ts` may lack `order_number` until CLI regen — action uses extended query row type. |
| **Auth escrow status steps** | `MemberAuthOrderTimeline` is UI baseline; DB still uses `pending` / `meetup_arranged` until dedicated auth statuses exist. |
| **Modify offer + auth** | `rpc_modify_offer` does not change `use_authentication` — buyer must make a new offer to change auth choice. |
| **Merchant orders** | `merchant_orders.order_number` column added; no list/detail action yet (`/profile/merchant/orderDetail/[id]` remains separate mock). |

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

Expect `order_number` like `ORD-2026-XXXXXX`, `status = 'pending'`, `use_authentication` matches buyer offer toggle.

### 1b. Auth opt-in smoke test

1. Buyer makes offer with **平台鑑定加購** on.
2. Seller accepts.
3. SQL:

```sql
SELECT o.use_authentication AS offer_auth, mo.use_authentication AS order_auth
FROM offers o
JOIN member_orders mo ON mo.listing_id = o.listing_id AND mo.buyer_id = o.buyer_id
WHERE o.id = '<offer_uuid>';
```

Expect both `true`. Detail page shows `MemberAuthOrderTimeline` / `MemberAuthOrderInvoice`.

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

### 2b. Order detail action

```ts
const detail = await getMemberOrderDetail("<member_orders.uuid>");
// detail.success === true
// detail.data.persona, .finalPrice, .status, .useAuthentication, .listing.useAuthentication
// detail.data.canCancel === true only for seller + pending
```

Open **`/profile/user/orderDetail/<uuid>`** as buyer or seller — expect 404-style message for non-participants.

### 3. Complete → chat system message

1. Log in as **buyer** → call `completeMemberOrder(orderId)` from trading page or order detail (after UI confirm dialog).
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
