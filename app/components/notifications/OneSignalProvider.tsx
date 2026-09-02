"use client";

import Script from "next/script";
import { useRef, type ReactNode } from "react";
import {
  ONESIGNAL_SDK_SCRIPT_SRC,
  ONESIGNAL_SERVICE_WORKER_PATH,
  ONESIGNAL_SERVICE_WORKER_SCOPE,
  ONESIGNAL_SERVICE_WORKER_UPDATER_PATH,
} from "@/lib/notifications/onesignal/client";
import { getOneSignalAppId } from "@/lib/notifications/onesignal/env";
import type { OneSignalInitOptions } from "@/lib/notifications/onesignal/types";
import { dispatchOneSignalReady } from "@/lib/notifications/onesignal/events";

function runOneSignalInit(appId: string) {
  const initOptions: OneSignalInitOptions = {
    appId,
    allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
    serviceWorkerPath: ONESIGNAL_SERVICE_WORKER_PATH,
    serviceWorkerUpdaterPath: ONESIGNAL_SERVICE_WORKER_UPDATER_PATH,
    serviceWorkerParam: { scope: ONESIGNAL_SERVICE_WORKER_SCOPE },
  };

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (oneSignal) => {
    await oneSignal.init(initOptions);
    dispatchOneSignalReady();

    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.info("[OneSignal] initialized", {
      permission: Notification.permission,
      note:
        "workers stay empty until notification permission is granted (expected).",
    });

    window.setTimeout(async () => {
      const workers = await navigator.serviceWorker.getRegistrations();
      console.info("[OneSignal] service workers", {
        permission: Notification.permission,
        workers: workers.map((registration) => registration.scope),
      });
    }, 2000);
  });
}

export function OneSignalProvider({ children }: { children: ReactNode }) {
  const appId = getOneSignalAppId();
  const initStarted = useRef(false);

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        id="onesignal-sdk"
        src={ONESIGNAL_SDK_SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          if (initStarted.current) {
            return;
          }

          initStarted.current = true;
          runOneSignalInit(appId);
        }}
        onError={() => {
          initStarted.current = false;
          console.error(
            "[OneSignal] SDK script failed to load from /vendor/onesignal. Hard refresh and check Network tab.",
          );
        }}
      />
      {children}
    </>
  );
}
