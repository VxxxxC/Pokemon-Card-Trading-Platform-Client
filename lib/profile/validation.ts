const USERNAME_REGEX = /^[A-Za-z0-9_\-]{3,24}$/;

export type UserProfileFormErrors = Record<string, string>;

export function validateUserProfileFields(fields: {
  displayName: string;
  username: string;
  shortDescription: string;
}): UserProfileFormErrors {
  const errors: UserProfileFormErrors = {};
  const displayName = fields.displayName.trim();
  const username = fields.username.trim();
  const shortDescription = fields.shortDescription.trim();

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

  return errors;
}
