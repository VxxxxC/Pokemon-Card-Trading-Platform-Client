import CryptoJS from "crypto-js";
import type { ChatPartnerPersona } from "@/app/lib/chat/partnerRoomKey";
import { normalizeChatPartnerPersona } from "@/app/lib/chat/partnerRoomKey";

/**
 * Generates a deterministic, bi-directional canonical room ID by sorting
 * participant id+persona tokens before hashing. Persona-aware so member and
 * merchant sessions for the same profile UUID do not collide.
 */
export function generateDeterministicRoomId(
  buyerId: string,
  buyerPersona: ChatPartnerPersona,
  sellerId: string,
  sellerPersona: ChatPartnerPersona,
): string {
  const buyerToken = `${buyerId.trim().toLowerCase()}:${normalizeChatPartnerPersona(buyerPersona)}`;
  const sellerToken = `${sellerId.trim().toLowerCase()}:${normalizeChatPartnerPersona(sellerPersona)}`;
  const sortedTokens = [buyerToken, sellerToken].sort().join("|");
  return CryptoJS.MD5(sortedTokens).toString().slice(0, 16).toUpperCase();
}

/**
 * Format an ISO-8601 timestamp string into a compact HH:mm display label.
 * Falls back gracefully to the raw string if parsing fails.
 */
export function formatMessageTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleTimeString("zh-HK", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return timestamp;
  }
}

/**
 * Returns a human-readable day separator label for the temporal HUD.
 * Compares the message date against today/yesterday; falls back to DD/MM/YYYY.
 */
export function getDateSeparatorLabel(timestamp: string): string {
  try {
    const msgDate = new Date(timestamp);
    if (isNaN(msgDate.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const normalize = (d: Date) =>
      d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();

    if (normalize(msgDate) === normalize(today)) return "\u4eca\u5929";
    if (normalize(msgDate) === normalize(yesterday)) return "\u6628\u5929";

    const dd = String(msgDate.getDate()).padStart(2, "0");
    const mm = String(msgDate.getMonth() + 1).padStart(2, "0");
    const yyyy = msgDate.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
  } catch {
    return "";
  }
}
