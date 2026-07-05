# Lucky bag (福袋) — V2 extension contract

**Status:** 📋 Planned (no migration / UI in V1)  
**Owner:** Backend  
**Touchpoint:** `listings`, `product_catalog`, orders, optional `lucky_bag_pools`

## Principle

| Domain | Role |
|--------|------|
| **`reward_templates`** | Platform **free** grants (PTS, coupons, draw tickets) — **not** 福袋 |
| **`listings` + orders** | **Paid** SKUs including future 福袋 |

Optional cross-promo only: e.g. `trigger_conditions` `first_lucky_bag_purchase` → grant a draw ticket.

## V1 (today)

- **Box / gift / pack:** `product_catalog.type` ∈ `booster_box`, `gift_set`, `booster_pack`, `starter_deck`
- **`listings`:** `product_id` FK only (no `item_type` column on live DB)
- Frontend `itemType: box_set` maps to box catalog types — see `lib/constants/commerce.ts`

## V2 additions (when implementing)

### 1. Enum / columns (backward-safe defaults)

```sql
-- Separate migration file when V2 starts
ALTER TYPE public.catalog_type ADD VALUE IF NOT EXISTS 'lucky_bag';

ALTER TABLE public.listings
  ADD COLUMN listing_kind TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN bundle_config JSONB NULL;

-- CHECK (listing_kind IN ('standard', 'lucky_bag'))
-- bundle_config required when listing_kind = 'lucky_bag'
```

Existing rows: `listing_kind = 'standard'`, `bundle_config = NULL` — unchanged behaviour.

### 2. New table (recommended)

`lucky_bag_pools` — weighted slots, stock, linked to `listing_id` or `pool_id` in `bundle_config`.

### 3. Fulfillment RPC

`rpc_open_lucky_bag(p_order_id)` after payment — deduct pool stock, write reveal to buyer inventory / order metadata.

Orders: reuse `member_orders` / `merchant_orders` + existing `listing_id`.

## Code SSOT

- Extension constants: `lib/constants/commerce.ts`
- Do **not** add 福袋 to `lib/constants/rewards.ts`

## Verify (when V2 ships)

1. Create `lucky_bag` catalog + listing with `listing_kind = lucky_bag`
2. Complete order → open RPC → pool stock decrements
3. Standard single-card / sealed box listings still work with `listing_kind = standard`
