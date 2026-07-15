"use client";

import {
  getChatRoomThread,
  loadOlderChatRoomMessages,
} from "@/app/actions/chat";
import { CHAT_THREAD_PAGE_SIZE, isDbChatRoomId } from "@/app/lib/chat/constants";
import {
  mergeLatestThreadPageFromDb,
  mergeRoomThreadFromDb,
  prependOlderRoomMessages,
} from "@/app/lib/chat/mergeChatRooms";
import { roomNeedsThreadHydration } from "@/app/lib/chat/roomHydration";
import { persistMarkRoomReadAsync } from "@/app/lib/chat/persistMarkRoomRead";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";

type HydrateChatRoomThreadOptions = {
  force?: boolean;
};

function getOldestPersistedTimestamp(
  messages: { id: string; timestamp: string }[],
): string | null {
  const persisted = messages.filter((message) => !message.id.startsWith("opt-"));
  const oldest = persisted[0];
  return oldest?.timestamp ?? null;
}

export async function hydrateChatRoomThread(
  roomId: string,
  options?: HydrateChatRoomThreadOptions,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!isDbChatRoomId(roomId)) {
    return { success: false, error: "請選擇有效的聊天室" };
  }

  const room = useHkCardVaultStore
    .getState()
    .chats.find((entry) => entry.id === roomId);

  if (!options?.force && !roomNeedsThreadHydration(room)) {
    const lastTs =
      room?.messages.at(-1)?.timestamp ?? room?.timestamp ?? undefined;
    await persistMarkRoomReadAsync(roomId, lastTs);
    return { success: true };
  }

  const result = await getChatRoomThread(roomId, {
    limit: CHAT_THREAD_PAGE_SIZE,
  });
  if (!result.success) {
    return { success: false, error: result.error };
  }

  useHkCardVaultStore.getState().setChats((currentRooms) => {
    if (options?.force && room?.threadHydrated) {
      return mergeLatestThreadPageFromDb(
        currentRooms,
        result.data,
        result.hasMore,
      );
    }

    return mergeRoomThreadFromDb(currentRooms, result.data, result.hasMore);
  });

  const lastTs =
    result.data.messages.at(-1)?.timestamp ?? result.data.timestamp;
  await persistMarkRoomReadAsync(roomId, lastTs);

  return { success: true };
}

export async function loadOlderChatRoomThread(
  roomId: string,
): Promise<{ success: true; hasMore: boolean } | { success: false; error: string }> {
  if (!isDbChatRoomId(roomId)) {
    return { success: false, error: "請選擇有效的聊天室" };
  }

  const room = useHkCardVaultStore
    .getState()
    .chats.find((entry) => entry.id === roomId);

  if (!room || room.threadHasMoreOlder === false) {
    return { success: true, hasMore: false };
  }

  const beforeCreatedAt = getOldestPersistedTimestamp(room.messages);
  if (!beforeCreatedAt) {
    return { success: true, hasMore: false };
  }

  const result = await loadOlderChatRoomMessages(roomId, beforeCreatedAt);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (result.data.messages.length === 0) {
    useHkCardVaultStore.getState().setChats((currentRooms) =>
      currentRooms.map((entry) =>
        entry.id === roomId
          ? { ...entry, threadHasMoreOlder: false }
          : entry,
      ),
    );
    return { success: true, hasMore: false };
  }

  useHkCardVaultStore.getState().setChats((currentRooms) =>
    prependOlderRoomMessages(
      currentRooms,
      roomId,
      result.data.messages,
      result.hasMore,
    ),
  );

  return { success: true, hasMore: result.hasMore };
}
