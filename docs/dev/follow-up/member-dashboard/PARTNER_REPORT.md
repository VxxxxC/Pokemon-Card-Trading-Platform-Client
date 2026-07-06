# Partner Report — Member Profile Dashboard (`/profile/user`)

**Date:** 2026-07-06  
**Flow:** User overview dashboard — profile hero, trading stats, titles, orders, reviews  
**Backend owner:** Backend track  
**Frontend owner:** Partner (merchant parity + polish)  
**Remote DB:** `20260706160000_member_completed_trades_buy_and_sell.sql` **pushed** ✅

---

## Executive summary

| Area | Status |
|------|--------|
| Overview orchestrator (`getMemberDashboardOverview`) | ✅ Shipped |
| Section 2 — 3 trading stats cards (live) | ✅ Shipped |
| Section 1 — main title + 4-tier stepper + progress bar | ✅ Shipped (`titles.ts`) |
| Activity badges (CDN icons, not emoji) | ✅ Shipped |
| Pending orders preview (max 5) | ✅ Shipped |
| Recent reviews preview (max 5) | ✅ Shipped |
| Check-in (`CheckInCard`) | ✅ Unchanged (independent) |
| `completed_trades_count` buy + sell fix | ✅ Migration pushed |
| Merchant dashboard titles | ⏳ Follow-up |

**Partner action:** Smoke-test `/profile/user` with a real member account; verify title progress matches completed trade count; merchant dashboard parity when ready.

---

## Five dashboard sections

| # | Section | Data source | Status |
|---|---------|-------------|--------|
| 1 | Profile summary + titles | `getMemberDashboardOverview` + `useMemberTitleDisplay` + CheckIn PTS | ✅ Live |
| 2 | Trading stats (3 cards) | `tradingStats` from overview | ✅ Live |
| 3 | Check-in | `CheckInCard` → `getGamificationStats` | ✅ Live (separate fetch) |
| 4 | Pending orders | `searchUserTradingOrders` (max 5) | ✅ Live |
| 5 | Reviews | `getPublicProfileReviews` (max 5) | ✅ Live |

---

## Architecture (performance)

```
Client mount
  ├─ getMemberDashboardOverview()     → profile + tradingStats (1 server hop)
  ├─ searchUserTradingOrders(pending, pageSize=5)   ║ parallel
  ├─ getPublicProfileReviews(pageSize=5)            ║
  └─ CheckInCard → getGamificationStats             (independent)

No mega-RPC — collection valuation stays in TS (resolveCollectionMarketValue).
```

---

## Section 2 — trading stats

| Card | Metric | Logic |
|------|--------|-------|
| 成交次數 | `profiles.completed_trades_count` | C2C buy + C2C sell + B2C buy; excludes `cancelled` / `refunded` |
| 持有卡牌數 | Collection rows + orphan active listings | Deduped: listed-from-collection not double-counted |
| 總卡牌估值 | `computePortfolioTotals` + orphan listings | SNKRDUNK → platform MIN → purchase/listing price |

---

## Section 1 — profile titles

| UI | Source |
|----|--------|
| Main title pill | `profiles.reputation_tag` → `resolveReputationTagDisplay`; fallback `getMainTitle(completedTrades)` |
| 4-tier stepper | `MEMBER_TITLES` from [`lib/constants/titles.ts`](../../../lib/constants/titles.ts) |
| Progress bar | `getMemberTitleProgress(completedTrades)` — trade count toward next threshold |
| Activity badges | `reputation_tag.activity_badges` → `ACTIVITY_BADGES` + `TitleBadgeIcon` |

**Icon SSOT:** `badgeUrl` in `titles.ts` only (not in DB). CDN: `hkcardvault.b-cdn.net/assets/badges/**` (see `next.config.ts`).

---

## Files touched

### Backend / lib

| File | Purpose |
|------|---------|
| `app/actions/member-dashboard.ts` | `getMemberDashboardOverview` |
| `lib/dashboard/member-trading-stats.ts` | Orphan listing stats + valuation |
| `lib/dashboard/constants.ts` | `MEMBER_DASHBOARD_PREVIEW_LIMIT = 5` |
| `lib/titles/member-title-progress.ts` | Title progress + stepper state |
| `lib/constants/titles.ts` | SSOT (existing; used by UI + SQL) |

### Frontend

| File | Purpose |
|------|---------|
| `app/profile/user/(dashboard)/page.tsx` | All 5 sections wired |
| `app/lib/hooks/useMemberDashboard.ts` | Parallel overview + orders + reviews |
| `app/lib/hooks/useMemberTitleDisplay.ts` | Title / stepper / badges display |
| `app/components/profile/TitleBadgeIcon.tsx` | CDN badge images |
| `app/lib/member-order/map-sale-order.ts` | Order row mapping |

### Database

| Migration | Purpose |
|-----------|---------|
| `20260706160000_member_completed_trades_buy_and_sell.sql` | C2C seller counts toward `completed_trades_count`; reconcile backfill |

---

## Acceptance checklist

- [ ] Log in → hero shows real name, avatar, join date, rating, PTS (from check-in)
- [ ] Main title matches `MEMBER_TITLES` tier for your trade count
- [ ] Progress bar updates toward next title (not XP)
- [ ] Stepper + activity badges show CDN icons (not emoji)
- [ ] Section 2 valuation matches `/profile/user/collection` summary (same account)
- [ ] Pending orders ≤ 5 from live API; empty state when none
- [ ] Reviews ≤ 5 from live API
- [ ] Cancelled orders do **not** increase 成交次數
- [ ] `bun run build:ci` passes

---

## Follow-up

| Item | Owner |
|------|-------|
| Merchant dashboard `MERCHANT_TITLES` + `core_main_merchant` | Frontend |
| Greyed-out locked activity badges preview | Frontend (optional) |
| `reputation_tag` backfill for legacy users with trades but null tag | Backend one-off if needed |

---

## Docs

- [backend.md](./backend.md)
- [frontend.md](./frontend.md)
- Stable API: [api.md](../../api.md) §7.5
- Queue: [INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)
