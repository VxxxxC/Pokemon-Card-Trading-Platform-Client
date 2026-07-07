const PERF_PREFIX = "[dashboard:perf]";

export function isDashboardClientPerfLogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_DASHBOARD_PERF_LOG === "1") return true;
  return process.env.NODE_ENV === "development";
}

export function dashboardClientPerfLog(message: string): void {
  if (!isDashboardClientPerfLogEnabled()) return;
  console.info(`${PERF_PREFIX} ${message}`);
}

let mountTimestamp: number | null = null;

export function markDashboardClientMount(hasInitialData: boolean): void {
  if (!isDashboardClientPerfLogEnabled()) return;
  mountTimestamp = performance.now();
  dashboardClientPerfLog(
    `clientMount initialData=${hasInitialData ? "yes" : "no"}`,
  );
}

export function logDashboardClientReady(section: string): void {
  if (!isDashboardClientPerfLogEnabled() || mountTimestamp === null) return;

  const elapsed = Math.round(performance.now() - mountTimestamp);
  dashboardClientPerfLog(`clientReady section=${section} within=${elapsed}ms`);
}
