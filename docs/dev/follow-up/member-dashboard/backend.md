# Member Profile Dashboard — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired (see [frontend.md](./frontend.md))

## Architecture

```
GET /profile/user
  → page.tsx (Suspense + UserOverviewSkeleton)
  → UserOverviewPageData (Server Component)
      getOptionalAuthUser() once
      Promise.all:
        getMemberDashboardOverview() — single supabase client, internal Promise.all
          profiles, get_gamification_stats_for_me RPC → pointsBalance
          user_collections (stats columns only)
          active listings (reused in loadCollectionPricingContext — no duplicate seller query)
          loadCollectionPricingContext(productIds, { userListingRows })
          computeMemberTradingStats
        searchUserTradingOrders({ tabStatus: 'pending', pageSize: 5 })
        getPublicProfileReviews({ persona: 'member', pageSize: 5 })
  → UserOverviewClient — initialData; skip mount-time fetches when SSR succeeded

Deferred on client (non-blocking):
  → CheckInCard — streak via getGamificationStats (idle); points from overview SSR
  → RewardNotificationHost — dynamic import after requestIdleCallback
```

### Performance instrumentation

- Server: `[dashboard:perf]` in `lib/dashboard/perf-log.ts` — `overview.authMs`, `parallelFetchMs`, `pricingContextMs`, `totalMs`
- Client: `app/lib/dashboard/perf-log-client.ts` — mount + ready timing
- Enable in staging: `DASHBOARD_PERF_LOG=1` / `NEXT_PUBLIC_DASHBOARD_PERF_LOG=1`

### Section 2 trading stats semantics

| Metric | Source |
|--------|--------|
| 成交次數 | `profiles.completed_trades_count` — Σ C2C buy (`member_orders.status=completed`) + C2C sell (same) + B2C buy (`merchant_orders.escrow_status=completed_and_transferred`); **excludes** `cancelled` / `refunded`; migration `20260706160000` adds seller-side C2C + backfill |
| 持有卡牌數 | `collection.cardCount + orphanActiveListingCount` (deduped) |
| 待售副標 | `collection.listedCount + orphanActiveListingCount` |
| 總卡牌估值 | `computePortfolioTotals` + orphan listings via `resolveCollectionMarketValue` |

**Orphan listing:** `listings.status = 'active'` with no matching `user_collections` row (`product_id + grading_company + grading_score`).

---

## Files

| File | Purpose |
|------|---------|
| `app/actions/member-dashboard.ts` | `getMemberDashboardOverview` |
| `app/profile/user/(dashboard)/UserOverviewPageData.tsx` | SSR bootstrap (overview + orders + reviews) |
| `app/profile/user/(dashboard)/UserOverviewClient.tsx` | Client UI with `initialData` |
| `app/profile/user/(dashboard)/UserOverviewSkeleton.tsx` | Streaming fallback |
| `lib/dashboard/perf-log.ts` | Server perf diagnostics |
| `app/lib/dashboard/types.ts` | `MemberDashboardProfile`, `MemberDashboardTradingStats` |
| `lib/dashboard/constants.ts` | `MEMBER_DASHBOARD_PREVIEW_LIMIT = 5` |
| `lib/dashboard/member-trading-stats.ts` | `computeMemberTradingStats`, `findOrphanActiveListings` |

Reuses: `lib/collection/build-entries.ts` (`loadCollectionPricingContext` with optional `userListingRows`, `computePortfolioTotals`), `lib/marketplace/portfolio-pricing.ts` (`resolveCollectionMarketValue`).

**Titles (Section 1):** `profiles.reputation_tag` via overview; display helpers in `lib/constants/titles.ts`, `lib/titles/member-title-progress.ts`, `useMemberTitleDisplay.ts`. No extra API.

---

## Action contract

```ts
getMemberDashboardOverview(): Promise<
  | { success: true; data: { profile: MemberDashboardProfile; tradingStats: MemberDashboardTradingStats; pointsBalance: number } }
  | { success: false; error: string }
>;
```

```ts
type MemberDashboardTradingStats = {
  completedTradesCount: number;
  heldCardCount: number;
  listedForSaleCount: number;
  totalMarketValue: number;
};
```

---

## Verify (backend)

1. Log in as member with collection rows + optional active listings.
2. Call `getMemberDashboardOverview` — `totalMarketValue` matches `getCollectionPortfolioSummary` when no orphan listings.
3. List a card not in collection — `heldCardCount` increases; listed-from-collection does not double-count.
4. Complete a trade — `completed_trades_count` on `profiles` reflects in `completedTradesCount`.
5. `bun run build:ci` passes (`isSupabaseConfigured()` guard when env unset).
