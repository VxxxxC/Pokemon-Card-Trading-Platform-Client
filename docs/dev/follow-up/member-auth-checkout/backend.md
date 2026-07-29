# Member Auth Checkout — Backend

## Scope

Member C2C orders with `use_authentication=true` only. P2P without auth has no Stripe flow.

## Migration

`20260729150000_member_auth_stripe_payment.sql`

- Columns: `item_subtotal`, `auth_fee`, `total_amount`, `stripe_payment_intent_id`
- `rpc_prepare_member_auth_order_payment`
- `rpc_attach_member_auth_order_payment_intent`
- `rpc_mark_member_auth_order_paid` (service_role / webhook)

## Server actions — `app/actions/member-auth-checkout.ts`

| Action | Role |
|--------|------|
| `loadMemberAuthCheckoutOrder` | buyer/seller read snapshot |
| `createMemberAuthPaymentIntent` | buyer — PI create/attach |
| `getMemberAuthPaymentStatus` | poll after pay → `custody` |
| `isMemberAuthStripePaymentAvailable` | publishable key guard |

## Webhook

`payment_intent.succeeded` with `metadata.order_kind=member_auth` → `rpc_mark_member_auth_order_paid`.

## Env

Same as merchant: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Verify

```bash
bunx supabase db push
bun run supabase:types
```
