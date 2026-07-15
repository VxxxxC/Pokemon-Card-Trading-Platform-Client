"use client";

import { markChatRoomRead } from "@/app/actions/chat";
import { isDbChatRoomId } from "@/app/lib/chat/constants";
import { normalizePartnerId } from "@/app/lib/chat/mergeChatRooms";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";

const inFlightByRoom = new Map<string, Promise<boolean>>();

function markPartnerRoomsReadInStore(roomId: string): void {
  const { chats, markRoomRead } = useHkCardVaultStore.getState();
  const room = chats.find((candidate) => candidate.id === roomId);
  const partnerKey = room ? normalizePartnerId(room.partnerId) : "";

  if (!partnerKey) {
    markRoomRead(roomId);
    return;
  }

  for (const candidate of chats) {
    if (normalizePartnerId(candidate.partnerId) === partnerKey) {
      markRoomRead(candidate.id);
    }
  }
}

async function executePersist(
  roomId: string,
  readAt?: string,
): Promise<boolean> {
  markPartnerRoomsReadInStore(roomId);

  if (!isDbChatRoomId(roomId)) {
    return true;
  }

  try {
    const result = await markChatRoomRead(roomId, readAt);
    if (!result.success) {
      console.error("[persistMarkRoomRead]", result.error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[persistMarkRoomRead]", error);
    return false;
  }
}

export async function persistMarkRoomReadAsync(
  roomId: string,
  readAt?: string,
): Promise<boolean> {
  const trimmedRoomId = roomId.trim();
  if (!trimmedRoomId) {
    return false;
  }

  const existing = inFlightByRoom.get(trimmedRoomId);
  if (existing) {
    return existing;
  }

  const promise = executePersist(trimmedRoomId, readAt).finally(() => {
    if (inFlightByRoom.get(trimmedRoomId) === promise) {
      inFlightByRoom.delete(trimmedRoomId);
    }
  });

  inFlightByRoom.set(trimmedRoomId, promise);
  return promise;
}

export function persistMarkRoomRead(
  roomId: string,
  readAt?: string,
): void {
  void persistMarkRoomReadAsync(roomId, readAt);
}
