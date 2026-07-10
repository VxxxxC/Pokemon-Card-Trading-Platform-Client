export const MOCK_CHAT_ID_PREFIX = "RM-MOCK";

/** Messages fetched per thread page (initial load + scroll-up) */
export const CHAT_THREAD_PAGE_SIZE = 50;
export const PENDING_CHAT_ID_PREFIX = "pending-";

const DB_CHAT_ROOM_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MD5_DETERMINISTIC_ROOM_ID_RE = /^[0-9a-f]{16}$/i;

export function isMockChatRoomId(roomId: string): boolean {
  return roomId.startsWith(MOCK_CHAT_ID_PREFIX);
}

/** Supabase `chat_rooms.id` (UUID) — persisted inbox rooms only */
export function isDbChatRoomId(roomId: string): boolean {
  return DB_CHAT_ROOM_UUID_RE.test(roomId.trim());
}

/** Session-only room IDs that must not be treated as persisted DB rooms */
export function isEphemeralChatRoomId(roomId: string): boolean {
  const trimmed = roomId.trim();
  if (isMockChatRoomId(trimmed)) return true;
  if (trimmed.startsWith(PENDING_CHAT_ID_PREFIX)) return true;
  if (trimmed.startsWith("room_")) return true;
  if (MD5_DETERMINISTIC_ROOM_ID_RE.test(trimmed)) return true;
  return false;
}

export function buildPendingChatRoomId(partnerId: string): string {
  return `${PENDING_CHAT_ID_PREFIX}${partnerId.trim().toLowerCase()}`;
}
