import type { Message, OfferLedgerEntry } from "@/app/store/useHkCardVaultStore";

/** Best-effort order id from chat thread state (no network). */
export function resolveMemberOrderIdFromChatRoom(
  messages: Message[],
  offers?: Record<string, OfferLedgerEntry>,
): string | undefined {
  const ids = collectMemberOrderIdsFromChatRoom(messages, offers);
  return ids.at(-1);
}

/** Unique member-order ids referenced by a room thread (stable order). */
export function collectMemberOrderIdsFromChatRoom(
  messages: Message[],
  offers?: Record<string, OfferLedgerEntry>,
): string[] {
  const seen = new Set<string>();
  const orderIds: string[] = [];

  const push = (raw?: string) => {
    const id = raw?.trim();
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    orderIds.push(id);
  };

  for (const message of messages) {
    push(message.orderData?.orderId);
  }

  if (offers) {
    for (const message of messages) {
      const offerId = message.specialData?.offerId;
      if (!offerId) {
        continue;
      }
      push(offers[offerId]?.memberOrderId);
    }
  }

  return orderIds;
}
