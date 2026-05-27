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
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

/* ------------------------------------------------------------------ */
/*  Module-level singleton store                                       */
/*  Captures `beforeinstallprompt` immediately — even before React     */
/*  hydrates — and shares state across every hook consumer.            */
/*                                                                     */
/*  Dismiss behaviour:                                                 */
/*    "稍後" (onDismiss) → sessionStorage only (reappears next visit)  */
/*    Actual install accepted → localStorage (permanent)               */
/* ------------------------------------------------------------------ */

/** localStorage key — set only when the app is actually installed */
const INSTALLED_KEY = "poketrade:pwa-installed";
/** sessionStorage key — set when user taps "稍後" (dismiss for this session) */
const SESSION_DISMISS_KEY = "poketrade:pwa-install-dismissed-session";

interface PwaStore {
  deferredPrompt: DeferredPromptEvent | null;
  isInstalled: boolean;
  isDismissed: boolean;
}

let store: PwaStore = {
  deferredPrompt: null,
  isInstalled: false,
  isDismissed: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot(): PwaStore {
  return store;
}

/** Must return a referentially stable value to avoid infinite re-renders */
const SERVER_SNAPSHOT: PwaStore = Object.freeze({
  deferredPrompt: null,
  isInstalled: false,
  isDismissed: false,
});

function getServerSnapshot(): PwaStore {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/* --- Eagerly attach listeners (runs once at module load) --- */
if (typeof window !== "undefined") {
  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byNavigator =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  const permanentlyInstalled =
    window.localStorage.getItem(INSTALLED_KEY) === "1";
  const sessionDismissed =
    window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";

  store = {
    deferredPrompt: null,
    isInstalled: byMedia || byNavigator || permanentlyInstalled,
    isDismissed: sessionDismissed,
  };

  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    store = { ...store, deferredPrompt: event as DeferredPromptEvent };
    emit();
  });

  window.addEventListener("appinstalled", () => {
    window.localStorage.setItem(INSTALLED_KEY, "1");
    store = { ...store, isInstalled: true, deferredPrompt: null };
    emit();
  });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePwaInstall(): UsePwaInstallReturn {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const canInstall =
    !snap.isInstalled && !snap.isDismissed && snap.deferredPrompt !== null;

  const onInstall = async () => {
    if (!snap.deferredPrompt) return;
    await snap.deferredPrompt.prompt();
    const choice = await snap.deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      store = { ...store, isInstalled: true, deferredPrompt: null };
    } else {
      // User dismissed the native prompt — treat as session dismiss
      window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
      store = { ...store, deferredPrompt: null, isDismissed: true };
    }
    emit();
  };

  const onDismiss = () => {
    // "稍後" — only dismiss for this browser session
    window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    store = { ...store, isDismissed: true };
    emit();
  };

  return { canInstall, isInstalled: snap.isInstalled, onInstall, onDismiss };
}

