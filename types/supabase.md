# Supabase Database Types Reference

> **Auto-generated** from `types/supabase.ts` — do not edit by hand.
>
> **PostgREST version:** 14.5
> **Schema:** `public`

Regenerate TypeScript + this doc:

```bash
bun run supabase:types
```

---

## TypeScript Usage

```typescript
import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/types/supabase";

// Row type (SELECT)
type Profile = Tables<"profiles">;
type Listing = Tables<"listings">;

// Insert / Update payloads
type NewListing = TablesInsert<"listings">;
type ListingPatch = TablesUpdate<"listings">;

// Enum union
type UserRole = Enums<"user_role">;
```

---

## Enums

| Enum | Values |
|------|--------|
| `catalog_type` | `single_card`, `booster_pack`, `booster_box`, `gift_set`, `starter_deck` |
| `escrow_state` | `payment_held`, `authenticating`, `authenticated`, `completed_and_transferred`, `refunded` |
| `kyc_state` | `pending`, `verified`, `rejected` |
| `listing_status` | `active`, `sold`, `inactive` |
| `member_order_state` | `pending`, `meetup_arranged`, `completed`, `cancelled` |
| `offer_status` | `pending`, `accepted`, `rejected`, `cancelled` |
| `report_state` | `pending`, `reviewing`, `resolved`, `dismissed` |
| `review_persona` | `member`, `merchant` |
| `reward_type` | `discount_coupon`, `free_shipping`, `lucky_draw_ticket` |
| `seller_persona_type` | `member`, `merchant` |
| `sync_state` | `synced`, `partial`, `needs_review` |
| `transaction_type` | `escrow_payment`, `commission_deduction`, `shipping_subsidy`, `refund`, `payout` |
| `user_role` | `admin`, `merchant`, `member` |

---

## RPC Functions

| Function | Args | Returns |
|----------|------|---------|
| `escape_ilike_pattern` | `{ input: string };` | `string` |
| `get_marketplace_price_bounds` | `never` | `{ max_price: number min_price: number }[]` |
| `get_marketplace_product_listings` | `{ p_grade_filters?: Json p_only_graded?: boolean p_page?: number p_page_size?: number p_product_id:…` | `{ created_at: string filtered_lowest_price: number grading_company: string grading_score: string li…` |
| `is_display_name_available` | `{ name: string };` | `boolean` |
| `listing_grade_sort_score` | `{ grading_company: string; grading_score: string }` | `number` |
| `search_marketplace_products` | `{ p_card_number?: string p_grade_filters?: Json p_name_query?: string p_page?: number p_page_size?:…` | `{ card_number: string catalog_type: Database["public"]["Enums"]["catalog_type"] display_id: string …` |

---

## Tables


### `chat_messages`

*Domain:* Messaging

| Column | Type | Nullable |
|--------|------|----------|
| `content` | `string` | No |
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
| `is_system_warning` | `boolean | null` | Yes |
| `room_id` | `string` | No |
| `sender_id` | `string` | No |

**Foreign keys:** `room_id` → `chat_rooms`

---

### `chat_rooms`

*Domain:* Messaging

| Column | Type | Nullable |
|--------|------|----------|
| `buyer_id` | `string` | No |
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
| `listing_id` | `string` | No |
| `seller_id` | `string` | No |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `buyer_id` → `profiles`

---

### `gamification_stats`

*Domain:* Gamification

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string | null` | Yes |
| `current_streak` | `number | null` | Yes |
| `last_check_in` | `string | null` | Yes |
| `longest_streak` | `number | null` | Yes |
| `updated_at` | `string | null` | Yes |
| `user_id` | `string` | No |

**Foreign keys:** `user_id` → `profiles`

---

### `kyc_records`

*Domain:* Merchant KYC

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string | null` | Yes |
| `kyc_status` | `kyc_state | null` | Yes |
| `merchant_id` | `string` | No |
| `stripe_account_id` | `string | null` | Yes |
| `updated_at` | `string | null` | Yes |
| `verified_at` | `string | null` | Yes |

**Foreign keys:** `merchant_id` → `profiles`

---

### `listing_bookmarks`

*Domain:* Marketplace bookmarks

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string | null` | Yes |
| `listing_id` | `string` | No |
| `user_id` | `string` | No |

**Foreign keys:** `listing_id` → `listings`

---

### `listing_stats`

*Domain:* Marketplace analytics

| Column | Type | Nullable |
|--------|------|----------|
| `likes` | `number | null` | Yes |
| `listing_id` | `string` | No |
| `trade_records_count` | `number | null` | Yes |
| `updated_at` | `string | null` | Yes |
| `views` | `number | null` | Yes |

---

### `listings`

*Domain:* Marketplace

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string` | No |
| `grading_company` | `string` | No |
| `grading_score` | `string | null` | Yes |
| `id` | `string` | No |
| `images` | `Json` | No |
| `price` | `number` | No |
| `product_id` | `string` | No |
| `seller_description` | `string | null` | Yes |
| `seller_id` | `string` | No |
| `seller_persona` | `seller_persona_type` | No |
| `status` | `listing_status` | No |
| `updated_at` | `string` | No |
| `use_authentication` | `boolean` | No |

**Foreign keys:** `seller_id` → `profiles`

---

### `member_orders`

*Domain:* P2P orders

| Column | Type | Nullable |
|--------|------|----------|
| `buyer_id` | `string` | No |
| `created_at` | `string | null` | Yes |
| `final_price` | `number` | No |
| `id` | `string` | No |
| `listing_id` | `string` | No |
| `meetup_details` | `Json | null` | Yes |
| `seller_id` | `string` | No |
| `status` | `member_order_state | null` | Yes |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `buyer_id` → `profiles`

---

### `merchant_ledgers`

*Domain:* Merchant finance

| Column | Type | Nullable |
|--------|------|----------|
| `amount` | `number` | No |
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
| `merchant_id` | `string` | No |
| `order_id` | `string | null` | Yes |
| `stripe_transfer_id` | `string | null` | Yes |
| `transaction_type` | `transaction_type` | No |

**Foreign keys:** `merchant_id` → `profiles`

---

### `merchant_orders`

*Domain:* Escrow orders

| Column | Type | Nullable |
|--------|------|----------|
| `buyer_id` | `string` | No |
| `created_at` | `string | null` | Yes |
| `escrow_status` | `escrow_state | null` | Yes |
| `final_price` | `number` | No |
| `id` | `string` | No |
| `listing_id` | `string` | No |
| `logistics_proof_path` | `string | null` | Yes |
| `merchant_id` | `string` | No |
| `requires_authentication` | `boolean | null` | Yes |
| `stripe_payment_intent_id` | `string | null` | Yes |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `buyer_id` → `profiles`

---

### `merchant_shops`

*Domain:* Merchant storefront

| Column | Type | Nullable |
|--------|------|----------|
| `business_details` | `Json | null` | Yes |
| `created_at` | `string | null` | Yes |
| `merchant_id` | `string` | No |
| `rating_score` | `number | null` | Yes |
| `shipping_speed_score` | `number | null` | Yes |
| `shop_description` | `string | null` | Yes |
| `shop_rating_score` | `number | null` | Yes |
| `top_banner_path` | `string | null` | Yes |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `merchant_id` → `profiles`

---

### `offers`

*Domain:* Negotiation

| Column | Type | Nullable |
|--------|------|----------|
| `buyer_id` | `string` | No |
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
| `offer_price` | `number` | No |
| `room_id` | `string` | No |
| `status` | `offer_status | null` | Yes |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `buyer_id` → `profiles`

---

### `product_catalog`

*Domain:* Catalog

| Column | Type | Nullable |
|--------|------|----------|
| `card_number` | `string | null` | Yes |
| `created_at` | `string` | No |
| `display_id` | `string | null` | Yes |
| `element_type` | `string | null` | Yes |
| `hp` | `number | null` | Yes |
| `id` | `string` | No |
| `image_url` | `string` | No |
| `jan_code` | `string | null` | Yes |
| `last_synced_at` | `string | null` | Yes |
| `name_en` | `string | null` | Yes |
| `name_ja` | `string` | No |
| `name_zh` | `string | null` | Yes |
| `pack_count` | `number | null` | Yes |
| `pokemon_stage` | `string | null` | Yes |
| `rarity` | `string | null` | Yes |
| `set_code` | `string` | No |
| `snkr_rank` | `number | null` | Yes |
| `sub_type_ja` | `string | null` | Yes |
| `type` | `catalog_type` | No |
| `updated_at` | `string` | No |

---

### `product_grading_market_prices`

| Column | Type | Nullable |
|--------|------|----------|
| `grading_company` | `string` | No |
| `grading_score` | `string | null` | Yes |
| `id` | `string` | No |
| `market_avg_price` | `number | null` | Yes |
| `market_chart_data` | `Json | null` | Yes |
| `market_trend_30d` | `number | null` | Yes |
| `product_id` | `string | null` | Yes |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `product_id` → `product_catalog`

---

### `product_price_snapshots`

*Domain:* Catalog / pricing

| Column | Type | Nullable |
|--------|------|----------|
| `condition_name_ja` | `string | null` | Yes |
| `condition_type` | `string` | No |
| `created_at` | `string` | No |
| `grading_company` | `string | null` | Yes |
| `grading_score` | `string | null` | Yes |
| `id` | `string` | No |
| `price_hkd` | `number | null` | Yes |
| `price_jpy` | `number` | No |
| `product_id` | `string` | No |
| `snapshot_date` | `string` | No |
| `source` | `string | null` | Yes |

**Foreign keys:** `product_id` → `product_catalog`

---

### `product_watchlists`

*Domain:* User watchlist

| Column | Type | Nullable |
|--------|------|----------|
| `product_id` | `string` | No |
| `user_id` | `string` | No |

**Foreign keys:** `user_id` → `profiles`

---

### `profiles`

*Domain:* Users & auth

| Column | Type | Nullable |
|--------|------|----------|
| `avatar_path` | `string | null` | Yes |
| `created_at` | `string` | No |
| `display_name` | `string` | No |
| `id` | `string` | No |
| `rating_score` | `number | null` | Yes |
| `reputation_tag` | `Json | null` | Yes |
| `role` | `user_role` | No |
| `short_description` | `string | null` | Yes |
| `total_trades` | `number | null` | Yes |
| `updated_at` | `string` | No |
| `username` | `string | null` | Yes |

---

### `reports`

*Domain:* Moderation

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
| `reason` | `string` | No |
| `reporter_id` | `string` | No |
| `status` | `report_state | null` | Yes |
| `target_id` | `string` | No |
| `target_type` | `string` | No |
| `updated_at` | `string | null` | Yes |

**Foreign keys:** `reporter_id` → `profiles`

---

### `reward_templates`

*Domain:* Rewards

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string | null` | Yes |
| `description` | `string | null` | Yes |
| `fixed_expiry_date` | `string | null` | Yes |
| `id` | `string` | No |
| `is_active` | `boolean | null` | Yes |
| `is_infinite` | `boolean | null` | Yes |
| `reward_value` | `Json` | No |
| `title` | `string` | No |
| `trigger_conditions` | `Json` | No |
| `type` | `reward_type` | No |
| `updated_at` | `string | null` | Yes |
| `valid_duration_days` | `number | null` | Yes |

---

### `transaction_reviews`

*Domain:* Reputation

| Column | Type | Nullable |
|--------|------|----------|
| `comment` | `string | null` | Yes |
| `created_at` | `string` | No |
| `id` | `string` | No |
| `member_order_id` | `string | null` | Yes |
| `merchant_order_id` | `string | null` | Yes |
| `rating` | `number` | No |
| `reviewee_id` | `string` | No |
| `reviewee_persona` | `review_persona` | No |
| `reviewer_id` | `string` | No |

**Foreign keys:** `reviewee_id` → `profiles`

---

### `user_collections`

*Domain:* User portfolio

| Column | Type | Nullable |
|--------|------|----------|
| `created_at` | `string` | No |
| `product_id` | `string` | No |
| `quantity` | `number` | No |
| `updated_at` | `string` | No |
| `user_id` | `string` | No |

**Foreign keys:** `user_id` → `profiles`

---

### `user_rewards`

*Domain:* Rewards

| Column | Type | Nullable |
|--------|------|----------|
| `calculated_expiry` | `string | null` | Yes |
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
| `is_used` | `boolean | null` | Yes |
| `template_id` | `string` | No |
| `used_at` | `string | null` | Yes |
| `user_id` | `string` | No |

**Foreign keys:** `template_id` → `reward_templates`

---

## Table Index

**22 tables**

| Table | Domain |
|-------|--------|
| `chat_messages` | Messaging |
| `chat_rooms` | Messaging |
| `gamification_stats` | Gamification |
| `kyc_records` | Merchant KYC |
| `listing_bookmarks` | Marketplace bookmarks |
| `listing_stats` | Marketplace analytics |
| `listings` | Marketplace |
| `member_orders` | P2P orders |
| `merchant_ledgers` | Merchant finance |
| `merchant_orders` | Escrow orders |
| `merchant_shops` | Merchant storefront |
| `offers` | Negotiation |
| `product_catalog` | Catalog |
| `product_grading_market_prices` | — |
| `product_price_snapshots` | Catalog / pricing |
| `product_watchlists` | User watchlist |
| `profiles` | Users & auth |
| `reports` | Moderation |
| `reward_templates` | Rewards |
| `transaction_reviews` | Reputation |
| `user_collections` | User portfolio |
| `user_rewards` | Rewards |

---

## Notes

- **Single source of truth for code:** import from `types/supabase.ts` only.
- **This markdown file** is a human-readable companion. Regenerate via `bun run supabase:types`.
- **`Json` columns** have flexible structure — document shapes in Server Actions / API handoff docs.
