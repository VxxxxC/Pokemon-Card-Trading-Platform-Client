/** Display helpers for marketplace listing rows. */
export function formatListingGrade(
  company: string,
  score: string | null,
): { authority: string; score: string } {
  const normalized = company.toUpperCase().trim();
  if (normalized === "RAW" || normalized === "RAW CARD") {
    return { authority: "Raw Card", score: score ?? "" };
  }
  return { authority: company, score: score ?? "" };
}

export function formatTradeGradeLabel(
  company: string,
  score: string | null,
): string {
  const { authority, score: gradeScore } = formatListingGrade(company, score);
  if (authority === "Raw Card") return "Raw Card";
  return gradeScore ? `${authority} ${gradeScore}` : authority;
}

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("zh-Hant", {
  numeric: "always",
});

/** Relative order/trade timestamp: 剛剛 → 分鐘 → 小時 → 天 → 月 → 年 */
export function formatRelativeDateTime(
  createdAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!createdAt) return "—";

  const then = new Date(createdAt);
  if (Number.isNaN(then.getTime())) return "—";

  const elapsedMs = now.getTime() - then.getTime();
  if (elapsedMs < 0) return "剛剛";

  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const monthMs = 30 * dayMs;
  const yearMs = 365 * dayMs;

  if (elapsedMs < minuteMs) return "剛剛";
  if (elapsedMs < hourMs) {
    return RELATIVE_TIME_FORMATTER.format(
      -Math.floor(elapsedMs / minuteMs),
      "minute",
    );
  }
  if (elapsedMs < dayMs) {
    return RELATIVE_TIME_FORMATTER.format(
      -Math.floor(elapsedMs / hourMs),
      "hour",
    );
  }
  if (elapsedMs < monthMs) {
    return RELATIVE_TIME_FORMATTER.format(
      -Math.floor(elapsedMs / dayMs),
      "day",
    );
  }
  if (elapsedMs < yearMs) {
    return RELATIVE_TIME_FORMATTER.format(
      -Math.floor(elapsedMs / monthMs),
      "month",
    );
  }
  return RELATIVE_TIME_FORMATTER.format(
    -Math.floor(elapsedMs / yearMs),
    "year",
  );
}
