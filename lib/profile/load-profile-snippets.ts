import { resolveAvatarUrl } from "@/lib/profile/avatar";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type ProfileSnippet = {
  username: string | null;
  avatarUrl: string;
};

type ProfileSnippetRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "username" | "avatar_path"
>;

export async function loadProfileSnippetsByIds(
  supabase: SupabaseClient<Database>,
  profileIds: string[],
): Promise<Map<string, ProfileSnippet>> {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_path")
    .in("id", uniqueIds);

  if (error) {
    console.error("[loadProfileSnippetsByIds]", error.message);
    return new Map();
  }

  const snippets = new Map<string, ProfileSnippet>();
  for (const row of (data ?? []) as ProfileSnippetRow[]) {
    snippets.set(row.id, {
      username: row.username?.trim() || null,
      avatarUrl: resolveAvatarUrl(row.avatar_path),
    });
  }

  return snippets;
}
