export type LoginFields = {
  email: string;
  password: string;
};

export type RegisterFields = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
};

export type AuthFormErrors = Record<string, string>;

const USERNAME_REGEX = /^[A-Za-z0-9_\-]{3,24}$/;

/** Matches Supabase: lowercase, uppercase, digits, symbols, min 8 chars */
export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function validateLoginFields(fields: LoginFields): AuthFormErrors {
  const errors: AuthFormErrors = {};

  if (!fields.email.trim()) {
    errors.email = "請輸入電子郵件";
  }

  if (!fields.password) {
    errors.password = "請輸入密碼";
  }

  return errors;
}

export function validateRegisterFields(fields: RegisterFields): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const username = fields.username.trim();
  const email = fields.email.trim();

  if (!username) {
    errors.username = "請輸入用戶名稱";
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username =
      "用戶名稱限 3-24 字元，且只可包含英文、數字、底線(_)或連字號(-)";
  }

  if (!email) {
    errors.email = "請輸入電子郵件";
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = "電子郵件格式不正確";
  }

  if (!fields.password) {
    errors.password = "請輸入密碼";
  } else if (!PASSWORD_COMPLEXITY_REGEX.test(fields.password)) {
    errors.password =
      "密碼至少 8 字元，且必須同時包含大寫英文、小寫英文、數字及特殊符號";
  }

  if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "兩次輸入的密碼不一致";
  }

  if (!fields.agreeTerms) {
    errors.agreeTerms = "請同意服務條款及私隱政策";
  }

  return errors;
}
