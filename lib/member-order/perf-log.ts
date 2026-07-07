const PERF_PREFIX = "[trading:perf]";

/** Dev/staging diagnostics — off in production unless `TRADING_PERF_LOG=1`. */
export function isTradingPerfLogEnabled(): boolean {
  if (process.env.TRADING_PERF_LOG === "1") return true;
  if (process.env.NEXT_PUBLIC_TRADING_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function tradingPerfNow(): number {
  return performance.now();
}

export function tradingPerfLog(message: string): void {
  if (!isTradingPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}
