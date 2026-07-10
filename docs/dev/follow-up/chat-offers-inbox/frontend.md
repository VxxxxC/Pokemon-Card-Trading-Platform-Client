# Chat & Offers Inbox — Frontend Handoff

## Status

- **Backend:** ✅ Ready (see [backend.md](./backend.md))
- **Frontend:** 🟡 Partial — buyer make/modify + seller accept/**reject** + DB text send + **Realtime Scheme A** + **order completion card + review CTA** + **long-thread perf** wired; mock rooms retained; checkout-after-accept polish pending
- **Your focus:** `OfferCard` styling polish; post-accept checkout navigation; inbox refresh-on-page-reload UX; profile review history UI
- **Partner report:** [PARTNER_REPORT.md](./PARTNER_REPORT.md)

## Changelog (2026-07-09, user reports)

| Area | Shipped |
|------|---------|
| **`GlobalChatConsole`** | Report dialog → `submitUserReport` with `chatRoomId`; guards mock/pending rooms |
| **`ProfileHeaderWithChat`** | Profile report → `submitUserReport` (no room); success toast fixed |
| **`ChatReportDialogBody`** | `isSubmitting` disables confirm button + loading label |

**Acceptance checklist:**

- [ ] DB chat room: select category → submit → success toast + dialog closes + `reports` row
- [ ] Mock/pending room: submit blocked with 「對話尚未建立，無法舉報」
- [ ] Profile page: report submits without `chatRoomId`
- [ ] Duplicate pending report shows friendly error, dialog stays open
- [ ] Submit button shows 「提交中…」 and is disabled during RPC

See [PARTNER_REPORT.md](./PARTNER_REPORT.md) for executive summary, P0–P3 backlog, SQL smoke tests, and E2E command.

## Changelog (2026-07-09, thread pagination)

| Area | Shipped |
|------|---------|
| **`useChatThreadPagination`** | Scroll-up load older messages; stick-to-bottom for new messages; scroll position preserved on prepend |
| **`loadOlderChatRoomThread`** | Client helper — prepends older page into Zustand |
| **`GlobalChatConsole`** | Removed `THREAD_WINDOW_SIZE` display-only truncation; top loading / end-of-history hints |
| **`threadHasMoreOlder`** | Room flag drives whether scroll-up fetch runs |

## Changelog (2026-07-08) — global buy entry points

| Area | Shipped |
|------|---------|
| **`ExecutionSlideOverHost`** | Root layout host; all buy CTAs share one `ExecutionSlideOver` instance |
| **`BuyButton`** | Marketplace grid, home C2C, merchant storefront → `openExecutionSlideOver` |
| **`map-listing-to-execution.ts`** | Listing / order-book → slide-over payload |
| **Product detail** | Order book row uses same store (local mount removed) |

## Changelog (2026-07-05, platform authentication opt-in)

| Area | Shipped |
|------|---------|
| **`ExecutionSlideOver`** | **平台鑑定加購** `Switch` → `makeOffer(..., useAuthentication)` |
| **`makeOffer` / `openOfferChatSession`** | `useAuthentication` on Zustand `specialData` for instant card hydration |
| **`OfferCard`** | Badge **含平台鑑定加購 (HK$ 150)**; pending alert; seller accept dialog note |
| **`getOfferCardContext`** | `offer.use_authentication` on fetch + cache |
| **Inbox mapping** | `mapDbChats` / `chat.ts` offers select includes `use_authentication` |
| **`SpecialTransactionMessage`** | Passes `useAuthentication` into `OfferCard` initial context |

## Changelog (2026-07-04, later)

| Area | Shipped |
|------|---------|
| **`SystemOrderCompletedMessage`** | Rich card for `SYSTEM_ORDER_COMPLETED`; **✍️ 給予對手評價** opens page-level `ReviewModal` in `GlobalChatConsole` |
| **Batched review lookup** | `useRoomReviewedOrderIds` — **one** `getUserReviewedMemberOrderIds` RPC per active room (not per completion card) |
| **`resolveChatCompletionOrderId`** | Server fallback when inbox row lacks `member_order_id`; client also resolves from thread `orderData` / offer ledger |
| **Long-thread perf** | `OfferCard` `React.memo`; skip network for terminal offers when inbox-hydrated; `offerCardContextCache` (5 min TTL); silent refresh for pending only |
| **Realtime modify** | `parseModifyOfferPriceFromContent` — price sync without `getOfferCardContext` round-trip on counterparty device |
| **`appendRoomMessage` fast path** | Append without full re-sort when new message is chronologically last |
| **Thread render** | `useMemo` on `buildMessageRenderList`; `MessageThread` / `MobileMessageThread` memoized |
| **Inbox mapping** | `SYSTEM_ORDER_COMPLETED` → `system_order_completed` + `orderData`; `SYSTEM_OFFER_ACCEPTED` carries `orderData.orderId` for review/order wiring |
| **Migration `20260704300000`** | Inbox RPC returns `member_order_id` on messages — required for completion card + review CTA |

## Changelog (2026-07-04, earlier)

| Area | Shipped |
|------|---------|
| **`OfferCard`** | Scheme B offer card: persona guard, state machine, listing thumbnail, accept/modify/**reject** RPC |
| **`SpecialTransactionMessage`** | Thin adapter → `OfferCard` when `offerId` present |
| **`GlobalChatOverlay`** | Prefetch **`getUserChatInboxLobby()`** on auth; refresh on open; **`getChatRoomThread(roomId)`** on room select; mounts **`useChatRoomRealtime`** |
| **Buyer modify** | `modifyOffer` + `applyOfferModification` in Zustand; `AlertDialog` trigger + `z-[550]` overlay fix |
| **Seller accept** | `acceptOffer` + `applyOfferAccepted(offerId, memberOrderId)` in Zustand |
| **Seller reject** | `rejectOffer` + `applyOfferRejected(offerId)` in Zustand |
| **Send text** | `GlobalChatConsole` → `sendMessage` → `rpc_send_chat_message` (UUID rooms); optimistic bubble + rollback |
| **Send perf (same day)** | Non-blocking send: `appendRoomMessage` / `finalizeOptimisticMessage` / `rollbackOptimisticMessage` — avoids `setChats` offer-ledger rebuild on every keystroke/send; button no longer waits on RPC |
| **Realtime Scheme A** | `useChatRoomRealtime` — inbox-wide `chat_messages` INSERT subscription + offline reconcile on `SUBSCRIBED` |
| **Offer ledger** | `useHkCardVaultStore.offers` + idempotent accept/reject (no double UI bounce) |
| **`isDbChatRoomId`** | `app/lib/chat/constants.ts` — gates RPC send + Realtime vs local-only mock/ephemeral rooms |
| **Images** | Listing `images[0]` (Bunny) via `getOfferCardContext` / inbox offers join |
| **`useCurrentUserId`** | Passed into chat message threads for persona |
| **PWA dev noise** | `app/sw.ts` → `disableDevLogs: true`; `prefetch={false}` on chat profile links + `FollowingFeed` `/profile/user` link |

## Pending

| Area | Owner | Notes |
|------|-------|-------|
| Checkout link after accept | Product | Old `SpecialTransactionMessage` had `/checkout/[cardId]` — `OfferCard` shows hold banner only |
| Page refresh inbox | Frontend | Lobby prefetches on login; thread lazy-loads per room (Phase 2) |
| Realtime replication | Infra | Migration **`20260704240000`** adds publication; confirm in Dashboard if push already applied |
| Inbox `member_order_id` | Backend/Infra | Apply **`20260704300000`** — without it, review CTA relies on slower server fallbacks |

---

## Related flows

| Flow | Link |
|------|------|
| Order complete / cancel RPCs | [user-trading-orders/backend.md](../user-trading-orders/backend.md) |
| Review submit + double-blind modal | [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) |

## File map

| File | Role |
|------|------|
| `app/actions/offers.ts` | `makeOffer`, `modifyOffer`, `acceptOffer`, **`rejectOffer`**, `getOfferCardContext` |
| `app/actions/chat.ts` | `getUserChatInboxLobby`, `getChatRoomThread`, `sendMessage` |
| `app/actions/reviews.ts` | `getUserReviewedMemberOrderIds`, **`resolveChatCompletionOrderId`** (chat completion card fallback) |
| `app/components/chat/OfferCard.tsx` | **Primary** offer card UI + RPC wiring; memoized; conditional fetch |
| `app/components/chat/SystemOrderCompletedMessage.tsx` | **Order completion card** + review CTA; memoized |
| `app/components/chat/SpecialTransactionMessage.tsx` | Adapter: `specialData` → `OfferCard` |
| `app/components/trading/ReviewModal.tsx` | Star rating + comment modal (mounted once in `GlobalChatConsole`) |
| `app/components/chat/GlobalChatOverlay.tsx` | DB sync on `isChatOpen`; mounts **`useChatRoomRealtime`** |
| `app/components/chat/GlobalChatConsole.tsx` | Threads + send form; `ReviewModal`; `useRoomReviewedOrderIds`; memoized threads |
| `app/lib/hooks/useChatRoomRealtime.ts` | Inbox-wide Realtime subscription + Scheme A decode + offline reconcile |
| `app/lib/hooks/useChatThreadPagination.ts` | Scroll-up pagination + stick-to-bottom scroll management |
| `app/lib/chat/hydrateChatRoomThread.ts` | `hydrateChatRoomThread` (first page) + `loadOlderChatRoomThread` |
| `app/lib/chat/realtimeChatMessages.ts` | DB row → store `Message`; offer event decoder; **`parseModifyOfferPriceFromContent`** |
| `app/lib/chat/resolveMemberOrderId.ts` | Client-side `orderId` extraction + **`collectMemberOrderIdsFromChatRoom`** |
| `app/lib/chat/offerCardContextCache.ts` | In-memory `getOfferCardContext` cache (per `offerId`, 5 min TTL) |
| `app/lib/chat/constants.ts` | `isMockChatRoomId`, `isDbChatRoomId` |
| `app/lib/chat/mapDbChats.ts` | DB → store mapping; `SYSTEM_OFFER_ACCEPTED` / `SYSTEM_OFFER_REJECTED` |
| `app/lib/chat/mergeChatRooms.ts` | Keeps `RM-MOCK-*` + merges DB rooms |
| `app/lib/chat/offerCardImage.ts` | Image URL resolution |
| `lib/supabase/client.ts` | Browser Supabase client for Realtime |
| `app/store/useHkCardVaultStore.ts` | `offers` ledger, `openOfferChatSession`, `applyOfferModification`, **`applyOfferAccepted`**, **`applyOfferRejected`**, `applyOfferPriceSync`, **`appendRoomMessage`**, **`finalizeOptimisticMessage`**, **`rollbackOptimisticMessage`**, **`markRoomRead`** |
| `app/store/useUIStore.ts` | **`openExecutionSlideOver`** / **`closeExecutionSlideOver`** |
| `app/components/transactions/ExecutionSlideOverHost.tsx` | Global host in `app/layout.tsx` |
| `lib/marketplace/map-listing-to-execution.ts` | `MarketplaceListing` / order book → execution payload |
| `app/components/transactions/GlobalTxButtons.tsx` | **`BuyButton`** → global slide-over; **`AuctionButton`** still mock |
| `app/components/transactions/ExecutionSlideOver.tsx` | Buyer submit → `makeOffer(listingId, price, useAuthentication?)` |
| `app/sw.ts` | Serwist worker — `disableDevLogs: true` (silences dev `No route found` spam) |

---

## Buyer flow — make offer (✅)

**Entry points** (all open the same global slide-over via `ExecutionSlideOverHost`):

1. `/marketplace` — `MarketplaceCard` **⚡ 立即購買**
2. `/` — `NewArrivals` **⚡ 立即購買**
3. `/marketplace/product/[id]` — order book row
4. `/marketplace/[sellerId]/product/[productId]` — storefront buy CTA

**Submit:**

1. Optional **平台鑑定加購** toggle → `makeOffer(listingId, price, useAuthentication)` → `openOfferChatSession({ offerId, useAuthentication, ... })`
2. `GlobalChatOverlay` opens; DB sync merges real room into lobby

### `openOfferChatSession` required fields

| Field | Source |
|-------|--------|
| `offerId` | `result.data.offer.id` |
| `roomId` | `result.data.room.id` |
| `modifiedCount` | `offer.modified_count ?? 0` |
| `messageId` | `result.data.message.id` |
| `useAuthentication` | `offer.use_authentication` (or slide-over toggle) |

---

## Buyer flow — modify offer (✅)

`OfferCard` buyer branch:

- Shows **修改出價** when `pending` && `modified_count < 1`
- `AlertDialogTrigger` with `render={<button type="button" />}` (Base UI); dialog overlay `z-[550]` above chat shell (`z-[500]`)
- Calls `modifyOffer(offerId, newPrice)`
- On success: `applyOfferModification` updates store + appends text bubble; dialog remounts via `modifyDialogKey`
- After modify: button hidden; **（已達修改上限）**
- Counterparty sees new price via Realtime → **`parseModifyOfferPriceFromContent`** → `applyOfferPriceSync` (no `getOfferCardContext` unless parse fails)

---

## Order completion + review (✅)

When either party completes a `member_orders` row, backend inserts `SYSTEM_ORDER_COMPLETED` with `member_order_id`.

### Rendering

| DB `content` | UI `Message` |
|--------------|----------------|
| `SYSTEM_ORDER_COMPLETED` | `type: "system_order_completed"` + optional `orderData.orderId` from `member_order_id` |

`GlobalChatConsole` renders **`SystemOrderCompletedMessage`** (not a plain system bubble).

### Review CTA

```tsx
// GlobalChatConsole — single modal instance
const reviewedOrderIds = useRoomReviewedOrderIds(
  activeRoom.messages,
  offers,
  submittedReviewOrderIds,
);

<ReviewModal
  isOpen={activeReview !== null}
  onClose={handleCloseReview}
  orderId={activeReview?.orderId ?? ""}
  revieweeId={activeReview?.revieweeId ?? ""}
  onSubmitted={handleReviewSubmitted}
/>
```

| Trigger | Action |
|---------|--------|
| **✍️ 給予對手評價** (footer + inline CTA) | `handleOpenReview(orderId, partnerId)` → opens `ReviewModal` |
| Already reviewed | CTA hidden; shows **✓ 您已提交此次交易的評價** |
| **查看我的訂單** | Closes chat overlay → `/profile/user/trading` |

**Order id resolution (client-first):**

1. `msg.orderData.orderId` from inbox / Realtime mapping
2. `collectMemberOrderIdsFromChatRoom` — scans thread `orderData` + offer ledger `memberOrderId`
3. On button click only: `resolveChatCompletionOrderId({ messageId, roomId, revieweeId })`

**Review status:** one batched `getUserReviewedMemberOrderIds` per room via `useRoomReviewedOrderIds` — not per card.

See [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) for modal contract + double-blind toasts.

Requires migration **`20260704300000`** on inbox RPC for reliable `member_order_id` on load.

---

## Chat flow — send text (✅)

`GlobalChatConsole` form submit (`發送` / `發送 ⚡`):

1. **Optimistic** — `appendRoomMessage(activeRoomId, { id: "opt-*", sender: "me", ... })` (no offer-ledger rebuild)
2. If `isDbChatRoomId(activeRoomId)` → fire-and-forget `sendMessage(roomId, text)` → **`rpc_send_chat_message`**
3. On success → `finalizeOptimisticMessage(roomId, optimisticId, { id, ... })` (swaps temp id for DB row; idempotent if Realtime already appended same `id`)
4. On failure → `rollbackOptimisticMessage`, restore input, `toast.error`
5. Mock (`RM-MOCK-*`) / ephemeral (`room_*`, hash ids) → local-only (no API call)

**Perf notes (2026-07-04):**

- Do **not** use `setChats` for plain-text send — it runs `buildOfferLedgerFromChats` across all rooms
- Send button is **not** blocked on RPC completion; `sendInFlightRef` prevents double-submit only
- Scroll-to-bottom: `useChatThreadPagination` sticks when user is near bottom; prepending older messages does not jump scroll

Requires migration **`20260709220000`** for RPC pagination (table fallback works without it).

---

## Seller flow — accept (✅)

`OfferCard` seller branch (`currentUserId === sellerId`):

- **接受出價** → `acceptOffer(offerId)` with loading spinner
- On success: `applyOfferAccepted(offerId, order.id)`; card → read-only grey + hold banner
- Buyer device: Realtime `SYSTEM_OFFER_ACCEPTED` → same card grey-out without reopening chat

---

## Seller flow — reject (✅)

`OfferCard` seller branch:

- **拒絕出價** → `rejectOffer(offerId)` with loading spinner
- On success: `applyOfferRejected(offerId)`; card → read-only rejected state
- Buyer device: Realtime `SYSTEM_OFFER_REJECTED` → system banner + card lock

---

## Realtime — Scheme A (✅)

`GlobalChatOverlay` mounts `useChatRoomRealtime({ enabled: isChatOpen })` (not inside `GlobalChatConsole`).

### Subscription

```ts
supabase.channel(`chat-inbox:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    // no room_id filter — inbox-wide; processRow gates by isDbChatRoomId(row.room_id)
  }, handler)
```

Only processes rows for UUID DB rooms (`isDbChatRoomId`). Requires migration **`20260704240000`** (`chat_messages` in `supabase_realtime` publication).

### Per-message pipeline

1. **`appendRoomMessage(roomId, message)`** — idempotent by `message.id`; keeps text thread fluid
2. **Scheme A decode** (when `offer_id` present):
   | `content` | Store action |
   |-----------|--------------|
   | `SYSTEM_OFFER_ACCEPTED` | `applyOfferAccepted(offerId, memberOrderId)` |
   | `SYSTEM_OFFER_REJECTED` | `applyOfferRejected(offerId)` |
   | starts with `修改了出價需求：` | **`parseModifyOfferPriceFromContent`** → `applyOfferPriceSync`; fallback `getOfferCardContext` if parse fails |

### Offline reconcile

On `.subscribe` status **`SUBSCRIBED`** (initial connect or reconnect):

- For **each DB room** in Zustand: `SELECT` from `chat_messages` where `room_id = …` and `created_at > lastLocalTimestamp` (skips `opt-*` optimistic ids)
- Run same append + decode pipeline for each missed row
- Also re-runs when inbox gains new DB room ids (store subscription)

### Zustand idempotency

`applyOfferAccepted` / `applyOfferRejected` check `offers[offerId].status` and card `initialStatus` before mutating — prevents local RPC + Realtime double-update UI bounce.

---

## Chat inbox — DB + mock (✅)

```
GlobalChatOverlay (isChatOpen)
  → getUserChatInbox()
  → mergeChatRoomsWithDb(currentRooms, dbRooms)
```

- Mock rooms: IDs prefixed `RM-MOCK-*` always kept
- DB rooms: UUID `chat_rooms.id` from Supabase
- Session-hydrated room merged with DB messages (optimistic + DB wins)
- `setChats` rebuilds `offers` ledger from `special_transaction` messages — use only for inbox merge / structural room changes, **not** per text send
- `markRoomRead(roomId)` clears `unreadCount` without ledger rebuild (lobby room click)

### Message mapping

| DB signal | UI `Message` |
|-----------|----------------|
| First message per `offer_id` | `type: special_transaction` + `specialData` (includes `offerId`, `imageUrl`) |
| Later messages same `offer_id` | Plain text bubble |
| `SYSTEM_OFFER_ACCEPTED` | System banner text + optional `orderData.orderId` (`member_order_id`) |
| `SYSTEM_OFFER_REJECTED` | System banner text |
| `SYSTEM_ORDER_COMPLETED` | **`SystemOrderCompletedMessage`** card (`type: system_order_completed`) |
   | `SYSTEM_ORDER_COMPLETED` | **`SystemOrderCompletedMessage`** card (`type: system_order_completed`) |
| `sender_id === currentUserId` | `sender: "me"` |

Only messages with `specialData.offerId` render `OfferCard` (via `SpecialTransactionMessage`).

---

## `OfferCard` props

```tsx
<OfferCard
  message={{ id, offer_id, room_id }}
  currentUserId={string | null}
  roomId?: string
  initialContext?: OfferCardContext  // hydration from Zustand
/>
```

Persona:

- `currentUserId === offer.buyer_id` → buyer UI
- `currentUserId === sellerId` (from context) → seller UI

`initialContext` / `specialData.initialStatus` updates from Zustand propagate via `useEffect` → local `offerStatus` sync.

### Fetch strategy (long-thread perf)

| Offer state | On mount |
|-------------|----------|
| **accepted / rejected / cancelled** + hydrated `initialContext` | **No network** — render immediately from inbox / Zustand |
| **pending** + hydrated context | Render immediately; **silent** background `getOfferCardContext` refresh |
| Missing hydration | Full fetch with loading skeleton |
| Cache hit (`offerCardContextCache`) | Skip network for 5 minutes |

Cache invalidated on accept / reject / modify from this card.

---

## Thread pagination (✅)

| Step | Behavior |
|------|----------|
| Room select | `hydrateChatRoomThread` → `getChatRoomThread` first **50** messages |
| Scroll near top | `useChatThreadPagination` → `loadOlderChatRoomThread` prepends older page |
| New message | Auto-scroll only when user is near bottom |
| End of history | `threadHasMoreOlder === false` → optional「已載入全部歷史訊息」hint |

Requires migration **`20260709220000`** on linked Supabase project.

---

## Long-thread performance (✅ baseline)

Same partner with many past offers + completions:

| Technique | Effect |
|-----------|--------|
| Batched `useRoomReviewedOrderIds` | 1 review RPC per room open (was N per completion card) |
| Terminal `OfferCard` skip-fetch | 0 server calls for historical accepted/rejected cards |
| `offerCardContextCache` | Dedupes repeat `getOfferCardContext` for same `offerId` |
| Realtime price parse | No server round-trip on modify events |
| `appendRoomMessage` fast append | Avoids O(n log n) re-sort on every INSERT when in order |
| Thread pagination | Initial 50 messages; scroll-up loads older pages (no full-thread fetch) |
| Memoized threads + `useMemo` render list | Fewer React re-renders on unrelated store updates |

**Not yet implemented:** message virtualization — acceptable with pagination for typical threads.

---

## Acceptance checklist

### Buyer

- [x] Submit offer from slide-over → chat opens with offer card
- [x] **平台鑑定加購** toggle persists `offers.use_authentication` and shows on `OfferCard`
- [x] **修改出價** updates price + `modified_count` in DB and UI
- [x] Second modify attempt blocked (RPC + hidden button)
- [x] Listing thumbnail shows Bunny image when `listings.images` populated
- [x] Sees seller **accept/reject** on card without reopening chat (Realtime Scheme A)

### Seller

- [x] Sees offer card with correct price / card name from DB inbox
- [x] Sees **含平台鑑定加購** badge + escrow notice when buyer opted in
- [x] **接受出價** calls `acceptOffer` with loading state
- [x] After accept: read-only card + hold message
- [x] **拒絕出價** calls `rejectOffer` with loading state
- [x] After reject: read-only card + rejected badge

### Chat shell

- [x] Mock demo rooms still visible alongside real DB rooms
- [x] DB rooms load after migration + login (no `permission denied`)
- [x] **發送** persists text in UUID DB rooms (`sendMessage` + optimistic UI)
- [x] Send feels instant (optimistic bubble; RPC non-blocking)
- [x] Mock rooms still accept local-only sends (no API call)
- [x] Counterparty text + offer events appear while chat open (Realtime)
- [x] `SYSTEM_ORDER_COMPLETED` renders completion card (not raw content string)
- [x] Review CTA on completion card opens `ReviewModal` (when `!hasReviewedByMe`)
- [x] Long room open: terminal offer cards do not each call `getOfferCardContext`
- [x] Thread pagination: initial page only; scroll up loads older messages
- [ ] Page refresh preserves inbox without re-making offer

---

## Manual test script

1. `bunx supabase db push` (through **`20260705140000`** for auth opt-in on make-offer)
2. Supabase Dashboard → confirm **Realtime** for `chat_messages` (migration `20260704240000` adds publication if missing)
3. Log in as **buyer** → make offer **with** auth toggle on → chat opens → `OfferCard` shows auth badge
4. Repeat with toggle off → no auth badge; accept → order detail uses meetup UI
4. Close/reopen chat → same DB room appears in lobby (with mocks)
5. **修改出價** once → new price + text bubble; seller (other browser) sees price update live
6. Type a plain message → **發送** → bubble appears immediately; counterparty sees it without reopening chat
7. Log in as **seller** → open same room → **接受出價** or **拒絕出價**
8. Buyer device: card greys out + system banner within ~1s
9. Marketplace (accept path): listing no longer `active`; `member_orders` row `pending`, `expires_at` ≈ +14 days
10. Complete order (trading page or RPC) → chat shows **`SystemOrderCompletedMessage`** → **✍️ 給予對手評價** opens modal
11. Re-open same room with many past offers → historical cards render without per-card loading spinners

---

## Styling constraints

Per `.cursorrules` backend-driven UI protocol:

- Do not remove/restructure existing Tailwind in `GlobalChatConsole`
- `OfferCard` uses shadcn `Card`, `AlertDialog`, `Spinner` — polish welcome
- New wiring only in adapter layers unless explicitly tasked

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Toast: `permission denied` | Run migrations `20260704190000`, `20260704200000`, `20260704210000` |
| Toast: `function get_user_chat_inbox() does not exist` | `bunx supabase db push` |
| Toast: `new row violates row-level security policy` (send) | Apply `20260704210500` (`rpc_send_chat_message`); redeploy / restart dev server |
| Toast: `function rpc_send_chat_message does not exist` | `bunx supabase db query --linked -f supabase/migrations/20260704210500_rpc_send_chat_message.sql` |
| Toast: `column r.listing_id does not exist` (accept) | Apply `20260704230000_rpc_accept_offer_fix_listing_id.sql` |
| Toast: reject RPC errors | Apply `20260704190500_rpc_reject_offer.sql` |
| **修改出價** click does nothing | Ensure `AlertDialog` above chat (`z-[550]`); use uncontrolled dialog + `render={<button />}` on trigger |
| Send toast: `請先登入後再發送訊息` | Log in; only UUID DB rooms call `sendMessage` |
| Send succeeds locally but lost on refresh | Room id is mock/ephemeral — use real offer/inbox UUID room |
| Broken image / empty `src` | Ensure `listings.images` has Bunny URLs; `getOfferCardContext` refetches |
| No DB rooms, only mocks | User not logged in, or no `chat_rooms` rows for `auth.uid()` |
| Offer card missing in thread | Message lacks `specialData.offerId` — only first message per offer is special card |
| Counterparty message not visible | Confirm Realtime enabled on `chat_messages`; room is UUID DB room; both users logged in |
| Card state bounces twice on accept | Should be fixed by idempotent `applyOfferAccepted` — report if still reproduces |
| Send feels slow / button stuck on「發送中…」 | Fixed 2026-07-04 — use `appendRoomMessage` path; hard-refresh if old bundle cached |
| Console spam: `serwist No route found for: /profile/user` | Dev-only Serwist debug; harmless. `app/sw.ts` sets `disableDevLogs: true` — unregister old SW + reload |
| Many `/profile/user` prefetches while chatting | `prefetch={false}` on chat header `Link` + homepage `FollowingFeed`; reduce unrelated Next prefetch |
| Review button missing on completion card | Apply **`20260704300000`**; verify `member_order_id` on `SYSTEM_ORDER_COMPLETED` row; see [user-trading-orders/backend.md](../user-trading-orders/backend.md) verify SQL |
| Review button stuck on「載入中…」 | Fixed — loading only on click; batched room review lookup runs in background |
| Room with many offers feels slow on open | Expected improvement from terminal skip-fetch + cache; if still slow at 50+ cards, plan virtualization |
