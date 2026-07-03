const AVATAR_STORAGE_BUCKET = "avatars";

/** Public default avatar for members and merchants without a custom upload. */
export const DEFAULT_AVATAR_URL = "/asset/default-avator.webp";

function getStorageAvatarUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return DEFAULT_AVATAR_URL;
  return `${base}/storage/v1/object/public/${AVATAR_STORAGE_BUCKET}/${path}`;
}

/** Resolve `profiles.avatar_path` to a browser-ready image URL. */
export function resolveAvatarUrl(avatarPath: string | null | undefined): string {
  const trimmed = avatarPath?.trim();
  if (!trimmed) return DEFAULT_AVATAR_URL;
  if (trimmed.startsWith("/") || trimmed.startsWith("http")) return trimmed;
  return getStorageAvatarUrl(trimmed);
}
