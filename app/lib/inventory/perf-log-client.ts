const PERF_PREFIX = "[inventory:perf]";

export function isInventoryClientPerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_INVENTORY_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function inventoryClientPerfLog(message: string): void {
  if (!isInventoryClientPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

let mountTimestamp: number | null = null;

export function markInventoryClientMount(hasInitialData: boolean): void {
  if (!isInventoryClientPerfLogEnabled()) return;
  mountTimestamp = performance.now();
  inventoryClientPerfLog(
    `clientMount initialData=${hasInitialData ? "yes" : "no"}`,
  );
}

export function logInventoryClientReady(section: string): void {
  if (!isInventoryClientPerfLogEnabled() || mountTimestamp === null) return;

  const elapsed = Math.round(performance.now() - mountTimestamp);
  inventoryClientPerfLog(`clientReady section=${section} within=${elapsed}ms`);
}
