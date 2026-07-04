# Chat & Offers Inbox — Backend Handoff

## Status

- **Backend:** ✅ Ready (`makeOffer` · `modifyOffer` · `acceptOffer` · `getOfferCardContext` · `getUserChatInbox` · `sendMessage`)
- **Frontend:** 🟡 Partial — `OfferCard` + DB inbox + text send wired; seller reject RPC pending
- **Partner:** Apply migrations `20260704170000`–`20260704210000`; verify inbox + send after push (see **Migrations** below)

## Changelog (2026-07-04, Scheme B)

| Change | Detail |
|--------|--------|
| **`offers.listing_id`** | Listing binding moved from `chat_rooms` → `offers` (user-centric rooms) |
| **`chat_rooms`** | One room per buyer+seller pair; `listing_id` column removed |
| **`rpc_make_offer`** | Upsert room by `(buyer_id, seller_id)`; write `listing_id` on `offers` |
| **`rpc_accept_offer`** | Read `listing_id` from `offers` (not `chat_rooms`) |
| **`rpc_modify_offer`** | Buyer one-time price edit; `modified_count`; new `chat_messages` row |
| **`modified_count`** | `offers.modified_count INT DEFAULT 0 NOT NULL` |
| **Chat RLS** | `chat_rooms` / `chat_messages` / `offers` party-scoped policies + `GRANT` |
| **`get_user_chat_inbox()`** | `SECURITY DEFINER` RPC — avoids `permission denied` on direct table reads |
| **`getUserChatInbox`** | Server action calls RPC first, table fallback |
| **`sendMessage`** | `rpc_send_chat_message` — plain-text send (replaces direct INSERT; fixes nested RLS) |
| **`is_chat_room_member()`** | `SECURITY DEFINER` helper; `chat_messages_party_insert` policy uses it |
| **`rpc_send_chat_message`** | Validates party + length; inserts `chat_messages`; returns `{ id, room_id, content, created_at }` |

---

## Architecture (Scheme B)

```
Buyer — make offer
  ExecutionSlideOver → makeOffer(listingId, price)
    → rpc_make_offer
      → chat_rooms (find/create by buyer_id + seller_id)
      → offers (pending, listing_id, offer_price)
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
      → member_orders (14-day TTL)
      → chat_messages (SYSTEM_OFFER_ACCEPTED)

Chat inbox load
  GlobalChatOverlay → getUserChatInbox()
    → get_user_chat_inbox() RPC  [preferred]
    ← { rooms, messages, offers }
    → assembleDbChatRooms() → merge with mock (RM-MOCK-*)

Party — send text message
  GlobalChatConsole → sendMessage(roomId, body)   [UUID rooms only]
    → rpc_send_chat_message(p_room_id, p_sender_id, p_content)
      → is_chat_room_member() membership check
      → INSERT chat_messages (is_system_warning = false)
    ← { id, room_id, content, created_at }
```

---

## Files (backend track)

| File | Purpose |
|------|---------|
| `app/actions/offers.ts` | `makeOffer`, `modifyOffer`, `acceptOffer`, `getOfferCardContext` |
| `app/actions/chat.ts` | `getUserChatInbox`, `sendMessage` |
| `app/lib/chat/constants.ts` | `isMockChatRoomId`, `isDbChatRoomId` (UUID room gate) |
| `app/lib/chat/mapDbChats.ts` | DB rows → Zustand `ChatRoom` / `Message` |
| `app/lib/chat/mergeChatRooms.ts` | Mock + DB room merge |
| `app/lib/chat/offerCardImage.ts` | Listing image #1 → catalog fallback |
| `supabase/migrations/20260704130000_rpc_make_offer.sql` | Initial make-offer RPC |
| `supabase/migrations/20260704150000_rpc_accept_offer.sql` | Accept-offer RPC |
| `supabase/migrations/20260704160000_rpc_make_offer_single_pending.sql` | Single active offer guard |
| `supabase/migrations/20260704170000_rpc_modify_offer.sql` | Modify-offer RPC + `modified_count` |
| `supabase/migrations/20260704180000_offers_listing_id_user_centric_rooms.sql` | Scheme B schema + RPC rewrites |
| `supabase/migrations/20260704190000_chat_rooms_messages_rls.sql` | RLS + grants |
| `supabase/migrations/20260704200000_get_user_chat_inbox_rpc.sql` | Inbox RPC + grant fix |
| `supabase/migrations/20260704210000_rpc_send_chat_message.sql` | `rpc_send_chat_message`, `is_chat_room_member`, INSERT policy fix |

---

## Migrations (required)

```bash
bunx supabase db push
# If push fails on already-applied migrations (e.g. 20260704180000 listing_id backfill):
bunx supabase db query --linked -f supabase/migrations/20260704210000_rpc_send_chat_message.sql
bun run supabase:types   # if scripted; else bunx supabase gen types typescript
```

| Migration | Purpose |
|-----------|---------|
| `20260704170000` | `modified_count`, `rpc_modify_offer` |
| `20260704180000` | `offers.listing_id`, user-centric `chat_rooms`, RPC updates |
| `20260704190000` | Chat/offers RLS policies (initial `chat_messages_party_insert`) |
| `20260704200000` | `get_user_chat_inbox()` RPC + `REVOKE PUBLIC` grants |
| `20260704210000` | **`rpc_send_chat_message`** + `is_chat_room_member` — **required for text send** |

---

## Server actions

### `makeOffer(listingId, offerPrice)`

Success: `{ success: true, data: { room, offer, message } }`

RPC content: `出價 HK$ ${price.toLocaleString()}`

### `modifyOffer(offerId, newPrice)`

Success: `{ success: true, data: { offer, messageId } }`

RPC content: `修改了出價需求：HK$ ${newPrice.toLocaleString()}`

Rules: `pending` only; `modified_count < 1`; `auth.uid() = buyer_id`

### `acceptOffer(offerId)`

Success: `{ success: true, data: { order, messageId } }`

Side effects: listing `inactive`, `member_orders` insert, `revalidatePath("/marketplace")`

### `getOfferCardContext(offerId)`

Success: `{ success: true, data: OfferCardContext }`

Joins: `offers` → `listings` (via `listing_id`) → `product_catalog`; `chat_rooms` for `seller_id`

Image: `listings.images[0]` (Bunny CDN) → `product_catalog.image_url`

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

**Why RPC:** Direct `INSERT` into `chat_messages` failed with `new row violates row-level security policy` — nested RLS on `chat_rooms` inside the INSERT `WITH CHECK` subquery. Same `SECURITY DEFINER` pattern as offer RPCs.

---

## RPC: `get_user_chat_inbox()`

```sql
SELECT public.get_user_chat_inbox();
-- Returns JSONB:
-- {
--   "rooms": [{ id, buyer_id, seller_id, buyer, seller, ... }],
--   "messages": [{ id, room_id, content, offer_id, ... }],
--   "offers": [{ id, offer_price, status, modified_count, listings: { product_catalog } }]
-- }
```

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

> **Note:** Raw `INSERT INTO chat_messages` may still fail RLS in SQL editor unless `is_chat_room_member` policy (`20260704210000`) is applied. Prefer the RPC for smoke tests.

---

## Not yet implemented (backend)

| Item | Notes |
|------|-------|
| `rpc_reject_offer` | Seller reject → `offers.status = rejected` + system message |
| Realtime `chat_messages` | Client polls on chat open only |
| `rpc_make_offer` single-pending guard | Removed in `20260704180000` rewrite — re-add if product requires |

---

## Env

No new env vars. Requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All migrations through **`20260704210000`** on linked project
