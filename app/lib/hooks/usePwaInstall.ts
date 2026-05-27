"use client";

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaPromptState =
  | "NATIVE_READY"
  | "BROWSER_COOLING"
  | "ALREADY_INSTALLED";

export interface UsePwaInstallReturn {
  /** Whether the app is already running in standalone / installed mode */
  isInstalled: boolean;
  /** Current prompt state for UI rendering */
  promptState: PwaPromptState;
  /** Trigger the native browser install prompt (no-op if unavailable) */
  onInstall: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  localStorage keys                                                  */
/* ------------------------------------------------------------------ */

const LS_COOLING_KEY = "pwa_cooling_active";
const LS_INSTALLED_KEY = "pwa_installed";

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
  isInstalled =
    byMedia || byNavigator || localStorage.getItem(LS_INSTALLED_KEY) === "true";

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as DeferredPromptEvent;
    // Native prompt arrived — clear any cooling flag
    localStorage.removeItem(LS_COOLING_KEY);
    version++;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    isInstalled = true;
    deferredPrompt = null;
    localStorage.setItem(LS_INSTALLED_KEY, "true");
    localStorage.removeItem(LS_COOLING_KEY);
    version++;
    emit();
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function derivePromptState(): PwaPromptState {
  if (isInstalled) return "ALREADY_INSTALLED";
  if (deferredPrompt) return "NATIVE_READY";
  return "BROWSER_COOLING";
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
      localStorage.setItem(LS_INSTALLED_KEY, "true");
      localStorage.removeItem(LS_COOLING_KEY);
    } else {
      // User dismissed — enter cooling state so next refresh shows fallback UI
      localStorage.setItem(
        LS_COOLING_KEY,
        JSON.stringify({ active: true, timestamp: Date.now() })
      );
    }
    deferredPrompt = null;
    version++;
    emit();
  };

  return { isInstalled, promptState: derivePromptState(), onInstall };
}

