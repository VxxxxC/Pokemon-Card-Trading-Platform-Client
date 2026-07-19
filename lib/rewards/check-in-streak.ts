const HK_TIME_ZONE = "Asia/Hong_Kong";

export function toHongKongDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: HK_TIME_ZONE });
}

export function isCheckedInTodayHk(
  lastCheckIn: string | null,
  now: Date = new Date(),
): boolean {
  if (!lastCheckIn) return false;
  const last = new Date(lastCheckIn);
  return toHongKongDateString(last) === toHongKongDateString(now);
}

export function wasCheckedInYesterdayHk(
  lastCheckIn: string | null,
  now: Date = new Date(),
): boolean {
  if (!lastCheckIn) return false;
  const last = new Date(lastCheckIn);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return toHongKongDateString(last) === toHongKongDateString(yesterday);
}

export function isCheckInStreakBroken(
  lastCheckIn: string | null,
  now: Date = new Date(),
): boolean {
  if (!lastCheckIn) return false;
  if (isCheckedInTodayHk(lastCheckIn, now)) return false;
  if (wasCheckedInYesterdayHk(lastCheckIn, now)) return false;
  return true;
}

export function resolveEffectiveCheckInStreak(input: {
  currentStreak: number;
  lastCheckIn: string | null;
  checkedInToday?: boolean;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const storedStreak = Math.max(0, input.currentStreak);
  const checkedInToday =
    input.checkedInToday ?? isCheckedInTodayHk(input.lastCheckIn, now);

  if (!input.lastCheckIn) {
    return 0;
  }

  if (checkedInToday) {
    return storedStreak;
  }

  if (wasCheckedInYesterdayHk(input.lastCheckIn, now)) {
    return storedStreak;
  }

  return 0;
}
