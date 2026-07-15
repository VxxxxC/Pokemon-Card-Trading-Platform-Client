# User Trading Orders — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** 🟡 Partial — list + **P2P order detail** + cancel/complete/review wired; overview mock strip + profile review display pending
- **Your focus:** Drop overview mock when stable, profile review display — see [transaction-reviews/frontend.md](../transaction-reviews/frontend.md)

## Changelog

### 2026-07-07 (SSR + useUserTrading)

| Area | What changed |
|------|----------------|
| **Page split** | `page.tsx` → Suspense shell; `UserTradingPageData` SSR bootstrap; `UserTradingClient` UI |
| **`useUserTrading`** | `initialData`, debounced search, responsive pageSize, `refetch` / `isRefreshing` |
| **Removed** | `USER_MOCK_ORDERS_DB`, `useSyncExternalStore` mount gate, duplicate mappers |
| **`ReviewModal`** | `next/dynamic` — load on review action only |
| **Perf report** | [PERF_REPORT.md](./PERF_REPORT.md) |

### 2026-07-15 (buyer-only P2P complete restore)

| Area | What changed |
|------|----------------|
| **`UserOrderRow`** | Pending P2P complete CTA for **buyer only** (`isBuyer && pending && !auth`) |
| **`MemberOrderDetailView`** | Confirm dialog buyer-only; seller sees wait-for-buyer copy |

### 2026-07-07 (buyer-only complete + handover confirm dialog)

| Area | What changed |
|------|----------------|
| **Complete permission** | Only **buyer** may call `completeMemberOrder` / `rpc_complete_member_order` (migration `20260707130000`) |
| **`MemberOrderCompleteConfirmDialog`** | New shared `AlertDialog` — buyer must tick 3 inspection checkboxes + acknowledge legal disclaimer before **確認完成交收** |
| **`UserOrderRow`** | Complete CTA for buyer only on pending P2P; opens confirm dialog |
| **`MemberOrderDetailView`** | Same for buyer; seller sees wait-for-buyer copy |
| **`app/lib/member-order/p2p.ts`** | Timeline copy: 由買家確認結案 |

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
| **Actions on detail** | Pending: **確認完成交易** (**buyer only**, handover confirm dialog) + **取消交易** (seller, `canCancel`); completed: **✍️ 給予對手評價** + page-level `ReviewModal` |
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
| **`UserOrderRow`** | Pending: **確認完成交易** (buyer, handover confirm dialog) / **取消交易** (seller, cancel `AlertDialog`); completed: **✍️ 給予對手評價**; `onOpenReview` callback |
| **`UserOrderRow` cancel UX** | shadcn `AlertDialog` — **確認取消交易** shows counterparty, amount, re-list notice before `cancelMemberOrder` |
| **`UserOrderRow` meta** | **`建立時間`** — `formatOrderDateTime(order.createdAt)` (date + 24h time) on row 2 |
| **`ReviewModal`** | `app/components/trading/ReviewModal.tsx` — see [transaction-reviews](../transaction-reviews/) |
| **Chat completion card** | `SystemOrderCompletedMessage` in chat after `SYSTEM_ORDER_COMPLETED`; review CTA when `!hasReviewedByMe`; **查看我的訂單** closes chat overlay — see [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) |
| **shadcn** | `components/ui/badge.tsx`, `components/ui/tabs.tsx` |

## UI touchpoints

### Primary page: `/profile/user/trading`

| File | Role |
|------|------|
| `app/profile/user/(dashboard)/trading/page.tsx` | Server `Suspense` shell + `searchParams.filter` |
| `app/profile/user/(dashboard)/trading/UserTradingPageData.tsx` | SSR `searchUserTradingOrders` bootstrap |
| `app/profile/user/(dashboard)/trading/UserTradingClient.tsx` | Search, tabs, order list, `ReviewModal` |
| `app/profile/user/(dashboard)/trading/UserTradingSkeleton.tsx` | Streaming fallback |
| `app/lib/hooks/useUserTrading.ts` | Data hook (`initialData`, `refetch`, responsive pageSize) |
| `app/lib/member-order/map-sale-order.ts` | `mapTradingOrderToSaleOrder` |
| `app/lib/member-order/perf-log-client.ts` | Client mount timing |

Route: **`/profile/user/trading`**

| State | Type | Purpose |
|-------|------|---------|
| `persona` | `'all' \| 'buy' \| 'sell'` | 全部 / 買單 / 賣單 |
| `tabStatus` | `'all' \| 'pending' \| 'completed' \| 'cancelled'` | 狀態分頁 |
| `searchQuery` | `string` | 搜尋（300ms debounce → server action） |
| `currentPage` | `number` | Managed by `useUserTrading` `setPage` |
| `itemsPerPage` | `number` | 5 mobile / 8 desktop (hook-managed) |
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
| `dbOrderContext?` | DB-only: `orderKind` (`member` \| `merchant`), `orderId`, `revieweeId`, `dbStatus`, `hasReviewedByMe`, `canCancel`, `onRefresh` |

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

**Pending actions (buyer complete / seller cancel):**

| Button | Who | Flow |
|--------|-----|------|
| **確認完成交易** | Buyer only | Opens `MemberOrderCompleteConfirmDialog` → tick 3 inspection items + read legal disclaimer → **確認完成交收** → `completeMemberOrder` → refresh → `ReviewModal` |
| **取消交易** | Seller (`canCancel`) | Opens cancel `AlertDialog` → **確認取消** → `cancelMemberOrder` → refresh; **返回** dismisses |

**`MemberOrderCompleteConfirmDialog`** (`app/components/user/MemberOrderCompleteConfirmDialog.tsx`):

| Block | Copy |
|-------|------|
| Title | 確認完成交收 |
| Checklist (all required) | 官方卡牌編號與稀有度標籤（如 SAR/UR/SR）；實物表面狀態（卡角、刮痕等細節）；確信此卡為正品 |
| Legal | 平台作為第三方提供商，在此確認後將不再受理任何關於此卡真偽、品相的售後爭議與賠償要求。此操作不可逆轉。 |
| Confirm CTA | Disabled until all checkboxes ticked |

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
| `pending`, `meetup_arranged` | 進行中 | 買賣雙方約定時間交收，請在面交現場點清錢貨後由買家確認結案 |
| `completed` | 已完成 | 交易已順利結束，雙盲評價已解鎖 |
| `cancelled` | 已取消 | 交易已中止，商品已重新上架大盤 |

**Invoice (meetup):** Hides shipping / platform subsidy rows. Shows **商品最終成交價** + **最終扣款總額** (buyer) or **最終實收總額** (seller).

**Invoice (auth):** See `MemberAuthOrderInvoice` — 順豐運費、平台補貼、鑑定服務費 (HK$150).

**Pending actions (detail):** Buyer → `MemberOrderCompleteConfirmDialog` → `completeMemberOrder`; seller → `cancelMemberOrder` when `canCancel`; complete success opens `ReviewModal`.

### Mock data

Removed — overview and trading list both use live `searchUserTradingOrders`.

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

**List (hook — preferred):**

```ts
import { useUserTrading } from "@/app/lib/hooks/useUserTrading";

const {
  orders,
  paginationMeta,
  filterCounts,
  isLoading,
  isRefreshing,
  refetch,
  setPage,
} = useUserTrading({
  persona,
  tabStatus,
  searchQuery,
  initialData, // from UserTradingPageData SSR
});
```

**List (direct action):**

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

No dedicated detail hook — inline fetch on detail page.

**Perf report:** [PERF_REPORT.md](./PERF_REPORT.md)

## Acceptance checklist

### List page (done / baseline)

- [x] SSR HTML includes first page orders + tab counts (`initialData`)
- [x] Hydrate 後首屏唔重複 RPC（initial list key 命中）
- [x] Status `Tabs` drive `tabStatus` filter
- [x] Search debounced; calls `searchUserTradingOrders` with server pagination
- [x] Live orders render with order number headline, card name + grade, counterparty, price, **建立時間**
- [x] Tab labels show facet counts from `filterCounts`
- [x] Pagination driven by `paginationMeta` (`total`, `rangeStart`/`rangeEnd`)
- [x] Needs-action banner uses `filterCounts.needsAction`
- [x] `?filter=待處理` deep-link syncs status tab
- [x] Pending DB orders: **確認完成交易** (buyer, handover confirm dialog) + **取消交易** (seller, cancel dialog)
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
- [x] Pending: buyer **確認完成交易** (handover dialog) + seller **取消交易** (`canCancel`)
- [x] Complete success → `ReviewModal`; completed + `!hasReviewedByMe` → 补評 CTA
- [x] Listing image carousel from `listingImageUrls` (fallback catalog image)

### Remaining (frontend)

- [ ] **Remove `USER_MOCK_ORDERS_DB`** from overview page when live path verified
- [ ] **Overview page** (`/profile/user`) — pending strip from `getUserTradingOrders` instead of mock
- [ ] **Styling pass** — align detail + shadcn Tabs with design system tokens (optional)
- [ ] **Loading UX** — subtle inline refresh indicator when DB refetches
- [ ] **Empty state** — distinguish "no DB orders" vs "no matches" on list

### Manual test

1. Apply migrations through **`20260707130000`**.
2. Log in → make offer **with auth toggle on** → seller accept → pending order on **`/profile/user/trading`**.
3. Detail page shows auth timeline + invoice; repeat flow with toggle off → meetup UI.
4. **Buyer:** **確認完成交易** → handover confirm dialog (tick all 3 + legal) → **確認完成交收** → review modal → submit 5-star review.
5. **Seller:** pending order → **取消交易** → confirm dialog → **確認取消** → listing reappears on marketplace.
6. Toggle persona/status tabs; search by order number / card name.
7. **已完成** tab → 补評 button only when `!hasReviewedByMe`.
8. Row 1 shows **`#orderNumber`** as the dominant label; row 2 shows card name, grade badge, counterpart, **建立時間**.
9. Verify **建立時間** on DB order rows (locale date + 24h time).
10. Complete order in chat → `SystemOrderCompletedMessage` card → **查看我的訂單** closes chat and lands on trading list.
11. Click row → **`/profile/user/orderDetail/<uuid>`** — meetup vs auth UI per `useAuthentication`.
12. On detail: seller **取消交易** → confirm → listing reappears; **buyer** **確認完成交易** → handover dialog → review modal.
13. Seller pending detail: no complete button; copy says wait for buyer confirmation.
14. Completed detail → **✍️ 給予對手評價** when `!hasReviewedByMe`.

## Related flows

| Flow | Link |
|------|------|
| Accept offer creates order | [offers-negotiation/backend.md](../offers-negotiation/backend.md) |
| Chat offer accept UI | [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md) |
| Complete order chat card + review CTA | [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) |
| Trade history (product detail) | [marketplace-product-detail/backend.md](../marketplace-product-detail/backend.md) |
