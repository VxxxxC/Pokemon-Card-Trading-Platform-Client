const PERF_PREFIX = "[marketplace:perf]";

/** Dev/staging diagnostics — off in production unless `MARKETPLACE_PERF_LOG=1`. */
export function isMarketplacePerfLogEnabled(): boolean {
  if (process.env.MARKETPLACE_PERF_LOG === "1") return true;
  if (process.env.NEXT_PUBLIC_MARKETPLACE_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function marketplacePerfNow(): number {
  return performance.now();
}

export function marketplacePerfLog(message: string): void {
  if (!isMarketplacePerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

export async function withMarketplacePerf<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isMarketplacePerfLogEnabled()) {
    return fn();
  }

  const start = marketplacePerfNow();
  try {
    return await fn();
  } finally {
    const elapsed = Math.round(marketplacePerfNow() - start);
    marketplacePerfLog(`${label}=${elapsed}ms`);
  }
}
