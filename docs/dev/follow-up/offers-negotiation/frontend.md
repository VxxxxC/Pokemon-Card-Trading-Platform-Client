# Offers & Negotiation Chat — Frontend Handoff

> **Superseded by** [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md) for current UI wiring (`OfferCard`, DB inbox, modify/accept).

## Status

- **Frontend:** 🟡 Partial — see [chat-offers-inbox/frontend.md](../chat-offers-inbox/frontend.md)

## Quick links

| Component | Role |
|-----------|------|
| `OfferCard.tsx` | Primary offer card (accept / modify) |
| `SpecialTransactionMessage.tsx` | Adapter to `OfferCard` |
| `GlobalChatOverlay.tsx` | DB inbox sync + mock merge |
| `ExecutionSlideOver.tsx` | Buyer `makeOffer` entry + **平台鑑定加購** toggle → `offers.use_authentication` |
| `OfferCard.tsx` | Shows auth badge / seller accept copy when `use_authentication` |
