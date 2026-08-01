# Member FPS Payout Pipeline — Backend

> **Status:** ✅ Ready (Phase 1A / 1B / 1C)  
> **Migration:** `supabase/migrations/20260802120000_member_fps_payout_pipeline.sql`

## Overview

Auth C2C orders (`member_orders.use_authentication = true`):

1. Buyer `confirmBuyerReceived` → T+3 hold on order (`seller_payout_status = 'held'`)
2. Hourly cron lists eligible orders → inserts `payout_requests` → `seller_payout_status = 'ready'`
3. Seller `profiles.fps_id` collected via settings / order-detail dialog (soft remind only)

Payout amount (v1): `payout_requests.amount = member_orders.final_price`.

## 1A — `rpc_confirm_buyer_received` patch

On successful buyer confirm (existing release logic unchanged), additionally sets:

| Column | Value |
|--------|--------|
| `buyer_confirmed_at` | `now()` |
| `payout_hold_until` | `now() + interval '3 days'` |
| `seller_payout_status` | `'held'` |

Scope: auth orders only (RPC already requires `use_authentication = true`).

**No** `payout_requests` insert in this RPC.

## 1B — Cron RPCs

### `rpc_list_member_fps_payout_ready_candidates(p_limit int default 50)`

Returns `{ order_id }[]` where:

- `use_authentication = true`
- `seller_payout_status = 'held'`
- `payout_hold_until <= now()`
- `buyer_confirmed_at IS NOT NULL`
- `status = 'completed'` AND `escrow_status = 'released'`
- `payment_capture_status = 'fully_captured'`
- `refund_status` empty / `'none'`
- No existing `payout_requests` row
- `seller_payout_status != 'frozen'`

### `rpc_finalize_member_fps_payout_ready(p_order_id uuid)`

Idempotent (`ON CONFLICT (order_id) DO NOTHING`):

1. Re-validates candidate conditions
2. Loads `seller_id`, `final_price`, `profiles.fps_id`
3. `INSERT INTO payout_requests`:
   - `amount := final_price`
   - `fps_id_snapshot := COALESCE(NULLIF(TRIM(fps_id), ''), 'PENDING_FPS')`
   - `status := 'ready'` if fps_id **and** fps_name present else `'pending'`
4. `UPDATE member_orders SET seller_payout_status = 'ready'`

Grant: `service_role` only.

### Cron route

`GET /api/cron/member-fps-payout-ready`

- File: `app/api/cron/member-fps-payout-ready/route.ts`
- Batch 50 → loop finalize RPC
- Response: `{ success, scanned, inserted, errors }`
- Schedule: hourly in `vercel.json`
- Auth: `CRON_SECRET` — see [server.md](../../server.md) §9

## 1C — Profile actions

| Action | Change |
|--------|--------|
| `getUserSettings` | Select + return `fpsId` from `profiles.fps_id` |
| `updateUserProfile` | Persist `fps_id` from form field `fpsId` |
| `updateUserFpsId(fpsId, fpsName)` | Validate via `validateFpsPayoutDetails`, update `profiles.fps_id` + `fps_name` |

## Order detail extensions

`getMemberOrderDetail` (sell persona + auth orders):

- `sellerFpsId` — from seller profile join `fps_id`
- `sellerPayoutStatus`, `payoutHoldUntil`, `buyerConfirmedAt` — from `member_orders`

## Verify

```bash
bunx supabase db push
bunx tsc --noEmit && bun run lint && bun run build:ci
```

**Manual:**

1. Buyer confirms auth order → SQL: `seller_payout_status='held'`, `payout_hold_until` ~ +3d
2. Backdate `payout_hold_until` → run cron → row in `payout_requests`
3. Admin `/admin/payouts` FPS tab lists live row
4. Seller with FPS **name + ID** at cron → `status=ready`; missing either → `pending` + `PENDING_FPS` / `PENDING_FPS_NAME` snapshot

**Stripe E2E（開通後）：** [e2e-checklist.md](./e2e-checklist.md)
