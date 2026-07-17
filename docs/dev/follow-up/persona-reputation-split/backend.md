# Persona Reputation Split — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired (member + merchant dashboards, marketplace storefront)

## Goal

Same auth account may have **member** and **merchant** personas with fully independent:

| Field | Member SSOT | Merchant SSOT |
|-------|-------------|---------------|
| Avatar | `profiles.avatar_path` | `merchant_shops.shop_avatar_path` |
| Main title | `profiles.reputation_tag.core_main_member` | `merchant_shops.reputation_tag.core_main_merchant` |
| Honor badges | `profiles.reputation_tag.activity_badges` | `merchant_shops.reputation_tag.activity_badges` |

`profiles.reputation_tag` **must not** contain `core_main_merchant`.  
`merchant_shops.reputation_tag` **must not** contain `core_main_member`.

## Migration

`supabase/migrations/20260717170000_merchant_shops_reputation_tag_split.sql`

- Adds `merchant_shops.reputation_tag JSONB`
- `fn_recalculate_member_reputation_tags(p_user_id)` → writes `profiles.reputation_tag`
- `fn_recalculate_merchant_reputation_tags(p_user_id)` → writes `merchant_shops.reputation_tag`
- `fn_recalculate_reputation_tags(p_user_id)` → thin wrapper calling both (existing triggers unchanged)
- CHECK constraints on both tables
- Backfill via recalc loops (no copy of old mixed payloads)

```bash
bunx supabase db push
bun run supabase:types
```

## TypeScript SSOT

`lib/constants/titles.ts`

| Export | Purpose |
|--------|---------|
| `MEMBER_ACTIVITY_BADGES` | 9 member badge IDs (existing) |
| `MERCHANT_ACTIVITY_BADGES` | 7 merchant badge IDs (new) |
| `parseMemberReputationTagPayload` / `parseMerchantReputationTagPayload` | JSONB → typed payload |
| `resolveMemberReputationTagDisplay` | `{ memberTitle, activityBadges }` |
| `resolveMerchantReputationTagDisplay` | `{ merchantTitle, activityBadges }` |

Deprecated shims (avoid new usage): `ACTIVITY_BADGES`, `parseReputationTagPayload`, `resolveReputationTagDisplay`.

## Badge ID reference

### Member (`MEMBER_ACTIVITY_BADGES`)

`FOUNDING_MEMBER`, `ANNUAL_VETERAN`, `FLAWLESS_REPUTATION`, `HIGHLY_RECOMMENDED`, `CENTURY_CURATOR`, `VOLUME_COLLECTOR`, `THE_VAULT_TYCOON`, `DAILY_ACTIVE_ENTHUSIAST`, `MARKET_PRICE_HUNTER`

Sources: `profiles.completed_trades_count`, `profiles.created_at`, `user_collections`, `gamification_stats`, `offers`, `transaction_reviews` where `reviewee_persona = 'member'`.

### Merchant (`MERCHANT_ACTIVITY_BADGES`)

| ID | Unlock rule (SQL) |
|----|-------------------|
| `FOUNDING_MERCHANT` | Shop `created_at` within platform launch first 30 days |
| `SHOP_ANNUAL_VETERAN` | Shop age ≥ 365 days |
| `MERCHANT_FLAWLESS_REPUTATION` | ≥50 public merchant reviews, no rating &lt; 4 |
| `MERCHANT_HIGHLY_RECOMMENDED` | ≥100 public merchant 5-star reviews |
| `MERCHANT_CENTURY_SELLER` | `merchant_shops.completed_trades_count` ≥ 100 |
| `MERCHANT_VOLUME_SELLER` | Completed B2C trades ≥ 500 |
| `MERCHANT_ELITE_SELLER` | Completed B2C trades ≥ 1000 |

Sources: `merchant_shops` stats + `transaction_reviews` where `reviewee_persona = 'merchant'`.

## Recalc trigger points

Existing triggers call `fn_recalculate_reputation_tags` (wrapper). After split:

| Event | Member recalc | Merchant recalc |
|-------|---------------|-----------------|
| `user_collections` change | ✅ | — |
| `gamification_stats` / check-in | ✅ | — |
| `offers` change | ✅ | — |
| `transaction_reviews` (persona-specific) | member persona | merchant persona |
| `merchant_orders` complete / cancel | — | ✅ |
| `merchant_shops` KYC init / stats | — | ✅ |
| Profile signup | ✅ | ✅ (if shop exists) |

`auto_grant_rewards` still calls `fn_recalculate_reputation_tags` — no change required (wrapper handles both).

## Consumers updated

| File | Reads |
|------|-------|
| `app/actions/member-dashboard.ts` | `profiles.reputation_tag` |
| `app/actions/merchant-dashboard.ts` | `merchant_shops.reputation_tag` |
| `lib/marketplace/load-seller-profile.ts` | Member branch → profiles; merchant branch → `merchant_shops` |
| `useMemberTitleDisplay.ts` | `resolveMemberReputationTagDisplay` |
| `useMerchantTitleDisplay.ts` | `resolveMerchantReputationTagDisplay` |

## Verify

1. Dual-persona account: `/profile/user` and `/profile/merchant` show **different** activity badges.
2. Merchant persona review → updates `merchant_shops.reputation_tag` trust badges only.
3. Collection / check-in → updates member badges only (`profiles.reputation_tag`).
4. `/marketplace/{shop_handle}` badges from merchant tag (no member collection badges).
5. `bunx tsc --noEmit` && `bun run build:ci`.

```sql
-- Member payload shape
SELECT reputation_tag FROM profiles WHERE id = '<uuid>';

-- Merchant payload shape (independent)
SELECT reputation_tag FROM merchant_shops WHERE merchant_id = '<uuid>';
```

## CDN note

New `MERCHANT_*` badge SVGs may need upload to Bunny; `TitleBadgeIcon` falls back to text when asset missing.
