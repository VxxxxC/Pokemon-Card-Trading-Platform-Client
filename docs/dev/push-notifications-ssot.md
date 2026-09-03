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
| **3** | PR4 | **P-OFF-*** offer events (chat triggers) | ✅ | `offer-push.ts`, `push-delivery.ts`, `offers.ts`, `buy-now.ts` |
| **4** | PR5 | **P-ORD-*** order lifecycle subset | ⏳ | webhook / cron hooks |
| **5** | PR6 | User settings toggles (real prefs) | ⏳ | `UserSettingsClient` wire-up |
| **6** | PR7 | **P-MOD-*** moderation / sanction mirror | ⏳ | align with admin-moderation v2 batch |
| **7** | PR8 | **P-CHT-01** chat unread daily digest | ⏳ | cron + inbox unread aggregate |

**Gate commands (per phase):**

```bash
bun run test:push:phase1    # PR3 wishlist
bun run test:push:phase2    # PR4 offers (gate + send + action wiring)
bunx tsc --noEmit
bun run lint
```

### Per-PR test checklist (mandatory before merge)

> **Rule:** 每完成一個 push PR，必須補齊對應 test — 唔好累積到 PR8 先寫。

| PR | Required tests | Command |
|----|----------------|---------|
| **PR3** | `push-phase1-registry` + copy/cooldown gate | `bun run test:push:phase1` |
| **PR4** | phase2 gate + `offer-push-send` (merchant/negative) + `offer-push-action-wiring` | `bun run test:push:phase2` |
| **PR5** | `push-phase3-registry` + order send helper + action/cron wiring | `bun run test:push:phase3` *(add script)* |
| **PR6** | settings toggle contract tests (opt-in gates send) | TBD |
| **PR7** | moderation push gate + wiring | TBD |
| **PR8** | chat digest cron gate (same pattern as wishlist) | TBD |
| **Post-PR6** | One Playwright smoke journey (canonical offer or order flow) | `bun run test:e2e` *(targeted spec)* |

**PR4 test layers (reference):**

1. **Gate** — registry + copy (`push-phase2-gate.test.ts`)
2. **Send helper** — `eventId` / `userId` / `path` + merchant branch + lookup-fail skip (`offer-push-send.test.ts`)
3. **Action wiring** — RPC success → `sendOffer*Push` called; RPC fail → not called (`offer-push-action-wiring.test.ts`)

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
2. Chat digest **P-CHT-01**: max **1 push / 24h** per `user_id` (daily bucket); skip if `unread_count = 0`.
3. Order reminders: align with email SSOT — max 1 / 24h per order + event class when wired.
4. Same trigger as email: push is **additive**; email idempotency (`E-*` outbox) stays independent.

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

### 3.5 Chat (`P-CHT`) — Phase 7 PR8

> **Not per-message push.** Realtime chat + inbox badge stay primary; push is a **daily nudge** when user still has unread.

| ID | Event (ZH) | Trigger | Recipient | P | Channel today | Feature | Deep link |
|----|------------|---------|-----------|---|---------------|---------|-----------|
| P-CHT-01 | 你有未讀訊息（每日摘要） | Cron `chat-unread-digest` (e.g. 09:00 HKT) | Users with `unread_count > 0` | P2 | in-app badge | F-M-13 | `/profile/user/chat` or active room |

**Match rule:**

1. Query inbox aggregate (`get_user_chat_inbox_lobby` or admin batch equivalent) → `SUM(unread_count) > 0` **or** any room `unread_count > 0`.
2. User has `user_push_subscriptions.opted_in = true`.
3. `last_chat_digest_pushed_at` is null or older than **24h** (per-user cooldown).
4. Optional (P2+): skip if `last_active` within last **15 min** (user already online).

**Copy example:** `你有 {n} 則未讀訊息 — 打開收件匣查看`

**Why daily (not per message):**

| Approach | Complexity | Risk |
|----------|------------|------|
| Per new message | High — realtime hook on every insert, aggressive dedupe, tab-focus checks | Spam / notification fatigue |
| **Daily digest** | **Low–medium** — same pattern as wishlist cron; 1 row cooldown per user | User may see message hours later |

**Implementation sketch (PR8):**

| Piece | Notes |
|-------|--------|
| Migration | `profiles.last_chat_digest_pushed_at` **or** small `user_push_digest_state` table (preferred if multiple digest types) |
| Cron | `app/api/cron/chat-unread-digest/route.ts` + `vercel.json` schedule (1×/day) |
| Logic | `lib/notifications/process-chat-unread-digest.ts` |
| Send | Reuse `sendOneSignalPush` + `external_id` fallback |
| Tests | `push-phase2-registry` + gate (cooldown + unread threshold) |

**Out of scope for P-CHT-01:** offer/order system messages (covered by **P-OFF-*** / **P-ORD-*** instant push in PR4–5).

### 3.6 Account (`P-ACC`) — deferred

| ID | Event (ZH) | Trigger | Recipient | P |
|----|------------|---------|-----------|---|
| P-ACC-01 | 停權屆滿 | Sanction expiry cron | User | P2 |

---

## 4. P0 MVP subset (first ship)

```
P-WIS-01
P-OFF-01, P-OFF-02, P-OFF-04
P-ORD-01, P-ORD-02
P-CHT-01   # P2 — after PR4–7; daily digest only
```

---

## 5. Production-safe wiring protocol

1. **只加法** — new `sendPush*` helper → call **after** existing RPC/webhook/cron success. Do not change return shapes or UI data contracts.
2. **Skip gracefully** — if `!isOneSignalConfigured()`, log + return `{ skipped: true }` (CI / local without secrets).
3. **No segment spam** — always target `include_subscription_ids` from `user_push_subscriptions`.
4. **禁碰範圍（unless explicit）** — `components/` styling-only tasks; payment/escrow RPC signatures; new migrations without approval.
5. **一 slice 一驗** — update `push-phase*-registry.ts` + gate test per phase; add send-helper + action/cron wiring tests before marking PR ✅ (see §0 checklist).

---

## 6. Implementation maps

### PR3 (P-WIS-01)

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

### PR4 (P-OFF-01–04)

| File | Purpose |
|------|---------|
| `lib/notifications/push-delivery.ts` | Load subscriptions + `sendPushToUser` |
| `lib/notifications/offer-push.ts` | Offer copy + send helpers |
| `lib/notifications/push-phase2-registry.ts` | P-OFF event catalog |
| `app/actions/offers.ts` | Wire after make/accept/reject offer RPC |
| `app/actions/buy-now.ts` | Wire after buy-now RPC |
| `tests/unit/notifications/push-phase2-gate.test.ts` | Copy + registry gate |
| `tests/unit/notifications/offer-push-send.test.ts` | Send helper: recipient, path, merchant, negative |
| `tests/unit/notifications/offer-push-action-wiring.test.ts` | Action RPC success/fail → push call |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-09-03 | PR4 tests: action wiring + merchant/negative; §0 per-PR test checklist |
| 2026-09-03 | PR4 **P-OFF-01–04** wired; add **P-CHT-01** daily digest (PR8) |
| 2026-09-02 | Initial SSOT; Phase 2 PR3 (P-WIS-01) scoped |
