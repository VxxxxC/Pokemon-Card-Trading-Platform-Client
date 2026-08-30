const DESKTOP_CHAT_MEDIA_QUERY = "(min-width: 1024px)";

export type ChatThreadViewState = {
  isChatOpen: boolean;
  activeRoomId: string;
  mobileView: "LIST" | "CHAT";
};

export function isDesktopChatViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(DESKTOP_CHAT_MEDIA_QUERY).matches;
}

/** True when the user is actively viewing the thread for `roomId`. */
export function isViewingChatThread(
  state: ChatThreadViewState,
  roomId: string,
): boolean {
  if (!state.isChatOpen || state.activeRoomId !== roomId) {
    return false;
  }

  if (isDesktopChatViewport()) {
    return true;
  }

  return state.mobileView === "CHAT";
}

export function shouldIncrementUnreadForInboundMessage(
  state: ChatThreadViewState,
  roomId: string,
  sender: "me" | "them" | "system",
): boolean {
  if (sender !== "them") {
    return false;
  }

  return !isViewingChatThread(state, roomId);
}
