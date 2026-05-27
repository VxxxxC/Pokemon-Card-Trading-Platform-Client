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
/* ------------------------------------------------------------------ */

const DISMISS_KEY = "poketrade:pwa-install-dismissed";

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

function getServerSnapshot(): PwaStore {
  return { deferredPrompt: null, isInstalled: false, isDismissed: false };
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/* --- Eagerly attach listeners (runs once at module load) --- */
if (typeof window !== "undefined") {
  // Read initial values
  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byNavigator =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  store = {
    deferredPrompt: null,
    isInstalled: byMedia || byNavigator,
    isDismissed: window.localStorage.getItem(DISMISS_KEY) === "1",
  };

  window.addEventListener("beforeinstallprompt", (event: Event) => {
    event.preventDefault();
    store = { ...store, deferredPrompt: event as DeferredPromptEvent };
    emit();
  });

  window.addEventListener("appinstalled", () => {
    store = { ...store, isInstalled: true, deferredPrompt: null };
    window.localStorage.setItem(DISMISS_KEY, "1");
    emit();
  });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePwaInstall(): UsePwaInstallReturn {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const canInstall = !snap.isInstalled && !snap.isDismissed && snap.deferredPrompt !== null;

  const onInstall = async () => {
    if (!snap.deferredPrompt) return;
    await snap.deferredPrompt.prompt();
    const choice = await snap.deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      window.localStorage.setItem(DISMISS_KEY, "1");
      store = { ...store, isInstalled: true, deferredPrompt: null };
    } else {
      store = { ...store, deferredPrompt: null, isDismissed: true };
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    emit();
  };

  const onDismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    store = { ...store, isDismissed: true };
    emit();
  };

  return { canInstall, isInstalled: snap.isInstalled, onInstall, onDismiss };
}

