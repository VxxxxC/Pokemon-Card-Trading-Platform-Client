"use client";

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export interface UsePwaInstallReturn {
  /** Whether the app is already running in standalone / installed mode */
  isInstalled: boolean;
  /** Trigger the native browser install prompt (no-op if unavailable) */
  onInstall: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Module-level singleton — captures `beforeinstallprompt` eagerly    */
/* ------------------------------------------------------------------ */

let deferredPrompt: DeferredPromptEvent | null = null;
let isInstalled = false;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Snapshot is just a version counter so React knows to re-render */
let version = 0;
function getSnapshot() {
  return version;
}
function getServerSnapshot() {
  return 0;
}

if (typeof window !== "undefined") {
  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byNavigator =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  isInstalled = byMedia || byNavigator;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as DeferredPromptEvent;
    version++;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    isInstalled = true;
    deferredPrompt = null;
    version++;
    emit();
  });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePwaInstall(): UsePwaInstallReturn {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const onInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      isInstalled = true;
    }
    deferredPrompt = null;
    version++;
    emit();
  };

  return { isInstalled, onInstall };
}

