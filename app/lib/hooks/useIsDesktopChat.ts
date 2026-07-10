"use client";

import { useSyncExternalStore } from "react";

const DESKTOP_CHAT_QUERY = "(min-width: 1024px)";

function subscribeDesktopChat(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(DESKTOP_CHAT_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getDesktopChatSnapshot() {
  return window.matchMedia(DESKTOP_CHAT_QUERY).matches;
}

function getDesktopChatServerSnapshot() {
  return true;
}

export function useIsDesktopChat(): boolean {
  return useSyncExternalStore(
    subscribeDesktopChat,
    getDesktopChatSnapshot,
    getDesktopChatServerSnapshot,
  );
}
