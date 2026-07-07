const PERF_PREFIX = "[marketplace:perf]";

export function isMarketplaceClientPerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_MARKETPLACE_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function marketplaceClientPerfLog(message: string): void {
  if (!isMarketplaceClientPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

/** Tracks client-side search invocations within a page session (dev only). */
let clientSearchCount = 0;
let mountTimestamp: number | null = null;

export function markMarketplaceClientMount(): void {
  if (!isMarketplaceClientPerfLogEnabled()) return;
  mountTimestamp = performance.now();
  clientSearchCount = 0;
}

export function recordMarketplaceClientSearch(details: string): void {
  if (!isMarketplaceClientPerfLogEnabled()) return;
  clientSearchCount += 1;
  marketplaceClientPerfLog(
    `clientSearch #${clientSearchCount} ${details}`,
  );
}

export function logMarketplaceClientSearchSummary(): void {
  if (!isMarketplaceClientPerfLogEnabled() || mountTimestamp === null) return;

  const elapsed = Math.round(performance.now() - mountTimestamp);
  marketplaceClientPerfLog(
    `clientSearchSummary count=${clientSearchCount} within=${elapsed}ms`,
  );
}
