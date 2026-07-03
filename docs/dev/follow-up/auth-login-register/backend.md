# Auth Login / Register — Backend Handoff

## Status

- **Backend:** ✅ Ready (member registration + login)
- **Frontend:** ✅ Wired (baseline in `AuthForm.tsx`)
- **Partner:** Polish UI, login email persistence, merchant signup flow — see [frontend.md](./frontend.md)

## Scope (this PR)

| In scope | Out of scope (future) |
|----------|----------------------|
| Member `signUp` + `signInWithPassword` | Merchant Supabase registration |
| Username / email availability pre-check | Password flows — see [auth-password-recovery](../auth-password-recovery/backend.md) |
| Profile auto-create on signup (`handle_new_user`) | OAuth / magic link |
| Role-aware redirect after login/register | Session middleware (see [role-based-routing](../role-based-routing/backend.md)) |
| `logout` server action | — |

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `app/actions/auth.ts` | `login`, `registerMember`, `logout` server actions |
| `lib/auth/validation.ts` | Shared field validation + password regex |
| `lib/supabase/admin.ts` | Service-role client (server-only) |
| `lib/supabase/server.ts` | Cookie-based Supabase client (existing) |
| `supabase/migrations/20260702110000_auth_profiles_registration.sql` | Profile grants, uniqueness, signup trigger, RPC |
| `types/supabase.ts` | Regenerated — includes `is_display_name_available` RPC |

## Action contract

Both actions are designed for React 19 `useActionState(formAction, null)`.

```ts
import { login, registerMember } from "@/app/actions/auth";
import type { AuthFormErrors } from "@/lib/auth/validation";

// Signature (both)
(prev: AuthFormErrors | null, formData: FormData) => Promise<AuthFormErrors | null>

// Success → redirect (no return value observed by client)
// Failure → field-level errors, e.g. { email: "此電子郵件已被註冊" }
```

### `login` — FormData fields

| Field | Required | Notes |
|-------|----------|-------|
| `email` | Yes | Trimmed |
| `password` | Yes | |

**On success:** `redirect(getRoleDefaultLandingPath(role))` — see [role-based-routing backend](../role-based-routing/backend.md)

| Role | Redirect |
|------|----------|
| `member` → `USER` | `/profile/user/collection` |
| `merchant` → `MERCHANT` | `/profile/merchant` |
| `admin` → `ADMIN` | `/admin` |

### `registerMember` — FormData fields

| Field | Required | Notes |
|-------|----------|-------|
| `username` | Yes | Maps to `profiles.display_name` |
| `email` | Yes | Supabase Auth email |
| `password` | Yes | Must pass complexity rules |
| `confirmPassword` | Yes | Must match `password` |
| `agreeTerms` | Yes | `"true"` / `"false"` string from hidden input |

**On success:** `redirect(getRoleDefaultLandingPath(role))` — see [role-based-routing backend](../role-based-routing/backend.md)

| Role | Redirect |
|------|----------|
| `member` → `USER` | `/profile/user/collection` |
| `merchant` → `MERCHANT` | `/profile/merchant` |
| `admin` → `ADMIN` | `/admin` |  
**Role written:** `member` (via `user_metadata.role` + profile trigger)

> Merchant toggle is handled in the UI wrapper only — `registerMember` is **not** called when `isMerchant=true`.

### `logout`

```ts
import { logout } from "@/app/actions/auth";

// No args. Success → redirect("/auth"). Failure → throws.
```

Wired in `LogoutModal.tsx` (user / merchant / admin settings).

## Validation rules (`lib/auth/validation.ts`)

| Field | Rule |
|-------|------|
| Username | 3–24 chars; `[A-Za-z0-9_-]` only |
| Email | Non-empty + basic `@` format |
| Password | Min **8** chars; at least one lowercase, uppercase, digit, and symbol |
| Confirm password | Must equal password |
| Agree terms | Must be `true` |

Matches Supabase project setting: *Lowercase, uppercase letters, digits and symbols (recommended)*.

## Availability checks (before `signUp`)

| Check | Method |
|-------|--------|
| Email taken | Admin `auth.admin.listUsers()` paginated scan (service role) |
| Username taken | RPC `is_display_name_available(name)` → returns `false` if taken |

## Database migration

**File:** `supabase/migrations/20260702110000_auth_profiles_registration.sql`

Applies:

1. `GRANT SELECT, INSERT, UPDATE ON profiles TO service_role`
2. Unique index on `lower(display_name)`
3. RPC `is_display_name_available(text)` — callable by anon/authenticated/service_role
4. Trigger `on_auth_user_created` → inserts/upserts `profiles` row from `raw_user_meta_data`

### Profile row on signup

| Column | Source |
|--------|--------|
| `id` | `auth.users.id` |
| `display_name` | `user_metadata.display_name` (form username) |
| `role` | `user_metadata.role` → defaults to `member` |

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only — never NEXT_PUBLIC_*
```

## How to verify

### 1. Apply migration (if not already pushed)

```bash
bunx supabase db push
bun run supabase:types
```

### 2. Manual UI test

```bash
bun run dev
```

1. Open `/auth` → **免費註冊**
2. Register with username `testuser_123`, email `test+1@example.com`, password `Test1234!`
3. Expect redirect to `/profile/user/collection`
4. Sign out via **設定 → 登出** → expect `/auth` (see [role-based-routing](../role-based-routing/frontend.md))
5. **登入** with same email/password
5. Re-register with same email → `此電子郵件已被註冊`
6. Re-register with same username → `此用戶名稱已被使用`

### 3. DB spot-check (Supabase dashboard)

- `auth.users` — new row with `user_metadata.display_name` + `role: member`
- `public.profiles` — matching row with same `id`, `display_name`, `role = member`

## Errors returned to UI

| Condition | Field | Message |
|-----------|-------|---------|
| Empty email (login) | `email` | `請輸入電子郵件` |
| Empty password (login) | `password` | `請輸入密碼` |
| Bad credentials | `email` | `電子郵件或密碼不正確` |
| Invalid username format | `username` | `用戶名稱限 3-24 字元…` |
| Invalid email format | `email` | `電子郵件格式不正確` |
| Weak password | `password` | `密碼至少 8 字元…` |
| Password mismatch | `confirmPassword` | `兩次輸入的密碼不一致` |
| Terms not agreed | `agreeTerms` | `請同意服務條款及私隱政策` |
| Email already registered | `email` | `此電子郵件已被註冊` |
| Username taken | `username` | `此用戶名稱已被使用` |
| Availability check failure | `email` | `無法驗證帳戶資料，請稍後再試` |
| Generic auth failure | `email` | `登入或註冊失敗，請稍後再試` |

Raw Supabase / Postgres errors are **not** leaked to the client.

## Do not change without backend sync

- `AuthFormErrors` field keys (`email`, `username`, `password`, etc.)
- Password complexity regex
- `user_metadata` shape (`display_name`, `role`)
- Migration / trigger / RPC behaviour
- Redirect target after auth — see `getRoleDefaultLandingPath` in `lib/auth/roles.ts`

UI styling and controlled-field behaviour in `AuthForm.tsx` are partner-owned.
