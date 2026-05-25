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
  redirect("/profile/user");
}
