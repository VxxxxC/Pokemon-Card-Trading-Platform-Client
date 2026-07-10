import { NextResponse } from "next/server";

export function isCronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export function assertCronEnvironment():
  | { ok: true }
  | { ok: false; response: NextResponse } {
  if (!process.env.CRON_SECRET) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "CRON_SECRET is not configured" },
        { status: 500 },
      ),
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Supabase admin credentials are not configured" },
        { status: 500 },
      ),
    };
  }

  return { ok: true };
}

export async function handleCronRoute(
  request: Request,
  run: () => Promise<NextResponse>,
  logLabel: string,
  fallbackError: string,
): Promise<NextResponse> {
  const env = assertCronEnvironment();
  if (!env.ok) {
    return env.response;
  }

  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    return await run();
  } catch (error) {
    console.error(logLabel, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : fallbackError,
      },
      { status: 500 },
    );
  }
}
