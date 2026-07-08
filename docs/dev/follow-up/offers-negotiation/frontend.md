# Offers & Negotiation Chat — Frontend Handoff

> **Superseded by** [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md) for current UI wiring (`OfferCard`, DB inbox, modify/accept).

## Status

- **Frontend:** 🟡 Partial — buyer **make-offer entry** wired globally via `ExecutionSlideOver`; negotiate/accept/reject in chat — see [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md)

## Changelog (2026-07-08) — global buy → offer slide-over

| Area | Shipped |
|------|---------|
| **`BuyButton`** (`GlobalTxButtons.tsx`) | **⚡ 立即購買** opens real offer flow via `useUIStore.openExecutionSlideOver` (no more `injectSpecialTransaction` mock) |
| **`ExecutionSlideOverHost`** | Single root-layout mount (`app/layout.tsx`); renders `ExecutionSlideOver` from global store |
| **`lib/marketplace/map-listing-to-execution.ts`** | `MarketplaceListing` / order-book row → `{ listingId, order, card, productId }` |
| **`ProductDetailClient`** | Order book uses same global opener; local slide-over state removed |
| **Entry points** | `MarketplaceCard`, `NewArrivals`, `CardItem` (mock grid), `MerchantProductDetailPageClient` |
| **Own-listing guard** | `BuyButton` skips when `listing.sellerId === useCurrentUserId()` |
| **`AuctionButton`** | Unchanged — still mock `injectSpecialTransaction` |

### Architecture

```
BuyButton / order book row
  → mapMarketplaceListingToExecutionPayload (or buildOrderBookExecutionPayload)
  → useUIStore.openExecutionSlideOver
  → ExecutionSlideOverHost (layout)
  → ExecutionSlideOver → makeOffer → openOfferChatSession
```

## Quick links

| Component | Role |
|-----------|------|
| `GlobalTxButtons.tsx` | **`BuyButton`** — global slide-over opener; **`AuctionButton`** — mock only |
| `ExecutionSlideOverHost.tsx` | Root host reading `useUIStore` execution payload |
| `map-listing-to-execution.ts` | Listing → slide-over payload mapper |
| `useUIStore.ts` | `openExecutionSlideOver` / `closeExecutionSlideOver` |
| `OfferCard.tsx` | Primary offer card (accept / modify) |
| `SpecialTransactionMessage.tsx` | Adapter to `OfferCard` |
| `GlobalChatOverlay.tsx` | DB inbox sync + mock merge |
| `ExecutionSlideOver.tsx` | Buyer `makeOffer` entry + **平台鑑定加購** toggle → `offers.use_authentication` |

## Acceptance (buy entry)

- [x] Marketplace grid **立即購買** opens slide-over with listing price/seller
- [x] Home C2C **立即購買** opens slide-over
- [x] Product detail order book row opens same global slide-over
- [x] Merchant storefront buy CTA opens slide-over
- [x] Submit offer → `makeOffer` + chat session (existing `ExecutionSlideOver` behaviour)
- [x] Own listing — buy button hidden/disabled or no-op
- [ ] **`AuctionButton`** — future: same slide-over path or separate auction flow

## Related docs

- [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md)
- [marketplace-product-detail/frontend.md](../marketplace-product-detail/frontend.md)
- [INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)
