"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "poketrade:pwa-install-dismissed";

type PwaInstallContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  setDeferredPrompt: (event: DeferredPromptEvent | null) => void;
  dismiss: () => void;
  promptInstall: () => Promise<void>;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function readInitialInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneByMedia = window.matchMedia("(display-mode: standalone)").matches;
  const standaloneByNavigator =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneByMedia || standaloneByNavigator;
}

function readInitialDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(readInitialInstalled);
  const [isDismissed, setIsDismissed] = useState(readInitialDismissed);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DISMISS_KEY, "1");
      }
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      canInstall: deferredPrompt !== null,
      isInstalled,
      isDismissed,
      setDeferredPrompt,
      dismiss,
      promptInstall,
    }),
    [deferredPrompt, dismiss, isDismissed, isInstalled, promptInstall],
  );

  return (
    <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const value = useContext(PwaInstallContext);
  if (!value) throw new Error("usePwaInstall must be used within PwaInstallProvider");
  return value;
}
