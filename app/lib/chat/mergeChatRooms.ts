import type { ChatRoom } from "@/app/store/useHkCardVaultStore";
import {
  isDbChatRoomId,
  isChatRoomId,
} from "@/app/lib/chat/constants";

export type MergeChatRoomsOptions = {
  /** Drop chatId-* preset rooms after a successful DB sync */
  stripeRooms?: boolean;
};

function sortRoomsByActivity(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function normalizePartnerId(partnerId: string): string {
  return partnerId.trim().toLowerCase();
}

export function findRoomByPartnerId(
  rooms: ChatRoom[],
  partnerId: string,
): ChatRoom | undefined {
  const key = normalizePartnerId(partnerId);
  if (!key) return undefined;
  return rooms.find(
    (room) => normalizePartnerId(room.partnerId) === key,
  );
}

export function normalizePartnerName(partnerName: string): string {
  return partnerName.trim().toLowerCase();
}

export function findRoomByPartnerName(
  rooms: ChatRoom[],
  partnerName: string,
): ChatRoom | undefined {
  const key = normalizePartnerName(partnerName);
  if (!key) return undefined;
  return rooms.find(
    (room) => normalizePartnerName(room.partnerName) === key,
  );
}

function dedupeMessagesByOfferId(messages: ChatRoom["messages"]): ChatRoom["messages"] {
  const seenOfferIds = new Set<string>();

  return messages.filter((message) => {
    const offerId = message.specialData?.offerId;
    if (message.type !== "special_transaction" || !offerId) {
      return true;
    }
    if (seenOfferIds.has(offerId)) {
      return false;
    }
    seenOfferIds.add(offerId);
    return true;
  });
}

function mergeRoomMessages(local: ChatRoom, db: ChatRoom): ChatRoom {
  const dbMessageIds = new Set(db.messages.map((message) => message.id));
  const optimisticOnly = local.messages.filter(
    (message) => !dbMessageIds.has(message.id),
  );

  const messages = dedupeMessagesByOfferId(
    [...db.messages, ...optimisticOnly].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    ),
  );

  const lastMessage = messages.at(-1)?.text ?? db.lastMessage;
  const timestamp =
    messages.at(-1)?.timestamp ?? db.timestamp ?? local.timestamp;

  return {
    ...db,
    messages,
    lastMessage,
    timestamp,
    unreadCount: Math.max(local.unreadCount, db.unreadCount),
    threadHydrated: local.threadHydrated === true || db.threadHydrated === true,
    threadHasMoreOlder:
      local.threadHasMoreOlder ?? db.threadHasMoreOlder,
  };
}

function pickCanonicalRoom(a: ChatRoom, b: ChatRoom): ChatRoom {
  const aIsDb = isDbChatRoomId(a.id);
  const bIsDb = isDbChatRoomId(b.id);

  if (aIsDb && !bIsDb) {
    return mergeRoomMessages(b, a);
  }
  if (!aIsDb && bIsDb) {
    return mergeRoomMessages(a, b);
  }

  const aTime = new Date(a.timestamp).getTime();
  const bTime = new Date(b.timestamp).getTime();

  if (aTime >= bTime) {
    return mergeRoomMessages(b, a);
  }

  return mergeRoomMessages(a, b);
}

function dedupeByPartner(rooms: ChatRoom[]): ChatRoom[] {
  const result: ChatRoom[] = [];

  for (const room of rooms) {
    const partnerIdKey = normalizePartnerId(room.partnerId);
    const partnerNameKey = normalizePartnerName(room.partnerName);

    const existingIndex = result.findIndex((candidate) => {
      const candidateIdKey = normalizePartnerId(candidate.partnerId);
      const candidateNameKey = normalizePartnerName(candidate.partnerName);

      if (partnerIdKey && candidateIdKey === partnerIdKey) {
        return true;
      }

      return Boolean(
        partnerNameKey &&
          candidateNameKey &&
          candidateNameKey === partnerNameKey,
      );
    });

    if (existingIndex === -1) {
      result.push(room);
      continue;
    }

    result[existingIndex] = pickCanonicalRoom(result[existingIndex], room);
  }

  return result;
}

/**
 * Merges Supabase inbox rooms with local session state.
 * DB rows win for matching room IDs; partner duplicates collapse to one room.
 */
export function mergeChatRoomsWithDb(
  currentRooms: ChatRoom[],
  dbRooms: ChatRoom[],
  options?: MergeChatRoomsOptions,
): ChatRoom[] {
  const stripeEnabled =
    options?.stripeRooms ?? (dbRooms.length > 0 ? true : false);

  const systemRooms = stripeEnabled
    ? []
    : currentRooms.filter((room) => isChatRoomId(room.id));
  const localRealRooms = currentRooms.filter(
    (room) => !isChatRoomId(room.id),
  );

  const dbById = new Map(dbRooms.map((room) => [room.id, room]));

  const mergedDbRooms = dbRooms.map((dbRoom) => {
    const local = localRealRooms.find((room) => room.id === dbRoom.id);
    return local ? mergeRoomMessages(local, dbRoom) : dbRoom;
  });

  const ephemeralRooms = localRealRooms.filter((room) => !dbById.has(room.id));

  const deduped = dedupeByPartner([...mergedDbRooms, ...ephemeralRooms]);

  return sortRoomsByActivity([...systemRooms, ...deduped]);
}

/** Refresh the latest thread page without discarding older pages already loaded. */
export function mergeLatestThreadPageFromDb(
  currentRooms: ChatRoom[],
  threadRoom: ChatRoom,
  hasMoreOlder: boolean,
): ChatRoom[] {
  return currentRooms.map((room) => {
    if (room.id !== threadRoom.id) {
      return room;
    }

    const pageTimestamps = threadRoom.messages
      .map((message) => new Date(message.timestamp).getTime())
      .filter((value) => Number.isFinite(value));

    if (pageTimestamps.length === 0) {
      return {
        ...mergeRoomMessages(room, threadRoom),
        threadHydrated: true,
        threadHasMoreOlder: hasMoreOlder,
      };
    }

    const pageStartMs = Math.min(...pageTimestamps);
    const olderMessages = room.messages.filter(
      (message) => new Date(message.timestamp).getTime() < pageStartMs,
    );
    const refreshedTail = mergeRoomMessages(
      { ...room, messages: [] },
      threadRoom,
    ).messages;

    const messages = dedupeMessagesByOfferId(
      [...olderMessages, ...refreshedTail].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    );

    return {
      ...room,
      ...threadRoom,
      messages,
      lastMessage: messages.at(-1)?.text ?? threadRoom.lastMessage,
      timestamp: messages.at(-1)?.timestamp ?? threadRoom.timestamp,
      threadHydrated: true,
      threadHasMoreOlder:
        olderMessages.length > 0 ? true : hasMoreOlder,
    };
  });
}

/** Merge a lazy-loaded thread page into an existing room row. */
export function mergeRoomThreadFromDb(
  currentRooms: ChatRoom[],
  threadRoom: ChatRoom,
  hasMoreOlder: boolean,
): ChatRoom[] {
  return currentRooms.map((room) =>
    room.id === threadRoom.id
      ? {
          ...mergeRoomMessages(room, threadRoom),
          threadHydrated: true,
          threadHasMoreOlder: hasMoreOlder,
        }
      : room,
  );
}

/** Prepend an older thread page into an existing room row. */
export function prependOlderRoomMessages(
  currentRooms: ChatRoom[],
  roomId: string,
  olderMessages: ChatRoom["messages"],
  hasMoreOlder: boolean,
): ChatRoom[] {
  return currentRooms.map((room) => {
    if (room.id !== roomId) {
      return room;
    }

    const existingIds = new Set(room.messages.map((message) => message.id));
    const uniqueOlder = olderMessages.filter(
      (message) => !existingIds.has(message.id),
    );

    const messages = dedupeMessagesByOfferId(
      [...uniqueOlder, ...room.messages].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    );

    return {
      ...room,
      messages,
      threadHasMoreOlder: hasMoreOlder,
    };
  });
}
