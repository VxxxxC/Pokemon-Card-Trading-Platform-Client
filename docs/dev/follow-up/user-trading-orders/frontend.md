# User Trading Orders — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** 🟡 Partial — list + **P2P order detail** + cancel/complete/review wired; overview mock strip + profile review display pending
- **Your focus:** Drop overview mock when stable, profile review display — see [transaction-reviews/frontend.md](../transaction-reviews/frontend.md)

## Changelog

### 2026-07-05 (platform authentication — order detail branch)

| Area | What changed |
|------|----------------|
| **Fulfillment branch** | `MemberOrderDetailView` uses `order.useAuthentication` → `isMeetupOnlyMemberOrder()` |
| **`MemberAuthOrderTimeline`** | Five-step escrow timeline when auth opted in |
| **`MemberAuthOrderInvoice`** | Auth receipt — subtotal, shipping, subsidy, HK$150 service fee |
| **`MemberP2pOrderTimeline` / `MemberP2pOrderInvoice`** | Meetup-only path when `useAuthentication === false` |
| **Trading list** | `hasAuthenticationToggle` on row mapping from `order.useAuthentication` |
| **Upstream** | Buyer toggle in `ExecutionSlideOver`; `OfferCard` shows auth badge before accept |

### 2026-07-05 (order detail — P2P meetup UI)

| Area | What changed |
|------|----------------|
| **Detail route** | `app/profile/user/orderDetail/[id]/page.tsx` — loads live `member_orders` via `getMemberOrderDetail` (removed mock `LocalOrder` / escrow stepper) |
| **`MemberOrderDetailView`** | Main detail shell — persona badge, counterparty card, actions, gallery |
| **`MemberP2pOrderTimeline`** | Single-step timeline for meetup-only orders (`useAuthentication === false`) |
| **`MemberP2pOrderInvoice`** | Face-to-face receipt — subtotal + total only |
| **`MemberAuthOrderTimeline`** | Five-step auth escrow timeline when `useAuthentication === true` |
| **`MemberAuthOrderInvoice`** | Auth receipt with shipping / subsidy / service fee rows |
| **`app/lib/member-order/p2p.ts`** | `getP2pTimelineStep`, `isMeetupOnlyMemberOrder`, `MEMBER_AUTH_*` fee constants, formatters |
| **Actions on detail** | Pending: **確認完成交易** (both parties) + **取消交易** (seller, `canCancel`); completed: **✍️ 給予對手評價** + page-level `ReviewModal` |
| **Perspective** | **買入交易** / **賣出交易** from `order.persona`; counterparty label fixed (was always showing buyer) |

### 2026-07-05

| Area | What changed |
|------|----------------|
| **List fetch** | `searchUserTradingOrders` RPC — server pagination, `meta`, `filters` facet counts on tabs |
| **Search** | Order number, card name/number, **set code**, counterparty name/username |
| **Mock list** | Removed from trading page list (export `USER_MOCK_ORDERS_DB` kept for overview) |
| **Tabs** | Persona/status labels show counts when &gt; 0, e.g. `待處理 (3)` |

### 2026-07-05 (row layout)

| Area | What changed |
|------|----------------|
| **`UserOrderRow` hierarchy** | **Order number** is the primary headline on row 1 (`#…`); **card name** + grade on row 2 |

### 2026-07-04

| Area | What changed |
|------|----------------|
| **Trading list page** | shadcn `Tabs` persona/status; **`activeReview` + single `ReviewModal`** at page root |
| **Data source** | `getUserTradingOrders` + mock merge; **`hasReviewedByMe`** drives 补評 button |
| **Status badges** | `renderStatusBadge()` maps DB + mock statuses to shadcn `Badge` variants |
| **`UserOrderRow`** | Pending: **確認完成交易** / **取消交易** (seller, with confirm dialog); completed: **✍️ 給予對手評價**; `onOpenReview` callback |
| **`UserOrderRow` cancel UX** | shadcn `AlertDialog` — **確認取消交易** shows counterparty, amount, re-list notice before `cancelMemberOrder` |
| **`UserOrderRow` meta** | **`建立時間`** — `formatOrderDateTime(order.createdAt)` (date + 24h time) on row 2 |
| **`ReviewModal`** | `app/components/trading/ReviewModal.tsx` — see [transaction-reviews](../transaction-reviews/) |
| **Chat completion card** | `SystemOrderCompletedMessage` in chat after `SYSTEM_ORDER_COMPLETED`; review CTA when `!hasReviewedByMe`; **查看我的訂單** closes chat overlay — see [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) |
| **shadcn** | `components/ui/badge.tsx`, `components/ui/tabs.tsx` |

## UI touchpoints

### Primary page: `app/profile/user/(dashboard)/trading/page.tsx`

Route: **`/profile/user/trading`**

| State | Type | Purpose |
|-------|------|---------|
| `persona` | `'all' \| 'buy' \| 'sell'` | 全部 / 買單 / 賣單 |
| `tabStatus` | `'all' \| 'pending' \| 'completed' \| 'cancelled'` | 狀態分頁 |
| `searchQuery` | `string` | 搜尋（300ms debounce → server action） |
| `currentPage` | `number` | Server page (resets on filter/search change) |
| `itemsPerPage` | `number` | 5 mobile / 8 desktop → RPC `pageSize` |
| `paginationMeta` | `TradingOrdersPaginationMeta` | `total`, `totalPages`, `rangeStart`, `rangeEnd` |
| `filterCounts` | `TradingOrdersFilterCounts` | Tab counts + needs-action banner |

| UI block | Implementation |
|----------|----------------|
| Persona control | shadcn `Tabs` — labels with counts, e.g. `買單 (2)` |
| Status control | shadcn `Tabs` — labels with counts, e.g. `待處理 (3)` |
| Search | Debounced `searchUserTradingOrders`; matches order #, card name/number, set code, counterparty |
| Order list | `UserOrderRow` per RPC page row (DB only) |
| Order timestamp | `建立時間` from `member_orders.created_at` via `formatOrderDateTime()` |
| Pagination | Server-side — `Pagination` uses `paginationMeta` |
| Needs-action banner | `filterCounts.needsAction` from RPC |
| DB fetch error | Warning banner only (no mock fallback on list) |

URL sync: `?filter=待處理` (etc.) maps to `tabStatus` via `TAB_STATUS_FROM_PARAM`.

### Row component: `app/components/user/UserOrderRow.tsx`

| Prop | Purpose |
|------|---------|
| `order` | `SaleOrder` display shape |
| `statusBadge?` | Overrides built-in `OrderStatusBadge` when provided |
| `orderNumber?` | Human-facing ID for row 1 headline — rendered as `#…` (falls back to `order.id`) |
| `detailOrderId?` | UUID for `/profile/user/orderDetail/[id]` navigation |
| `onOpenReview?` | `(orderId, revieweeId) => void` — opens page-level `ReviewModal` |
| `dbOrderContext?` | DB-only: `orderId`, `revieweeId`, `dbStatus`, `hasReviewedByMe`, `canCancel`, `onRefresh` |

**Row layout (visual hierarchy):**

| Row | Content |
|-----|---------|
| **1 (primary)** | 買入/賣出 role badge · status badge · **`#orderNumber`** (large mono brand headline) |
| **2 (metadata)** | `{cardName}` · grade badge · `{counterpartLabel}：{name}` · `建立時間：{createdAt}` |

DB rows pass `orderNumber={order.orderNumber}` from `UserTradingOrder.orderNumber`.

`mapTradingOrderToSaleOrder()` builds `SaleOrder` from `UserTradingOrder`, including:

```ts
createdAt: formatOrderDateTime(order.createdAt),
// zh-TW locale — e.g. "2026/07/04 22:30" (24h)
```

**Pending actions (seller `canCancel`):**

| Button | Flow |
|--------|------|
| **確認完成交易** | Direct click → `completeMemberOrder` → refresh → `ReviewModal` |
| **取消交易** | Opens `AlertDialog` → **確認取消** → `cancelMemberOrder` → refresh; **返回** dismisses |

Cancel dialog copy references counterparty name, `HK$` amount, and that the listing returns to marketplace. Styling matches offer reject dialog in `OfferCard` (red border / destructive action).

### Order detail page: `app/profile/user/orderDetail/[id]/page.tsx`

Route: **`/profile/user/orderDetail/[id]`** — **member P2P only** (`member_orders`). Merchant B2C uses separate `/profile/merchant/orderDetail/[id]`.

| Piece | Role |
|-------|------|
| `page.tsx` | Client shell — `getMemberOrderDetail`, loading/error, `ReviewModal` host |
| `MemberOrderDetailView` | Layout + pending/complete/cancel CTAs + listing image carousel; branches timeline/invoice |
| `MemberP2pOrderTimeline` | Simplified meetup status copy |
| `MemberP2pOrderInvoice` | Subtotal + total (meetup) |
| `MemberAuthOrderTimeline` | Auth escrow five-step chain |
| `MemberAuthOrderInvoice` | Full fee breakdown (auth) |

**Data fetch:**

```ts
import { getMemberOrderDetail } from "@/app/actions/orders";

const result = await getMemberOrderDetail(orderId);
// result.data: MemberOrderDetail (persona, finalPrice, status, counterparty, listing, product, canCancel, …)
```

**Fulfillment mode:** branch on **`order.useAuthentication`** (`member_orders.use_authentication`):

| `useAuthentication` | Timeline | Invoice |
|---------------------|----------|---------|
| `false` | `MemberP2pOrderTimeline` — single-step meetup copy | `MemberP2pOrderInvoice` — subtotal + total |
| `true` | `MemberAuthOrderTimeline` — five-step escrow | `MemberAuthOrderInvoice` — shipping + subsidy + HK$150 auth fee |

Set at offer time via `ExecutionSlideOver` toggle → inherited on accept. See [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md).

**P2P timeline mapping** (`getP2pTimelineStep` in `app/lib/member-order/p2p.ts`) — meetup path only:

| DB `status` | UI headline | Description |
|-------------|-------------|-------------|
| `pending`, `meetup_arranged` | 進行中 | 雙方交收溝通中，請在面交現場點清錢貨後點擊確認 |
| `completed` | 已完成 | 交易已順利結束，雙盲評價已解鎖 |
| `cancelled` | 已取消 | 交易已中止，商品已重新上架大盤 |

**Invoice (meetup):** Hides shipping / platform subsidy rows. Shows **商品最終成交價** + **最終扣款總額** (buyer) or **最終實收總額** (seller).

**Invoice (auth):** See `MemberAuthOrderInvoice` — 順豐運費、平台補貼、鑑定服務費 (HK$150).

**Pending actions (detail):** Same RPCs as list row — `completeMemberOrder`, `cancelMemberOrder` (seller + `canCancel`); complete success opens `ReviewModal`.

### Mock data (temporary)

| Export | Used by |
|--------|---------|
| `USER_MOCK_ORDERS_DB` | `app/profile/user/(dashboard)/page.tsx` (overview pending strip only) |

Removed from trading list — live RPC only.

### Badge mapping: `renderStatusBadge(status)`

| Status | Badge |
|--------|-------|
| `pending`, `meetup_arranged` | 待處理 (amber) |
| `in_custody` | 保管中 (blue) |
| `grading` | 鑑定中 (purple) |
| `completed` | 已完成 (`variant="success"`) |
| `cancelled` | 已取消 (`variant="destructive"`) |

Mock statuses mapped via `mockStatusToBadgeKey()` (`payment` → `pending`, `custody`/`shipped` → `in_custody`, `released` → `completed`).

## API usage

**List:**

```ts
import { searchUserTradingOrders } from "@/app/actions/orders";

const result = await searchUserTradingOrders({
  persona,
  tabStatus,
  searchQuery: searchQuery.trim() || undefined,
  page: currentPage,
  pageSize: itemsPerPage,
});

if (result.success) {
  setDbOrders(result.data);
  setPaginationMeta(result.meta);
  setFilterCounts(result.filters);
}
```

**Detail:**

```ts
import { getMemberOrderDetail } from "@/app/actions/orders";

const result = await getMemberOrderDetail(orderId);
if (result.success) {
  setOrder(result.data);
}
```

No dedicated hook yet — inline `useEffect` on list + detail pages.

## Acceptance checklist

### List page (done / baseline)

- [x] Persona `Tabs` replace buy/sell checkboxes
- [x] Status `Tabs` drive `tabStatus` filter
- [x] Search debounced; calls `searchUserTradingOrders` with server pagination
- [x] Live orders render with order number headline, card name + grade, counterparty, price, **建立時間**
- [x] Tab labels show facet counts from `filterCounts`
- [x] Pagination driven by `paginationMeta` (`total`, `rangeStart`/`rangeEnd`)
- [x] Needs-action banner uses `filterCounts.needsAction`
- [x] `?filter=待處理` deep-link syncs status tab
- [x] Pending DB orders: **確認完成交易** (both parties) + **取消交易** (seller, confirm dialog)
- [x] Cancel: **取消交易** opens confirm dialog; **確認取消** calls RPC; **返回** aborts
- [x] Complete success → `ReviewModal` opens (Track A)
- [x] Completed + `!hasReviewedByMe` → **✍️ 給予對手評價** (Track B)

### Order detail (done / baseline)

- [x] Load real `member_orders` row by UUID via `getMemberOrderDetail`
- [x] P2P meetup timeline — single step per status (when `useAuthentication === false`)
- [x] **Auth escrow timeline + invoice** — when `order.useAuthentication === true`
- [x] Invoice — meetup: subtotal + total; auth: fee breakdown via `MemberAuthOrderInvoice`
- [x] **買入交易** / **賣出交易** badge from `persona`
- [x] Counterparty block shows correct 買家/賣家 label
- [x] Pending: **確認完成交易** + seller **取消交易** (`canCancel`)
- [x] Complete success → `ReviewModal`; completed + `!hasReviewedByMe` → 补評 CTA
- [x] Listing image carousel from `listingImageUrls` (fallback catalog image)

### Remaining (frontend)

- [ ] **Remove `USER_MOCK_ORDERS_DB`** from overview page when live path verified
- [ ] **Overview page** (`/profile/user`) — pending strip from `getUserTradingOrders` instead of mock
- [ ] **Styling pass** — align detail + shadcn Tabs with design system tokens (optional)
- [ ] **Loading UX** — subtle inline refresh indicator when DB refetches
- [ ] **Empty state** — distinguish "no DB orders" vs "no matches" on list

### Manual test

1. Apply migrations through **`20260705140000`**.
2. Log in → make offer **with auth toggle on** → seller accept → pending order on **`/profile/user/trading`**.
3. Detail page shows auth timeline + invoice; repeat flow with toggle off → meetup UI.
4. **確認完成交易** → review modal → submit 5-star review.
4. Seller: pending order → **取消交易** → confirm dialog → **確認取消** → listing reappears on marketplace.
5. Toggle persona/status tabs; search by order number / card name.
6. **已完成** tab → 补評 button only when `!hasReviewedByMe`.
7. Row 1 shows **`#orderNumber`** as the dominant label; row 2 shows card name, grade badge, counterparty, **建立時間**.
8. Verify **建立時間** on DB order rows (locale date + 24h time).
9. Complete order in chat → `SystemOrderCompletedMessage` card → **查看我的訂單** closes chat and lands on trading list.
10. Click row → **`/profile/user/orderDetail/<uuid>`** — meetup vs auth UI per `useAuthentication`.
11. On detail: seller **取消交易** → confirm → listing reappears; either party **確認完成交易** → review modal.
12. Completed detail → **✍️ 給予對手評價** when `!hasReviewedByMe`.

## Related flows

| Flow | Link |
|------|------|
| Accept offer creates order | [offers-negotiation/backend.md](../offers-negotiation/backend.md) |
| Chat offer accept UI | [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md) |
| Complete order chat card + review CTA | [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) |
| Trade history (product detail) | [marketplace-product-detail/backend.md](../marketplace-product-detail/backend.md) |
