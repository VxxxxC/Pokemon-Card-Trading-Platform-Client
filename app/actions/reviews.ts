"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

const MAX_COMMENT_LENGTH = 200;

type RpcSubmitTransactionReviewArgs = {
  p_order_id: string;
  p_reviewee_id: string;
  p_rating: number;
  p_comment: string | null;
  p_user_id: string;
};

export type SubmitTransactionReviewInput = {
  orderId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
};

export type SubmitTransactionReviewResult =
  | { success: true; revealed: boolean }
  | { success: false; error: string };

export type GetUserReviewedMemberOrderIdsResult =
  | { success: true; data: string[] }
  | { success: false; error: string };

export type ResolveChatCompletionOrderIdInput = {
  messageId: string;
  roomId: string;
  revieweeId: string;
};

export type ResolveChatCompletionOrderIdResult =
  | { success: true; orderId: string | null }
  | { success: false; error: string };

type RpcSubmitTransactionReviewResult = {
  success?: boolean;
  review_id?: string;
  revealed?: boolean;
};

function parseRpcSubmitReviewPayload(
  data: unknown,
): RpcSubmitTransactionReviewResult | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  return data as RpcSubmitTransactionReviewResult;
}

function validateRating(rating: number): string | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "請選擇 1 至 5 星評分";
  }
  return null;
}

function validateComment(comment: string | undefined): string | null {
  if (!comment) {
    return null;
  }
  const trimmed = comment.trim();
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return `留言不可超過 ${MAX_COMMENT_LENGTH} 字`;
  }
  return null;
}

export async function resolveChatCompletionOrderId(
  input: ResolveChatCompletionOrderIdInput,
): Promise<ResolveChatCompletionOrderIdResult> {
  const messageId = input.messageId.trim();
  const roomId = input.roomId.trim();
  const revieweeId = input.revieweeId.trim();

  if (!messageId || !roomId || !revieweeId) {
    return { success: true, orderId: null };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入" };
    }

    const { data: messageData, error: messageError } = await supabase
      .from("chat_messages")
      .select("member_order_id, room_id, content")
      .eq("id", messageId)
      .maybeSingle();

    if (messageError) {
      console.error(
        "[resolveChatCompletionOrderId] message",
        messageError.message,
      );
      return { success: false, error: messageError.message };
    }

    const messageRow = messageData as Pick<
      Tables<"chat_messages">,
      "member_order_id" | "room_id" | "content"
    > | null;

    if (
      messageRow?.content === "SYSTEM_ORDER_COMPLETED" &&
      messageRow.member_order_id
    ) {
      return { success: true, orderId: messageRow.member_order_id };
    }

    const { data: roomCompletionData, error: roomCompletionError } =
      await supabase
        .from("chat_messages")
        .select("id, member_order_id")
        .eq("room_id", roomId)
        .eq("content", "SYSTEM_ORDER_COMPLETED")
        .not("member_order_id", "is", null)
        .order("created_at", { ascending: false });

    if (roomCompletionError) {
      console.error(
        "[resolveChatCompletionOrderId] room completion",
        roomCompletionError.message,
      );
      return { success: false, error: roomCompletionError.message };
    }

    const roomCompletionRows = (roomCompletionData ?? []) as Array<
      Pick<Tables<"chat_messages">, "id" | "member_order_id">
    >;

    const roomCompletionMatch =
      roomCompletionRows.find((row) => row.id === messageId) ??
      roomCompletionRows[0];

    if (roomCompletionMatch?.member_order_id) {
      return { success: true, orderId: roomCompletionMatch.member_order_id };
    }

    const { data: acceptedOfferData, error: acceptedOfferError } =
      await supabase
        .from("chat_messages")
        .select("member_order_id")
        .eq("room_id", roomId)
        .eq("content", "SYSTEM_OFFER_ACCEPTED")
        .not("member_order_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (acceptedOfferError) {
      console.error(
        "[resolveChatCompletionOrderId] accepted offer",
        acceptedOfferError.message,
      );
      return { success: false, error: acceptedOfferError.message };
    }

    const acceptedOfferRow = acceptedOfferData as Pick<
      Tables<"chat_messages">,
      "member_order_id"
    > | null;

    if (acceptedOfferRow?.member_order_id) {
      return { success: true, orderId: acceptedOfferRow.member_order_id };
    }

    const { data: orderData, error: orderError } = await supabase
      .from("member_orders")
      .select("id")
      .eq("status", "completed")
      .or(
        `and(buyer_id.eq.${user.id},seller_id.eq.${revieweeId}),and(buyer_id.eq.${revieweeId},seller_id.eq.${user.id})`,
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error("[resolveChatCompletionOrderId] order", orderError.message);
      return { success: false, error: orderError.message };
    }

    const orderRow = orderData as Pick<Tables<"member_orders">, "id"> | null;

    return { success: true, orderId: orderRow?.id ?? null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "無法解析訂單編號";
    console.error("[resolveChatCompletionOrderId]", error);
    return { success: false, error: message };
  }
}

export async function getUserReviewedMemberOrderIds(
  orderIds: string[],
): Promise<GetUserReviewedMemberOrderIdsResult> {
  const normalizedIds = [
    ...new Set(orderIds.map((id) => id.trim()).filter(Boolean)),
  ];

  if (normalizedIds.length === 0) {
    return { success: true, data: [] };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入" };
    }

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_get_user_reviewed_member_order_ids",
          args: { p_order_ids: string[] },
        ) => Promise<{
          data: string[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_get_user_reviewed_member_order_ids", {
      p_order_ids: normalizedIds,
    });

    if (error) {
      console.error("[getUserReviewedMemberOrderIds] rpc", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? [] };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "無法查詢評價狀態";
    console.error("[getUserReviewedMemberOrderIds]", error);
    return { success: false, error: message };
  }
}

export async function submitTransactionReview(
  input: SubmitTransactionReviewInput,
): Promise<SubmitTransactionReviewResult> {
  const orderId = input.orderId.trim();
  const revieweeId = input.revieweeId.trim();

  if (!orderId) {
    return { success: false, error: "找不到此訂單" };
  }

  if (!revieweeId) {
    return { success: false, error: "找不到被評價對象" };
  }

  const ratingError = validateRating(input.rating);
  if (ratingError) {
    return { success: false, error: ratingError };
  }

  const commentError = validateComment(input.comment);
  if (commentError) {
    return { success: false, error: commentError };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再提交評價" };
    }

    const rpcArgs: RpcSubmitTransactionReviewArgs = {
      p_order_id: orderId,
      p_reviewee_id: revieweeId,
      p_rating: input.rating,
      p_comment: input.comment?.trim() || null,
      p_user_id: user.id,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_submit_transaction_review",
          args: RpcSubmitTransactionReviewArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_submit_transaction_review", rpcArgs);

    if (error) {
      console.error("[submitTransactionReview] rpc", error.message);
      return { success: false, error: error.message };
    }

    const parsed = parseRpcSubmitReviewPayload(data);
    if (!parsed?.success) {
      console.error("[submitTransactionReview] invalid rpc payload", data);
      return { success: false, error: "提交評價回傳資料格式異常" };
    }

    revalidatePath("/profile/user/trading");
    revalidatePath(`/profile/user/${revieweeId}`);

    return { success: true, revealed: parsed.revealed === true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "提交評價時發生錯誤";
    console.error("[submitTransactionReview]", error);
    return { success: false, error: message };
  }
}
