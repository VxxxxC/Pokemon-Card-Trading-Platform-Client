"use server";

import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import {
  commissionPercentToRate,
  commissionRateToPercent,
  DEFAULT_COMMISSION_RATE,
  parseCommissionRateFromSettings,
  PLATFORM_FINANCIAL_CONFIG_KEY,
  validateCommissionPercent,
} from "@/lib/platform/financial-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type PlatformFinancialConfigResult =
  | { success: true; data: { commissionRatePercent: number } }
  | { success: false; error: string };

async function requireAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "未登入" };
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    return { ok: false, error: "請先登入" };
  }

  const supabase = await createClient();
  const isAdmin = await isCurrentUserAdmin(supabase, user.id);
  if (!isAdmin) {
    return { ok: false, error: "無管理員權限" };
  }

  return { ok: true, adminId: user.id };
}

async function readCommissionRateFromDb(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_COMMISSION_RATE;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", PLATFORM_FINANCIAL_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    console.error("[readCommissionRateFromDb]", error.message);
    return DEFAULT_COMMISSION_RATE;
  }

  return parseCommissionRateFromSettings(data?.value);
}

export async function getPlatformFinancialConfig(): Promise<PlatformFinancialConfigResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const rate = await readCommissionRateFromDb();
  return {
    success: true,
    data: { commissionRatePercent: commissionRateToPercent(rate) },
  };
}

export async function getPlatformCommissionRateForDisplay(): Promise<
  { success: true; data: { commissionRate: number } } | { success: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return {
      success: true,
      data: { commissionRate: DEFAULT_COMMISSION_RATE },
    };
  }

  const rate = await readCommissionRateFromDb();
  return { success: true, data: { commissionRate: rate } };
}

export async function updatePlatformFinancialConfig(input: {
  commissionRatePercent: number;
}): Promise<PlatformFinancialConfigResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const validationError = validateCommissionPercent(input.commissionRatePercent);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const commissionRate = commissionPercentToRate(input.commissionRatePercent);
  const admin = createAdminClient();

  const { error } = await admin.from("platform_settings").upsert(
    {
      key: PLATFORM_FINANCIAL_CONFIG_KEY,
      value: { commissionRate },
      updated_by: guard.adminId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    console.error("[updatePlatformFinancialConfig]", error.message);
    return { success: false, error: "無法儲存財務設定" };
  }

  return {
    success: true,
    data: { commissionRatePercent: commissionRateToPercent(commissionRate) },
  };
}
