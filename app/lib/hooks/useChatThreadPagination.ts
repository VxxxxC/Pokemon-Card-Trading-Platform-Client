"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { toast } from "sonner";
import { CHAT_THREAD_PAGE_SIZE } from "@/app/lib/chat/constants";
import { loadOlderChatRoomThread } from "@/app/lib/chat/hydrateChatRoomThread";
import type { ChatRoom } from "@/app/store/useHkCardVaultStore";

const SCROLL_EDGE_THRESHOLD_PX = 80;

type UseChatThreadPaginationOptions = {
  scrollRef: RefObject<HTMLDivElement | null>;
  activeRoomId: string;
  activeRoom: ChatRoom | null;
  isThreadLoading: boolean;
  isChatOpen: boolean;
  messageCount: number;
};

export function useChatThreadPagination({
  scrollRef,
  activeRoomId,
  activeRoom,
  isThreadLoading,
  isChatOpen,
  messageCount,
}: UseChatThreadPaginationOptions) {
  const [loadingOlder, setLoadingOlder] = useState(false);
  const stickToBottomRef = useRef(true);
  const isPrependingRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const loadOlderRequestIdRef = useRef(0);
  const prevRoomIdRef = useRef(activeRoomId);
  const prevMessageCountRef = useRef(messageCount);

  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollTop = element.scrollHeight;
  }, [scrollRef]);

  const updateStickToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottomRef.current = distanceFromBottom < SCROLL_EDGE_THRESHOLD_PX;
  }, [scrollRef]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || isThreadLoading || loadingOlder) {
      updateStickToBottom();
      return;
    }

    updateStickToBottom();

    if (
      !activeRoom ||
      activeRoom.threadHasMoreOlder === false ||
      loadingOlderRef.current ||
      element.scrollTop > SCROLL_EDGE_THRESHOLD_PX
    ) {
      return;
    }

    const requestId = ++loadOlderRequestIdRef.current;
    const previousScrollHeight = element.scrollHeight;
    isPrependingRef.current = true;
    loadingOlderRef.current = true;
    setLoadingOlder(true);

    void loadOlderChatRoomThread(activeRoomId)
      .then((result) => {
        if (requestId !== loadOlderRequestIdRef.current) {
          return;
        }

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        requestAnimationFrame(() => {
          const currentElement = scrollRef.current;
          if (!currentElement) {
            return;
          }

          const nextScrollHeight = currentElement.scrollHeight;
          currentElement.scrollTop =
            nextScrollHeight - previousScrollHeight + currentElement.scrollTop;
        });
      })
      .finally(() => {
        if (requestId === loadOlderRequestIdRef.current) {
          isPrependingRef.current = false;
          loadingOlderRef.current = false;
          setLoadingOlder(false);
        }
      });
  }, [
    activeRoom,
    activeRoomId,
    isThreadLoading,
    loadingOlder,
    scrollRef,
    updateStickToBottom,
  ]);

  useEffect(() => {
    if (!isChatOpen) {
      return;
    }

    if (prevRoomIdRef.current !== activeRoomId) {
      prevRoomIdRef.current = activeRoomId;
      stickToBottomRef.current = true;
      prevMessageCountRef.current = messageCount;
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      return;
    }

    if (isPrependingRef.current) {
      prevMessageCountRef.current = messageCount;
      return;
    }

    if (messageCount > prevMessageCountRef.current && stickToBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }

    prevMessageCountRef.current = messageCount;
  }, [
    activeRoomId,
    isChatOpen,
    messageCount,
    scrollToBottom,
  ]);

  useEffect(() => {
    if (isChatOpen && !isThreadLoading && activeRoom?.threadHydrated) {
      stickToBottomRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [activeRoom?.threadHydrated, activeRoomId, isChatOpen, isThreadLoading, scrollToBottom]);

  const showAllHistoryLoaded =
    Boolean(activeRoom?.threadHydrated) &&
    activeRoom?.threadHasMoreOlder === false &&
    (activeRoom?.messages.length ?? 0) >= CHAT_THREAD_PAGE_SIZE;

  return {
    loadingOlder,
    handleScroll,
    showAllHistoryLoaded,
  };
}
