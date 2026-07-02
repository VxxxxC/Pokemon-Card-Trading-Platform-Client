"use server";

import { redirect } from "next/navigation";
import { getRoleDefaultLandingPath } from "@/lib/auth/roles";
import { resolveCurrentDemoRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type AuthFormErrors,
  validateLoginFields,
  validateRegisterFields,
} from "@/lib/auth/validation";

function parseRegisterFields(formData: FormData) {
  return {
    username: ((formData.get("username") as string | null) ?? "").trim(),
    email: ((formData.get("email") as string | null) ?? "").trim(),
    password: (formData.get("password") as string | null) ?? "",
    confirmPassword: (formData.get("confirmPassword") as string | null) ?? "",
    agreeTerms: formData.get("agreeTerms") === "true",
  };
}

function mapAuthError(message: string): AuthFormErrors {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return { email: "電子郵件或密碼不正確" };
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("email address is already")
  ) {
    return { email: "此電子郵件已被註冊" };
  }

  if (normalized.includes("password")) {
    return {
      password:
        "密碼至少 8 字元，且必須同時包含大寫英文、小寫英文、數字及特殊符號",
    };
  }

  return { email: "登入或註冊失敗，請稍後再試" };
}

async function isEmailTaken(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    if (
      data.users.some((user) => user.email?.toLowerCase() === normalized)
    ) {
      return true;
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return false;
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("is_display_name_available", {
    name: username,
  });

  if (error) throw error;
  return data === false;
}

export async function login(
  _prev: AuthFormErrors | null,
  formData: FormData,
): Promise<AuthFormErrors | null> {
  const fields = {
    email: ((formData.get("email") as string | null) ?? "").trim(),
    password: (formData.get("password") as string | null) ?? "",
  };

  const errors = validateLoginFields(fields);
  if (Object.keys(errors).length) return errors;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: fields.email,
    password: fields.password,
  });

  if (error) {
    return mapAuthError(error.message);
  }

  const role = await resolveCurrentDemoRole();
  redirect(getRoleDefaultLandingPath(role));
}

export async function registerMember(
  _prev: AuthFormErrors | null,
  formData: FormData,
): Promise<AuthFormErrors | null> {
  const fields = parseRegisterFields(formData);
  const errors = validateRegisterFields(fields);
  if (Object.keys(errors).length) return errors;

  try {
    const [emailTaken, usernameTaken] = await Promise.all([
      isEmailTaken(fields.email),
      isUsernameTaken(fields.username),
    ]);

    if (emailTaken) {
      return { email: "此電子郵件已被註冊" };
    }

    if (usernameTaken) {
      return { username: "此用戶名稱已被使用" };
    }
  } catch {
    return { email: "無法驗證帳戶資料，請稍後再試" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: fields.email,
    password: fields.password,
    options: {
      data: {
        display_name: fields.username,
        role: "member",
      },
    },
  });

  if (error) {
    return mapAuthError(error.message);
  }

  if (!data.user) {
    return { email: "註冊失敗，請稍後再試" };
  }

  const role = await resolveCurrentDemoRole();
  redirect(getRoleDefaultLandingPath(role));
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("登出失敗，請稍後再試");
  }

  redirect("/auth");
}
