import CryptoJS from "crypto-js";

/**
 * Generates a deterministic, bi-directional canonical room ID by sorting
 * the two participant IDs alphabetically before hashing. This guarantees that
 * openGlobalChat called with either party order always resolves to the same room,
 * preventing duplicate parallel sessions between the same two users.
 */
export function generateDeterministicRoomId(
  userIdA: string,
  userIdB: string,
): string {
  const sortedTokens = [userIdA, userIdB].sort().join("_");
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
