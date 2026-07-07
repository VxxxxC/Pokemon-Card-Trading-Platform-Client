const PERF_PREFIX = "[collection:perf]";

/** Dev/staging diagnostics — off in production unless `COLLECTION_PERF_LOG=1`. */
export function isCollectionPerfLogEnabled(): boolean {
  if (process.env.COLLECTION_PERF_LOG === "1") return true;
  if (process.env.NEXT_PUBLIC_COLLECTION_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function collectionPerfNow(): number {
  return performance.now();
}

export function collectionPerfLog(message: string): void {
  if (!isCollectionPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}
