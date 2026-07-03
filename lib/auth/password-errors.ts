import type { AuthFormErrors } from "@/lib/auth/validation";

const SAME_PASSWORD_MESSAGE = "新密碼不可與目前密碼相同";

export function isSamePasswordAuthError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("same") ||
    normalized.includes("different from the old") ||
    normalized.includes("should be different")
  );
}

export function mapPasswordUpdateAuthError(message: string): AuthFormErrors {
  if (isSamePasswordAuthError(message)) {
    return { password: SAME_PASSWORD_MESSAGE };
  }
  return { password: "無法更新密碼，請稍後再試" };
}

export { SAME_PASSWORD_MESSAGE };
