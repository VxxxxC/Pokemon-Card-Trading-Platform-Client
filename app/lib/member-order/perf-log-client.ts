const PERF_PREFIX = "[trading:perf]";

export function isTradingClientPerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_TRADING_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function tradingClientPerfLog(message: string): void {
  if (!isTradingClientPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

let mountTimestamp: number | null = null;

export function markTradingClientMount(hasInitialData: boolean): void {
  if (!isTradingClientPerfLogEnabled()) return;
  mountTimestamp = performance.now();
  tradingClientPerfLog(
    `clientMount initialData=${hasInitialData ? "yes" : "no"}`,
  );
}

export function logTradingClientReady(section: string): void {
  if (!isTradingClientPerfLogEnabled() || mountTimestamp === null) return;

  const elapsed = Math.round(performance.now() - mountTimestamp);
  tradingClientPerfLog(`clientReady section=${section} within=${elapsed}ms`);
}
