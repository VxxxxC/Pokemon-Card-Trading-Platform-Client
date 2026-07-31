"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { runAuthFeeCaptureSaga } from "@/lib/payments/auth-capture-saga";
import {
  isGradingFaultParty,
  runAuthGradingFailVoidSaga,
  type GradingFaultParty,
} from "@/lib/payments/auth-grading-fail-void-saga";
import { runGoodsCaptureSaga } from "@/lib/payments/goods-capture-saga";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AdminGradingTab =
  | "awaiting_intake"
  | "grading"
  | "awaiting_outbound"
  | "closed";

export type AdminGradingOrderKind = "member" | "merchant";

export type AdminGradingFaultParty =
  | "buyer"
  | "seller"
  | "platform"
  | "carrier"
  | "inconclusive";

export type AdminGradingQueueRow = {
  order_kind: AdminGradingOrderKind;
  order_id: string;
  order_number: string | null;
  buyer_id: string;
  counterparty_seller_id: string | null;
  merchant_id: string | null;
  listing_id: string;
  item_subtotal: number;
  shipping_fee: number;
  auth_fee: number;
  total_amount: number | null;
  inbound_tracking_no: string | null;
  outbound_tracking_no: string | null;
  auth_result: string | null;
  refund_status: string;
  refund_amount: number | null;
  escrow_status: string;
  platform_received_at: string | null;
  auth_graded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  buyer_display_name: string | null;
  buyer_username: string | null;
  seller_display_name: string | null;
  seller_username: string | null;
  shop_name: string | null;
  product_name_zh: string | null;
  product_name_ja: string | null;
  product_name_en: string | null;
  grading_company: string;
  grading_score: string | null;
};

export type AdminGradingAuditRow = {
  id: string;
  order_kind: AdminGradingOrderKind;
  order_id: string;
  admin_id: string;
  action: string;
  from_status: string | null;
  to_status: string | null;
  notes: string | null;
  created_at: string;
  admin_display_name: string | null;
  admin_username: string | null;
};

type ActionResult<T> =
  | { success: true; data: T }
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

function mapRpcError(message: string): string {
  if (message.includes("無管理員權限")) {
    return "無管理員權限";
  }
  return message || "操作失敗，請稍後再試";
}

function revalidateGradingPaths(
  orderKind: AdminGradingOrderKind,
  orderId: string,
): void {
  revalidatePath("/admin/grading");
  if (orderKind === "member") {
    revalidatePath("/profile/user/orderDetail/" + orderId);
    revalidatePath("/profile/user/trading");
  } else {
    revalidatePath("/profile/merchant/orderDetail/" + orderId);
    revalidatePath("/profile/merchant/trading");
    revalidatePath("/profile/user/orderDetail/" + orderId);
  }
}

function parseQueuePayload(data: unknown): {
  rows: AdminGradingQueueRow[];
  total: number;
  page: number;
  pageSize: number;
} | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const total = typeof payload.total === "number" ? payload.total : 0;
  const page = typeof payload.page === "number" ? payload.page : 1;
  const pageSize = typeof payload.page_size === "number" ? payload.page_size : 20;

  return {
    rows: rows as AdminGradingQueueRow[],
    total,
    page,
    pageSize,
  };
}

function parseAuditPayload(data: unknown): AdminGradingAuditRow[] {
  if (!data || typeof data !== "object") {
    return [];
  }
  const rows = (data as { rows?: unknown }).rows;
  return Array.isArray(rows) ? (rows as AdminGradingAuditRow[]) : [];
}

type AdminGradingRpcClient = {
  rpc(
    fn: "search_admin_grading_orders",
    args: {
      p_tab: AdminGradingTab;
      p_order_kind: AdminGradingOrderKind | null;
      p_keyword: string | null;
      p_page: number;
      p_page_size: number;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_admin_confirm_grading_intake",
    args: { p_order_kind: AdminGradingOrderKind; p_order_id: string },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_admin_submit_grading_outbound",
    args: {
      p_order_kind: AdminGradingOrderKind;
      p_order_id: string;
      p_tracking_no: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "get_admin_grading_audit_history",
    args: { p_order_kind: AdminGradingOrderKind; p_order_id: string },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

function asAdminGradingRpcClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
): AdminGradingRpcClient {
  return supabase as unknown as AdminGradingRpcClient;
}

export async function searchAdminGradingOrders(params: {
  tab: AdminGradingTab;
  orderKind?: AdminGradingOrderKind | "all";
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    rows: AdminGradingQueueRow[];
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  try {
    const supabase = asAdminGradingRpcClient(await createClient());
    const { data, error } = await supabase.rpc("search_admin_grading_orders", {
      p_tab: params.tab,
      p_order_kind:
        params.orderKind && params.orderKind !== "all"
          ? params.orderKind
          : null,
      p_keyword: params.keyword?.trim() || null,
      p_page: params.page ?? 1,
      p_page_size: params.pageSize ?? 20,
    });

    if (error) {
      console.error("[searchAdminGradingOrders]", error.message);
      return { success: false, error: mapRpcError(error.message) };
    }

    const parsed = parseQueuePayload(data);
    if (!parsed) {
      return { success: false, error: "無法載入鑑定佇列" };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error("[searchAdminGradingOrders]", error);
    return { success: false, error: "無法載入鑑定佇列" };
  }
}

export async function adminConfirmGradingIntake(input: {
  orderKind: AdminGradingOrderKind;
  orderId: string;
}): Promise<ActionResult<{ applied: true }>> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const orderId = input.orderId.trim();
  if (!orderId) {
    return { success: false, error: "找不到此訂單" };
  }

  try {
    const result = await runAuthFeeCaptureSaga({
      orderKind: input.orderKind,
      orderId,
    });

    if (!result.ok) {
      console.error("[adminConfirmGradingIntake]", result.error);
      return { success: false, error: mapRpcError(result.error) };
    }

    revalidateGradingPaths(input.orderKind, orderId);
    return { success: true, data: { applied: true } };
  } catch (error) {
    console.error("[adminConfirmGradingIntake]", error);
    return { success: false, error: "入庫確認失敗，請稍後再試" };
  }
}

export async function adminPassGrading(input: {
  orderKind: AdminGradingOrderKind;
  orderId: string;
  notes?: string;
}): Promise<ActionResult<{ applied: true }>> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const orderId = input.orderId.trim();
  if (!orderId) {
    return { success: false, error: "找不到此訂單" };
  }

  try {
    const result = await runGoodsCaptureSaga({
      orderKind: input.orderKind,
      orderId,
      notes: input.notes,
    });

    if (!result.ok) {
      console.error("[adminPassGrading]", result.error);
      return { success: false, error: mapRpcError(result.error) };
    }

    revalidateGradingPaths(input.orderKind, orderId);
    return { success: true, data: { applied: true } };
  } catch (error) {
    console.error("[adminPassGrading]", error);
    return { success: false, error: "鑑定通過操作失敗，請稍後再試" };
  }
}

export async function adminSubmitGradingOutbound(input: {
  orderKind: AdminGradingOrderKind;
  orderId: string;
  trackingNo: string;
}): Promise<ActionResult<{ applied: true }>> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const orderId = input.orderId.trim();
  const trackingNo = input.trackingNo.trim();
  if (!orderId) {
    return { success: false, error: "找不到此訂單" };
  }
  if (!trackingNo) {
    return { success: false, error: "請輸入出庫物流單號" };
  }

  try {
    const supabase = asAdminGradingRpcClient(await createClient());
    const { error } = await supabase.rpc("rpc_admin_submit_grading_outbound", {
      p_order_kind: input.orderKind,
      p_order_id: orderId,
      p_tracking_no: trackingNo,
    });

    if (error) {
      console.error("[adminSubmitGradingOutbound]", error.message);
      return { success: false, error: mapRpcError(error.message) };
    }

    revalidateGradingPaths(input.orderKind, orderId);
    return { success: true, data: { applied: true } };
  } catch (error) {
    console.error("[adminSubmitGradingOutbound]", error);
    return { success: false, error: "出庫物流更新失敗，請稍後再試" };
  }
}

export async function adminFailGradingAndRefund(input: {
  orderKind: AdminGradingOrderKind;
  orderId: string;
  faultParty: GradingFaultParty;
  reason?: string;
}): Promise<ActionResult<{ applied: true }>> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const orderId = input.orderId.trim();
  if (!orderId) {
    return { success: false, error: "找不到此訂單" };
  }

  if (!isGradingFaultParty(input.faultParty)) {
    return { success: false, error: "請選擇責任方" };
  }

  try {
    const result = await runAuthGradingFailVoidSaga({
      orderKind: input.orderKind,
      orderId,
      faultParty: input.faultParty,
      reason: input.reason,
    });

    if (!result.ok) {
      console.error("[adminFailGradingAndRefund]", result.error);
      return { success: false, error: mapRpcError(result.error) };
    }

    revalidateGradingPaths(input.orderKind, orderId);
    return { success: true, data: { applied: true } };
  } catch (error) {
    console.error("[adminFailGradingAndRefund]", error);
    return { success: false, error: "鑑定失敗處理未完成，請稍後重試" };
  }
}

export async function getAdminGradingAuditHistory(input: {
  orderKind: AdminGradingOrderKind;
  orderId: string;
}): Promise<ActionResult<AdminGradingAuditRow[]>> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  const orderId = input.orderId.trim();
  if (!orderId) {
    return { success: false, error: "找不到此訂單" };
  }

  try {
    const supabase = asAdminGradingRpcClient(await createClient());
    const { data, error } = await supabase.rpc(
      "get_admin_grading_audit_history",
      {
        p_order_kind: input.orderKind,
        p_order_id: orderId,
      },
    );

    if (error) {
      console.error("[getAdminGradingAuditHistory]", error.message);
      return { success: false, error: mapRpcError(error.message) };
    }

    return { success: true, data: parseAuditPayload(data) };
  } catch (error) {
    console.error("[getAdminGradingAuditHistory]", error);
    return { success: false, error: "無法載入審計紀錄" };
  }
}
