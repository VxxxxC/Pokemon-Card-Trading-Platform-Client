const USERNAME_REGEX = /^[A-Za-z0-9_\-]{3,24}$/;

export type UserProfileFormErrors = Record<string, string>;

export function validateUserProfileFields(fields: {
  displayName: string;
  username: string;
  shortDescription: string;
  bankAccount?: string;
  fpsId?: string;
}): UserProfileFormErrors {
  const errors: UserProfileFormErrors = {};
  const displayName = fields.displayName.trim();
  const username = fields.username.trim();
  const shortDescription = fields.shortDescription.trim();
  const bankAccount = (fields.bankAccount ?? "").trim();
  const fpsId = (fields.fpsId ?? "").trim();

  if (!displayName) {
    errors.displayName = "請輸入顯示名稱";
  }

  if (username && !USERNAME_REGEX.test(username)) {
    errors.username =
      "用戶名稱限 3-24 字元，且只可包含英文、數字、底線(_)或連字號(-)";
  }

  if (shortDescription.length > 280) {
    errors.shortDescription = "個人簡介不可超過 280 字元";
  }

  if (bankAccount && bankAccount.length > 100) {
    errors.bankAccount = "銀行名稱及帳號長度不可超過 100 字元";
  }

  if (fpsId && fpsId.length > 100) {
    errors.fpsId = "轉數快 ID / 電話 / 電郵長度不可超過 100 字元";
  }

  return errors;
}
