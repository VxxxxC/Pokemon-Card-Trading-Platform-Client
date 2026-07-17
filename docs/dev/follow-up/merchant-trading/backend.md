# Merchant Trading Orders — Backend Handoff

## Status

- **Backend:** ✅ Ready (list RPC + `getMerchantOrderDetail` + stub `submitMerchantLogistics`)
- **Frontend:** ✅ Wired — `/profile/merchant/trading` list + `/profile/merchant/orderDetail/[id]` detail
- **Stripe / mutations:** ⏳ Deferred — Connect, PaymentIntent, webhooks, `completeMerchantOrder` RPC not shipped

## Changelog

### 2026-07-17 (merchant order detail)

| Change | Detail |
|--------|--------|
| **`getMerchantOrderDetail`** | Single-order read for seller (`merchant_id = auth.uid()`) |
| **`resolveMerchantOrderIdForMerchant`** | UUID or `ORD-*` → `merchant_orders.id` |
| **`submitMerchantLogistics`** | Stub — returns `商戶發貨功能即將推出` |
| **`getMerchantSellerActionFlags`** | `canSubmitLogistics`, `canReviewBuyer` |

### 2026-07-17 (merchant trading list)

| Change | Detail |
|--------|--------|
| **Migration `20260717150000`** | `search_merchant_trading_orders` RPC; `fn_merchant_order_is_open`; `fn_merchant_order_needs_seller_action`; `fn_merchant_order_is_auth_in_progress`; `merchant_orders_participant_read` RLS |
| **`searchMerchantTradingOrders`** | Server action in `app/actions/orders.ts` |
| **Dual fulfillment** | `requires_authentication` on `merchant_orders` — buyer opt-in at checkout (Stripe milestone) |

## B2C fulfillment model

| Signal | Column | Notes |
|--------|--------|-------|
| Buyer auth opt-in | `merchant_orders.requires_authentication` | Set at B2C checkout (future) |
| Escrow state | `merchant_orders.escrow_status` | `escrow_state` enum |
| Funds | Stripe Escrow | Full pay → hold until buyer confirms receipt → `completed_and_transferred` |

### `escrow_state` → tab filters

| Tab | Filter |
|-----|--------|
| 待處理 (`pending`) | `payment_held`, `authenticating`, `authenticated` (+ sub-filters) |
| 已完成 (`completed`) | `completed_and_transferred` |
| 已取消 (`cancelled`) | `refunded` |

### Pending sub-filters

| UI checkbox | RPC param | SQL |
|-------------|-----------|-----|
| 待付款 | `p_include_payment_pending` | `escrow_status = 'payment_held'` |
| 鑑定中 | `p_include_auth_in_progress` | `requires_authentication = true` AND `escrow_status IN ('authenticating','authenticated')` |

> **Copy note:** UI label「待付款」in B2C means **buyer already paid (Stripe held)** — merchant must ship. Not awaiting buyer payment.

### Needs-action banner

`count_needs_action` = orders where `escrow_status = 'payment_held'` (merchant must ship to platform or buyer).

## Server action: `getMerchantOrderDetail`

```ts
import {
  getMerchantOrderDetail,
  type MerchantOrderDetail,
  type GetMerchantOrderDetailResult,
} from "@/app/actions/orders";
```

| Param | Notes |
|-------|-------|
| `orderId` | `merchant_orders.id` (UUID) or `order_number` (`ORD-2026-*`) |

Auth: **seller only** — `merchant_id` must equal `auth.uid()`.

`MerchantOrderDetail` extends `MerchantTradingOrder` with:

| Field | Source |
|-------|--------|
| `listingId` | `merchant_orders.listing_id` |
| `listingImageUrls` | Parsed from `listings.images` |
| `logisticsProofPath` | `merchant_orders.logistics_proof_path` |
| `canSubmitLogistics` | `escrow_status === 'payment_held'` |
| `canReviewBuyer` | `completed_and_transferred` && `!hasReviewedByMe` |

### Stub: `submitMerchantLogistics(orderId, trackingNo)`

Returns `{ success: false, error: "商戶發貨功能即將推出" }` until Stripe milestone.

## Server action: `searchMerchantTradingOrders`

```ts
import {
  searchMerchantTradingOrders,
  type GetMerchantTradingOrdersInput,
  type MerchantTradingOrder,
  type MerchantTradingFilterCounts,
} from "@/app/actions/orders";
```

### Input

```ts
type GetMerchantTradingOrdersInput = {
  tabStatus: "all" | "pending" | "completed" | "cancelled";
  searchQuery?: string;
  page?: number;      // default 1
  pageSize?: number;  // default 8, max 50
  includePaymentPending?: boolean;  // default true
  includeAuthInProgress?: boolean;  // default true
};
```

Auth: RPC filters `merchant_id = auth.uid()` (seller dashboard only).

### Success response

```ts
{
  success: true,
  data: MerchantTradingOrder[];
  meta: TradingOrdersPaginationMeta;
  filters: {
    status: { all, pending, completed, cancelled };
    needsAction: number;
    pendingSub: { payment, authInProgress };
  };
}
```

### RPC

```sql
SELECT * FROM search_merchant_trading_orders(
  p_tab_status := 'pending',
  p_search_query := '皮卡丘',
  p_page := 1,
  p_page_size := 8,
  p_include_payment_pending := true,
  p_include_auth_in_progress := true
);
```

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260717150000_search_merchant_trading_orders.sql` | RPC + helpers + RLS |
| `app/actions/orders.ts` | `searchMerchantTradingOrders`, `getMerchantOrderDetail`, stubs |
| `lib/merchant-order/resolve-order-id.ts` | Merchant order ID resolve |
| `app/lib/merchant-order/merchant-seller-actions.ts` | Seller action flags |
| `lib/merchant-order/constants.ts` | Tab URL mapping, page sizes |
| `app/lib/merchant-order/map-sale-order.ts` | `escrow_state` → `SaleOrder` for row UI |

## Stripe deferred (do not implement in this flow)

- `app/checkout/[id]` real PaymentIntent
- `stripe_payment_intent_id` webhook writes
- `rpc_complete_merchant_order` / buyer confirm receipt
- See [merchant_checkout_follow_up.md](../merchant_checkout_follow_up.md)

## How to verify

```bash
bunx supabase db push
```

Seed (service role / SQL editor):

```sql
INSERT INTO merchant_orders (
  buyer_id, merchant_id, listing_id, final_price,
  escrow_status, requires_authentication, order_number
) VALUES (
  '<buyer_uuid>', '<merchant_uuid>', '<listing_uuid>', 1200,
  'payment_held', true, 'ORD-2026-TEST01'
);
```

1. Log in as merchant → `/profile/merchant/trading`
2. Expect row with `#ORD-2026-TEST01`, needs-action banner if `payment_held`
3. Tab / search / sub-filters / pagination

```bash
bunx tsc --noEmit
bun run build:ci
```
