import { dismissPushOptIn } from "@/lib/notifications/onesignal/prompt-state";

export async function requestOneSignalPushPermission(): Promise<boolean> {
  const oneSignal = window.OneSignal;
  if (!oneSignal) {
    return false;
  }

  if (!oneSignal.Notifications.isPushSupported()) {
    dismissPushOptIn();
    return false;
  }

  const granted = await oneSignal.Notifications.requestPermission();

  if (Notification.permission !== "default") {
    dismissPushOptIn();
  }

  return granted;
}
