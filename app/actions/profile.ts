"use server";

import type { DemoRole } from "@/app/store/useUIStore";
import { resolveCurrentDemoRole } from "@/lib/auth/session";

export async function getCurrentUserRole(): Promise<
  { success: true; data: DemoRole } | { success: false; error: string }
> {
  try {
    const role = await resolveCurrentDemoRole();
    return { success: true, data: role };
  } catch {
    return { success: false, error: "無法取得用戶角色" };
  }
}
