# Merchant Settings — Backend Handoff

## Status

- **Backend:** ✅ Ready (read + update merchant shop profile; auth email read-only)
- **Frontend:** ✅ Wired (shop form + security; notifications still mock)
- **Partner:** Notification prefs (future table), email change flow

## Architecture: dual persona (same auth account)

| Layer | Purpose | Merchant settings |
|-------|---------|-------------------|
| `auth.users` | Login email + password | Read-only email; password via `/auth/reset-password` |
| `profiles` | Member persona (`display_name`, `username`, `short_description`) | **Not read/written** (role guard only) |
| `merchant_shops` | Merchant storefront persona | **SSOT** for shop name, handle, bio |

`profiles.username` (C2C) and `merchant_shops.shop_handle` (B2C storefront) are independent.

### Column vs `business_details` JSONB

- **Use dedicated columns:** `shop_name`, `shop_handle`, `shop_description`
- **`business_details`:** reserved for future KYC / legal entity metadata — not storefront display fields

## Scope

| In scope | Out of scope |
|----------|--------------|
| `getMerchantSettings` | `notification_settings` |
| `updateMerchantShopProfile` | Email change (`auth.updateUser`) |
| `updateMerchantShopAvatar` | `profiles` member field updates |
| `updateMerchantShopTopBanner` | Stripe Connect UI |
| Migration `20260716100000` | |
| Storefront loader reads `merchant_shops` for merchant persona | |

## Files

| File | Purpose |
|------|---------|
| `app/actions/merchant-settings.ts` | `getMerchantSettings`, `updateMerchantShopProfile`, `updateMerchantShopAvatar`, `updateMerchantShopTopBanner` |
| `app/api/merchant/upload-avatar/route.ts` | Shop avatar Bunny upload |
| `app/api/merchant/upload-top-banner/route.ts` | Shop top banner Bunny upload |
| `lib/merchant/client-upload.ts` | Client helpers for avatar + banner upload |
| `lib/storage/bunny.ts` | `uploadMerchantShopAvatarToBunny`, `uploadMerchantShopBannerToBunny` |
| `lib/merchant/validation.ts` | `validateMerchantShopFields` |
| `lib/merchant/errors.ts` | `mapMerchantShopUpdateError` |
| `lib/marketplace/load-seller-profile.ts` | Merchant persona from `merchant_shops` |
| `supabase/migrations/20260716100000_merchant_shops_settings_columns.sql` | Columns + RLS + backfill |

## DB: `merchant_shops` fields

| Column | Settings UI | Notes |
|--------|-------------|-------|
| `shop_name` | 店舖名稱 | Required non-empty |
| `shop_handle` | 店舖帳號 (Handle) | Optional; 3–24 chars; unique (case-insensitive) |
| `shop_description` | 店舖簡介 | Optional; max 280 chars |
| `shop_avatar_path` | 店舖頭像 | Bunny CDN URL; **independent** from `profiles.avatar_path` |
| `top_banner_path` | 店舖頂部橫幅 | Bunny CDN URL; displayed on `/marketplace/{handle}` storefront header |
| `reputation_tag` | — | Merchant persona titles/badges SSOT (`core_main_merchant`, `activity_badges`); independent from `profiles.reputation_tag` |
| `auth.users.email` | 電郵地址 | Read-only; shared with member login |

## Action contracts

### `getMerchantSettings()`

```ts
import { getMerchantSettings } from "@/app/actions/merchant-settings";

// Returns:
{ success: true, data: MerchantSettingsData }
| { success: false, error: string }

type MerchantSettingsData = {
  merchantId: string;
  shopName: string;
  shopHandle: string;
  shopDescription: string;
  shopAvatarUrl: string;
  topBannerUrl: string | null;
  email: string;
};
```

### `updateMerchantShopAvatar(cdnUrl)`

Writes `merchant_shops.shop_avatar_path` after Bunny upload via `/api/merchant/upload-avatar`.

Requires `profiles.role = 'merchant'` and existing `merchant_shops` row (KYC init). No fallback from `profiles`.

### `updateMerchantShopTopBanner(cdnUrl)`

Writes `merchant_shops.top_banner_path` after Bunny upload via `/api/merchant/upload-top-banner`.

Object key prefix: `shop-banners/{merchantId}/{uuid}.{ext}`. Replaces prior banner with best-effort Bunny delete when key starts with `shop-banners/`.

### `updateMerchantShopProfile` — `useActionState`

```ts
import { updateMerchantShopProfile } from "@/app/actions/merchant-settings";

// Signature
(prev: MerchantShopFormErrors | null, formData: FormData) => Promise<MerchantShopFormErrors | null>
```

**FormData fields:**

| Field | `name` attribute | Required |
|-------|------------------|----------|
| 店舖名稱 | `shopName` | Yes |
| 店舖帳號 | `shopHandle` | No (empty → `null`) |
| 店舖簡介 | `shopDescription` | No |

Success → `null` + revalidate merchant settings, merchant dashboard, public profile, marketplace storefront.

## Migrations

```bash
bunx supabase db push
```

- `20260716100000_merchant_shops_settings_columns.sql`
- `20260717160000_merchant_shops_shop_avatar_path.sql`
- `20260717170000_merchant_shops_reputation_tag_split.sql` — persona-split titles/badges

## How to verify (backend)

1. Log in as merchant → `/profile/merchant/settings` — fields from `merchant_shops` only.
2. Save shop name + handle + bio → DB updated; `profiles` unchanged.
3. Duplicate `shop_handle` on another merchant → `此店舖帳號已被使用`.
4. `/marketplace/{shop_handle}` shows updated shop name and custom top banner when set.
5. Upload top banner in settings → `top_banner_path` updated; storefront header reflects change.

```sql
SELECT ms.shop_name, ms.shop_handle, ms.shop_description,
       p.display_name, p.username
FROM merchant_shops ms
JOIN profiles p ON p.id = ms.merchant_id
WHERE ms.merchant_id = '<uuid>';
```

## Errors returned to UI

| Condition | Field | Message |
|-----------|-------|---------|
| Empty shop name | `shopName` | `請輸入店舖名稱` |
| Invalid handle | `shopHandle` | `店舖帳號限 3-24 字元…` |
| Handle taken | `shopHandle` | `此店舖帳號已被使用` |
| Bio too long | `shopDescription` | `店舖簡介不可超過 280 字元` |
| No shop row | `form` | `店舖尚未初始化，請完成商戶認證` |
| Not merchant | `form` | `無商戶權限` |
| RLS / migration missing | `form` | Permission / migration message |
