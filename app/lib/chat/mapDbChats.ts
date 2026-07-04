import type {
  ChatRoom,
  Message,
  SpecialTransactionData,
} from "@/app/store/useHkCardVaultStore";
import { resolveOfferCardDisplayImage } from "@/app/lib/chat/offerCardImage";
import type { Tables } from "@/types/supabase";

type ProfileSnippet = {
  id: string;
  display_name: string;
  role: Tables<"profiles">["role"];
};

type CatalogSnippet = {
  id: string;
  name_zh: string | null;
  name_ja: string;
  card_number: string | null;
  set_code: string;
  image_url: string;
};

export type DbOfferSnippet = {
  id: string;
  buyer_id: string;
  offer_price: number;
  status: Tables<"offers">["status"];
  modified_count: number;
  listings: {
    product_id: string;
    images: unknown;
    product_catalog: CatalogSnippet | null;
  } | null;
};

export type DbChatMessageRow = {
  id: string;
  room_id: string;
  content: string;
  created_at: string | null;
  sender_id: string;
  offer_id: string | null;
  is_system_warning: boolean | null;
  offers?: DbOfferSnippet | null;
};

export type DbChatRoomBaseRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string | null;
  updated_at: string | null;
  buyer: ProfileSnippet | null;
  seller: ProfileSnippet | null;
};

/** @deprecated nested select shape — use assembleDbChatRooms */
export type DbChatRoomRow = DbChatRoomBaseRow & {
  chat_messages: DbChatMessageRow[] | null;
};

function mapOfferStatusToInitialStatus(
  status: Tables<"offers">["status"],
  modifiedCount: number,
): SpecialTransactionData["initialStatus"] {
  if (status === "accepted") return "accepted";
  if (status === "rejected" || status === "cancelled") return "rejected";
  if (modifiedCount >= 1) return "countered";
  return "pending";
}

function buildSpecialData(
  offer: DbOfferSnippet,
  buyer: ProfileSnippet,
  seller: ProfileSnippet,
): SpecialTransactionData | null {
  const catalog = offer.listings?.product_catalog;
  if (!catalog) return null;

  const cardName =
    catalog.name_zh?.trim() || catalog.name_ja?.trim() || "未命名卡牌";
  const listingImages = offer.listings?.images;
  const imageUrl = resolveOfferCardDisplayImage(
    listingImages,
    catalog.image_url,
  );

  return {
    cardName,
    cardId: catalog.id,
    offerPrice: Number(offer.offer_price),
    buyerName: buyer.display_name?.trim() || "買家",
    buyerId: buyer.id,
    sellerId: seller.id,
    sellerName: seller.display_name?.trim() || "賣家",
    offerId: offer.id,
    modifiedCount: offer.modified_count ?? 0,
    imageUrl: imageUrl || undefined,
    initialStatus: mapOfferStatusToInitialStatus(
      offer.status,
      offer.modified_count ?? 0,
    ),
  };
}

function resolveSender(
  senderId: string,
  currentUserId: string,
  isSystemWarning: boolean,
  content: string,
): Message["sender"] {
  if (isSystemWarning || content === "SYSTEM_OFFER_ACCEPTED") {
    return "system";
  }
  return senderId === currentUserId ? "me" : "them";
}

function mapDbMessage(
  row: DbChatMessageRow,
  currentUserId: string,
  buyer: ProfileSnippet,
  seller: ProfileSnippet,
  primaryOfferMessageIds: Map<string, string>,
): Message {
  const timestamp = row.created_at ?? new Date().toISOString();
  const sender = resolveSender(
    row.sender_id,
    currentUserId,
    Boolean(row.is_system_warning),
    row.content,
  );

  const isPrimaryOfferMessage =
    row.offer_id != null &&
    primaryOfferMessageIds.get(row.offer_id) === row.id &&
    row.offers != null;

  if (isPrimaryOfferMessage && row.offers) {
    const specialData = buildSpecialData(row.offers, buyer, seller);
    if (specialData) {
      return {
        id: row.id,
        sender,
        text: row.content,
        timestamp,
        type: "special_transaction",
        specialData,
      };
    }
  }

  if (row.content === "SYSTEM_OFFER_ACCEPTED") {
    return {
      id: row.id,
      sender: "system",
      text: "✅ 賣家已接受出價，商品已成功鎖定（Hold 貨）",
      timestamp,
      type: "text",
    };
  }

  return {
    id: row.id,
    sender,
    text: row.content,
    timestamp,
    type: "text",
  };
}

function partnerTierForRole(role: Tables<"profiles">["role"]): string {
  return role === "merchant" ? "專業認證商戶" : "認證用戶";
}

function mapRoomToStore(
  room: DbChatRoomBaseRow,
  messages: DbChatMessageRow[],
  currentUserId: string,
): ChatRoom {
  const buyer = room.buyer ?? {
    id: room.buyer_id,
    display_name: "買家",
    role: "member" as const,
  };
  const seller = room.seller ?? {
    id: room.seller_id,
    display_name: "賣家",
    role: "merchant" as const,
  };

  const isBuyer = currentUserId === room.buyer_id;
  const partner = isBuyer ? seller : buyer;
  const partnerId = partner.id;
  const partnerName = partner.display_name?.trim() || "對話夥伴";

  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at ?? 0).getTime() -
      new Date(b.created_at ?? 0).getTime(),
  );

  const primaryOfferMessageIds = new Map<string, string>();
  for (const message of sortedMessages) {
    if (message.offer_id && !primaryOfferMessageIds.has(message.offer_id)) {
      primaryOfferMessageIds.set(message.offer_id, message.id);
    }
  }

  const mappedMessages = sortedMessages.map((message) =>
    mapDbMessage(
      message,
      currentUserId,
      buyer,
      seller,
      primaryOfferMessageIds,
    ),
  );

  const lastMessage = mappedMessages.at(-1)?.text ?? "尚無訊息";
  const timestamp =
    mappedMessages.at(-1)?.timestamp ??
    room.updated_at ??
    room.created_at ??
    new Date().toISOString();

  return {
    id: room.id,
    partnerId,
    partnerName,
    partnerTier: partnerTierForRole(partner.role),
    lastMessage,
    unreadCount: 0,
    timestamp,
    messages: mappedMessages,
  };
}

export function assembleDbChatRooms(
  rooms: DbChatRoomBaseRow[],
  messages: DbChatMessageRow[],
  offersById: Map<string, DbOfferSnippet>,
  currentUserId: string,
): ChatRoom[] {
  const messagesByRoom = new Map<string, DbChatMessageRow[]>();

  for (const message of messages) {
    const hydrated: DbChatMessageRow = {
      ...message,
      offers: message.offer_id ? offersById.get(message.offer_id) ?? null : null,
    };
    const bucket = messagesByRoom.get(message.room_id) ?? [];
    bucket.push(hydrated);
    messagesByRoom.set(message.room_id, bucket);
  }

  return rooms.map((room) =>
    mapRoomToStore(
      room,
      messagesByRoom.get(room.id) ?? [],
      currentUserId,
    ),
  );
}

/** @deprecated use assembleDbChatRooms */
export function mapDbChatRoomsToStore(
  rows: DbChatRoomRow[],
  currentUserId: string,
): ChatRoom[] {
  return rows.map((room) =>
    mapRoomToStore(room, room.chat_messages ?? [], currentUserId),
  );
}
