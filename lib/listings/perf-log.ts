const PERF_PREFIX = "[inventory:perf]";

/** Dev/staging diagnostics — off in production unless `INVENTORY_PERF_LOG=1`. */
export function isInventoryPerfLogEnabled(): boolean {
  if (process.env.INVENTORY_PERF_LOG === "1") return true;
  if (process.env.NEXT_PUBLIC_INVENTORY_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function inventoryPerfNow(): number {
  return performance.now();
}

export function inventoryPerfLog(message: string): void {
  if (!isInventoryPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}
