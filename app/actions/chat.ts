"use server";

import {
  assembleDbChatLobbyRooms,
  assembleDbChatRooms,
  assembleDbChatThreadRoom,
  type DbChatMessageRow,
  type DbChatRoomBaseRow,
  type DbOfferSnippet,
} from "@/app/lib/chat/mapDbChats";
import { isDbChatRoomId, CHAT_THREAD_PAGE_SIZE } from "@/app/lib/chat/constants";
import type { ChatRoom } from "@/app/store/useHkCardVaultStore";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const MAX_CHAT_MESSAGE_LENGTH = 2000;

type ChatThreadFetchOptions = {
  limit?: number;
  beforeCreatedAt?: string;
};

type RpcSendChatMessageArgs = {
  p_room_id: string;
  p_sender_id: string;
  p_content: string;
};

export type SendMessagePayload = {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  isSystemWarning: boolean;
};

export type SendMessageResult =
  | { success: true; data: SendMessagePayload }
  | { success: false; error: string };

export type GetUserChatInboxResult =
  | { success: true; data: ChatRoom[] }
  | { success: false; error: string };

export type GetChatRoomThreadResult =
  | { success: true; data: ChatRoom; hasMore: boolean }
  | { success: false; error: string };

export type LoadOlderChatRoomMessagesResult =
  | { success: true; data: ChatRoom; hasMore: boolean }
  | { success: false; error: string };

type InboxRpcPayload = {
  rooms: DbChatRoomBaseRow[];
  messages: DbChatMessageRow[];
  offers: DbOfferSnippet[];
};

type LobbyRpcPayload = {
  rooms: DbChatRoomBaseRow[];
  last_messages: DbChatMessageRow[];
};

type ThreadRpcPayload = {
  room: DbChatRoomBaseRow | null;
  messages: DbChatMessageRow[];
  offers: DbOfferSnippet[];
  has_more: boolean;
};

function parseInboxRpcPayload(data: unknown): InboxRpcPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  return {
    rooms: Array.isArray(payload.rooms)
      ? (payload.rooms as DbChatRoomBaseRow[])
      : [],
    messages: Array.isArray(payload.messages)
      ? (payload.messages as DbChatMessageRow[])
      : [],
    offers: Array.isArray(payload.offers)
      ? (payload.offers as DbOfferSnippet[])
      : [],
  };
}

function parseLobbyRpcPayload(data: unknown): LobbyRpcPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  return {
    rooms: Array.isArray(payload.rooms)
      ? (payload.rooms as DbChatRoomBaseRow[])
      : [],
    last_messages: Array.isArray(payload.last_messages)
      ? (payload.last_messages as DbChatMessageRow[])
      : [],
  };
}

function parseThreadRpcPayload(data: unknown): ThreadRpcPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  return {
    room:
      payload.room && typeof payload.room === "object"
        ? (payload.room as DbChatRoomBaseRow)
        : null,
    messages: Array.isArray(payload.messages)
      ? (payload.messages as DbChatMessageRow[])
      : [],
    offers: Array.isArray(payload.offers)
      ? (payload.offers as DbOfferSnippet[])
      : [],
    has_more: payload.has_more === true,
  };
}

async function fetchInboxViaRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ payload: InboxRpcPayload | null; error: string | null }> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: "get_user_chat_inbox") => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    }
  ).rpc("get_user_chat_inbox");

  if (error) {
    return { payload: null, error: error.message };
  }

  const parsed = parseInboxRpcPayload(data);
  if (!parsed) {
    return { payload: null, error: "聊天室回傳資料格式異常" };
  }

  return { payload: parsed, error: null };
}

async function fetchLobbyViaRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ payload: LobbyRpcPayload | null; error: string | null }> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (fn: "get_user_chat_inbox_lobby") => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    }
  ).rpc("get_user_chat_inbox_lobby");

  if (error) {
    return { payload: null, error: error.message };
  }

  const parsed = parseLobbyRpcPayload(data);
  if (!parsed) {
    return { payload: null, error: "聊天室回傳資料格式異常" };
  }

  return { payload: parsed, error: null };
}

async function fetchThreadViaRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  options?: ChatThreadFetchOptions,
): Promise<{ payload: ThreadRpcPayload | null; error: string | null }> {
  const limit = options?.limit ?? CHAT_THREAD_PAGE_SIZE;
  const rpcArgs: {
    p_room_id: string;
    p_limit: number;
    p_before_created_at?: string;
  } = {
    p_room_id: roomId,
    p_limit: limit,
  };

  if (options?.beforeCreatedAt) {
    rpcArgs.p_before_created_at = options.beforeCreatedAt;
  }

  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        fn: "get_chat_room_thread",
        args: {
          p_room_id: string;
          p_limit?: number;
          p_before_created_at?: string;
        },
      ) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    }
  ).rpc("get_chat_room_thread", rpcArgs);

  if (error) {
    return { payload: null, error: error.message };
  }

  const parsed = parseThreadRpcPayload(data);
  if (!parsed || !parsed.room) {
    return { payload: null, error: "聊天室回傳資料格式異常" };
  }

  return { payload: parsed, error: null };
}

async function fetchRoomRowsForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ rooms: DbChatRoomBaseRow[]; error: string | null }> {
  const { data: rooms, error: roomsError } = await supabase
    .from("chat_rooms")
    .select(
      `
        id,
        buyer_id,
        seller_id,
        created_at,
        updated_at,
        buyer:profiles!fk_chat_rooms_buyer (
          id,
          display_name,
          role,
          avatar_path
        ),
        seller:profiles!fk_chat_rooms_seller_id (
          id,
          display_name,
          role,
          avatar_path
        )
      `,
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (roomsError) {
    return { rooms: [], error: roomsError.message };
  }

  return { rooms: (rooms ?? []) as DbChatRoomBaseRow[], error: null };
}

async function fetchLastMessagesForRooms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomIds: string[],
): Promise<{ messages: DbChatMessageRow[]; error: string | null }> {
  if (roomIds.length === 0) {
    return { messages: [], error: null };
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, room_id, content, created_at, sender_id, offer_id, member_order_id, is_system_warning",
    )
    .in("room_id", roomIds)
    .order("created_at", { ascending: false });

  if (error) {
    return { messages: [], error: error.message };
  }

  const lastByRoom = new Map<string, DbChatMessageRow>();
  for (const row of (data ?? []) as DbChatMessageRow[]) {
    if (!lastByRoom.has(row.room_id)) {
      lastByRoom.set(row.room_id, row);
    }
  }

  return { messages: Array.from(lastByRoom.values()), error: null };
}

type FetchMessagesForRoomOptions = {
  limit?: number;
  beforeCreatedAt?: string;
};

type FetchMessagesForRoomResult = {
  messages: DbChatMessageRow[];
  hasMore: boolean;
  error: string | null;
};

async function fetchMessagesForRoom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  options?: FetchMessagesForRoomOptions,
): Promise<FetchMessagesForRoomResult> {
  const limit = options?.limit ?? CHAT_THREAD_PAGE_SIZE;
  const fetchLimit = limit + 1;

  let query = supabase
    .from("chat_messages")
    .select(
      "id, room_id, content, created_at, sender_id, offer_id, member_order_id, is_system_warning",
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (options?.beforeCreatedAt) {
    query = query.lt("created_at", options.beforeCreatedAt);
  }

  const { data, error } = await query;

  if (error) {
    return { messages: [], hasMore: false, error: error.message };
  }

  const rows = (data ?? []) as DbChatMessageRow[];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  return {
    messages: [...pageRows].reverse(),
    hasMore,
    error: null,
  };
}

async function fetchOffersForMessageRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  messageRows: DbChatMessageRow[],
): Promise<{ offers: DbOfferSnippet[]; error: string | null }> {
  const offerIds = [
    ...new Set(
      messageRows
        .map((message) => message.offer_id)
        .filter((offerId): offerId is string => Boolean(offerId)),
    ),
  ];

  if (offerIds.length === 0) {
    return { offers: [], error: null };
  }

  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select(
      `
          id,
          buyer_id,
          offer_price,
          status,
          modified_count,
          use_authentication,
          listings!offers_listing_id_fkey (
            product_id,
            images,
            product_catalog!listings_product_id_fkey (
              id,
              name_zh,
              name_ja,
              card_number,
              set_code,
              image_url
            )
          )
        `,
    )
    .in("id", offerIds);

  if (offersError) {
    return { offers: [], error: offersError.message };
  }

  return { offers: (offers ?? []) as DbOfferSnippet[], error: null };
}

async function fetchInboxViaTables(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ payload: InboxRpcPayload | null; error: string | null }> {
  const { rooms, error: roomsError } = await fetchRoomRowsForUser(
    supabase,
    userId,
  );

  if (roomsError) {
    return { payload: null, error: roomsError };
  }

  if (rooms.length === 0) {
    return { payload: { rooms: [], messages: [], offers: [] }, error: null };
  }

  const roomIds = rooms.map((room) => room.id);

  const { data: allMessages, error: allMessagesError } = await supabase
    .from("chat_messages")
    .select(
      "id, room_id, content, created_at, sender_id, offer_id, member_order_id, is_system_warning",
    )
    .in("room_id", roomIds)
    .order("created_at", { ascending: true });

  if (allMessagesError) {
    return {
      payload: null,
      error: allMessagesError.message,
    };
  }

  const messageRows = (allMessages ?? []) as DbChatMessageRow[];
  const { offers, error: offersError } = await fetchOffersForMessageRows(
    supabase,
    messageRows,
  );

  if (offersError) {
    return { payload: null, error: offersError };
  }

  return {
    payload: {
      rooms,
      messages: messageRows,
      offers,
    },
    error: null,
  };
}

async function fetchLobbyViaTables(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ payload: LobbyRpcPayload | null; error: string | null }> {
  const { rooms, error: roomsError } = await fetchRoomRowsForUser(
    supabase,
    userId,
  );

  if (roomsError) {
    return { payload: null, error: roomsError };
  }

  if (rooms.length === 0) {
    return { payload: { rooms: [], last_messages: [] }, error: null };
  }

  const { messages: lastMessages, error: messagesError } =
    await fetchLastMessagesForRooms(
      supabase,
      rooms.map((room) => room.id),
    );

  if (messagesError) {
    return { payload: null, error: messagesError };
  }

  return {
    payload: {
      rooms,
      last_messages: lastMessages,
    },
    error: null,
  };
}

async function fetchThreadViaTables(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  roomId: string,
  options?: ChatThreadFetchOptions,
): Promise<{ payload: ThreadRpcPayload | null; error: string | null }> {
  const { data: room, error: roomError } = await supabase
    .from("chat_rooms")
    .select(
      `
        id,
        buyer_id,
        seller_id,
        created_at,
        updated_at,
        buyer:profiles!fk_chat_rooms_buyer (
          id,
          display_name,
          role,
          avatar_path
        ),
        seller:profiles!fk_chat_rooms_seller_id (
          id,
          display_name,
          role,
          avatar_path
        )
      `,
    )
    .eq("id", roomId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle();

  if (roomError) {
    return { payload: null, error: roomError.message };
  }

  if (!room) {
    return { payload: null, error: "找不到聊天室或無權限" };
  }

  const {
    messages,
    hasMore,
    error: messagesError,
  } = await fetchMessagesForRoom(supabase, roomId, options);

  if (messagesError) {
    return { payload: null, error: messagesError };
  }

  const { offers, error: offersError } = await fetchOffersForMessageRows(
    supabase,
    messages,
  );

  if (offersError) {
    return { payload: null, error: offersError };
  }

  return {
    payload: {
      room: room as DbChatRoomBaseRow,
      messages,
      offers,
      has_more: hasMore,
    },
    error: null,
  };
}

function parseRpcSendChatMessagePayload(
  data: unknown,
): SendMessagePayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;

  if (
    typeof payload.id !== "string" ||
    typeof payload.room_id !== "string" ||
    typeof payload.content !== "string"
  ) {
    return null;
  }

  return {
    id: payload.id,
    roomId: payload.room_id,
    content: payload.content,
    createdAt:
      typeof payload.created_at === "string"
        ? payload.created_at
        : new Date().toISOString(),
    isSystemWarning: payload.is_system_warning === true,
  };
}

export async function sendMessage(
  roomId: string,
  body: string,
): Promise<SendMessageResult> {
  const trimmedRoomId = roomId.trim();
  const trimmedBody = body.trim();

  if (!trimmedRoomId) {
    return { success: false, error: "請先選擇聊天室" };
  }

  if (!trimmedBody) {
    return { success: false, error: "訊息不能為空" };
  }

  if (trimmedBody.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `訊息長度不可超過 ${MAX_CHAT_MESSAGE_LENGTH} 字`,
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "服務尚未設定" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再發送訊息" };
    }

    const rpcArgs: RpcSendChatMessageArgs = {
      p_room_id: trimmedRoomId,
      p_sender_id: user.id,
      p_content: trimmedBody,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_send_chat_message",
          args: RpcSendChatMessageArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_send_chat_message", rpcArgs);

    if (error) {
      console.error("[sendMessage] rpc", error.message);
      return { success: false, error: error.message };
    }

    const parsed = parseRpcSendChatMessagePayload(data);
    if (!parsed) {
      console.error("[sendMessage] invalid rpc payload", data);
      return { success: false, error: "發送訊息回傳資料格式異常" };
    }

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    console.error("[sendMessage]", error);
    return { success: false, error: "發送訊息時發生錯誤" };
  }
}

export async function getUserChatInboxLobby(): Promise<GetUserChatInboxResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: [] };
    }

    let payload: LobbyRpcPayload | null = null;
    let loadError: string | null = null;

    const rpcResult = await fetchLobbyViaRpc(supabase);
    if (rpcResult.payload) {
      payload = rpcResult.payload;
    } else {
      loadError = rpcResult.error;
      const tableResult = await fetchLobbyViaTables(supabase, user.id);
      if (tableResult.payload) {
        payload = tableResult.payload;
        loadError = null;
      } else {
        loadError = tableResult.error ?? loadError;
      }
    }

    if (!payload) {
      console.error("[getUserChatInboxLobby]", loadError);
      return {
        success: false,
        error: `無法載入聊天室：${loadError ?? "未知錯誤"}`,
      };
    }

    const inbox = assembleDbChatLobbyRooms(
      payload.rooms,
      payload.last_messages,
      user.id,
    );

    return { success: true, data: inbox };
  } catch (error) {
    console.error("[getUserChatInboxLobby]", error);
    return { success: false, error: "載入聊天室時發生錯誤" };
  }
}

export async function getChatRoomThread(
  roomId: string,
  options?: ChatThreadFetchOptions,
): Promise<GetChatRoomThreadResult> {
  const trimmedRoomId = roomId.trim();

  if (!trimmedRoomId || !isDbChatRoomId(trimmedRoomId)) {
    return { success: false, error: "請選擇有效的聊天室" };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "服務尚未設定" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入" };
    }

    const fetchOptions: ChatThreadFetchOptions = {
      limit: options?.limit ?? CHAT_THREAD_PAGE_SIZE,
      beforeCreatedAt: options?.beforeCreatedAt,
    };

    let payload: ThreadRpcPayload | null = null;
    let loadError: string | null = null;

    const rpcResult = await fetchThreadViaRpc(
      supabase,
      trimmedRoomId,
      fetchOptions,
    );
    if (rpcResult.payload) {
      payload = rpcResult.payload;
    } else {
      loadError = rpcResult.error;
      const tableResult = await fetchThreadViaTables(
        supabase,
        user.id,
        trimmedRoomId,
        fetchOptions,
      );
      if (tableResult.payload) {
        payload = tableResult.payload;
        loadError = null;
      } else {
        loadError = tableResult.error ?? loadError;
      }
    }

    if (!payload?.room) {
      console.error("[getChatRoomThread]", loadError);
      return {
        success: false,
        error: `無法載入對話：${loadError ?? "未知錯誤"}`,
      };
    }

    const offersById = new Map(
      payload.offers.map((offer) => [offer.id, offer]),
    );

    const threadRoom = assembleDbChatThreadRoom(
      payload.room,
      payload.messages,
      offersById,
      user.id,
    );

    return { success: true, data: threadRoom, hasMore: payload.has_more };
  } catch (error) {
    console.error("[getChatRoomThread]", error);
    return { success: false, error: "載入對話時發生錯誤" };
  }
}

export async function loadOlderChatRoomMessages(
  roomId: string,
  beforeCreatedAt: string,
): Promise<LoadOlderChatRoomMessagesResult> {
  const trimmedBefore = beforeCreatedAt.trim();

  if (!trimmedBefore) {
    return { success: false, error: "無法載入更早的訊息" };
  }

  return getChatRoomThread(roomId, {
    limit: CHAT_THREAD_PAGE_SIZE,
    beforeCreatedAt: trimmedBefore,
  });
}

/** @deprecated Prefer getUserChatInboxLobby + getChatRoomThread for performance */
export async function getUserChatInbox(): Promise<GetUserChatInboxResult> {
  return getUserChatInboxLobby();
}

export async function getUserChatInboxFull(): Promise<GetUserChatInboxResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, data: [] };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, data: [] };
    }

    let payload: InboxRpcPayload | null = null;
    let loadError: string | null = null;

    const rpcResult = await fetchInboxViaRpc(supabase);
    if (rpcResult.payload) {
      payload = rpcResult.payload;
    } else {
      loadError = rpcResult.error;
      const tableResult = await fetchInboxViaTables(supabase, user.id);
      if (tableResult.payload) {
        payload = tableResult.payload;
        loadError = null;
      } else {
        loadError = tableResult.error ?? loadError;
      }
    }

    if (!payload) {
      console.error("[getUserChatInboxFull]", loadError);
      return {
        success: false,
        error: `無法載入聊天室：${loadError ?? "未知錯誤"}`,
      };
    }

    const offersById = new Map(
      payload.offers.map((offer) => [offer.id, offer]),
    );

    const inbox = assembleDbChatRooms(
      payload.rooms,
      payload.messages,
      offersById,
      user.id,
    );

    return { success: true, data: inbox };
  } catch (error) {
    console.error("[getUserChatInboxFull]", error);
    return { success: false, error: "載入聊天室時發生錯誤" };
  }
}
