# Dual Persona Trading — Frontend Handoff

## Status

- **Backend:** ✅ Ready — migration `20260717140000`, `getDualPersonaContext`, `makeOffer` self-deal guard
- **Frontend:** ✅ Wired — persona switch on member overview + merchant performance; `ExecutionSlideOver` own-listing block

## Product rules

| Action | Persona |
|--------|---------|
| Buy / make offer | Always **member** (even when logged in as merchant) |
| Sell / list | **merchant** or **member** per listing `seller_persona` |
| Self-purchase | Blocked (same `profiles.id`, any persona) |

## UI touchpoints

| File | Change |
|------|--------|
| [`app/components/profile/ProfilePersonaSwitch.tsx`](../../../app/components/profile/ProfilePersonaSwitch.tsx) | Switch button; hidden when `!hasDualPersona` |
| [`app/profile/user/(dashboard)/UserOverviewClient.tsx`](../../../app/profile/user/(dashboard)/UserOverviewClient.tsx) | `activeContext="member"` → `/profile/merchant` |
| [`app/profile/merchant/performance/page.tsx`](../../../app/profile/merchant/performance/page.tsx) | `activeContext="merchant"` → `/profile/user` |
| [`app/components/transactions/ExecutionSlideOver.tsx`](../../../app/components/transactions/ExecutionSlideOver.tsx) | Disable offer form on own listing |

## Acceptance checklist

- [ ] Dual merchant on `/profile/user` sees「切換至商戶身份」with shop name subtitle
- [ ] Same user on `/profile/merchant/performance` sees「切換至會員身份」with member name subtitle
- [ ] Pure `member` role → no switch on either page
- [ ] Own listing in slide-over → disabled input +「這是您的掛單，無法對自己的商品出價」
- [ ] Merchant buying others' listings still works; buyer appears as member in chat
