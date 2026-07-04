export const MOCK_CHAT_ID_PREFIX = "RM-MOCK";

const DB_CHAT_ROOM_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMockChatRoomId(roomId: string): boolean {
  return roomId.startsWith(MOCK_CHAT_ID_PREFIX);
}

/** Supabase `chat_rooms.id` (UUID) — persisted inbox rooms only */
export function isDbChatRoomId(roomId: string): boolean {
  return DB_CHAT_ROOM_UUID_RE.test(roomId.trim());
}
