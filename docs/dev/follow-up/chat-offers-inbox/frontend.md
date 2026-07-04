# Chat & Offers Inbox — Frontend Handoff

## Status

- **Backend:** ✅ Ready (see [backend.md](./backend.md))
- **Frontend:** 🟡 Partial — buyer make/modify + seller accept + DB text send wired; mock rooms retained; reject is UI-only
- **Your focus:** Polish `OfferCard` styling; wire reject when `rpc_reject_offer` lands; optional Realtime

## Changelog (2026-07-04)

| Area | Shipped |
|------|---------|
| **`OfferCard`** | Scheme B offer card: persona guard, state machine, listing thumbnail, accept/modify RPC |
| **`SpecialTransactionMessage`** | Thin adapter → `OfferCard` when `offerId` present |
| **`GlobalChatOverlay`** | On open → `getUserChatInbox()` → `mergeChatRoomsWithDb` (mock + DB) |
| **Buyer modify** | `modifyOffer` + `applyOfferModification` in Zustand; `AlertDialog` trigger + `z-[550]` overlay fix |
| **Seller accept** | `acceptOffer` + `applyOfferAccepted` in Zustand |
| **Send text** | `GlobalChatConsole` → `sendMessage` → `rpc_send_chat_message` (UUID rooms); optimistic bubble + rollback |
| **`isDbChatRoomId`** | `app/lib/chat/constants.ts` — gates RPC send vs local-only mock/ephemeral rooms |
| **Images** | Listing `images[0]` (Bunny) via `getOfferCardContext` / inbox offers join |
| **`useCurrentUserId`** | Passed into chat message threads for persona |

## Pending

| Area | Owner | Notes |
|------|-------|-------|
| Seller **拒絕出價** | Backend + FE | `rpc_reject_offer` not in repo; `OfferCard` shows preview toast only |
| Realtime messages | Frontend | Inbox refetch on chat open only; counterparty text needs reopen or poll |
| Checkout link after accept | Product | Old `SpecialTransactionMessage` had `/checkout/[cardId]` — `OfferCard` shows hold banner only |

---

## File map

| File | Role |
|------|------|
| `app/actions/offers.ts` | `makeOffer`, `modifyOffer`, `acceptOffer`, `getOfferCardContext` |
| `app/actions/chat.ts` | `getUserChatInbox`, `sendMessage` |
| `app/components/chat/OfferCard.tsx` | **Primary** offer card UI + RPC wiring |
| `app/components/chat/SpecialTransactionMessage.tsx` | Adapter: `specialData` → `OfferCard` |
| `app/components/chat/GlobalChatOverlay.tsx` | DB sync on `isChatOpen` |
| `app/components/chat/GlobalChatConsole.tsx` | Threads + `handleSendMessage` → `sendMessage` (DB rooms) |
| `app/lib/chat/constants.ts` | `isMockChatRoomId`, `isDbChatRoomId` |
| `app/lib/chat/mapDbChats.ts` | DB → store mapping |
| `app/lib/chat/mergeChatRooms.ts` | Keeps `RM-MOCK-*` + merges DB rooms |
| `app/lib/chat/offerCardImage.ts` | Image URL resolution |
| `app/store/useHkCardVaultStore.ts` | `openOfferChatSession`, `applyOfferModification`, `applyOfferAccepted` |
| `app/components/transactions/ExecutionSlideOver.tsx` | Buyer submit → `makeOffer` |

---

## Buyer flow — make offer (✅)

1. Product detail → order book row → `ExecutionSlideOver`
2. `makeOffer(listingId, price)` → `openOfferChatSession({ offerId: offer.id, ... })`
3. `GlobalChatOverlay` opens; DB sync merges real room into lobby

### `openOfferChatSession` required fields

| Field | Source |
|-------|--------|
| `offerId` | `result.data.offer.id` |
| `roomId` | `result.data.room.id` |
| `modifiedCount` | `offer.modified_count ?? 0` |
| `messageId` | `result.data.message.id` |

---

## Buyer flow — modify offer (✅)

`OfferCard` buyer branch:

- Shows **修改出價** when `pending` && `modified_count < 1`
- `AlertDialogTrigger` with `render={<button type="button" />}` (Base UI); dialog overlay `z-[550]` above chat shell (`z-[500]`)
- Calls `modifyOffer(offerId, newPrice)`
- On success: `applyOfferModification` updates store + appends text bubble; dialog remounts via `modifyDialogKey`
- After modify: button hidden; **（已達修改上限）**

---

## Chat flow — send text (✅)

`GlobalChatConsole` form submit (`發送` / `發送 ⚡`):

1. Optimistic `Message` appended to active room (`sender: "me"`, temp id `opt-*`)
2. If `isDbChatRoomId(activeRoomId)` → `sendMessage(roomId, text)` → **`rpc_send_chat_message`**
3. On success → replace temp id with DB `id` + `createdAt`
4. On failure → remove optimistic row, restore input, `toast.error`
5. Mock (`RM-MOCK-*`) / ephemeral (`room_*`, hash ids) → local-only (no API call)

Requires logged-in user in a UUID `chat_rooms` row. Backend must have migration **`20260704210000`** applied.

---

## Seller flow — accept (✅)

`OfferCard` seller branch (`currentUserId === sellerId`):

- **接受出價** → `acceptOffer(offerId)` with loading spinner
- On success: `applyOfferAccepted`; card → read-only grey + hold banner

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

### Message mapping

| DB signal | UI `Message` |
|-----------|----------------|
| First message per `offer_id` | `type: special_transaction` + `specialData` (includes `offerId`, `imageUrl`) |
| Later messages same `offer_id` | Plain text bubble |
| `SYSTEM_OFFER_ACCEPTED` | System banner text |
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

---

## Acceptance checklist

### Buyer

- [x] Submit offer from slide-over → chat opens with offer card
- [x] **修改出價** updates price + `modified_count` in DB and UI
- [x] Second modify attempt blocked (RPC + hidden button)
- [x] Listing thumbnail shows Bunny image when `listings.images` populated

### Seller

- [x] Sees offer card with correct price / card name from DB inbox
- [x] **接受出價** calls `acceptOffer` with loading state
- [x] After accept: read-only card + hold message
- [ ] **拒絕出價** persists to DB (needs RPC)

### Chat shell

- [x] Mock demo rooms still visible alongside real DB rooms
- [x] DB rooms load after migration + login (no `permission denied`)
- [x] **發送** persists text in UUID DB rooms (`sendMessage` + optimistic UI)
- [x] Mock rooms still accept local-only sends (no API call)
- [ ] Page refresh preserves inbox without re-making offer
- [ ] Realtime new messages from counterparty (reopen chat to refetch)

---

## Manual test script

1. `bunx supabase db push` (through **`20260704210000`**) — or apply send migration alone if push fails on older scripts (see [backend.md](./backend.md))
2. Log in as **buyer** → make offer → chat opens
3. Close/reopen chat → same DB room appears in lobby (with mocks)
4. **修改出價** once → new price + text bubble; dialog opens above chat panel
5. Type a plain message → **發送** → bubble appears; close/reopen chat → message still in thread
6. Log in as **seller** → open same room → **接受出價**
7. Marketplace: listing no longer `active`
8. `member_orders` row `pending`, `expires_at` ≈ +14 days

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
| Toast: `new row violates row-level security policy` (send) | Apply `20260704210000` (`rpc_send_chat_message`); redeploy / restart dev server |
| Toast: `function rpc_send_chat_message does not exist` | `bunx supabase db query --linked -f supabase/migrations/20260704210000_rpc_send_chat_message.sql` |
| **修改出價** click does nothing | Ensure `AlertDialog` above chat (`z-[550]`); use uncontrolled dialog + `render={<button />}` on trigger |
| Send toast: `請先登入後再發送訊息` | Log in; only UUID DB rooms call `sendMessage` |
| Send succeeds locally but lost on refresh | Room id is mock/ephemeral — use real offer/inbox UUID room |
| Broken image / empty `src` | Ensure `listings.images` has Bunny URLs; `getOfferCardContext` refetches |
| No DB rooms, only mocks | User not logged in, or no `chat_rooms` rows for `auth.uid()` |
| Offer card missing in thread | Message lacks `specialData.offerId` — only first message per offer is special card |
| Counterparty message not visible | No Realtime yet — close and reopen chat to trigger `getUserChatInbox` |
