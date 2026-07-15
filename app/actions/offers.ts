"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  resolveOfferCardDisplayImage,
} from "@/app/lib/chat/offerCardImage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/types/supabase";

type ChatRoomRow = Tables<"chat_rooms">;
type OfferRow = Tables<"offers">;
type ChatMessageRow = Tables<"chat_messages">;

type RpcMakeOfferArgs = {
  p_listing_id: string;
  p_buyer_id: string;
  p_offer_price: number;
  p_content: string;
  p_use_authentication: boolean;
};

type RpcMakeOfferPayload = {
  room: ChatRoomRow;
  offer: OfferRow;
  message: ChatMessageRow;
};

export type MakeOfferResult =
  | {
      success: true;
      data: RpcMakeOfferPayload;
    }
  | { success: false; error: string };

type MemberOrderRow = Tables<"member_orders">;

type RpcAcceptOfferArgs = {
  p_offer_id: string;
  p_seller_id: string;
};

type AcceptOfferPayload = {
  order: MemberOrderRow;
  messageId: string;
};

export type AcceptOfferResult =
  | {
      success: true;
      data: AcceptOfferPayload;
    }
  | { success: false; error: string };

type RpcModifyOfferArgs = {
  p_offer_id: string;
  p_buyer_id: string;
  p_new_price: number;
  p_content: string;
};

type ModifyOfferPayload = {
  offer: OfferRow;
  messageId: string;
};

export type ModifyOfferResult =
  | {
      success: true;
      data: ModifyOfferPayload;
    }
  | { success: false; error: string };

type RpcRejectOfferArgs = {
  p_offer_id: string;
  p_seller_id: string;
};

type RejectOfferPayload = {
  offer: OfferRow;
  messageId: string;
};

export type RejectOfferResult =
  | {
      success: true;
      data: RejectOfferPayload;
    }
  | { success: false; error: string };

export type OfferCardOfferState = {
  id: string;
  buyer_id: string;
  offer_price: number;
  status: Tables<"offers">["status"];
  modified_count: number;
  room_id: string;
  use_authentication: boolean;
};

export type OfferCardContext = {
  offer: OfferCardOfferState;
  listingId: string;
  productId: string;
  cardName: string;
  cardNumber: string | null;
  setCode: string;
  displayId: string | null;
  imageUrl?: string;
  buyerName: string;
  sellerId: string;
};

export type GetOfferCardContextResult =
  | { success: true; data: OfferCardContext }
  | { success: false; error: string };

type OfferCardQueryRow = {
  id: string;
  buyer_id: string;
  offer_price: number;
  status: Tables<"offers">["status"];
  modified_count?: number | null;
  room_id: string;
  listing_id: string;
  use_authentication: boolean;
  listings: {
    id: string;
    product_id: string;
    images: unknown;
    product_catalog: {
      id: string;
      name_zh: string | null;
      name_ja: string;
      card_number: string | null;
      set_code: string;
      display_id: string | null;
      image_url: string;
    };
  };
  chat_rooms: {
    seller_id: string;
  };
};

function readModifiedCount(offer: {
  modified_count?: number | null;
}): number {
  const value = offer.modified_count;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

import {
  formatAuthOfferMessageContent,
  formatStandardOfferMessageContent,
} from "@/lib/listings/auth-service-copy";

function formatModifyOfferMessageContent(newPrice: number): string {
  return `修改了出價需求：HK$ ${newPrice.toLocaleString()}`;
}

function validateOfferPrice(offerPrice: number): string | null {
  if (!Number.isFinite(offerPrice) || offerPrice <= 0) {
    return "請輸入有效的出價金額";
  }
  return null;
}

function parseRpcMakeOfferPayload(data: unknown): RpcMakeOfferPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (
    !payload.room ||
    typeof payload.room !== "object" ||
    !payload.offer ||
    typeof payload.offer !== "object" ||
    !payload.message ||
    typeof payload.message !== "object"
  ) {
    return null;
  }

  return {
    room: payload.room as ChatRoomRow,
    offer: payload.offer as OfferRow,
    message: payload.message as ChatMessageRow,
  };
}

function parseRpcAcceptOfferPayload(data: unknown): AcceptOfferPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (!payload.order || typeof payload.order !== "object") {
    return null;
  }

  if (typeof payload.message_id !== "string") {
    return null;
  }

  return {
    order: payload.order as MemberOrderRow,
    messageId: payload.message_id,
  };
}

function parseRpcModifyOfferPayload(data: unknown): ModifyOfferPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (!payload.offer || typeof payload.offer !== "object") {
    return null;
  }

  if (typeof payload.message_id !== "string") {
    return null;
  }

  return {
    offer: payload.offer as OfferRow,
    messageId: payload.message_id,
  };
}

function parseRpcRejectOfferPayload(data: unknown): RejectOfferPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (!payload.offer || typeof payload.offer !== "object") {
    return null;
  }

  if (typeof payload.message_id !== "string") {
    return null;
  }

  return {
    offer: payload.offer as OfferRow,
    messageId: payload.message_id,
  };
}

export async function getOfferCardContext(
  offerId: string,
): Promise<GetOfferCardContextResult> {
  const trimmedOfferId = offerId.trim();
  if (!trimmedOfferId) {
    return { success: false, error: "找不到此出價紀錄" };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "服務尚未設定" };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("offers")
      .select(
        `
          id,
          buyer_id,
          offer_price,
          status,
          modified_count,
          room_id,
          listing_id,
          use_authentication,
          listings!inner (
            id,
            product_id,
            images,
            product_catalog!inner (
              id,
              name_zh,
              name_ja,
              card_number,
              set_code,
              display_id,
              image_url
            )
          ),
          chat_rooms!inner (
            seller_id
          )
        `,
      )
      .eq("id", trimmedOfferId)
      .maybeSingle<OfferCardQueryRow>();

    if (error) {
      console.error("[getOfferCardContext]", error.message);
      return { success: false, error: "無法載入出價資料" };
    }

    if (!data?.listings?.product_catalog || !data.listing_id) {
      return { success: false, error: "找不到此出價紀錄" };
    }

    const listing = data.listings;
    const catalog = listing.product_catalog;
    const room = data.chat_rooms;

    const { data: buyerProfile, error: buyerError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", data.buyer_id)
      .maybeSingle<{ display_name: string }>();

    if (buyerError) {
      console.error("[getOfferCardContext] buyer profile", buyerError.message);
    }

    const cardName =
      catalog.name_zh?.trim() ||
      catalog.name_ja?.trim() ||
      "未命名卡牌";

    return {
      success: true,
      data: {
        offer: {
          id: data.id,
          buyer_id: data.buyer_id,
          offer_price: Number(data.offer_price),
          status: data.status,
          modified_count: readModifiedCount(data),
          room_id: data.room_id,
          use_authentication: data.use_authentication,
        },
        listingId: data.listing_id,
        productId: catalog.id,
        cardName,
        cardNumber: catalog.card_number,
        setCode: catalog.set_code,
        displayId: catalog.display_id,
        imageUrl: resolveOfferCardDisplayImage(
          listing.images,
          catalog.image_url,
        ),
        buyerName: buyerProfile?.display_name?.trim() || "買家",
        sellerId: room.seller_id,
      },
    };
  } catch (error) {
    console.error("[getOfferCardContext]", error);
    return { success: false, error: "載入出價卡片時發生錯誤" };
  }
}

export async function makeOffer(
  listingId: string,
  offerPrice: number,
  useAuthentication = false,
): Promise<MakeOfferResult> {
  const trimmedListingId = listingId.trim();
  if (!trimmedListingId) {
    return { success: false, error: "找不到此商品掛單" };
  }

  const priceError = validateOfferPrice(offerPrice);
  if (priceError) {
    return { success: false, error: priceError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再出價" };
    }

    const rpcArgs: RpcMakeOfferArgs = {
      p_listing_id: trimmedListingId,
      p_buyer_id: user.id,
      p_offer_price: offerPrice,
      p_content: useAuthentication
        ? formatAuthOfferMessageContent(offerPrice)
        : formatStandardOfferMessageContent(offerPrice),
      p_use_authentication: useAuthentication,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_make_offer",
          args: RpcMakeOfferArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_make_offer", rpcArgs);

    if (error) {
      console.error("[makeOffer] rpc", error.message);
      return { success: false, error: error.message };
    }

    const parsed = parseRpcMakeOfferPayload(data);
    if (!parsed) {
      console.error("[makeOffer] invalid rpc payload", data);
      return { success: false, error: "出價回傳資料格式異常" };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    console.error("[makeOffer]", error);
    return { success: false, error: "出價時發生錯誤" };
  }
}

export async function acceptOffer(offerId: string): Promise<AcceptOfferResult> {
  const trimmedOfferId = offerId.trim();
  if (!trimmedOfferId) {
    return { success: false, error: "找不到此出價紀錄" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再接受出價" };
    }

    const rpcArgs: RpcAcceptOfferArgs = {
      p_offer_id: trimmedOfferId,
      p_seller_id: user.id,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_accept_offer",
          args: RpcAcceptOfferArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_accept_offer", rpcArgs);

    if (error) {
      console.error("[acceptOffer] rpc", error.message);
      return { success: false, error: error.message };
    }

    const parsed = parseRpcAcceptOfferPayload(data);
    if (!parsed) {
      console.error("[acceptOffer] invalid rpc payload", data);
      return { success: false, error: "接受出價回傳資料格式異常" };
    }

    revalidatePath("/marketplace");
    revalidatePath("/profile/user/inventory");
    revalidatePath("/profile/user/collection");

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    console.error("[acceptOffer]", error);
    return { success: false, error: "接受出價時發生錯誤" };
  }
}

export async function modifyOffer(
  offerId: string,
  newPrice: number,
): Promise<ModifyOfferResult> {
  const trimmedOfferId = offerId.trim();
  if (!trimmedOfferId) {
    return { success: false, error: "找不到此出價紀錄" };
  }

  const priceError = validateOfferPrice(newPrice);
  if (priceError) {
    return { success: false, error: priceError };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再修改出價" };
    }

    const rpcArgs: RpcModifyOfferArgs = {
      p_offer_id: trimmedOfferId,
      p_buyer_id: user.id,
      p_new_price: newPrice,
      p_content: formatModifyOfferMessageContent(newPrice),
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_modify_offer",
          args: RpcModifyOfferArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_modify_offer", rpcArgs);

    if (error) {
      console.error("[modifyOffer] rpc", error.message);
      return { success: false, error: error.message };
    }

    const parsed = parseRpcModifyOfferPayload(data);
    if (!parsed) {
      console.error("[modifyOffer] invalid rpc payload", data);
      return { success: false, error: "修改出價回傳資料格式異常" };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    console.error("[modifyOffer]", error);
    const message =
      error instanceof Error ? error.message : "修改出價時發生錯誤";
    return { success: false, error: message };
  }
}

export async function rejectOffer(offerId: string): Promise<RejectOfferResult> {
  const trimmedOfferId = offerId.trim();
  if (!trimmedOfferId) {
    return { success: false, error: "找不到此出價紀錄" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再拒絕出價" };
    }

    const rpcArgs: RpcRejectOfferArgs = {
      p_offer_id: trimmedOfferId,
      p_seller_id: user.id,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_reject_offer",
          args: RpcRejectOfferArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_reject_offer", rpcArgs);

    if (error) {
      console.error("[rejectOffer] rpc", error.message);
      return { success: false, error: error.message };
    }

    const parsed = parseRpcRejectOfferPayload(data);
    if (!parsed) {
      console.error("[rejectOffer] invalid rpc payload", data);
      return { success: false, error: "拒絕出價回傳資料格式異常" };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    console.error("[rejectOffer]", error);
    const message =
      error instanceof Error ? error.message : "拒絕出價時發生錯誤";
    return { success: false, error: message };
  }
}
