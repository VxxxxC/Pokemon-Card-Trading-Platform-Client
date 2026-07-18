import type { Message } from "@/app/store/useHkCardVaultStore";
import type { Tables } from "@/types/supabase";

export type RealtimeChatMessageRow = Tables<"chat_messages">;

const SYSTEM_ACCEPT_TEXT =
  "✅ 賣家已接受出價，商品已成功鎖定（Hold 貨）";
const SYSTEM_REJECT_TEXT = "❌ 賣家已拒絕此出價";
const SYSTEM_ORDER_COMPLETED_TEXT = "✅ 交易已順利完成";
const SYSTEM_ORDER_CANCELLED_TEXT = "❌ 此筆訂單已取消";

export function isAmlSensitiveChatContent(content: string): boolean {
  return content.includes("私下") && content.includes("過數");
}

export function resolvePersistedChatMessageSender(
  row: Pick<RealtimeChatMessageRow, "sender_id" | "is_system_warning" | "content">,
  currentUserId: string,
): Message["sender"] {
  if (row.is_system_warning || isAmlSensitiveChatContent(row.content)) {
    return "system";
  }

  return row.sender_id === currentUserId ? "me" : "them";
}

export type OfferRealtimeEvent =
  | {
      type: "accepted";
      offerId: string;
      memberOrderId?: string;
      merchantOrderId?: string;
      orderKind?: "member" | "merchant";
    }
  | { type: "rejected"; offerId: string }
  | { type: "modified"; offerId: string };

export function mapChatMessageRowToStoreMessage(
  row: RealtimeChatMessageRow,
  currentUserId: string,
): Message {
  const timestamp = row.created_at ?? new Date().toISOString();
  const content = row.content;

  if (content === "SYSTEM_OFFER_ACCEPTED") {
    const merchantOrderId = row.merchant_order_id?.trim();
    const memberOrderId = row.member_order_id?.trim();
    return {
      id: row.id,
      sender: "system",
      text: SYSTEM_ACCEPT_TEXT,
      timestamp,
      type: "text",
      orderData: merchantOrderId
        ? { orderId: merchantOrderId, orderKind: "merchant" }
        : memberOrderId
          ? { orderId: memberOrderId, orderKind: "member" }
          : undefined,
    };
  }

  if (content === "SYSTEM_OFFER_REJECTED") {
    return {
      id: row.id,
      sender: "system",
      text: SYSTEM_REJECT_TEXT,
      timestamp,
      type: "text",
    };
  }

  if (content === "SYSTEM_ORDER_COMPLETED") {
    const merchantOrderId = row.merchant_order_id?.trim();
    const memberOrderId = row.member_order_id?.trim();
    return {
      id: row.id,
      sender: "system",
      text: SYSTEM_ORDER_COMPLETED_TEXT,
      timestamp,
      type: "system_order_completed",
      orderData: merchantOrderId
        ? { orderId: merchantOrderId, orderKind: "merchant" }
        : memberOrderId
          ? { orderId: memberOrderId, orderKind: "member" }
          : undefined,
    };
  }

  if (content === "SYSTEM_ORDER_CANCELLED") {
    return {
      id: row.id,
      sender: "system",
      text: SYSTEM_ORDER_CANCELLED_TEXT,
      timestamp,
      type: "text",
    };
  }

  const sender = resolvePersistedChatMessageSender(row, currentUserId);

  return {
    id: row.id,
    sender,
    text: content,
    timestamp,
    type: "text",
  };
}

export function parseModifyOfferPriceFromContent(
  content: string,
): number | null {
  const match = /^修改了出價需求：HK\$\s*([\d,]+(?:\.\d+)?)/.exec(
    content.trim(),
  );
  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function decodeOfferRealtimeEvent(
  row: RealtimeChatMessageRow,
): OfferRealtimeEvent | null {
  if (!row.offer_id) {
    return null;
  }

  const offerId = row.offer_id;

  if (row.content === "SYSTEM_OFFER_ACCEPTED") {
    const merchantOrderId = row.merchant_order_id?.trim();
    const memberOrderId = row.member_order_id?.trim();
    return {
      type: "accepted",
      offerId,
      orderKind: merchantOrderId ? "merchant" : "member",
      merchantOrderId: merchantOrderId || undefined,
      memberOrderId: memberOrderId || undefined,
    };
  }

  if (row.content === "SYSTEM_OFFER_REJECTED") {
    return { type: "rejected", offerId };
  }

  if (row.content.startsWith("修改了出價需求：")) {
    return { type: "modified", offerId };
  }

  return null;
}

/** Initial buyer offer row — needs full thread hydrate for OfferCard rendering */
export function isInitialOfferRealtimeMessage(
  row: RealtimeChatMessageRow,
): boolean {
  if (!row.offer_id) {
    return false;
  }

  if (decodeOfferRealtimeEvent(row)) {
    return false;
  }

  return !row.content.startsWith("修改了出價需求：");
}

export function getLastPersistedMessageTimestamp(
  messages: Message[],
): string | null {
  let latest: string | null = null;

  for (const message of messages) {
    if (message.id.startsWith("opt-")) {
      continue;
    }

    if (!latest || new Date(message.timestamp).getTime() > new Date(latest).getTime()) {
      latest = message.timestamp;
    }
  }

  return latest;
}
