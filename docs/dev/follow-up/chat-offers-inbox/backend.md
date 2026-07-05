# Chat & Offers Inbox — Backend Handoff

## Status

- **Backend:** ✅ Ready (`makeOffer` · `modifyOffer` · `acceptOffer` · **`rejectOffer`** · `getOfferCardContext` · `getUserChatInbox` · `sendMessage`; inbox **`member_order_id`**; review helpers used by chat UI)
- **Frontend:** 🟡 Partial — offer card RPCs + DB inbox + text send + **Realtime Scheme A** + **completion card + review CTA** + **long-thread perf** wired; polish / checkout-after-accept pending
- **Partner:** Apply migrations `20260704170000`–**`20260705140000`**; verify inbox + send + accept/reject + auth opt-in + completion messages after push (see **Migrations** below)

## Changelog (2026-07-05, P2P platform authentication opt-in)

| Change | Detail |
|--------|--------|
| **`offers.use_authentication`** | Migration **`20260705130000`** — buyer opt-in at offer time (default `false`) |
| **`member_orders.use_authentication`** | Same migration — copied from offer on **`rpc_accept_offer`** |
| **`rpc_make_offer(p_use_authentication)`** | Migration **`20260705140000`** — persists flag on INSERT into `offers` |
| **`makeOffer(listingId, price, useAuthentication?)`** | Server action passes `p_use_authentication` to RPC |
| **`getOfferCardContext`** | Selects `offers.use_authentication` → `OfferCardContext.offer.use_authentication` |
| **`search_user_trading_orders`** | Migration **`20260705130000`** — fulfillment mode from **`member_orders.use_authentication`** (not listing) |

## Changelog (2026-07-04, completion + inbox order id)

| Change | Detail |
|--------|--------|
| **`get_user_chat_inbox()` `member_order_id`** | Migration **`20260704300000`** — messages JSON includes `member_order_id` for `SYSTEM_OFFER_ACCEPTED` / `SYSTEM_ORDER_COMPLETED` UI wiring |
| **`resolveChatCompletionOrderId`** | `app/actions/reviews.ts` — server fallback when chat row lacks `member_order_id` (message id → room completion rows → accepted-offer row → latest completed order with counterparty) |
| **`rpc_get_user_reviewed_member_order_ids`** | Batched from chat via `useRoomReviewedOrderIds` (one RPC per room) — see [transaction-reviews/backend.md](../transaction-reviews/backend.md) |
| **Order complete chat event** | `rpc_complete_member_order` inserts `SYSTEM_ORDER_COMPLETED` with `member_order_id` — see [user-trading-orders/backend.md](../user-trading-orders/backend.md) |

## Changelog (2026-07-04, Scheme B + Scheme A events)

| Change | Detail |
|--------|--------|
| **`offers.listing_id`** | Listing binding moved from `chat_rooms` → `offers` (user-centric rooms) |
| **`chat_rooms`** | One room per buyer+seller pair; `listing_id` column removed |
| **`rpc_make_offer`** | Upsert room by `(buyer_id, seller_id)`; write `listing_id` on `offers` |
| **`rpc_accept_offer`** | Read `listing_id` from `offers` (not `chat_rooms`); fixed again in `20260704230000` |
| **`rpc_reject_offer`** | Seller reject → `offers.status = rejected` + `SYSTEM_OFFER_REJECTED` chat message |
| **`rejectOffer`** | Server action → `rpc_reject_offer(p_offer_id, p_seller_id)` |
| **`rpc_modify_offer`** | Buyer one-time price edit; `modified_count`; new `chat_messages` row |
| **`modified_count`** | `offers.modified_count INT DEFAULT 0 NOT NULL` |
| **Chat RLS** | `chat_rooms` / `chat_messages` / `offers` party-scoped policies + `GRANT` |
| **`get_user_chat_inbox()`** | `SECURITY DEFINER` RPC — avoids `permission denied` on direct table reads |
| **`getUserChatInbox`** | Server action calls RPC first, table fallback |
| **`sendMessage`** | `rpc_send_chat_message` — plain-text send (replaces direct INSERT; fixes nested RLS) |
| **`is_chat_room_member()`** | `SECURITY DEFINER` helper; `chat_messages_party_insert` policy uses it |
| **`rpc_send_chat_message`** | Validates party + length; inserts `chat_messages`; returns `{ id, room_id, content, created_at }` |
| **Scheme A events** | `chat_messages` INSERT rows drive offer card sync (`SYSTEM_OFFER_*`, modify prefix) — consumed by client Realtime |
| **Realtime publication** | Migration `20260704240000` adds `chat_messages` to `supabase_realtime` |
| **Client send perf** | No API change — frontend uses `appendRoomMessage` / `finalizeOptimisticMessage` instead of `setChats` on each text send |
| **Client long-thread perf** | No API change — terminal offer cards skip `getOfferCardContext`; Realtime modify parses `修改了出價需求：HK$ …` locally; `appendRoomMessage` fast append |

---

## Architecture (Scheme B + Scheme A)

```
Buyer — make offer
  ExecutionSlideOver → makeOffer(listingId, price, useAuthentication?)
    → rpc_make_offer(p_use_authentication)
      → chat_rooms (find/create by buyer_id + seller_id)
      → offers (pending, listing_id, offer_price, use_authentication)
      → chat_messages (content + offer_id)
    ← { room, offer, message }

Buyer — modify offer (once)
  OfferCard → modifyOffer(offerId, newPrice)
    → rpc_modify_offer
      → offers.offer_price, modified_count += 1
      → chat_messages ("修改了出價需求：HK$ …", same offer_id)

Seller — accept
  OfferCard → acceptOffer(offerId)
    → rpc_accept_offer
      → offers.status = accepted
      → listings.status = inactive
      → member_orders (14-day TTL, use_authentication from offer)
      → chat_messages (SYSTEM_OFFER_ACCEPTED, offer_id, member_order_id)

Seller — reject
  OfferCard → rejectOffer(offerId)
    → rpc_reject_offer
      → offers.status = rejected
      → chat_messages (SYSTEM_OFFER_REJECTED, offer_id)

Scheme A — cross-device offer card sync (frontend Realtime on backend events)
  GlobalChatOverlay → useChatRoomRealtime (inbox-wide chat_messages INSERT)
    → append message to thread (idempotent by message.id)
    → decode content:
        SYSTEM_OFFER_ACCEPTED  → grey card (accepted) + member_order_id on row
        SYSTEM_OFFER_REJECTED  → grey card (rejected)
        "修改了出價需求："      → parse price from content → applyOfferPriceSync
                                   (fallback getOfferCardContext if parse fails)

Order complete (cross-flow — user-trading-orders)
  rpc_complete_member_order
    → member_orders.status = completed
    → chat_messages (SYSTEM_ORDER_COMPLETED, member_order_id)
    → frontend: SystemOrderCompletedMessage + review CTA (transaction-reviews)

Chat inbox load
  GlobalChatOverlay → getUserChatInbox()
    → get_user_chat_inbox() RPC  [preferred]
    ← { rooms, messages, offers }
    → assembleDbChatRooms() → merge with mock (RM-MOCK-*)

Party — send text message
  GlobalChatConsole → sendMessage(roomId, body)   [UUID rooms only; client fires async after optimistic UI]
    → rpc_send_chat_message(p_room_id, p_sender_id, p_content)
      → is_chat_room_member() membership check
      → INSERT chat_messages (is_system_warning = false)
    ← { id, room_id, content, created_at }
```

---

## Files (backend track)

| File | Purpose |
|------|---------|
| `app/actions/offers.ts` | `makeOffer`, `modifyOffer`, `acceptOffer`, **`rejectOffer`**, `getOfferCardContext` |
| `app/actions/chat.ts` | `getUserChatInbox`, `sendMessage` |
| `app/actions/reviews.ts` | **`getUserReviewedMemberOrderIds`**, **`resolveChatCompletionOrderId`** (chat completion card) |
| `app/lib/chat/constants.ts` | `isMockChatRoomId`, `isDbChatRoomId` (UUID room gate) |
| `app/lib/chat/mapDbChats.ts` | DB rows → Zustand `ChatRoom` / `Message`; `SYSTEM_OFFER_*` banners; **`SYSTEM_ORDER_COMPLETED`** card type |
| `app/lib/chat/mergeChatRooms.ts` | Mock + DB room merge |
| `app/lib/chat/offerCardImage.ts` | Listing image #1 → catalog fallback |
| `app/lib/chat/realtimeChatMessages.ts` | Realtime row mapping; **`parseModifyOfferPriceFromContent`** |
| `app/lib/chat/resolveMemberOrderId.ts` | Client-side order id collection from thread |
| `lib/supabase/client.ts` | Browser Supabase client (Realtime subscriptions) |
| `supabase/migrations/20260704130000_rpc_make_offer.sql` | Initial make-offer RPC |
| `supabase/migrations/20260704150000_rpc_accept_offer.sql` | Accept-offer RPC (superseded by `180000` / `230000`) |
| `supabase/migrations/20260704160000_rpc_make_offer_single_pending.sql` | Single active offer guard |
| `supabase/migrations/20260704170000_rpc_modify_offer.sql` | Modify-offer RPC + `modified_count` |
| `supabase/migrations/20260704180000_offers_listing_id_user_centric_rooms.sql` | Scheme B schema + RPC rewrites (idempotent backfill) |
| `supabase/migrations/20260704190000_chat_rooms_messages_rls.sql` | RLS + grants |
| `supabase/migrations/20260704190500_rpc_reject_offer.sql` | **`rpc_reject_offer`** |
| `supabase/migrations/20260704200000_get_user_chat_inbox_rpc.sql` | Inbox RPC + grant fix |
| `supabase/migrations/20260704210500_rpc_send_chat_message.sql` | `rpc_send_chat_message`, `is_chat_room_member`, INSERT policy fix |
| `supabase/migrations/20260704230000_rpc_accept_offer_fix_listing_id.sql` | **`rpc_accept_offer`** listing_id fix (post–Scheme B) |
| `supabase/migrations/20260704240000_chat_messages_realtime.sql` | Adds `chat_messages` to **`supabase_realtime`** publication |
| `supabase/migrations/20260704300000_get_user_chat_inbox_member_order_id.sql` | Inbox RPC + table select expose **`member_order_id`** on messages |
| `supabase/migrations/20260705130000_member_orders_offers_use_authentication.sql` | **`offers` / `member_orders.use_authentication`**; **`rpc_accept_offer`** inherit; list RPC update |
| `supabase/migrations/20260705140000_rpc_make_offer_use_authentication.sql` | **`rpc_make_offer(p_use_authentication)`** |

> **Note:** `20260704190000_rpc_reject_offer.sql` was renamed to **`20260704190500`** to avoid duplicate migration version with RLS migration.

### Related migrations (not owned by this packet)

| Migration | Purpose |
|-----------|---------|
| `20260704210000_order_actions_rpc.sql` | `rpc_complete_member_order` → `SYSTEM_ORDER_COMPLETED` |
| `20260704270000`–`20260704290000` | Transaction reviews RPCs used by chat review CTA |

---

## Migrations (required)

```bash
bunx supabase db push
# If push fails on already-applied migrations (e.g. 20260704180000 listing_id backfill):
# ensure 180000 is idempotent, then push remaining files through 20260704300000
bun run supabase:types   # if scripted; else bunx supabase gen types typescript
```

| Migration | Purpose |
|-----------|---------|
| `20260704170000` | `modified_count`, `rpc_modify_offer` |
| `20260704180000` | `offers.listing_id`, user-centric `chat_rooms`, RPC updates |
| `20260704190000` | Chat/offers RLS policies (initial `chat_messages_party_insert`) |
| `20260704190500` | **`rpc_reject_offer`** |
| `20260704200000` | `get_user_chat_inbox()` RPC + `REVOKE PUBLIC` grants |
| `20260704210500` | **`rpc_send_chat_message`** + `is_chat_room_member` — **required for text send** |
| `20260704230000` | **`rpc_accept_offer`** fix — use `offers.listing_id` (fixes `column r.listing_id does not exist`) |
| `20260704240000` | **`chat_messages`** in Realtime publication — required for live inbox |
| **`20260704300000`** | **`member_order_id`** on inbox messages — **required for completion card + review CTA on load** |
| **`20260705130000`** | **`use_authentication`** on offers + member_orders; accept RPC inherit |
| **`20260705140000`** | **`rpc_make_offer`** auth param — **required for buyer toggle** |

---

## Server actions

### `makeOffer(listingId, offerPrice, useAuthentication?)`

Third arg optional (default `false`). Maps to `p_use_authentication` on RPC.

Success: `{ success: true, data: { room, offer, message } }`

RPC content: `出價 HK$ ${price.toLocaleString()}`

Offer row includes `use_authentication` in returned `offer` JSON.

### `modifyOffer(offerId, newPrice)`

Success: `{ success: true, data: { offer, messageId } }`

RPC content: `修改了出價需求：HK$ ${newPrice.toLocaleString()}`

Rules: `pending` only; `modified_count < 1`; `auth.uid() = buyer_id`

### `acceptOffer(offerId)`

Success: `{ success: true, data: { order, messageId } }`

Side effects: listing `inactive`, `member_orders` insert, `revalidatePath("/marketplace")`

Requires migration **`20260704230000`** on DBs that dropped `chat_rooms.listing_id` but still run old accept RPC body.

### `rejectOffer(offerId)`

Success: `{ success: true, data: { offer, messageId } }`

- Auth: `supabase.auth.getUser()` → `p_seller_id = user.id`
- RPC: `rpc_reject_offer(p_offer_id, p_seller_id)`
- Errors: RPC `RAISE EXCEPTION` → `{ success: false, error: error.message }`
- Side effect: `chat_messages` row `SYSTEM_OFFER_REJECTED` (Scheme A event for Realtime)

### `getOfferCardContext(offerId)`

Success: `{ success: true, data: OfferCardContext }`

Joins: `offers` → `listings` (via `listing_id`) → `product_catalog`; `chat_rooms` for `seller_id`

Fields: `offer.use_authentication` included in `OfferCardContext.offer`

Image: `listings.images[0]` (Bunny CDN) → `product_catalog.image_url`

Used by `OfferCard` hydration (pending offers / cache miss) and Realtime modify-price **fallback** only.

### `getUserReviewedMemberOrderIds(orderIds[])`

Success: `{ success: true, data: string[] }` — order UUIDs the current user already reviewed.

- RPC: `rpc_get_user_reviewed_member_order_ids`
- Chat: **`useRoomReviewedOrderIds`** batches all order ids in the active room into **one** call
- See [transaction-reviews/backend.md](../transaction-reviews/backend.md)

### `resolveChatCompletionOrderId({ messageId, roomId, revieweeId })`

Success: `{ success: true, orderId: string | null }`

Resolution order:

1. `chat_messages.member_order_id` for `messageId` when `content = SYSTEM_ORDER_COMPLETED`
2. Latest `SYSTEM_ORDER_COMPLETED` in `roomId` with non-null `member_order_id`
3. Latest `SYSTEM_OFFER_ACCEPTED` in `roomId` with non-null `member_order_id`
4. Latest `member_orders` row `status = completed` between `auth.uid()` and `revieweeId`

Used when inbox load omitted `member_order_id` (pre-`20260704300000` rows or stale RPC).

### `getUserChatInbox()`

Success: `{ success: true, data: ChatRoom[] }`

- Guest / unconfigured Supabase → `{ success: true, data: [] }`
- Logged-in → RPC `get_user_chat_inbox()`; fallback to direct table queries
- Errors include Supabase message: `無法載入聊天室：…`

### `sendMessage(roomId, body)`

Success: `{ success: true, data: { id, roomId, content, createdAt } }`

- Trims `body`; rejects empty or `> 2000` chars (also enforced in RPC)
- Guest / unconfigured → `{ success: false, error }`
- Calls **`rpc_send_chat_message`** (not direct table insert)
- RPC validates `auth.uid() = p_sender_id` and room membership via `is_chat_room_member`
- Does **not** update `chat_rooms.updated_at` (no UPDATE grant on rooms)

**Client contract (unchanged):** Returns persisted row; frontend may receive the same `id` via Realtime before the action resolves — `finalizeOptimisticMessage` dedupes by `message.id`.

**Why RPC:** Direct `INSERT` into `chat_messages` failed with `new row violates row-level security policy` — nested RLS on `chat_rooms` inside the INSERT `WITH CHECK` subquery. Same `SECURITY DEFINER` pattern as offer RPCs.

---

## RPC: `rpc_reject_offer(p_offer_id, p_seller_id)`

```sql
SELECT public.rpc_reject_offer('<offer_uuid>'::uuid, auth.uid());
-- Returns JSONB:
-- { "offer": { ... }, "message_id": "<uuid>" }
```

- Validates seller owns listing via `offers.listing_id` → `listings.seller_id`
- `offers.status` must be `pending`
- Inserts `chat_messages.content = 'SYSTEM_OFFER_REJECTED'` with same `offer_id`
- `SECURITY DEFINER`; `GRANT EXECUTE` to `authenticated`, `service_role`

---

## RPC: `get_user_chat_inbox()`

```sql
SELECT public.get_user_chat_inbox();
-- Returns JSONB:
-- {
--   "rooms": [{ id, buyer_id, seller_id, buyer, seller, ... }],
--   "messages": [{ id, room_id, content, offer_id, member_order_id, is_system_warning, ... }],
--   "offers": [{ id, offer_price, status, modified_count, listings: { product_catalog } }]
-- }
```

- `member_order_id` on messages: migration **`20260704300000`** — required for `SYSTEM_ORDER_COMPLETED` / accept-hold review wiring without extra round-trips
- `SECURITY DEFINER` + `auth.uid()` filter
- `GRANT EXECUTE` to `authenticated`, `service_role`

---

## RPC: `rpc_send_chat_message(p_room_id, p_sender_id, p_content)`

```sql
SELECT public.rpc_send_chat_message(
  '<room_uuid>'::uuid,
  auth.uid(),
  '測試訊息'
);
-- Returns JSONB:
-- { "id", "room_id", "content", "created_at" }
```

- `SECURITY DEFINER` + `auth.uid() = p_sender_id`
- Membership via `is_chat_room_member(p_room_id, p_sender_id)`
- `GRANT EXECUTE` to `authenticated`, `service_role`

---

## Verify (backend)

### Inbox RPC (SQL editor, as logged-in user context)

```sql
SELECT public.get_user_chat_inbox();
```

### Reject offer (SQL editor, as listing seller)

```sql
SELECT public.rpc_reject_offer('<offer_uuid>'::uuid, auth.uid());
```

Re-load inbox — offer `status` should be `rejected`; message thread includes `SYSTEM_OFFER_REJECTED`.

### Accept offer (regression after Scheme B)

```sql
SELECT public.rpc_accept_offer('<offer_uuid>'::uuid, auth.uid());
```

Must **not** error with `column r.listing_id does not exist` when `20260704230000` is applied.

### Permissions smoke

```sql
-- As authenticated user who is buyer or seller in a room:
SELECT id FROM chat_rooms WHERE buyer_id = auth.uid() OR seller_id = auth.uid();
SELECT id FROM chat_messages cm
  JOIN chat_rooms cr ON cr.id = cm.room_id
  WHERE cr.buyer_id = auth.uid() OR cr.seller_id = auth.uid();
```

If `permission denied` persists → ensure `20260704190000`, `20260704200000`, and `20260704210000` are applied.

### Modify offer

```sql
SELECT public.rpc_modify_offer(
  '<offer_uuid>'::uuid,
  auth.uid(),
  2999::numeric,
  '修改了出價需求：HK$ 2,999'
);
```

Second call must fail: `限額攔截：每筆出價需求僅限修改一次價格。`

### Send text message (SQL editor, as room party)

```sql
SELECT public.rpc_send_chat_message(
  '<room_uuid>'::uuid,
  auth.uid(),
  '測試訊息'
);
```

Re-load inbox (`SELECT public.get_user_chat_inbox();`) — row should appear for both parties.

### Order completion message (cross-flow)

After `rpc_complete_member_order` (see [user-trading-orders/backend.md](../user-trading-orders/backend.md)):

```sql
SELECT id, content, member_order_id, room_id
FROM public.chat_messages
WHERE content = 'SYSTEM_ORDER_COMPLETED'
ORDER BY created_at DESC
LIMIT 5;
```

Expect `member_order_id` = completed order UUID. Inbox RPC must return that column (`20260704300000`).

### Batched review lookup (SQL editor)

```sql
SELECT * FROM public.rpc_get_user_reviewed_member_order_ids(
  ARRAY['<order-uuid-1>', '<order-uuid-2>']::uuid[]
);
```

> **Note:** Raw `INSERT INTO chat_messages` may still fail RLS in SQL editor unless `is_chat_room_member` policy (`20260704210000`) is applied. Prefer the RPC for smoke tests.

---

## Realtime (Supabase project config)

Backend does not ship a custom Realtime endpoint — clients subscribe to Postgres changes on `public.chat_messages`.

| Requirement | Notes |
|-------------|-------|
| Table in publication | `chat_messages` must be enabled for Realtime — migration **`20260704240000`** or Dashboard → Database → Replication |
| RLS | Party can `SELECT` own room messages (`20260704190000`) — required for `postgres_changes` delivery |
| Event source | Offer RPCs + `rpc_send_chat_message` + **`rpc_complete_member_order`** insert rows; client decodes `content` + `offer_id` + `member_order_id` (Scheme A) |
| Subscription shape | Client uses inbox-wide `postgres_changes` on `chat_messages` (no `room_id` filter); gates by room membership in app code |
| Modify price sync | Client parses `修改了出價需求：HK$ …` from `content` — avoids `getOfferCardContext` per modify event |

---

## Related flows

| Flow | Link |
|------|------|
| Order complete / cancel RPCs | [user-trading-orders/backend.md](../user-trading-orders/backend.md) |
| Transaction reviews (submit + double-blind) | [transaction-reviews/backend.md](../transaction-reviews/backend.md) |

---

## Not yet implemented (backend)

| Item | Notes |
|------|-------|
| `rpc_make_offer` single-pending guard | Removed in `20260704180000` rewrite — re-add if product requires |
| Push notifications (OneSignal) | `SYSTEM_OFFER_*` rows reserved as future trigger points |
| `chat_rooms.updated_at` bump on send | No UPDATE grant on rooms today |

---

## Env

No new env vars. Requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All migrations through **`20260704300000`** on linked project
