"use server";

import {
  emptyMerchantPerformanceAnalytics,
  mapMerchantPerformanceRpcPayload,
} from "@/lib/dashboard/map-merchant-performance";
import {
  MERCHANT_PERF_DEFAULT_RANGE,
  MERCHANT_PERF_TOP_LIMIT,
  isMerchantPerformanceRange,
} from "@/lib/dashboard/merchant-performance-ranges";
import type {
  MerchantPerformanceAnalytics,
  MerchantPerformanceRange,
  MerchantPerformanceRpcPayload,
} from "@/lib/dashboard/merchant-performance-types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type MerchantRoleRow = Pick<Tables<"profiles">, "role">;

type MerchantPerformanceResult =
  | { success: true; data: MerchantPerformanceAnalytics }
  | { success: false; error: string };

type MerchantPerformanceRpcArgs = {
  p_time_range: MerchantPerformanceRange;
  p_top_limit: number;
};

export async function getMerchantPerformanceAnalytics(
  timeRange: MerchantPerformanceRange = MERCHANT_PERF_DEFAULT_RANGE,
): Promise<MerchantPerformanceResult> {
  const resolvedRange = isMerchantPerformanceRange(timeRange)
    ? timeRange
    : MERCHANT_PERF_DEFAULT_RANGE;

  if (!isSupabaseConfigured()) {
    return { success: false, error: "請先登入" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "請先登入" };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<MerchantRoleRow>();

    if (profileError || !profile) {
      return { success: false, error: "無法取得用戶資料" };
    }

    if (profile.role !== "merchant") {
      return { success: false, error: "無商戶權限" };
    }

    const rpcArgs: MerchantPerformanceRpcArgs = {
      p_time_range: resolvedRange,
      p_top_limit: MERCHANT_PERF_TOP_LIMIT,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "get_merchant_performance_analytics",
          args: MerchantPerformanceRpcArgs,
        ) => Promise<{
          data: MerchantPerformanceRpcPayload | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("get_merchant_performance_analytics", rpcArgs);

    if (error) {
      console.error("[getMerchantPerformanceAnalytics]", error.message);
      return { success: false, error: "無法載入業績分析" };
    }

    if (!data) {
      return {
        success: true,
        data: emptyMerchantPerformanceAnalytics(resolvedRange),
      };
    }

    return {
      success: true,
      data: mapMerchantPerformanceRpcPayload(data, resolvedRange),
    };
  } catch (error) {
    console.error("[getMerchantPerformanceAnalytics]", error);
    return { success: false, error: "無法載入業績分析" };
  }
}
