# Member Profile Dashboard — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired (see [frontend.md](./frontend.md))

## Architecture

```
User overview page mount
  → getMemberDashboardOverview() — single auth, internal Promise.all
      profiles (completed_trades_count, rating, avatar, join date)
      gamification_stats.points_balance → pointsBalance
      user_collections + active listings
      loadCollectionPricingContext(productIds)
      computeMemberTradingStats (collection totals + orphan listings)

Parallel (client hook, not inside overview):
  → searchUserTradingOrders({ tabStatus: 'pending', pageSize: 5 })
  → getPublicProfileReviews({ persona: 'member', pageSize: 5 })

Independent:
  → CheckInCard → getGamificationStats / execute_daily_check_in (streak + post-check-in balance refresh)
```

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
| `app/lib/dashboard/types.ts` | `MemberDashboardProfile`, `MemberDashboardTradingStats` |
| `lib/dashboard/constants.ts` | `MEMBER_DASHBOARD_PREVIEW_LIMIT = 5` |
| `lib/dashboard/member-trading-stats.ts` | `computeMemberTradingStats`, `findOrphanActiveListings` |

Reuses: `lib/collection/build-entries.ts` (`loadCollectionPricingContext`, `computePortfolioTotals`), `lib/marketplace/portfolio-pricing.ts` (`resolveCollectionMarketValue`).

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
