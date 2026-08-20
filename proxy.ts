import { type NextRequest, NextResponse } from "next/server";
import type { Tables } from "@/types/supabase";
import type { AuthRole } from "@/app/store/useUIStore";
import {
  dbRoleToAuthRole,
  getRoleHomePath,
  isPathAllowedForRole,
} from "@/lib/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

export async function proxy(request: NextRequest) {
  const { supabase, user, response } = await updateSession(request);

  let role: AuthRole = "GUEST";
  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<ProfileRoleRow>();
    role = dbRoleToAuthRole(profile?.role);
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
