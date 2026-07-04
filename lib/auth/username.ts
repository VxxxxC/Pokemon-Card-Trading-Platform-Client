const USERNAME_PREFIX = "user_";
const USERNAME_SUFFIX_LENGTH = 10;
const USERNAME_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function buildRandomUsernameCandidate(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(USERNAME_SUFFIX_LENGTH));
  const suffix = Array.from(
    bytes,
    (byte) => USERNAME_CHARSET[byte % USERNAME_CHARSET.length],
  ).join("");

  return `${USERNAME_PREFIX}${suffix}`;
}

export async function generateUniqueUsername(
  isTaken: (username: string) => Promise<boolean>,
  maxAttempts = 12,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = buildRandomUsernameCandidate();
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  return `user_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
}
