import { type NextRequest, NextResponse } from "next/server";
import type { Tables } from "@/types/supabase";
import {
  dbRoleToDemoRole,
  getRoleHomePath,
  isPathAllowedForRole,
} from "@/lib/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

export async function middleware(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request);

  let role: "GUEST" | "USER" | "MERCHANT" | "ADMIN" = "GUEST";
  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<ProfileRoleRow>();
    role = dbRoleToDemoRole(profile?.role);
  }

  const { pathname } = request.nextUrl;

  if (isPathAllowedForRole(role, pathname)) {
    return response;
  }

  if (role === "GUEST") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    if (pathname !== "/auth") {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = getRoleHomePath(role);
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/profile", "/profile/:path*", "/admin", "/admin/:path*"],
};
