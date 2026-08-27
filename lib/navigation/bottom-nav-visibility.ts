const BOTTOM_NAV_PROFILE_PATHS = new Set([
  "/profile/user",
  "/profile/user/collection",
  "/profile/user/inventory",
  "/profile/merchant",
  "/profile/merchant/inventory",
  "/profile/merchant/finance",
]);

const BOTTOM_NAV_TRADING_PATHS = new Set([
  "/profile/user/trading",
  "/profile/merchant/trading",
]);

/**
 * Bottom nav is only shown on primary app hubs: home, marketplace, profile tabs,
 * and trading management — hidden on settings, sub-flows, and static pages.
 */
export function shouldShowBottomNav(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  if (pathname === "/marketplace" || pathname.startsWith("/marketplace/")) {
    return true;
  }

  if (BOTTOM_NAV_PROFILE_PATHS.has(pathname)) {
    return true;
  }

  if (BOTTOM_NAV_TRADING_PATHS.has(pathname)) {
    return true;
  }

  return false;
}
