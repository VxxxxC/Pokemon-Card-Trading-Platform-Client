# Auth Login / Register — Frontend Handoff

## Status

- **Backend:** ✅ Ready (auto-generated username on signup)
- **Frontend:** ✅ **Baseline wired** — login + member register work in `AuthForm.tsx`
- **Your focus:** Visual polish, login field persistence, merchant flow, post-auth nav polish

## What is already done

| Feature | Location |
|---------|----------|
| Login tab → `login` server action | `AuthForm.tsx` ~L210–213 |
| Register tab → client wrapper + `registerMember` | `AuthForm.tsx` ~L216–242 |
| Field-level error display (login + register) | `Field` component + `errors` map |
| Password show/hide toggle | `PasswordInput` |
| Merchant toggle + approval success screen | `isMerchant` / `isMerchantSubmitted` |
| `?role=merchant` deep link → register + merchant toggle | `useEffect` ~L196–207 |
| **Preserve email, agreeTerms on validation failure** | Controlled state `registerEmail`, ~L229–231 |
| Hidden fields for `agreeTerms`, `isMerchant` | Register form ~L412–421 |
| **No username field on register** — backend assigns `profiles.username` | Register form (username input removed) |

## UI touchpoints

| File | Area |
|------|------|
| `app/auth/AuthForm.tsx` | Main form — tabs, validation errors, submit |
| `app/auth/page.tsx` | Page shell (left relic panel + form card) — **no auth logic** |

### Key `AuthForm.tsx` sections

- Tab switcher: ~L322–347
- Login form: ~L351–399
- Register form: ~L402–505 (email, password, terms only)
- Merchant success panel: ~L251–288

## Server action usage (already integrated)

```ts
import { login, registerMember } from "@/app/actions/auth";
import { validateRegisterFields } from "@/lib/auth/validation";

// Login — direct binding
const [loginErrors, loginAction, isLoginPending] = useActionState(login, null);

// Register — wrapper handles merchant branch + field persistence
const [registerErrors, registerAction, isRegisterPending] = useActionState(
  async (prev, formData) => {
    // sync controlled fields, validate, merchant intercept, else registerMember
  },
  null,
);
```

### FormData contract (register)

| `name` | Type | Notes |
|--------|------|-------|
| `email` | email input | Controlled via `registerEmail` |
| `password` | password | Uncontrolled (cleared on re-render is OK) |
| `confirmPassword` | password | Uncontrolled |
| `agreeTerms` | hidden | `"true"` / `"false"` from `agreeTerms` state |
| `isMerchant` | hidden | `"true"` / `"false"` from `isMerchant` state |

> **Removed:** `username` — no longer collected at signup. Users get a random handle (e.g. `user_k3m9x2p1q0`) and can change it in **設定 → 用戶名** — see [user-profile-settings](../user-profile-settings/frontend.md).

## Role flows

| Flow | Status |
|------|--------|
| **Member** register | ✅ Wired to Supabase |
| **Member** login | ✅ Wired to Supabase |
| **Merchant** register | ⏳ UI-only — shows approval screen, no backend call |
| Password reset | ✅ See [auth-password-recovery](../auth-password-recovery/frontend.md) — forgot (guest) + reset (logged-in) |
| Remember me | ⏳ UI checkbox only — no session persistence logic |
| Session / route guards | ✅ See [role-based-routing](../role-based-routing/frontend.md) |
| Logout | ✅ `LogoutModal` → `logout` action |

## Optional polish (partner backlog)

- [ ] Preserve **login email** on failed login (register email already preserved)
- [ ] Post-register UX: show assigned username once (e.g. toast) or link to settings to customize
- [ ] Preserve password fields on validation error (if product wants — usually avoided for security)
- [ ] Loading / error toast for unexpected failures
- [ ] Disable submit while pending (already done via `isLoginPending` / `isRegisterPending`)
- [ ] Wire **merchant registration** when backend flow is ready
- [ ] Wire **merchant settings** password link → `/auth/reset-password` (member path done — see [auth-password-recovery](../auth-password-recovery/frontend.md))
- [ ] Redirect authenticated users away from `/auth` if already logged in
- [ ] Connect TopNav / BottomNav avatar to real session profile
- [ ] Role-aware nav links (see [role-based-routing](../role-based-routing/frontend.md))
- [ ] Style pass: error states, mobile keyboard types, focus order

## Acceptance test

1. `bun run dev` — ensure `.env` has all three Supabase keys (see [backend.md](./backend.md))
2. Confirm migrations `20260702110000` and `20260704140000` are applied
3. **Register (member)**
   - Go to `/auth` → 免費註冊
   - Confirm **no username field** on the form
   - Leave fields empty → submit → inline errors, no navigation
   - Enter weak password → password error; email/checkbox **stay filled**
   - Enter valid email + password → redirect to `/profile/user/collection`
4. **Duplicate checks**
   - Same email → `此電子郵件已被註冊`
5. **Profile username**
   - After register, open **設定** → handle field shows auto-generated `user_*` value (or set via DB if migration-only path)
6. **Login**
   - Sign in with registered credentials → redirect to collection
   - Wrong password → `電子郵件或密碼不正確`
7. **Merchant UI**
   - Toggle 認證商戶 → submit with valid fields → approval screen (no Supabase signup)
   - Visit `/auth?role=merchant` → lands on register tab with merchant toggle on

## Do not edit (backend track)

- `app/actions/auth.ts`
- `lib/auth/validation.ts`
- `lib/auth/username.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/server.ts`
- `supabase/migrations/20260702110000_auth_profiles_registration.sql`
- `supabase/migrations/20260704140000_profiles_username_on_signup.sql`

Coordinate with backend dev before changing server actions or validation rules.

## Related next flows

- **Role-based routing & logout** — ✅ [role-based-routing](../role-based-routing/frontend.md)
- **Merchant registration** — KYC + `role: merchant` signup path
- **Profile settings** — customize `displayName` / `username` via `updateUserProfile` — [user-profile-settings](../user-profile-settings/frontend.md)
