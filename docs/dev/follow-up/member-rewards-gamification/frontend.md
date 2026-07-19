# Member Rewards & Gamification — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** 🟡 Partial — check-in, **4-tab coupon center** (wallet + **可解鎖** locked preview), reward modal wired; missions + checkout redemption pending
- **Your focus:** Polish locked/wallet card variants, missions when backend exists, checkout coupon picker

## Changelog

### 2026-07-19 (effective check-in streak — broken gap days)

| Area | What changed |
|------|----------------|
| **CheckInCard** | `getGamificationStats` returns **effective** streak via `resolveEffectiveCheckInStreak` (HK timezone); gap >1 day → UI shows day 1「今日」, not stale `current_streak` |
| **Locked coupons** | **`可解鎖`** tab progress (`check_in_streak` / `min_streak`) requires migration **`20260719150000`** — DB `fn_effective_check_in_streak` SSOT |
| **Home** | `HomePageShell` `showCheckIn` only when logged in **and** member persona active (avoids merchant empty column) |
| **PortfolioRewards** | Replaced hardcoded 7-day mock with live `CheckInCard` when member persona |
| **E2E** | `e2e/member-dashboard.spec.ts` — broken-streak fixture (`last_check_in` 3 days ago → day 1「今日」) |

### 2026-07-17 (merchant persona guard)

| Area | What changed |
|------|----------------|
| **Check-in** | `CheckInCard` hidden when `activeListingPersona === 'merchant'` |
| **Server** | `executeDailyCheckIn` + `getGamificationStats` guarded via `guardMemberPersonaPersonalFeatures` |
| **Restore** | Switch to member identity or visit `/profile/user/*` |

### 2026-07-05 (locked catalog tab — 可解鎖)

| Area | What changed |
|------|----------------|
| **4-tab coupon center** | `redeemable` · **`locked` (可解鎖)** · `redeemed` · `expired` |
| **Locked cards** | Dashed border, no coupon code; shows **解鎖條件**, **進度**, **去完成 →** `Link` to `ctaHref` |
| **Data** | `getUserRewardCoupons()` → `{ wallet, locked }`; mapper `parseRewardCouponCenter` in `mapUserRewardCoupon.ts` |
| **Types** | `LockedRewardView`, `CouponCenterTab`, `RewardCouponCenterView` — import from `@/lib/rewards/mapUserRewardCoupon` |
| **Tab bar** | Horizontal scroll on small screens; `scrollbar-none` |

### 2026-07-05 (member homepage + rewards page DB wiring)

| Area | What changed |
|------|----------------|
| **Member homepage** | `app/profile/user/(dashboard)/page.tsx` — `CheckInCard` with `onStatsChange`; hero **帳戶總積分餘額** syncs to DB (replaces mock `1250`) |
| **Rewards page** | `app/profile/user/rewards/page.tsx` — coupon tabs load via `getUserRewardCoupons()` (removed large mock grid) |
| **CheckInCard** | `getGamificationStats` + `executeDailyCheckIn`; optional `onStatsChange` callback |
| **Gamification RPC** | Stats read no longer uses direct table query (RLS-safe) |

### 2026-07-05 (reward notifications + layout)

| Area | What changed |
|------|----------------|
| **`RewardNotificationHost`** | Polls `getUnacknowledgedRewardGrants` on mount; opens `RewardUnlockedModal` |
| **`UserProfileDashboardShell`** | Wraps dashboard routes — mounts `RewardNotificationHost` |
| **`RewardUnlockedModal`** | Ack via `acknowledgeRewardGrants`; types from `@/lib/constants/rewards` |
| **`useRewardNotificationStore`** | Queue for grant toasts/modal |

### 2026-07-05 (homepage hero check-in)

| Area | What changed |
|------|----------------|
| **`HeroSearch.tsx`** | Shows `CheckInCard` when `mockRole === USER \| ADMIN` (marketplace home `/`) |

## UI touchpoints

### Check-in: `app/components/rewards/CheckInCard.tsx`

Reused in:

| Route | Location |
|-------|----------|
| `/profile/user` | Mobile column + desktop sidebar (`(dashboard)/page.tsx`) |
| `/profile/user/rewards` | Top of rewards page |
| `/` | `HeroSearch` right column (logged-in USER/ADMIN demo role) |

**Server actions:**

```ts
import {
  executeDailyCheckIn,
  getGamificationStats,
} from "@/app/actions/rewards";
```

**Props:**

```ts
type CheckInCardProps = {
  onStatsChange?: (stats: {
    pointsBalance: number;
    currentStreak: number;
    checkedInToday: boolean;
  }) => void;
};
```

**Constants (UI ladder labels):** `CHECK_IN_STEPS` from `@/lib/constants/rewards`.

**After check-in:** enqueues `newlyGranted` into `useRewardNotificationStore` for modal.

### Coupon center: `app/profile/user/rewards/page.tsx`

Route: **`/profile/user/rewards`**

| State | Source |
|-------|--------|
| `walletCoupons` | `getUserRewardCoupons().wallet` → redeemable / redeemed / expired |
| `lockedRewards` | `getUserRewardCoupons().locked` → **可解鎖** tab |
| `activeTab` | `CouponCenterTab` — includes `"locked"` |
| Tabs | **可領取 / 可使用** · **可解鎖** · 歷史已使用 · 不可領用 (已過期) |
| Tab bar | `overflow-x-auto scrollbar-none` (mobile-friendly 4 tabs) |
| `CheckInCard` | Same component as homepage |

**Types** (never from `app/actions/rewards.ts`):

```ts
import type {
  CouponCenterTab,
  LockedRewardView,
  UserCouponTab,
  UserCouponView,
} from "@/lib/rewards/mapUserRewardCoupon";
```

### Locked card UI contract (`LockedRewardView`)

| Field | UI placement |
|-------|----------------|
| `valueLabel` / `name` / `minSpendLabel` | Same header area as wallet cards |
| `requirementLabel` | **解鎖條件** row |
| `progressLabel` | **進度** row |
| `ctaHref` | **去完成 →** link |
| `footerNote` | Stock hint or「完成條件後自動發放」 |
| *(no `code`)* | Locked templates are not issued yet |

### Reward modal pipeline

| File | Role |
|------|------|
| `RewardNotificationHost.tsx` | Fetch unacknowledged grants; show modal |
| `RewardUnlockedModal.tsx` | Display grant list; link to `/profile/user/rewards` |
| `UserProfileDashboardShell.tsx` | Host in `app/profile/user/(dashboard)/layout.tsx` |

Grants also surface after check-in via store `enqueue`.

### Member homepage hero PTS

`app/profile/user/(dashboard)/page.tsx`:

- `accountPoints` state updated via `CheckInCard` `onStatsChange`
- Hero displays `(accountPoints ?? 0)` — rest of hero still mock (name, XP, badges)

## Server action usage (frontend)

```ts
// Check-in card
const stats = await getGamificationStats();
const checkIn = await executeDailyCheckIn();

// Coupon page — wallet + locked catalog
const center = await getUserRewardCoupons();
// center.data.wallet.redeemable | .redeemed | .expired
// center.data.locked

// Modal host
const grants = await getUnacknowledgedRewardGrants();
await acknowledgeRewardGrants([userRewardId]);

// Do NOT import types from app/actions/rewards.ts ("use server" restriction)
import type { UnacknowledgedRewardGrant } from "@/lib/constants/rewards";
import type {
  LockedRewardView,
  UserCouponView,
} from "@/lib/rewards/mapUserRewardCoupon";
```

## Acceptance checklist

### Check-in (member homepage `/profile/user`)

- [ ] Load page while logged in — check-in card shows real PTS (not stuck at 0)
- [ ] Hero **帳戶總積分餘額** matches check-in card PTS after load
- [ ] Click **立即簽到打卡** — toast with earned PTS; button disabled until tomorrow (HK day)
- [ ] 7-day ladder reflects `currentStreak` / cycle day
- [ ] New auto-grant (e.g. coupon) opens `RewardUnlockedModal`

### Rewards page (`/profile/user/rewards`)

- [ ] Four tabs render with correct counts; tab bar scrolls horizontally without visible scrollbar (`scrollbar-none`)
- [ ] **可解鎖** — incomplete profile shows HK$2 + HK$10 preview with `0 / 1` progress
- [ ] **可解鎖** — **去完成 →** navigates to settings (profile coupons)
- [ ] Profile complete → locked items disappear; coupons appear under **可領取 / 可使用**
- [ ] Coupon code format: `{code_prefix}-{shortId}` e.g. `HK2-XXXXXXXX`
- [ ] Pagination works with 6 items per page

### Profile settings → coupon grant

- [ ] Save profile with username + avatar → revisit rewards → HK$2 coupon issued (if not already)

### Reward modal

- [ ] Unacknowledged grants show on dashboard routes
- [ ] Dismiss/ack clears from queue (`acknowledged_at` set in DB)

## Still mock / not wired

| Area | File | Notes |
|------|------|-------|
| **Missions** | `rewards/page.tsx` `INITIAL_MISSIONS` | Defined but **not rendered**; no backend |
| **PortfolioRewards check-in** | `PortfolioRewards.tsx` | Commented out on `/`; inline mock 7-day strip if re-enabled |
| **Checkout coupon apply** | — | `user_rewards.is_used` not read in order/checkout flow |
| **Lucky draw UI** | — | Archived backend-side; do not surface until licensing resolved |

## Styling notes

Backend wire-up followed **addition-only** protocol on existing Stitch UI:

- Do not remove/restructure coupon card HTML in `rewards/page.tsx`
- New inputs (if any) use raw/unstyled tags unless frontend polishes

## Related routes

| Route | Shell |
|-------|-------|
| `/profile/user` | `(dashboard)/layout.tsx` + `UserProfileDashboardShell` |
| `/profile/user/rewards` | Standalone page (own `TopNav` / `BottomNav`) — includes `RewardNotificationHost` |
| `/profile/user/settings` | Profile save triggers backend auto-grant (no UI change required) |

## Suggested next steps (frontend)

1. **Polish locked card** — match Stitch design system (progress bar, iconography); keep `LockedRewardView` contract
2. **Single `CheckInCard` instance** on homepage — currently duplicated mobile + desktop (two fetches)
3. **Missions section** — when backend lands, can merge with or replace **可解鎖** for non-coupon tasks
4. **Checkout** — coupon selector reading `getUserRewardCoupons().wallet.redeemable`
5. **Remove `mockUser.points`** constant from homepage once hero fully live-data
6. **Loading/error UX** — `CheckInCard` silently shows 0 on stats failure; consider toast
