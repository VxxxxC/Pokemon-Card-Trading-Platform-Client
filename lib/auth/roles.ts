import type { AuthRole } from "@/app/store/useUIStore";
import type { Database } from "@/types/supabase";
import {
  defaultListingPersonaForRole,
  type ListingSellerPersona,
} from "@/lib/listings/active-listing-persona";

export type DbUserRole = Database["public"]["Enums"]["user_role"];

export function dbRoleToAuthRole(
  role: DbUserRole | null | undefined,
): AuthRole {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "merchant":
      return "MERCHANT";
    case "member":
    default:
      return "USER";
  }
}

export function getRoleHomePath(role: AuthRole): string {
  return getProfileHomePath(role, defaultListingPersonaForRole(role));
}

export function getProfileHomePath(
  role: AuthRole,
  persona: ListingSellerPersona = defaultListingPersonaForRole(role),
): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "GUEST":
      return "/auth";
    case "USER":
      return "/profile/user";
    case "MERCHANT":
      return persona === "member" ? "/profile/user" : "/profile/merchant";
  }
}

export function getTradingHomePath(
  role: AuthRole,
  persona: ListingSellerPersona = defaultListingPersonaForRole(role),
): string {
  switch (role) {
    case "ADMIN":
      return "/admin/user_control";
    case "GUEST":
      return "/auth";
    case "USER":
      return "/profile/user/trading";
    case "MERCHANT":
      return persona === "member"
        ? "/profile/user/trading"
        : "/profile/merchant/trading";
  }
}

export function getRoleDefaultLandingPath(role: AuthRole): string {
  switch (role) {
    case "USER":
      return "/profile/user";
    case "MERCHANT":
      return "/profile/merchant";
    case "ADMIN":
      return "/admin";
    case "GUEST":
      return "/auth";
  }
}

export function getRoleSettingsPath(role: AuthRole): string {
  switch (role) {
    case "MERCHANT":
      return "/profile/merchant/settings";
    case "USER":
      return "/profile/user/settings";
    case "ADMIN":
      return "/admin/settings";
    case "GUEST":
      return "/auth";
  }
}

function isMemberDashboardPath(pathname: string): boolean {
  return (
    pathname === "/profile/user" || pathname.startsWith("/profile/user/")
  );
}

function isMerchantDashboardPath(pathname: string): boolean {
  return (
    pathname === "/profile/merchant" ||
    pathname.startsWith("/profile/merchant/")
  );
}

export function isPathAllowedForRole(role: AuthRole, pathname: string): boolean {
  const requiresAuth =
    pathname === "/profile" ||
    isMemberDashboardPath(pathname) ||
    isMerchantDashboardPath(pathname) ||
    pathname.startsWith("/admin");

  if (role === "GUEST") {
    return !requiresAuth;
  }

  if (pathname.startsWith("/admin")) {
    return role === "ADMIN";
  }

  if (isMerchantDashboardPath(pathname)) {
    return role === "MERCHANT" || role === "ADMIN";
  }

  if (pathname === "/profile" || isMemberDashboardPath(pathname)) {
    return role === "USER" || role === "MERCHANT" || role === "ADMIN";
  }

  return true;
}
