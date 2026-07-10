export const SNAPSHOT_SOURCE_SNKRDUNK = "snkrdunk";
export const SNAPSHOT_SOURCE_PLATFORM = "platform";

export type MarketDataSource = typeof SNAPSHOT_SOURCE_SNKRDUNK | typeof SNAPSHOT_SOURCE_PLATFORM;

export function isPlatformSnapshotSource(
  source: string | null | undefined,
): boolean {
  return (source ?? "").trim().toLowerCase() === SNAPSHOT_SOURCE_PLATFORM;
}

export function isSnkrdunkSnapshotSource(
  source: string | null | undefined,
): boolean {
  return !isPlatformSnapshotSource(source);
}
