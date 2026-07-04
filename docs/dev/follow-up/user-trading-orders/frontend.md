# User Trading Orders — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** 🟡 Partial — list + **cancel/complete/review** wired; order detail + mock removal pending
- **Your focus:** Order detail page, drop mock when stable, profile review display — see [transaction-reviews/frontend.md](../transaction-reviews/frontend.md)

## Changelog (2026-07-04)

| Area | What changed |
|------|----------------|
| **Trading list page** | shadcn `Tabs` persona/status; **`activeReview` + single `ReviewModal`** at page root |
| **Data source** | `getUserTradingOrders` + mock merge; **`hasReviewedByMe`** drives 补評 button |
| **Status badges** | `renderStatusBadge()` maps DB + mock statuses to shadcn `Badge` variants |
| **`UserOrderRow`** | Pending: **確認完成交易** / **取消交易** (seller, with confirm dialog); completed: **✍️ 給予對手評價**; `onOpenReview` callback |
| **`UserOrderRow` cancel UX** | shadcn `AlertDialog` — **確認取消交易** shows counterparty, amount, re-list notice before `cancelMemberOrder` |
| **`UserOrderRow` meta** | **`建立時間`** — `formatOrderDateTime(order.createdAt)` (date + 24h time) beside order number |
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

| UI block | Implementation |
|----------|----------------|
| Persona control | shadcn `Tabs` — 全部 / 買單 / 賣單 |
| Status control | shadcn `Tabs` — 全部 / 待處理 / 已完成 / 已取消 |
| Search | Existing styled input; placeholder mentions 訂單編號 |
| Order list | `UserOrderRow` per merged row (DB first in sort, then mock by `createdAt`) |
| Order timestamp | DB rows: `建立時間` from `member_orders.created_at` via `formatOrderDateTime()` |
| Pagination | Client-side on merged `displayRows` |
| Needs-action banner | Counts DB pending + mock action-required orders |
| DB fetch error | Warning banner; **mock rows still shown** |

URL sync: `?filter=待處理` (etc.) maps to `tabStatus` via `TAB_STATUS_FROM_PARAM`.

### Row component: `app/components/user/UserOrderRow.tsx`

| Prop | Purpose |
|------|---------|
| `order` | `SaleOrder` display shape |
| `statusBadge?` | Overrides built-in `OrderStatusBadge` when provided |
| `orderNumber?` | Shown as `訂單編號: #…` (falls back to `order.id`) |
| `detailOrderId?` | UUID for `/profile/user/orderDetail/[id]` navigation |
| `onOpenReview?` | `(orderId, revieweeId) => void` — opens page-level `ReviewModal` |
| `dbOrderContext?` | DB-only: `orderId`, `revieweeId`, `dbStatus`, `hasReviewedByMe`, `canCancel`, `onRefresh` |

**Sub-row display (second line):** `{counterpartLabel}：{name}` · `訂單編號: #…` · `建立時間：{createdAt}`

DB rows: `mapTradingOrderToSaleOrder()` builds `SaleOrder` from `UserTradingOrder`, including:

```ts
createdAt: formatOrderDateTime(order.createdAt),
// zh-TW locale — e.g. "2026/07/04 22:30" (24h)
```

Mock rows use static date strings from `USER_MOCK_ORDERS_DB` (date only, no time).

**Pending actions (seller `canCancel`):**

| Button | Flow |
|--------|------|
| **確認完成交易** | Direct click → `completeMemberOrder` → refresh → `ReviewModal` |
| **取消交易** | Opens `AlertDialog` → **確認取消** → `cancelMemberOrder` → refresh; **返回** dismisses |

Cancel dialog copy references counterparty name, `HK$` amount, and that the listing returns to marketplace. Styling matches offer reject dialog in `OfferCard` (red border / destructive action).

### Mock data (temporary)

| Export | Used by |
|--------|---------|
| `USER_MOCK_ORDERS_DB` | Trading page (merged list) + `app/profile/user/(dashboard)/page.tsx` (overview pending strip) |

Remove mock from trading page once order detail + live data are stable.

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

```ts
import { getUserTradingOrders } from "@/app/actions/orders";

// Inside client component useEffect (see trading page):
const result = await getUserTradingOrders({
  persona,       // from Tabs state
  tabStatus,     // from Tabs state
  searchQuery: searchQuery.trim() || undefined,
});

if (result.success) {
  setDbOrders(result.data);
} else {
  setFetchError(result.error);
}
```

No dedicated hook yet — inline `useEffect` + debounce on `searchQuery`.

## Acceptance checklist

### List page (done / baseline)

- [x] Persona `Tabs` replace buy/sell checkboxes
- [x] Status `Tabs` drive `tabStatus` filter
- [x] Search debounced; calls `getUserTradingOrders`
- [x] Live orders render with counterparty name, grade, price, order number, **建立時間**
- [x] Mock orders remain visible alongside DB rows
- [x] DB load failure shows warning but keeps mock list
- [x] Pagination works on merged list
- [x] `?filter=待處理` deep-link syncs status tab
- [x] Pending DB orders: **確認完成交易** (both parties) + **取消交易** (seller, confirm dialog)
- [x] Cancel: **取消交易** opens confirm dialog; **確認取消** calls RPC; **返回** aborts
- [x] Complete success → `ReviewModal` opens (Track A)
- [x] Completed + `!hasReviewedByMe` → **✍️ 給予對手評價** (Track B)

### Remaining (frontend)

- [ ] **`orderDetail/[id]`** — load real `member_orders` row by UUID (not mock `LocalOrder`)
- [ ] **Remove `USER_MOCK_ORDERS_DB`** from trading list when live path verified
- [ ] **Overview page** (`/profile/user`) — pending strip from `getUserTradingOrders` instead of mock
- [ ] **Styling pass** — align shadcn Tabs with design system tokens (optional; current uses inline dark theme classes)
- [ ] **Loading UX** — subtle inline refresh indicator when DB refetches but mock already visible
- [ ] **Empty state** — distinguish "no DB orders" vs "no matches" if mock removed later

### Manual test

1. Apply migrations `20260704250000`, `20260704210000_order_actions_rpc`, `20260704280000` (see backend.md).
2. Log in → accept-offer flow → pending order on **`/profile/user/trading`**.
3. **確認完成交易** → review modal → submit 5-star review.
4. Seller: pending order → **取消交易** → confirm dialog → **確認取消** → listing reappears on marketplace.
5. Toggle persona/status tabs; search by order number / card name.
6. **已完成** tab → 补評 button only when `!hasReviewedByMe`.
7. Verify **建立時間** on DB order rows (locale date + 24h time).
8. Complete order in chat → `SystemOrderCompletedMessage` card → **查看我的訂單** closes chat and lands on trading list.
9. Click row → `/profile/user/orderDetail/<uuid>` (detail still mock).

## Related flows

| Flow | Link |
|------|------|
| Accept offer creates order | [offers-negotiation/backend.md](../offers-negotiation/backend.md) |
| Chat offer accept UI | [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md) |
| Complete order chat card + review CTA | [transaction-reviews/frontend.md](../transaction-reviews/frontend.md) |
| Trade history (product detail) | [marketplace-product-detail/backend.md](../marketplace-product-detail/backend.md) |
