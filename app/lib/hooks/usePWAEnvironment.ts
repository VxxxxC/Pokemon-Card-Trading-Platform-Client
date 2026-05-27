"use client";

import { useEffect, useState } from "react";

export interface PWAEnvironment {
  /** App is running inside an installed PWA standalone window */
  isStandalone: boolean;
  /** User is on iOS Safari but has NOT installed the PWA */
  isIOSBrowser: boolean;
  /** Standard desktop/mobile browser (not standalone, not iOS hint) */
  isBrowser: boolean;
}

function detectIsIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function detectIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mediaMatch = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return mediaMatch || iosStandalone;
}

export function usePWAEnvironment(): PWAEnvironment {
  const [isStandalone, setIsStandalone] = useState(detectIsStandalone);
  const [isIOS] = useState(detectIsIOS);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return {
    isStandalone,
    isIOSBrowser: isIOS && !isStandalone,
    isBrowser: !isStandalone && !isIOS,
  };
}
