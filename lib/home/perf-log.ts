const PERF_PREFIX = "[home:perf]";

/** Dev/staging diagnostics — off in production unless `HOME_PERF_LOG=1`. */
export function isHomePerfLogEnabled(): boolean {
  if (process.env.HOME_PERF_LOG === "1") return true;
  if (process.env.NEXT_PUBLIC_HOME_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function homePerfNow(): number {
  return performance.now();
}

export function homePerfLog(message: string): void {
  if (!isHomePerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}
