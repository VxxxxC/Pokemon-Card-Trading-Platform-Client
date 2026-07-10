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
| `member_escrow_status` | `payment`, `custody`, `grading`, `shipped`, `released`, `cancelled` |
| `member_order_state` | `pending`, `meetup_arranged`, `completed`, `cancelled` |
| `offer_status` | `pending`, `accepted`, `rejected`, `cancelled` |
| `report_state` | `pending`, `reviewing`, `resolved`, `dismissed` |
| `review_persona` | `member`, `merchant` |
| `reward_type` | `discount_coupon`, `free_shipping`, `lucky_draw_ticket`, `points` |
| `seller_persona_type` | `member`, `merchant` |
| `sync_state` | `synced`, `partial`, `needs_review` |
| `transaction_type` | `escrow_payment`, `commission_deduction`, `shipping_subsidy`, `refund`, `payout` |
| `user_role` | `admin`, `merchant`, `member` |

---

## RPC Functions

| Function | Args | Returns |
|----------|------|---------|
| `acknowledge_reward_grants` | `{ p_user_reward_ids: string[] }` | `Json` |
| `escape_ilike_pattern` | `{ input: string };` | `string` |
| `execute_daily_check_in` | `never;` | `Json` |
| `fn_apply_point_transaction` | `{ p_amount: number p_description?: string p_source_ref?: string p_source_type: string p_user_id: st…` | `number` |
| `fn_archive_seller_collection_for_listing` | `{ p_final_price: number p_listing_id: string p_seller_id: string }` | `undefined` |
| `fn_bump_listing_offers_count` | `{ p_listing_id: string }` | `undefined` |
| `fn_claim_mission_points` | `{ p_description?: string; p_mission_id: string; p_points: number }` | `Json` |
| `fn_grant_points_from_template` | `{ p_template_id: string; p_user_id: string }` | `Json` |
| `fn_issue_reward_from_template` | `{ p_grant_dedup_key?: string p_template_id: string p_user_id: string }` | `string` |
| `fn_member_order_is_open` | `{ p_escrow_status: Database["public"]["Enums"]["member_escrow_status"] p_status: Database["public"]…` | `boolean` |
| `fn_recalculate_reputation_tags` | `{ p_user_id: string }` | `undefined` |
| `fn_redeem_member_points` | `{ p_amount: number p_description?: string p_source_ref?: string }` | `Json` |
| `fn_reward_template_has_stock` | `{ p_template: Database["public"]["Tables"]["reward_templates"]["Row"] }` | `boolean` |
| `fn_reward_template_progress_detail` | `{ p_template: Database["public"]["Tables"]["reward_templates"]["Row"] p_user_id: string }` | `Json` |
| `fn_template_is_eligible` | `{ p_template: Database["public"]["Tables"]["reward_templates"]["Row"] p_user_id: string }` | `{ eligible: boolean grant_dedup_key: string }[]` |
| `fn_try_auto_grant_rewards` | `{ p_user_id: string };` | `Json` |
| `fn_try_reveal_order_reviews` | `{ p_order_id: string; p_order_kind: string }` | `boolean` |
| `generate_profile_username` | `never;` | `string` |
| `get_chat_room_thread` | `{ p_room_id: string };` | `Json } | { Args: { p_before_created_at?: string p_limit?: number p_room_id: string } Returns: Json` |
| `get_gamification_stats_for_me` | `never;` | `Json` |
| `get_marketplace_price_bounds` | `never` | `{ max_price: number min_price: number }[]` |
| `get_marketplace_product_listings` | `{ p_grade_filters?: Json p_only_graded?: boolean p_page?: number p_page_size?: number p_product_id:…` | `{ created_at: string filtered_lowest_price: number grading_company: string grading_score: string li…` |
| `get_marketplace_rarities` | `never` | `{ rarity: string }[]` |
| `get_reward_coupon_center` | `never;` | `Json` |
| `get_unacknowledged_reward_grants` | `never;` | `Json` |
| `get_user_chat_inbox` | `never;` | `Json` |
| `get_user_chat_inbox_lobby` | `never;` | `Json` |
| `get_user_reward_coupons` | `never;` | `Json` |
| `is_chat_room_member` | `{ p_room_id: string; p_user_id?: string }` | `boolean` |
| `is_display_name_available` | `{ name: string };` | `boolean` |
| `listing_grade_sort_score` | `{ grading_company: string; grading_score: string }` | `number` |
| `refresh_marketplace_product_summaries` | `never;` | `undefined` |
| `rpc_accept_offer` | `{ p_offer_id: string; p_seller_id: string }` | `Json` |
| `rpc_cancel_member_order` | `{ p_order_id: string; p_user_id: string }` | `Json` |
| `rpc_complete_member_auth_grading` | `{ p_order_id: string }` | `Json` |
| `rpc_complete_member_order` | `{ p_order_id: string; p_user_id: string }` | `Json` |
| `rpc_confirm_buyer_received` | `{ p_buyer_id: string; p_order_id: string }` | `Json` |
| `rpc_confirm_platform_received` | `{ p_order_id: string }` | `Json` |
| `rpc_e2e_reset_listing_trading_fixture` | `{ p_buyer_id: string; p_listing_id: string; p_seller_id: string }` | `Json` |
| `rpc_fail_member_auth_order` | `{ p_order_id: string }` | `Json` |
| `rpc_get_user_reviewed_member_order_ids` | `{ p_order_ids: string[] }` | `string[]` |
| `rpc_increment_listing_view` | `{ p_listing_id: string }` | `undefined` |
| `rpc_make_offer` | `{ p_buyer_id: string p_content: string p_listing_id: string p_offer_price: number }` | `Json } | { Args: { p_buyer_id: string p_content: string p_listing_id: string p_offer_price: number …` |
| `rpc_mock_pay_member_auth_order` | `{ p_buyer_id: string p_mock_session_id?: string p_order_id: string }` | `Json` |
| `rpc_modify_offer` | `{ p_buyer_id: string p_content: string p_new_price: number p_offer_id: string }` | `Json` |
| `rpc_reject_offer` | `{ p_offer_id: string; p_seller_id: string }` | `Json` |
| `rpc_send_chat_message` | `{ p_content: string; p_room_id: string; p_sender_id: string }` | `Json` |
| `rpc_submit_inbound_tracking` | `{ p_order_id: string; p_seller_id: string; p_tracking_no: string }` | `Json` |
| `rpc_submit_outbound_tracking` | `{ p_order_id: string; p_tracking_no: string }` | `Json` |
| `rpc_submit_transaction_review` | `{ p_comment?: string p_order_id: string p_rating: number p_reviewee_id: string p_user_id?: string }` | `Json` |
| `run_auto_grant_rewards_for_me` | `never;` | `Json` |
| `search_marketplace_products` | `{ p_card_number?: string p_grade_filters?: Json p_keyword?: string p_name_query?: string p_page?: n…` | `{ card_number: string catalog_type: Database["public"]["Enums"]["catalog_type"] display_id: string …` |
| `search_marketplace_products_browse` | `{ p_page?: number; p_page_size?: number; p_sort?: string }` | `{ card_number: string catalog_type: Database["public"]["Enums"]["catalog_type"] display_id: string …` |
| `search_marketplace_seller_listings` | `{ p_grade_filters?: Json p_name_query?: string p_page?: number p_page_size?: number p_price_max?: n…` | `{ card_number: string created_at: string display_id: string grading_company: string grading_score: …` |
| `search_public_profile_reviews` | `{ p_page?: number p_page_size?: number p_persona: Database["public"]["Enums"]["review_persona"] p_p…` | `{ aggregate_rating: number comment: string created_at: string is_merchant_tx: boolean page: number …` |
| `search_user_trading_orders` | `{ p_page?: number p_page_size?: number p_persona?: string p_search_query?: string p_tab_status?: st…` | `{ buyer_id: string card_number: string catalog_image_url: string count_needs_action: number count_p…` |

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
| `member_order_id` | `string | null` | Yes |
| `merchant_order_id` | `string | null` | Yes |
| `offer_id` | `string | null` | Yes |
| `room_id` | `string` | No |
| `sender_id` | `string` | No |

**Foreign keys:** `member_order_id` → `member_orders`

---

### `chat_rooms`

*Domain:* Messaging

| Column | Type | Nullable |
|--------|------|----------|
| `buyer_id` | `string` | No |
| `created_at` | `string | null` | Yes |
| `id` | `string` | No |
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
| `points_balance` | `number` | No |
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
| `listing_id` | `string` | No |
| `offers_count` | `number` | No |
| `updated_at` | `string | null` | Yes |
| `views` | `number` | No |

**Foreign keys:** `listing_id` → `listings`

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
| `source_collection_id` | `string | null` | Yes |
| `status` | `listing_status` | No |
| `updated_at` | `string` | No |
| `use_authentication` | `boolean` | No |

**Foreign keys:** `seller_id` → `profiles`

---

### `member_orders`

*Domain:* P2P orders

| Column | Type | Nullable |
|--------|------|----------|
| `auth_result` | `string | null` | Yes |
| `buyer_id` | `string` | No |
| `created_at` | `string | null` | Yes |
| `escrow_status` | `| member_escrow_status` | No |
| `expires_at` | `string` | No |
| `extended_count` | `number` | No |
| `final_price` | `number` | No |
| `id` | `string` | No |
| `inbound_tracking_no` | `string | null` | Yes |
| `listing_id` | `string` | No |
| `logistics_proof_path` | `string | null` | Yes |
| `meetup_details` | `Json | null` | Yes |
| `mock_payment_session_id` | `string | null` | Yes |
| `order_number` | `string | null` | Yes |
| `outbound_tracking_no` | `string | null` | Yes |
| `payment_confirmed_at` | `string | null` | Yes |
| `platform_received_at` | `string | null` | Yes |
| `seller_id` | `string` | No |
| `status` | `member_order_state | null` | Yes |
| `updated_at` | `string | null` | Yes |
| `use_authentication` | `boolean` | No |

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
| `order_number` | `string | null` | Yes |
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
| `cancelled_trades_count` | `number` | No |
| `completed_trades_count` | `number` | No |
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
| `listing_id` | `string | null` | Yes |
| `modified_count` | `number` | No |
| `offer_price` | `number` | No |
| `room_id` | `string` | No |
| `status` | `offer_status | null` | Yes |
| `updated_at` | `string | null` | Yes |
| `use_authentication` | `boolean` | No |

**Foreign keys:** `buyer_id` → `profiles`

---

### `point_ledger`

| Column | Type | Nullable |
|--------|------|----------|
| `amount` | `number` | No |
| `balance_after` | `number` | No |
| `created_at` | `string` | No |
| `description` | `string | null` | Yes |
| `id` | `string` | No |
| `source_ref` | `string | null` | Yes |
| `source_type` | `string` | No |
| `user_id` | `string` | No |

**Foreign keys:** `user_id` → `profiles`

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
| `grading_score` | `string` | No |
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
| `alert_enabled` | `boolean` | No |
| `created_at` | `string` | No |
| `grading_company` | `string` | No |
| `grading_score` | `string` | No |
| `last_alerted_at` | `string | null` | Yes |
| `product_id` | `string` | No |
| `target_price` | `number | null` | Yes |
| `tracked_price` | `number | null` | Yes |
| `user_id` | `string` | No |

**Foreign keys:** `user_id` → `profiles`

---

### `profiles`

*Domain:* Users & auth

| Column | Type | Nullable |
|--------|------|----------|
| `avatar_path` | `string | null` | Yes |
| `cancelled_trades_count` | `number` | No |
| `completed_trades_count` | `number` | No |
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
| `claimed_count` | `number` | No |
| `created_at` | `string | null` | Yes |
| `description` | `string | null` | Yes |
| `fixed_expiry_date` | `string | null` | Yes |
| `id` | `string` | No |
| `is_active` | `boolean | null` | Yes |
| `is_infinite` | `boolean | null` | Yes |
| `max_claims` | `number | null` | Yes |
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
| `is_public` | `boolean` | No |
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
| `grading_company` | `string` | No |
| `grading_score` | `string` | No |
| `id` | `string` | No |
| `product_id` | `string` | No |
| `purchase_price` | `number` | No |
| `sold_at` | `string | null` | Yes |
| `sold_listing_id` | `string | null` | Yes |
| `sold_price` | `number | null` | Yes |
| `updated_at` | `string` | No |
| `user_id` | `string` | No |

**Foreign keys:** `user_id` → `profiles`

---

### `user_rewards`

*Domain:* Rewards

| Column | Type | Nullable |
|--------|------|----------|
| `acknowledged_at` | `string | null` | Yes |
| `calculated_expiry` | `string | null` | Yes |
| `created_at` | `string | null` | Yes |
| `grant_dedup_key` | `string` | No |
| `id` | `string` | No |
| `is_used` | `boolean | null` | Yes |
| `template_id` | `string` | No |
| `used_at` | `string | null` | Yes |
| `user_id` | `string` | No |

**Foreign keys:** `template_id` → `reward_templates`

---

## Table Index

**23 tables**

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
| `point_ledger` | — |
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
