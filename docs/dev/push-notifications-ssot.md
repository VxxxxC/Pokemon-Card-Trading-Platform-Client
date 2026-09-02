# Push Notifications SSOT

> **Status:** Phase 0–1 live (OneSignal SDK + opt-in + DB sync). Phase 2 first send (wishlist) in progress.  
> **Related:** [email-notifications-ssot.md](./email-notifications-ssot.md) · [system-feature-registry.md](./system-feature-registry.md) · [INTEGRATION_QUEUE.md](./INTEGRATION_QUEUE.md)  
> **Provider:** OneSignal Web Push (self-hosted SDK v16, service worker scope `/onesignal/`)

---

## 0. Rollout progress (agent trace)

| Phase | PR | Deliverable | Status | Key files |
|-------|-----|-------------|--------|-----------|
| **0** | PR1 | SDK init, SW, login opt-in banner | ✅ | `OneSignalProvider`, `PushOptInBanner`, `public/vendor/onesignal/` |
| **1** | PR2 | `user_push_subscriptions` + client sync | ✅ | `push-subscriptions.ts`, `OneSignalSubscriptionSync`, migration `20261002100000` |
| **2** | PR3 | **P-WIS-01** wishlist price alert cron | ✅ | `send.ts`, `process-wishlist-price-alerts.ts`, `/api/cron/wishlist-price-alerts` |
| **3** | PR4 | **P-OFF-*** offer events (chat triggers) | ⏳ | `offer push` after `SYSTEM_OFFER_*` |
| **4** | PR5 | **P-ORD-*** order lifecycle subset | ⏳ | webhook / cron hooks |
| **5** | PR6 | User settings toggles (real prefs) | ⏳ | `UserSettingsClient` wire-up |
| **6** | PR7 | **P-MOD-*** moderation / sanction mirror | ⏳ | align with admin-moderation v2 batch |

**Gate commands (per phase):**

```bash
bun run test:push:phase1    # PR3+ registry + wishlist alert logic
bunx tsc --noEmit
bun run lint
```

---

## 1. Conventions

### ID format

`P-<DOMAIN>-<NN>` — stable event key for code, tests, and future outbox (if added).

| Domain prefix | Area |
|---------------|------|
| `P-WIS` | Wishlist / price alerts |
| `P-OFF` | Offers / negotiation |
| `P-ORD` | Orders |
| `P-MOD` | Reports / moderation |
| `P-ACC` | Account / sanctions |
| `P-CHT` | Chat (high-volume; P2) |
| `P-RWD` | Rewards (P2) |

### Priority

| Tier | Meaning |
|------|---------|
| **P0** | Money-adjacent or time-sensitive user action |
| **P1** | Important — seller/buyer should know within hours |
| **P2** | Nice — digest, marketing, strong in-app duplicate |

### Delivery split

| Layer | Responsibility |
|-------|----------------|
| **Client** | Permission, `OneSignal.login(userId)`, subscription sync → `user_push_subscriptions` |
| **Server send** | OneSignal REST `POST /notifications` with `include_subscription_ids` |
| **Targeting** | Prefer DB `user_push_subscriptions` where `opted_in = true` (not segment blast) |
| **In-app keep** | Chat realtime, reward modal, F-M-23 report toast — push **mirrors** critical events only |

### Dedupe rules

1. Wishlist **P-WIS-01**: max **1 push / 24h** per `(user_id, product_id, grading_company, grading_score)` via `product_watchlists.last_alerted_at`.
2. Order reminders: align with email SSOT — max 1 / 24h per order + event class when wired.
3. Same trigger as email: push is **additive**; email idempotency (`E-*` outbox) stays independent.

### Env

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Client init |
| `ONESIGNAL_REST_API_KEY` | Server send only |
| `CRON_SECRET` | Cron routes |

---

## 2. Infra checklist (Phase 0–1) ✅

- [x] Self-hosted OneSignal SDK (`public/vendor/onesignal/v16/`)
- [x] Service worker `public/onesignal/OneSignalSDKWorker.js`
- [x] `OneSignalProvider` in `app/layout.tsx`
- [x] Post-login opt-in card (`PushOptInBanner`)
- [x] Table `user_push_subscriptions` + RLS owner-only
- [x] `upsertUserPushSubscription` / `optOutUserPushSubscription`
- [x] `OneSignalSubscriptionSync` on login + subscription change
- [ ] Push outbox table (optional — defer until >3 event types)
- [ ] User prefs `push_transactional` (Phase 6)

---

## 3. Event registry

### 3.1 Wishlist (`P-WIS`)

| ID | Event (ZH) | Trigger | Recipient | P | Channel today | Feature | Deep link |
|----|------------|---------|-----------|---|---------------|---------|-----------|
| P-WIS-01 | 願望清單 — 掛單價 ≤ 目標價 | Cron `wishlist-price-alerts` | Watchlist owner | P1 | none | F-M-10 | `/marketplace/product/{productId}` |

**Match rule:** `MIN(listings.price)` for `status = 'active'` + `listingMatchesWishlistGrade` ≤ `target_price`, `alert_enabled = true`.

### 3.2 Offers (`P-OFF`) — Phase 3 PR

| ID | Event (ZH) | Trigger | Recipient | P | Channel today | Feature |
|----|------------|---------|-----------|---|---------------|---------|
| P-OFF-01 | 收到新叫價 | `rpc_make_offer` success | Seller | P0 | chat |
| P-OFF-02 | 出價被接受 | `rpc_accept_offer` | Buyer | P0 | chat |
| P-OFF-03 | 出價被拒絕 | `rpc_reject_offer` | Buyer | P1 | chat |
| P-OFF-04 | 立即購買 | `rpc_buy_now_listing` | Seller | P0 | chat |

### 3.3 Orders (`P-ORD`) — Phase 4 PR

| ID | Event (ZH) | Trigger | Recipient | P | Channel today |
|----|------------|---------|-----------|---|---------------|
| P-ORD-01 | 付款成功 | Stripe webhook | Seller | P0 | chat |
| P-ORD-02 | 賣家已發貨 | Ship RPC | Buyer | P0 | order detail |
| P-ORD-03 | 待付款逾時取消 | Cron | Buyer | P1 | none |

### 3.4 Moderation (`P-MOD`) — Phase 6 PR

| ID | Event (ZH) | Trigger | Recipient | P | Channel today |
|----|------------|---------|-----------|---|---------------|
| P-MOD-01 | 舉報結果 | `rpc_resolve_moderation_case` | Reporter | P1 | in-app F-M-23 |
| P-MOD-02 | 帳號制裁 | Sanction RPC | Subject | P0 | redirect |

### 3.5 Account (`P-ACC`) — deferred

| ID | Event (ZH) | Trigger | Recipient | P |
|----|------------|---------|-----------|---|
| P-ACC-01 | 停權屆滿 | Sanction expiry cron | User | P2 |

---

## 4. P0 MVP subset (first ship)

```
P-WIS-01
P-OFF-01, P-OFF-02, P-OFF-04
P-ORD-01, P-ORD-02
```

---

## 5. Production-safe wiring protocol

1. **只加法** — new `sendPush*` helper → call **after** existing RPC/webhook/cron success. Do not change return shapes or UI data contracts.
2. **Skip gracefully** — if `!isOneSignalConfigured()`, log + return `{ skipped: true }` (CI / local without secrets).
3. **No segment spam** — always target `include_subscription_ids` from `user_push_subscriptions`.
4. **禁碰範圍（unless explicit）** — `components/` styling-only tasks; payment/escrow RPC signatures; new migrations without approval.
5. **一 slice 一驗** — update `push-phase*-registry.ts` + gate test per phase.

---

## 6. PR3 implementation map (P-WIS-01)

| File | Purpose |
|------|---------|
| `lib/notifications/onesignal/send.ts` | REST wrapper |
| `lib/notifications/push-config.ts` | Cooldown hours, cron batch limit |
| `lib/notifications/push-phase1-registry.ts` | Event catalog for gate tests |
| `lib/notifications/wishlist-push.ts` | Copy + URL builder |
| `lib/notifications/process-wishlist-price-alerts.ts` | Cron business logic |
| `app/api/cron/wishlist-price-alerts/route.ts` | Cron entry |
| `vercel.json` | Schedule (hourly) |
| `tests/unit/notifications/push-phase1-gate.test.ts` | Registry + pure helpers |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-09-02 | Initial SSOT; Phase 2 PR3 (P-WIS-01) scoped |
