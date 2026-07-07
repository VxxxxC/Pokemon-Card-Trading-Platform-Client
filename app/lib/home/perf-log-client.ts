const PERF_PREFIX = "[home:perf]";

export function isHomeClientPerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_HOME_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function homeClientPerfLog(message: string): void {
  if (!isHomeClientPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

let mountTimestamp: number | null = null;

export function markHomeClientMount(): void {
  if (!isHomeClientPerfLogEnabled()) return;
  mountTimestamp = performance.now();
  homeClientPerfLog("clientMount");
}

export function logHomeSectionHydrated(section: string): void {
  if (!isHomeClientPerfLogEnabled() || mountTimestamp === null) return;
  const elapsed = Math.round(performance.now() - mountTimestamp);
  homeClientPerfLog(`sectionHydrated ${section} within=${elapsed}ms`);
}
