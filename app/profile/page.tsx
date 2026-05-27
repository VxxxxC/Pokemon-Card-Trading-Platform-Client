import { redirect } from "next/navigation";

/**
 * Profile gateway — in production this reads the session role and redirects:
 *   USER             → /profile/user
 *   MERCHANT         → /profile/merchant
 *   PENDING_MERCHANT → /profile/user  (with KYC banner)
 *   ADMIN            → /admin
 *
 * For demo purposes, we redirect to /profile/user (the default USER view).
 * Use the role-switcher banner on each profile page to test other roles.
 */
export default function ProfileGateway() {
  // TODO: [server] Read auth session role from Supabase — supabase.auth.getSession() then check user.user_metadata.role
  // Redirect: USER → /profile/user | MERCHANT → /profile/merchant | ADMIN → /admin | unauthenticated → /auth
  redirect("/profile/user");
}
