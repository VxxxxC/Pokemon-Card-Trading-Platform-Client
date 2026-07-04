# Auth Login / Register — Backend Handoff

## Status

- **Backend:** ✅ Ready (member registration + login; auto-generated username)
- **Frontend:** ✅ Wired (baseline in `AuthForm.tsx` — no username field on register)
- **Partner:** Polish UI, login email persistence, merchant signup flow — see [frontend.md](./frontend.md)

## Scope (this PR)

| In scope | Out of scope (future) |
|----------|----------------------|
| Member `signUp` + `signInWithPassword` | Merchant Supabase registration |
| Email availability pre-check | Password flows — see [auth-password-recovery](../auth-password-recovery/backend.md) |
| Profile auto-create on signup (`handle_new_user`) | OAuth / magic link |
| **Auto-generated unique `profiles.username` on signup** | User-chosen username at register (removed) |
| Role-aware redirect after login/register | Session middleware (see [role-based-routing](../role-based-routing/backend.md)) |
| `logout` server action | — |

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `app/actions/auth.ts` | `login`, `registerMember`, `logout` server actions |
| `lib/auth/validation.ts` | Shared field validation + password regex (register: no username field) |
| `lib/auth/username.ts` | `generateUniqueUsername` — random `user_<suffix>` with collision retry |
| `lib/supabase/admin.ts` | Service-role client (server-only) |
| `lib/supabase/server.ts` | Cookie-based Supabase client (existing) |
| `supabase/migrations/20260702110000_auth_profiles_registration.sql` | Profile grants, display_name uniqueness, signup trigger, RPC |
| `supabase/migrations/20260704140000_profiles_username_on_signup.sql` | `generate_profile_username()` + trigger sets `profiles.username` |
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
| `email` | Yes | Supabase Auth email |
| `password` | Yes | Must pass complexity rules |
| `confirmPassword` | Yes | Must match `password` |
| `agreeTerms` | Yes | `"true"` / `"false"` string from hidden input |

> **No `username` field.** Handle is assigned server-side after signup (see below).

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
| Email | Non-empty + basic `@` format |
| Password | Min **8** chars; at least one lowercase, uppercase, digit, and symbol |
| Confirm password | Must equal password |
| Agree terms | Must be `true` |

Matches Supabase project setting: *Lowercase, uppercase letters, digits and symbols (recommended)*.

Username format / uniqueness is **not** validated at register — users may customize handle later in [user profile settings](../user-profile-settings/backend.md).

## Availability checks (before `signUp`)

| Check | Method |
|-------|--------|
| Email taken | Admin `auth.admin.listUsers()` paginated scan (service role) |

## Username assignment on signup

Two layers (either may satisfy; both are safe):

1. **DB trigger** (`20260704140000_profiles_username_on_signup.sql`) — `handle_new_user` calls `generate_profile_username()` and inserts `profiles.username` (format `user_<10 hex chars>`, retries on collision).
2. **Server action fallback** — `registerMember` calls `assignGeneratedUsername(userId)` via service role if `profiles.username` is still `null` (e.g. migration not yet applied).

### Profile row on signup

| Column | Source |
|--------|--------|
| `id` | `auth.users.id` |
| `display_name` | Email local-part (`alice` from `alice@example.com`) via `user_metadata.display_name` |
| `username` | Auto-generated `user_<random>` (unique index on `lower(username)`) |
| `role` | `user_metadata.role` → defaults to `member` |

Users can change `display_name` and `username` later via `updateUserProfile` — see [user-profile-settings](../user-profile-settings/backend.md).

## Database migrations

| File | Applies |
|------|---------|
| `20260702110000_auth_profiles_registration.sql` | Profile grants, `display_name` uniqueness, `is_display_name_available` RPC, signup trigger |
| `20260704140000_profiles_username_on_signup.sql` | `generate_profile_username()`, trigger sets `username` on insert |

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only — never NEXT_PUBLIC_*
```

## How to verify

### 1. Apply migrations (if not already pushed)

```bash
bunx supabase db push
bun run supabase:types
```

### 2. Manual UI test

```bash
bun run dev
```

1. Open `/auth` → **免費註冊**
2. Register with email `test+1@example.com`, password `Test1234!` (no username field)
3. Expect redirect to `/profile/user/collection`
4. Sign out via **設定 → 登出** → expect `/auth` (see [role-based-routing](../role-based-routing/frontend.md))
5. **登入** with same email/password
6. Re-register with same email → `此電子郵件已被註冊`

### 3. DB spot-check (Supabase dashboard)

- `auth.users` — new row with `user_metadata.display_name` = email local-part, `role: member`
- `public.profiles` — matching row with same `id`, `display_name`, `username` like `user_a1b2c3d4e5`, `role = member`

```sql
SELECT id, display_name, username, role
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
```

## Errors returned to UI

| Condition | Field | Message |
|-----------|-------|---------|
| Empty email (login) | `email` | `請輸入電子郵件` |
| Empty password (login) | `password` | `請輸入密碼` |
| Bad credentials | `email` | `電子郵件或密碼不正確` |
| Invalid email format | `email` | `電子郵件格式不正確` |
| Weak password | `password` | `密碼至少 8 字元…` |
| Password mismatch | `confirmPassword` | `兩次輸入的密碼不一致` |
| Terms not agreed | `agreeTerms` | `請同意服務條款及私隱政策` |
| Email already registered | `email` | `此電子郵件已被註冊` |
| Availability check failure | `email` | `無法驗證帳戶資料，請稍後再試` |
| Username assignment failure | `email` | `帳戶已建立，但用戶名稱設定失敗，請聯絡客服` |
| Generic auth failure | `email` | `登入或註冊失敗，請稍後再試` |

Raw Supabase / Postgres errors are **not** leaked to the client.

## Do not change without backend sync

- `AuthFormErrors` field keys (`email`, `password`, etc.)
- Password complexity regex
- `user_metadata` shape (`display_name`, `role`)
- Username generation format / uniqueness guarantees
- Migration / trigger behaviour
- Redirect target after auth — see `getRoleDefaultLandingPath` in `lib/auth/roles.ts`

UI styling and controlled-field behaviour in `AuthForm.tsx` are partner-owned.
