# Admin grading workbench — backend

> **Status:** ✅ P1 Ready · 🟡 Partner QA  
> **Partner handoff:** [PARTNER_HANDOFF.md](./PARTNER_HANDOFF.md)

## Files

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260729190000_admin_grading_workbench.sql` | Schema, audit logs, admin RPCs, legacy refund saga, payout/receipt guards |
| `supabase/migrations/20260730100000_escrow_p0_manual_capture.sql` | P0 manual capture: `payment_capture_status`, authorize/auth-fee capture RPCs, grading cancel lock |
| `supabase/migrations/20260731100000_escrow_p1_goods_capture_fail_void.sql` | P1: `grading_fault_party`, goods capture + fail void RPCs, `fully_captured` guards |
| `lib/payments/auth-capture-saga.ts` | Admin intake auth-fee capture saga |
| `lib/payments/goods-capture-saga.ts` | Admin pass goods capture saga |
| `lib/payments/auth-grading-fail-void-saga.ts` | Admin fail void uncaptured balance saga |
| `app/actions/admin-grading.ts` | Production admin guard + queue search + mutations |
| `app/api/stripe/webhook/route.ts` | `payment_intent.succeeded` partial capture finalize; `payment_intent.canceled` void sync |
| `app/actions/orders.ts` | `submitMerchantLogistics` → `rpc_submit_merchant_auth_inbound_tracking` |

## Migrations / env

- Push: `bunx supabase db push`
- Regenerate types: `bun run supabase:types`
- Stripe webhook: `bun run stripe:webhook:sync`（Dashboard）或 `bun run stripe:webhook:listen`（本機）；事件清單見 `lib/stripe/webhook-events.ts`
- Uses existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Admin action contract

All exports return `{ success: true, data } | { success: false, error }`.

| Action | RPC / Stripe | Notes |
|--------|--------------|-------|
| `searchAdminGradingOrders` | `search_admin_grading_orders` | Tabs: `awaiting_intake \| grading \| awaiting_outbound \| closed` |
| `adminConfirmGradingIntake` | `rpc_prepare_auth_fee_capture` → `stripe.paymentIntents.capture(auth_fee, final_capture: false)` → `rpc_finalize_auth_fee_capture` | `auth_fee_captured`; Member `custody→grading`; Merchant `payment_held→authenticating` |
| `adminPassGrading` | `rpc_prepare_goods_capture` → `stripe.paymentIntents.capture(goods, final_capture: true)` → `rpc_finalize_goods_capture` | `fully_captured`; Member `grading→shipped`; Merchant `authenticating→authenticated` |
| `adminSubmitGradingOutbound` | `rpc_admin_submit_grading_outbound` | Requires `auth_result=passed` |
| `adminFailGradingAndRefund` | `rpc_prepare_auth_grading_fail` → `stripe.paymentIntents.cancel` → `rpc_finalize_auth_grading_fail` | **Void** uncaptured card+shipping; auth fee retained; `faultParty` required |
| `getAdminGradingAuditHistory` | `get_admin_grading_audit_history` | Admin read via session client |

Admin-triggered sagas (`run*Saga`) use session `createClient()` for prepare/finalize RPCs (`_grading_require_admin()` needs `auth.uid()`). Webhook `finalize*FromWebhook` and `rpc_mark_auth_grading_fail_failed` use service-role `createAdminClient()`.

**Multicapture prerequisite:** checkout PI must be created with `request_multicapture: if_available`. Orders created before this fix may have remainder released after intake; goods capture will fail with insufficient `amount_capturable` — open a new test order.

## Fail / void policy (P1)

- After intake (`auth_fee_captured`): fail releases **uncaptured** authorize via `paymentIntents.cancel`
- Buyer pays only HK$150 auth fee; no Stripe refund RPC on happy path
- `fault_party` enum: `buyer | seller | platform | carrier | inconclusive` (required on fail)
- Idempotency key: `auth-grading-fail-void:<orderKind>:<orderId>`
- Legacy `rpc_finalize_auth_refund` + `refund.created` webhook kept for manual recovery only

## Guards added

- `rpc_confirm_buyer_received`: `auth_result=passed` + `outbound_tracking_no` + `payment_capture_status=fully_captured`
- `rpc_prepare_merchant_order_payout`: auth orders require `fully_captured` + `authenticated` + outbound tracking
- `rpc_mark_auth_order_payment_voided`: only sets `voided` when `authorized` (not after partial capture)

## Verify (backend)

1. Non-admin session → all admin RPCs reject
2. Member: custody → intake → pass (`fully_captured`) → outbound → buyer confirm
3. Merchant auth: intake → pass → outbound → buyer confirm → payout
4. Fail on 100+30+150: captured 150 only; listing `active`; `fault_party` stored
5. Webhook replay `payment_intent.succeeded` (goods) idempotent
6. `bunx tsc --noEmit`, `bun run lint`, `bun run build:ci`
