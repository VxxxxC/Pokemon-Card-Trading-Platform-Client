# Merchant Trading Orders — Frontend Handoff

## Status

- **List page:** ✅ Wired (`/profile/merchant/trading`)
- **Order detail:** ✅ Wired (`/profile/merchant/orderDetail/[id]` — `getMerchantOrderDetail`)
- **Merchant overview:** ⏳ Mock (`/profile/merchant` — `MerchantOrderRow` from store)

## Files wired

| File | Role |
|------|------|
| `app/profile/merchant/(dashboard)/trading/page.tsx` | Async server page, `searchParams.filter` |
| `MerchantTradingPageData.tsx` | SSR `searchMerchantTradingOrders` bootstrap |
| `MerchantTradingClient.tsx` | Tabs, search, sub-filters, pagination |
| `MerchantTradingSkeleton.tsx` | Loading shell |
| `app/lib/hooks/useMerchantTrading.ts` | Client fetch + debounce |
| `app/lib/merchant-order/map-sale-order.ts` | `MerchantTradingOrder` / `MerchantOrderDetail` → `SaleOrder` |
| `app/components/merchant/MerchantOrderRow.tsx` | Row UI (`orderNumber` display) |
| `app/profile/merchant/orderDetail/[id]/page.tsx` | Client fetch + `ReviewModal` |
| `app/components/merchant/MerchantOrderDetailView.tsx` | Detail UI (stepper, receipt, carousel) |

## Data flow

### List

1. Server: `MerchantTradingPageData` → `searchMerchantTradingOrders({ tabStatus, page: 1 })`
2. Client: `useMerchantTrading({ initialData, tabStatus, searchQuery, sub-filters })`
3. Rows: `mapMerchantTradingOrderToSaleOrder(order)` → `MerchantOrderRow`

### Detail

1. Client: `getMerchantOrderDetail(orderId)` on mount / refresh
2. `MerchantOrderDetailView` maps via `mapMerchantOrderDetailToSaleOrder`
3. Action buttons → `submitMerchantLogistics` stub (`toast.error`)
4. Completed + `canReviewBuyer` → `ReviewModal` (buyer as reviewee)

## Acceptance checklist

- [ ] Trading list loads from DB (no `useMerchantStore`)
- [ ] Row click → detail shows real card name, buyer, `order_number`
- [ ] Non-merchant participant → permission error
- [ ] `payment_held` → payment stepper; action buttons show stub toast
- [ ] `completed_and_transferred` → released block; review CTA when eligible
- [ ] `refunded` → cancelled notice
- [ ] Listing images from DB in carousel (fallback catalog image)
- [ ] CI: `bun run build:ci` passes

## Out of scope

- Stripe checkout / real logistics mutations
- Merchant dashboard overview mock strip

See [backend.md](./backend.md) for action contracts.
