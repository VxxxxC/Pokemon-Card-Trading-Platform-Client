"use client";

import { useSyncExternalStore } from "react";

let currentNow = typeof window !== "undefined" ? Date.now() : 0;
const nowListeners = new Set<() => void>();
let nowIntervalId: number | null = null;

function subscribeNow(onStoreChange: () => void) {
  nowListeners.add(onStoreChange);
  if (nowListeners.size === 1 && typeof window !== "undefined") {
    nowIntervalId = window.setInterval(() => {
      currentNow = Date.now();
      nowListeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    nowListeners.delete(onStoreChange);
    if (nowListeners.size === 0 && nowIntervalId !== null) {
      window.clearInterval(nowIntervalId);
      nowIntervalId = null;
    }
  };
}

function getNowSnapshot() {
  return currentNow;
}

function getNowServerSnapshot() {
  return 0;
}

export function useNowTicker() {
  return useSyncExternalStore(
    subscribeNow,
    getNowSnapshot,
    getNowServerSnapshot,
  );
}
