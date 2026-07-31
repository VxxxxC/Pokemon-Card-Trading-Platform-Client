# Admin Payouts — Backend

> **Status:** Phase A ✅ · Phase B ✅ · Merchant ledger ✅ · Phase C ⏳  
> **Route:** `/admin/payouts`

## Phase A — Server actions

### `getAdminPayoutsPageData()`

```ts
{ success: true, data: {
  stripeBalance: { available, pending, todayIn, currency, lastSyncedAt } | null,
  stripeBalanceError?: string,
}}
```

- Auth: `requireAdmin()` + `createAdminClient()`
- Stripe: `getPlatformStripeBalance()` + `getPlatformStripeTodayInflow()` (HKT start-of-day, positive HKD net)

### `listAdminMerchantTransfers(input)`

```ts
type ListAdminMerchantTransfersInput = {
  page?: number;           // default 1
  pageSize?: number;       // default 10, max 50
  search?: string;
  statusFilter?: "all" | "paid" | "failed" | "processing" | "pending";
  sort?: "transferred_at-desc" | "transferred_at-asc" | "merchantName-asc" | "merchantName-desc";
  dateFrom?: string;       // ISO, transferred_at >=
  dateTo?: string;
};

{ success: true, data: {
  rows: MerchantTransferRow[],  // includes merchantId
  total: number,
  page: number,
  pageSize: number,
  totalPages: number,
  statusCounts: { all, paid, processing, pending, failed },
}}
```

- Base query: `merchant_orders` where `stripe_transfer_id IS NOT NULL`
- Server pagination: `.select(..., { count: "exact" }).range(offset, offset + pageSize - 1)`
- **`statusCounts`**: 5 parallel head-count queries with same search/date filters (ignores active `statusFilter`)
- Extended fields: `item_subtotal`, `commission_rate_applied`, `auth_fee`, `buyer_confirmed_at`, `stripe_payment_intent_id`, `requires_authentication`
- Join enrichment: `merchant_shops`, `kyc_records`, `profiles`, `merchant_ledgers` reconciliation
- `merchantName` sort: in-memory sort up to `MERCHANT_NAME_SORT_FETCH_CAP` (5000), then slice

### `listAdminMerchantTransfersForExport(input)`

- Same filters as list; fetches up to `MERCHANT_TRANSFERS_EXPORT_CAP` (2000) rows for CSV

### `refreshAdminStripeBalance()`

- `revalidatePath('/admin/payouts')`

### `getAdminFpsBatchSchedule()`

- Returns next Wednesday batch date + cutoff from `lib/admin-payouts/fps-batch-config.ts`

## Phase B — Migration `20260801120000_member_fps_payout.sql`

### Enums

- `member_seller_payout_status`: `none | held | ready | processing | paid | frozen | failed`
- `payout_request_status`: `pending | ready | processing | completed | failed`
- `payout_batch_status`: `draft | processing | completed`

### Tables

| Table | Purpose |
|-------|---------|
| `member_orders` + `buyer_confirmed_at`, `payout_hold_until`, `seller_payout_status` | T+3 hold state |
| `payout_requests` | 1:1 `member_orders`, FPS snapshot |
| `payout_batches` | Weekly batch audit |
| `profiles.fps_id` | Seller FPS ID |
| `platform_settings` | Seed `fps_payout_config` |

### RLS

- `payout_requests`: seller read own; admin all
- `payout_batches`: admin only

## Phase C — Deferred

1. **`confirmBuyerReceived`** — set `buyer_confirmed_at`, `payout_hold_until = confirmed + 3d`, `seller_payout_status = held`
2. **Cron** — when `payout_hold_until <= now()` and no dispute → insert `payout_requests` (`ready`), idempotent `UNIQUE(order_id)`
3. **Admin batch RPC** — group by `payout_batch_id`, mark `processing` → `completed` + `admin_fps_reference`
4. **`listPayoutRequests`** — replace FPS tab mock
5. **Member order detail** — seller sees `seller_payout_status` / FPS ref
6. **`updateUserProfile`** — persist `fps_id`

## Verify (Phase A + Merchant ledger)

```bash
bunx tsc --noEmit
bun run build:ci
# As admin: /admin/payouts → Stripe balance HK$ numeric; Merchant tab server pagination 10/page
```

## Verify (Phase B)

```bash
bunx supabase db push   # or apply migration in SQL editor
# Confirm types: payout_requests, payout_batches, platform_settings in types/supabase.ts
```
