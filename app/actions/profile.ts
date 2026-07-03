"use server";

import { revalidatePath } from "next/cache";
import type { DemoRole } from "@/app/store/useUIStore";
import { resolveCurrentDemoRole } from "@/lib/auth/session";
import { mapProfileUpdateError } from "@/lib/profile/errors";
import { resolveAvatarUrl } from "@/lib/profile/avatar";
import {
  validateUserProfileFields,
  type UserProfileFormErrors,
} from "@/lib/profile/validation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/supabase";

type ProfileRow = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "avatar_path" | "role"
>;

type SettingsProfileRow = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "username" | "short_description" | "avatar_path" | "role"
>;

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type CurrentUserProfile = {
  id: string;
  displayName: string;
  avatarUrl: string;
  role: Tables<"profiles">["role"];
};

export type UserSettingsData = {
  id: string;
  displayName: string;
  username: string;
  shortDescription: string;
  email: string;
  avatarUrl: string;
  role: Tables<"profiles">["role"];
};

export async function getCurrentUserRole(): Promise<
  { success: true; data: DemoRole } | { success: false; error: string }
> {
  try {
    const role = await resolveCurrentDemoRole();
    return { success: true, data: role };
  } catch {
    return { success: false, error: "無法取得用戶角色" };
  }
}

export async function getCurrentUserProfile(): Promise<
  { success: true; data: CurrentUserProfile } | { success: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "未登入" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_path, role")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error || !profile) {
    return { success: false, error: "無法取得用戶資料" };
  }

  return {
    success: true,
    data: {
      id: profile.id,
      displayName: profile.display_name,
      avatarUrl: resolveAvatarUrl(profile.avatar_path),
      role: profile.role,
    },
  };
}

export async function getUserSettings(): Promise<
  { success: true; data: UserSettingsData } | { success: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "未登入" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, short_description, avatar_path, role")
    .eq("id", user.id)
    .maybeSingle<SettingsProfileRow>();

  if (error || !profile) {
    return { success: false, error: "無法取得用戶資料" };
  }

  return {
    success: true,
    data: {
      id: profile.id,
      displayName: profile.display_name,
      username: profile.username ?? "",
      shortDescription: profile.short_description ?? "",
      email: user.email ?? "",
      avatarUrl: resolveAvatarUrl(profile.avatar_path),
      role: profile.role,
    },
  };
}

async function isUsernameTakenByOther(
  username: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .neq("id", userId)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function updateUserProfile(
  _prev: UserProfileFormErrors | null,
  formData: FormData,
): Promise<UserProfileFormErrors | null> {
  const fields = {
    displayName: ((formData.get("displayName") as string | null) ?? "").trim(),
    username: ((formData.get("username") as string | null) ?? "").trim(),
    shortDescription: (
      (formData.get("shortDescription") as string | null) ?? ""
    ).trim(),
  };

  const errors = validateUserProfileFields(fields);
  if (Object.keys(errors).length) return errors;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { form: "未登入" };
  }

  try {
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .maybeSingle<Pick<Tables<"profiles">, "display_name" | "username">>();

    if (fetchError) {
      return { form: "無法取得用戶資料" };
    }

    if (!currentProfile) {
      return { form: "找不到用戶資料，請重新登入" };
    }

    const normalizedUsername = fields.username || null;
    const currentUsername = currentProfile.username?.trim() ?? "";

    if (
      normalizedUsername &&
      normalizedUsername.toLowerCase() !== currentUsername.toLowerCase()
    ) {
      const usernameTaken = await isUsernameTakenByOther(
        normalizedUsername,
        user.id,
      );
      if (usernameTaken) {
        return { username: "此用戶名稱已被使用" };
      }
    }

    const payload: ProfileUpdate = {
      display_name: fields.displayName,
      username: normalizedUsername,
      short_description: fields.shortDescription || null,
      updated_at: new Date().toISOString(),
    };

    const profilesClient = supabase.from("profiles") as unknown as {
      update: (values: ProfileUpdate) => {
        eq: (
          column: "id",
          value: string,
        ) => {
          select: (columns: "id") => Promise<{
            data: { id: string }[] | null;
            error: { code?: string; message?: string } | null;
          }>;
        };
      };
    };

    const { data: updatedRows, error: updateError } = await profilesClient
      .update(payload)
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      return mapProfileUpdateError(updateError);
    }

    if (!updatedRows?.length) {
      return {
        form: "沒有權限更新資料，請確認已套用 profiles UPDATE migration",
      };
    }
  } catch {
    return { form: "儲存失敗，請稍後再試" };
  }

  revalidatePath("/profile/user/settings");
  revalidatePath("/profile/user");
  return null;
}
