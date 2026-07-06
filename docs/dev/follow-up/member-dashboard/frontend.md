# Member Profile Dashboard — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired

## UI touchpoints

| Section | File | Data |
|---------|------|------|
| Profile hero | `app/profile/user/(dashboard)/page.tsx` | `useMemberDashboard().profile` + `useMemberTitleDisplay` + PTS |
| Main title / stepper / progress | same | `lib/constants/titles.ts` + `profiles.reputation_tag` |
| Activity badges | same | `TitleBadgeIcon` + `badgeUrl` from `titles.ts` |
| Trading stats (3 cards) | same | `tradingStats` |
| Check-in | `CheckInCard.tsx` | unchanged (independent fetch) |
| Pending orders (max 5) | same | `searchUserTradingOrders` via hook |
| Recent reviews (max 5) | same | `getPublicProfileReviews` via hook |

| Hook / util | Purpose |
|-------------|---------|
| `app/lib/hooks/useMemberDashboard.ts` | Parallel overview + orders + reviews; `pointsBalance` from overview |
| `app/lib/member-order/map-sale-order.ts` | `UserTradingOrder` → `SaleOrder` for `UserOrderRow` |
| `app/lib/hooks/useMemberTitleDisplay.ts` | Main title, 4-tier stepper, trade progress, activity badges |
| `app/components/profile/TitleBadgeIcon.tsx` | CDN badge SVG via `next/image` |
| `lib/titles/member-title-progress.ts` | `getMemberTitleProgress`, `buildMemberTitleStepperState` |
| `lib/dashboard/constants.ts` | `MEMBER_DASHBOARD_PREVIEW_LIMIT = 5` |

---

## Acceptance checklist

- [x] Section 2 shows 3 live stats (成交次數 / 持有卡牌 / 總卡牌估值)
- [x] Hero uses real `displayName`, `username`, `avatarUrl`, `joinDateLabel`, `ratingScore`, review count
- [x] Pending orders from live API (max 5); empty state when none
- [x] Reviews from live API (max 5); empty + loading states
- [x]「查看更多評價」→ `/profile/{id}/rating?persona=member`
- [x]「查看全部」訂單 → `/profile/user/trading?filter=待處理`
- [x] Main title from `reputation_tag` / `getMainTitle` (4-tier `MEMBER_TITLES`)
- [x] Progress bar: completed trades toward next title threshold (not XP)
- [x] Activity badges from `reputation_tag.activity_badges` with CDN icons
- [x] Hero PTS: `overview.pointsBalance` on load; `CheckInCard` refreshes after check-in
- [x] Stepper uses `MEMBER_TITLES[].badgeUrl` via `TitleBadgeIcon`
- [ ] Merchant dashboard titles — follow-up

---

## Notes

- Grid for stats: `grid-cols-2 lg:grid-cols-3` (was 4 cards).
- Valuation subtitle documents 3-step fallback for users.
- Do not merge CheckIn into overview — sign-in mutation should not invalidate portfolio stats.
