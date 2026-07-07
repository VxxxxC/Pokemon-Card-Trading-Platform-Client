"use client";

import { getChatRoomThread } from "@/app/actions/chat";
import { isDbChatRoomId } from "@/app/lib/chat/constants";
import { mergeRoomThreadFromDb } from "@/app/lib/chat/mergeChatRooms";
import { roomNeedsThreadHydration } from "@/app/lib/chat/roomHydration";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";

type HydrateChatRoomThreadOptions = {
  force?: boolean;
};

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
    return { success: true };
  }

  const result = await getChatRoomThread(roomId);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  useHkCardVaultStore.getState().setChats((currentRooms) =>
    mergeRoomThreadFromDb(currentRooms, result.data),
  );

  return { success: true };
}
