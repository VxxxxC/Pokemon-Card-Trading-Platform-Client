const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function formatSellerJoinDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月加入`;
}

const BADGE_CATEGORY_EMOJI: Record<string, string> = {
  longevity: "🏅",
  trust: "⭐",
  collection: "📚",
  engagement: "🔥",
};

export function resolveActivityBadgeEmoji(category: string): string {
  return BADGE_CATEGORY_EMOJI[category] ?? "🏷️";
}
