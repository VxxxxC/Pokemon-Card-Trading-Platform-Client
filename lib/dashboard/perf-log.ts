const PERF_PREFIX = "[dashboard:perf]";

/** Dev/staging diagnostics — off in production unless `DASHBOARD_PERF_LOG=1`. */
export function isDashboardPerfLogEnabled(): boolean {
  if (process.env.DASHBOARD_PERF_LOG === "1") return true;
  if (process.env.NEXT_PUBLIC_DASHBOARD_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function dashboardPerfNow(): number {
  return performance.now();
}

export function dashboardPerfLog(message: string): void {
  if (!isDashboardPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

export async function withDashboardPerf<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isDashboardPerfLogEnabled()) {
    return fn();
  }

  const start = dashboardPerfNow();
  try {
    return await fn();
  } finally {
    const elapsed = Math.round(dashboardPerfNow() - start);
    dashboardPerfLog(`${label}=${elapsed}ms`);
  }
}
