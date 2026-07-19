import { describe, expect, test } from "bun:test";
import {
  isCheckedInTodayHk,
  resolveEffectiveCheckInStreak,
  wasCheckedInYesterdayHk,
} from "@/lib/rewards/check-in-streak";

const NOW = new Date("2026-07-19T10:00:00+08:00");

function daysAgoHkMidday(days: number): string {
  const date = new Date(NOW);
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

describe("wasCheckedInYesterdayHk", () => {
  test("returns true when last check-in was yesterday in HK", () => {
    expect(wasCheckedInYesterdayHk(daysAgoHkMidday(1), NOW)).toBe(true);
  });

  test("returns false when last check-in was two days ago", () => {
    expect(wasCheckedInYesterdayHk(daysAgoHkMidday(2), NOW)).toBe(false);
  });
});

describe("resolveEffectiveCheckInStreak", () => {
  test("returns 0 when there is no last check-in", () => {
    expect(
      resolveEffectiveCheckInStreak({
        currentStreak: 5,
        lastCheckIn: null,
        now: NOW,
      }),
    ).toBe(0);
  });

  test("returns stored streak when checked in today", () => {
    expect(
      resolveEffectiveCheckInStreak({
        currentStreak: 5,
        lastCheckIn: daysAgoHkMidday(0),
        now: NOW,
      }),
    ).toBe(5);
    expect(isCheckedInTodayHk(daysAgoHkMidday(0), NOW)).toBe(true);
  });

  test("returns stored streak when last check-in was yesterday and not yet today", () => {
    expect(
      resolveEffectiveCheckInStreak({
        currentStreak: 5,
        lastCheckIn: daysAgoHkMidday(1),
        now: NOW,
      }),
    ).toBe(5);
  });

  test("returns 0 when streak is broken (last check-in before yesterday)", () => {
    expect(
      resolveEffectiveCheckInStreak({
        currentStreak: 5,
        lastCheckIn: daysAgoHkMidday(3),
        now: NOW,
      }),
    ).toBe(0);
  });

  test("honors explicit checkedInToday flag", () => {
    expect(
      resolveEffectiveCheckInStreak({
        currentStreak: 7,
        lastCheckIn: daysAgoHkMidday(3),
        checkedInToday: true,
        now: NOW,
      }),
    ).toBe(7);
  });
});
