import { NextResponse } from "next/server";
import { normalizePublicOrigin } from "@/lib/auth/normalize-public-origin";
import {
  establishAuthCallbackSession,
  shouldRedirectToPasswordResetComplete,
} from "@/lib/auth/auth-callback-session";
import { getRoleDefaultLandingPath } from "@/lib/auth/roles";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_POST_CONFIRM_PATH = "/profile/user";

function sanitizeNextPath(next: string | null): string {
  if (!next?.startsWith("/")) {
    return DEFAULT_POST_CONFIRM_PATH;
  }

  return next;
}

function buildEmailConfirmedRedirect(origin: string, nextPath: string): string {
  const url = new URL("/auth/email-confirmed", origin);
  if (nextPath !== DEFAULT_POST_CONFIRM_PATH) {
    url.searchParams.set("next", nextPath);
  }
  return url.toString();
}

function buildAuthCallbackErrorRedirect(
  origin: string,
  reason: "auth_callback" | "auth_callback_expired",
  email?: string | null,
): string {
  const url = new URL("/auth", origin);
  url.searchParams.set("error", reason);
  if (email?.trim()) {
    url.searchParams.set("email", email.trim());
  }
  return url.toString();
}

async function resolvePostConfirmPathForUser(
  userId: string,
  nextPath: string,
): Promise<string> {
  if (nextPath !== DEFAULT_POST_CONFIRM_PATH) {
    return nextPath;
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle<{ role: "admin" | "merchant" | "member" | null }>();

    switch (profile?.role) {
      case "admin":
        return getRoleDefaultLandingPath("ADMIN");
      case "merchant":
        return getRoleDefaultLandingPath("MERCHANT");
      case "member":
        return getRoleDefaultLandingPath("USER");
      default:
        return DEFAULT_POST_CONFIRM_PATH;
    }
  } catch {
    return DEFAULT_POST_CONFIRM_PATH;
  }
}

function copyResponseCookies(from: NextResponse, to: NextResponse): void {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const emailHint = requestUrl.searchParams.get("email");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const origin = normalizePublicOrigin(requestUrl.origin);

  if (!code && !tokenHash) {
    return NextResponse.redirect(
      buildAuthCallbackErrorRedirect(origin, "auth_callback", emailHint),
    );
  }

  const pendingResponse = new NextResponse();
  const supabase = await createRouteHandlerClient(pendingResponse);

  const sessionResult = await establishAuthCallbackSession(supabase, {
    code,
    tokenHash,
    type,
  });

  if (!sessionResult.ok) {
    const normalized = sessionResult.message.toLowerCase();
    const reason =
      normalized.includes("expired") || normalized.includes("invalid")
        ? "auth_callback_expired"
        : "auth_callback";
    return NextResponse.redirect(
      buildAuthCallbackErrorRedirect(origin, reason, emailHint),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (shouldRedirectToPasswordResetComplete(type, nextPath)) {
    const finalResponse = NextResponse.redirect(new URL(nextPath, origin).toString());
    copyResponseCookies(pendingResponse, finalResponse);
    return finalResponse;
  }

  if (!user?.email_confirmed_at) {
    return NextResponse.redirect(
      buildAuthCallbackErrorRedirect(origin, "auth_callback_expired", user?.email),
    );
  }

  const resolvedNext = await resolvePostConfirmPathForUser(user.id, nextPath);
  const finalResponse = NextResponse.redirect(
    buildEmailConfirmedRedirect(origin, resolvedNext),
  );
  copyResponseCookies(pendingResponse, finalResponse);

  return finalResponse;
}
