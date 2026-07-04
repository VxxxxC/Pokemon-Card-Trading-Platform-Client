import type { ChatRoom } from "@/app/store/useHkCardVaultStore";
import { isMockChatRoomId } from "@/app/lib/chat/constants";

function sortRoomsByActivity(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function mergeRoomMessages(local: ChatRoom, db: ChatRoom): ChatRoom {
  const dbMessageIds = new Set(db.messages.map((message) => message.id));
  const optimisticOnly = local.messages.filter(
    (message) => !dbMessageIds.has(message.id),
  );

  const messages = [...db.messages, ...optimisticOnly].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const lastMessage = messages.at(-1)?.text ?? db.lastMessage;

  return {
    ...db,
    messages,
    lastMessage,
    unreadCount: local.unreadCount,
  };
}

/**
 * Keeps mock demo rooms and merges Supabase rooms on top.
 * DB rows win for matching room IDs; session-only rooms are preserved.
 */
export function mergeChatRoomsWithDb(
  currentRooms: ChatRoom[],
  dbRooms: ChatRoom[],
): ChatRoom[] {
  const mockRooms = currentRooms.filter((room) => isMockChatRoomId(room.id));
  const localRealRooms = currentRooms.filter(
    (room) => !isMockChatRoomId(room.id),
  );

  const dbById = new Map(dbRooms.map((room) => [room.id, room]));

  const mergedDbRooms = dbRooms.map((dbRoom) => {
    const local = localRealRooms.find((room) => room.id === dbRoom.id);
    return local ? mergeRoomMessages(local, dbRoom) : dbRoom;
  });

  const ephemeralRooms = localRealRooms.filter((room) => !dbById.has(room.id));

  return sortRoomsByActivity([
    ...mockRooms,
    ...mergedDbRooms,
    ...ephemeralRooms,
  ]);
}
