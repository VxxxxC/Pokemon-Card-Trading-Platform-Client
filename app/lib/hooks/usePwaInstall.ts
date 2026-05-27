"use client";

import { useEffect, useMemo, useState } from "react";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "poketrade:pwa-install-dismissed";

export interface UsePwaInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => Promise<void>;
  onDismiss: () => void;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    const byMedia = window.matchMedia("(display-mode: standalone)").matches;
    const byNavigator =
      "standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    return byMedia || byNavigator;
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.localStorage.setItem(DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canInstall = useMemo(
    () => !isInstalled && !isDismissed && deferredPrompt !== null,
    [deferredPrompt, isDismissed, isInstalled],
  );

  const onInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredPrompt(null);
  };

  const onDismiss = () => {
    setIsDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, "1");
  };

  return { canInstall, isInstalled, onInstall, onDismiss };
}
