"use server";

import { mapMerchantProductAnalyticsRpcPayload } from "@/lib/dashboard/map-merchant-product-analytics";
import { MERCHANT_PRODUCT_HISTORY_PAGE_SIZE } from "@/lib/dashboard/merchant-product-analytics-constants";
import type { MerchantProductAnalyticsRpcPayload } from "@/lib/dashboard/merchant-product-analytics-types";
import {
  MERCHANT_PERF_DEFAULT_RANGE,
  isMerchantPerformanceRange,
} from "@/lib/dashboard/merchant-performance-ranges";
import type { MerchantPerformanceRange } from "@/lib/dashboard/merchant-performance-types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type MerchantRoleRow = Pick<Tables<"profiles">, "role">;

type ProductCatalogIdRow = Pick<Tables<"product_catalog">, "id">;

export type GetMerchantProductAnalyticsInput = {
  productId?: string;
  sku?: string;
  timeRange?: MerchantPerformanceRange;
  historyPage?: number;
};

type MerchantProductAnalyticsResult =
  | { success: true; data: import("@/lib/dashboard/merchant-product-analytics-types").MerchantProductAnalytics }
  | { success: false; error: string; notFound?: boolean };

type MerchantProductAnalyticsRpcArgs = {
  p_product_id: string;
  p_time_range: MerchantPerformanceRange;
  p_history_page: number;
  p_history_page_size: number;
};

async function lookupProductCatalogId(
  identifier: string,
): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();

  const byId = await supabase
    .from("product_catalog")
    .select("id")
    .eq("id", trimmed)
    .maybeSingle<ProductCatalogIdRow>();

  if (byId.data?.id) {
    return byId.data.id;
  }

  const byDisplay = await supabase
    .from("product_catalog")
    .select("id")
    .eq("display_id", trimmed)
    .maybeSingle<ProductCatalogIdRow>();

  if (byDisplay.data?.id) {
    return byDisplay.data.id;
  }

  const byCanonical = await supabase
    .from("product_catalog")
    .select("id")
    .eq("id_canonical", trimmed.toLowerCase())
    .maybeSingle<ProductCatalogIdRow>();

  if (byCanonical.data?.id) {
    return byCanonical.data.id;
  }

  const byCompact = await supabase
    .from("product_catalog")
    .select("id")
    .eq("id_compact", trimmed.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .maybeSingle<ProductCatalogIdRow>();

  return byCompact.data?.id ?? null;
}

export async function resolveMerchantProductId(
  productId?: string,
  sku?: string,
): Promise<string | null> {
  const candidates = [...new Set(
    [productId?.trim(), sku?.trim()].filter(
      (value): value is string => Boolean(value),
    ),
  )];

  for (const candidate of candidates) {
    const resolved = await lookupProductCatalogId(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export async function getMerchantProductAnalytics(
  input: GetMerchantProductAnalyticsInput,
): Promise<MerchantProductAnalyticsResult> {
  const resolvedRange = isMerchantPerformanceRange(input.timeRange ?? "")
    ? input.timeRange!
    : MERCHANT_PERF_DEFAULT_RANGE;
  const historyPage = Math.max(input.historyPage ?? 1, 1);

  if (!isSupabaseConfigured()) {
    return { success: false, error: "請先登入" };
  }

  const resolvedProductId = await resolveMerchantProductId(
    input.productId,
    input.sku,
  );

  if (!resolvedProductId) {
    return { success: false, error: "找不到商品", notFound: true };
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

    const rpcArgs: MerchantProductAnalyticsRpcArgs = {
      p_product_id: resolvedProductId,
      p_time_range: resolvedRange,
      p_history_page: historyPage,
      p_history_page_size: MERCHANT_PRODUCT_HISTORY_PAGE_SIZE,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "get_merchant_product_analytics",
          args: MerchantProductAnalyticsRpcArgs,
        ) => Promise<{
          data: MerchantProductAnalyticsRpcPayload | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("get_merchant_product_analytics", rpcArgs);

    if (error) {
      console.error("[getMerchantProductAnalytics]", error.message);
      return { success: false, error: "無法載入商品分析" };
    }

    if (!data) {
      return {
        success: false,
        error: "找不到商品或無權限查看",
        notFound: true,
      };
    }

    return {
      success: true,
      data: mapMerchantProductAnalyticsRpcPayload(
        data,
        resolvedRange,
        resolvedProductId,
      ),
    };
  } catch (error) {
    console.error("[getMerchantProductAnalytics]", error);
    return { success: false, error: "無法載入商品分析" };
  }
}
