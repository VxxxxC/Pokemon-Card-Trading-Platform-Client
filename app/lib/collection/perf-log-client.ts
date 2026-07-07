const PERF_PREFIX = "[collection:perf]";

export function isCollectionClientPerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_COLLECTION_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function collectionClientPerfLog(message: string): void {
  if (!isCollectionClientPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

let mountTimestamp: number | null = null;

export function markCollectionClientMount(hasInitialData: boolean): void {
  if (!isCollectionClientPerfLogEnabled()) return;
  mountTimestamp = performance.now();
  collectionClientPerfLog(
    `clientMount initialData=${hasInitialData ? "yes" : "no"}`,
  );
}

export function logCollectionClientReady(section: string): void {
  if (!isCollectionClientPerfLogEnabled() || mountTimestamp === null) return;

  const elapsed = Math.round(performance.now() - mountTimestamp);
  collectionClientPerfLog(`clientReady section=${section} within=${elapsed}ms`);
}
