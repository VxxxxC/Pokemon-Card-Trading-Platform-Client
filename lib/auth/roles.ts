import type { DemoRole } from "@/app/store/useUIStore";
import type { Database } from "@/types/supabase";

export type DbUserRole = Database["public"]["Enums"]["user_role"];

export function dbRoleToDemoRole(
  role: DbUserRole | null | undefined,
): DemoRole {
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

export function getRoleHomePath(role: DemoRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MERCHANT":
      return "/profile/merchant";
    case "USER":
      return "/profile/user";
    case "GUEST":
      return "/auth";
  }
}

export function getRoleDefaultLandingPath(role: DemoRole): string {
  switch (role) {
    case "USER":
      return "/profile/user/collection";
    case "MERCHANT":
      return "/profile/merchant";
    case "ADMIN":
      return "/admin";
    case "GUEST":
      return "/auth";
  }
}

export function getRoleSettingsPath(role: DemoRole): string {
  switch (role) {
    case "MERCHANT":
      return "/profile/merchant/settings";
    case "USER":
      return "/profile/user/settings";
    case "ADMIN":
      return "/admin";
    case "GUEST":
      return "/auth";
  }
}

export function isPathAllowedForRole(role: DemoRole, pathname: string): boolean {
  const requiresAuth =
    pathname === "/profile" ||
    pathname.startsWith("/profile/user") ||
    pathname.startsWith("/profile/merchant") ||
    pathname.startsWith("/admin");

  if (role === "GUEST") {
    return !requiresAuth;
  }

  if (pathname.startsWith("/admin")) {
    return role === "ADMIN";
  }

  if (pathname.startsWith("/profile/merchant")) {
    return role === "MERCHANT" || role === "ADMIN";
  }

  if (pathname === "/profile" || pathname.startsWith("/profile/user")) {
    return role === "USER" || role === "MERCHANT" || role === "ADMIN";
  }

  return true;
}
