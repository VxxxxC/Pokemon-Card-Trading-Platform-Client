# User Profile Settings (Member) — Backend Handoff

## Status

- **Backend:** ✅ Ready (read + update personal profile; default avatar)
- **Frontend:** ✅ Wired (baseline) — personal info + security read-only email; notifications still mock
- **Partner:** Wire dashboard hero avatar, merchant settings parity, notification prefs (future table)

## Scope

| In scope | Out of scope (future) |
|----------|----------------------|
| `getUserSettings` — profile + auth email | `notification_settings` table / toggles |
| `updateUserProfile` — `display_name`, `username`, `short_description` | Avatar upload to Supabase Storage |
| Default avatar via `profiles.avatar_path` DB default + `resolveAvatarUrl()` | Merchant shop settings (`merchant_shops`) |
| RLS: owner can `UPDATE` own `profiles` row | Email change flow (`auth.updateUser` email) |
| Username uniqueness (app + DB index) | Remove / relax `display_name` unique index (product decision) |

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `app/actions/profile.ts` | `getUserSettings`, `updateUserProfile`, `getCurrentUserProfile` |
| `lib/profile/avatar.ts` | `DEFAULT_AVATAR_URL`, `resolveAvatarUrl()` |
| `lib/profile/validation.ts` | `validateUserProfileFields` (username format, bio length; display name = required non-empty only) |
| `lib/profile/errors.ts` | `mapProfileUpdateError()` — RLS, unique, column errors |
| `supabase/migrations/20260703100000_profiles_default_avatar.sql` | `avatar_path` default `/asset/default-avator.webp` |
| `supabase/migrations/20260703110000_profiles_owner_update.sql` | `profiles_update_own` RLS + `GRANT UPDATE` |
| `supabase/migrations/20260703120000_profiles_settings_columns.sql` | `username`, `short_description` columns + username unique index |

## DB: `profiles` fields used

| Column | Settings UI label | Notes |
|--------|-------------------|-------|
| `display_name` | 顯示名稱 | Required non-empty; **unique** index `profiles_display_name_lower_idx` still enforced at DB |
| `username` | 用戶名 (Handle) | Optional; 3–24 chars `[A-Za-z0-9_-]`; unique when set |
| `short_description` | 個人簡介 | Optional; max 280 chars |
| `avatar_path` | (not on settings page yet) | Default `/asset/default-avator.webp` for new rows |
| `auth.users.email` | 電郵地址 | Read-only in UI |

## Action contracts

### `getUserSettings()`

```ts
import { getUserSettings } from "@/app/actions/profile";

// Returns:
{ success: true, data: UserSettingsData }
| { success: false, error: string }

type UserSettingsData = {
  id: string;
  displayName: string;
  username: string;
  shortDescription: string;
  email: string;
  avatarUrl: string;  // resolved via resolveAvatarUrl
  role: "member" | "merchant" | "admin";
};
```

Called from **Server Component** `app/profile/user/settings/page.tsx` (not from client fetch on mount).

### `updateUserProfile` — `useActionState`

```ts
import { updateUserProfile } from "@/app/actions/profile";
import type { UserProfileFormErrors } from "@/lib/profile/validation";

// Signature
(prev: UserProfileFormErrors | null, formData: FormData) => Promise<UserProfileFormErrors | null>

// Success → null + revalidatePath("/profile/user/settings", "/profile/user")
// Failure → field errors, e.g. { username: "此用戶名稱已被使用" }
```

**FormData fields:**

| Field | `name` attribute | Required |
|-------|------------------|----------|
| 顯示名稱 | `displayName` | Yes |
| Handle | `username` | No (empty → `null` in DB) |
| 個人簡介 | `shortDescription` | No |

### `resolveAvatarUrl` (shared lib)

```ts
import { resolveAvatarUrl, DEFAULT_AVATAR_URL } from "@/lib/profile/avatar";

// null / empty avatar_path → "/asset/default-avator.webp"
// "/..." or "http..." → used as-is
// other → Supabase Storage public URL (bucket `avatars`, future uploads)
```

## Env / migrations

**Required migrations** (run once):

```bash
bunx supabase db push
```

- `20260703100000_profiles_default_avatar.sql`
- `20260703110000_profiles_owner_update.sql`
- `20260703120000_profiles_settings_columns.sql`

**Asset:** `public/asset/default-avator.webp` must exist in repo.

## How to verify (backend)

1. Log in as member → open `/profile/user/settings` — fields match `profiles` row + auth email.
2. Change display name + bio → **儲存更改** → DB updated; toast「個人資料已更新」.
3. Set handle to taken username → error + toast「此用戶名稱已被使用」.
4. New signup → `profiles.avatar_path` defaults to `/asset/default-avator.webp`.

**SQL spot-check:**

```sql
SELECT id, display_name, username, short_description, avatar_path
FROM profiles
WHERE id = '<auth-user-uuid>';
```

## Errors returned to UI

| Condition | Field | Message |
|-----------|-------|---------|
| Empty display name | `displayName` | `請輸入顯示名稱` |
| Invalid handle format | `username` | `用戶名稱限 3-24 字元…` |
| Handle taken | `username` | `此用戶名稱已被使用` |
| Bio too long | `shortDescription` | `個人簡介不可超過 280 字元` |
| Duplicate display name (DB) | `displayName` | `此顯示名稱已被使用` |
| RLS / migration missing | `form` | `沒有權限更新資料…` / `資料庫尚未更新…` |
| Not logged in | `form` | `未登入` |

Raw Postgres / Supabase errors are not leaked.

## Do not change without backend sync

- `UserProfileFormErrors` field keys
- `UserSettingsData` shape
- RLS policy `profiles_update_own`
- `resolveAvatarUrl` path conventions
- FormData field names (`displayName`, `username`, `shortDescription`)
