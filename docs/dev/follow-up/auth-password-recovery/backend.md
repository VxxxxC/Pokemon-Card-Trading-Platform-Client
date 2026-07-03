# Auth Password Recovery & Reset — Backend Handoff

## Status

- **Backend:** ✅ Ready (forgot password for guests + reset password for logged-in users)
- **Frontend:** ✅ Wired (baseline)
- **Partner:** Merchant settings password link, email change flow, Supabase redirect URL config in dashboard

## Two separate flows

| Flow | Route | Who | Purpose |
|------|-------|-----|---------|
| **Forgot password** | `/auth/forgot-password` | Guests only | Request reset email |
| **Complete forgot** | `/auth/forgot-password/complete` | After email link | Set new password (recovery session) |
| **Reset password** | `/auth/reset-password` | Logged-in member/merchant/admin | Change password from settings |

Logged-in users hitting `/auth/forgot-password` are redirected to `/auth/reset-password`.

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `app/actions/auth.ts` | `requestForgotPassword`, `completeForgotPassword`, `updatePasswordFromProfile` |
| `lib/auth/validation.ts` | `validatePasswordResetRequest`, `validatePasswordUpdate`, `validateProfilePasswordUpdate` |
| `lib/auth/password-errors.ts` | `mapPasswordUpdateAuthError`, same-password detection |
| `lib/auth/site-url.ts` | `getSiteUrl()` for Supabase `redirectTo` |
| `lib/auth/roles.ts` | `getRoleSettingsPath()` |
| `app/auth/callback/route.ts` | PKCE `exchangeCodeForSession` → redirect to `next` param |

## Action contracts

### `requestForgotPassword` — guest only

```ts
// useActionState — returns union, not AuthFormErrors
type ForgotPasswordRequestResult =
  | { status: "sent" }
  | { status: "error"; errors: AuthFormErrors };

// FormData: email
// Rejects if user already logged in
// redirectTo: {SITE}/auth/callback?next=/auth/forgot-password/complete
```

### `completeForgotPassword` — after email link

```ts
// FormData: password, confirmPassword
// Success → redirect to role home + ?passwordUpdated=1
// Uses validatePasswordUpdate (no current password field)
```

### `updatePasswordFromProfile` — logged-in change

```ts
// FormData: currentPassword, password, confirmPassword
// Validates new !== current (client + server)
// Verifies current via signInWithPassword
// Success → redirect to getRoleSettingsPath(role) + ?passwordUpdated=1
```

## Supabase dashboard config (required)

**Authentication → URL Configuration** — add redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://<production-domain>/auth/callback`

**Optional env:**

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Password validation rules

Same as registration (`PASSWORD_COMPLEXITY_REGEX`):

- Min 8 chars; uppercase, lowercase, digit, symbol

**Profile reset only:** current password required; new must differ → `新密碼不可與目前密碼相同`

## How to verify

### Forgot password (guest)

1. Log out → `/auth/forgot-password`
2. Enter email →「重設郵件已送出」
3. Click email link → `/auth/forgot-password/complete`
4. Set new password → redirect to role home + toast「密碼已更新」

### Reset password (logged-in)

1. `/profile/user/settings` → 更改 → `/auth/reset-password`
2. Enter current + new password
3. Same as current → error + toast
4. Success → back to settings + toast「密碼已更新」

## Errors (profile reset)

| Condition | Field | Message |
|-----------|-------|---------|
| Missing current password | `currentPassword` | `請輸入目前密碼` |
| Wrong current password | `currentPassword` | `目前密碼不正確` |
| New === current | `password` | `新密碼不可與目前密碼相同` |
| Weak password | `password` | Complexity message |
| Mismatch confirm | `confirmPassword` | `兩次輸入的密碼不一致` |

## Do not change without backend sync

- Route split: `/auth/forgot-password` vs `/auth/reset-password`
- Callback path `/auth/callback` and `next` query param
- FormData field names for each action
- `getRoleSettingsPath` redirect targets after profile reset
