"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
  const pendingInitialScrollRef = useRef(true);
  const isPrependingRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const loadOlderRequestIdRef = useRef(0);
  const prevRoomIdRef = useRef(activeRoomId);
  const prevMessageCountRef = useRef(messageCount);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  const isNearBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return true;
    }

    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    return distanceFromBottom < SCROLL_EDGE_THRESHOLD_PX;
  }, [scrollRef]);

  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
    bottomAnchorRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [scrollRef]);

  const finishPendingInitialScroll = useCallback(() => {
    if (isNearBottom()) {
      pendingInitialScrollRef.current = false;
    }
  }, [isNearBottom]);

  const scheduleScrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
      requestAnimationFrame(() => {
        scrollToBottom();
        finishPendingInitialScroll();
      });
    });
  }, [finishPendingInitialScroll, scrollToBottom]);

  const updateStickToBottom = useCallback(() => {
    stickToBottomRef.current = isNearBottom();
  }, [isNearBottom]);

  const requestOlderMessages = useCallback(() => {
    if (pendingInitialScrollRef.current) {
      return;
    }

    const element = scrollRef.current;
    if (
      !element ||
      !activeRoom ||
      activeRoom.threadHasMoreOlder === false ||
      loadingOlderRef.current ||
      isThreadLoading
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
  }, [activeRoom, activeRoomId, isThreadLoading, scrollRef]);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element || isThreadLoading || loadingOlder) {
      updateStickToBottom();
      return;
    }

    updateStickToBottom();

    if (pendingInitialScrollRef.current || element.scrollTop > SCROLL_EDGE_THRESHOLD_PX) {
      return;
    }

    requestOlderMessages();
  }, [
    isThreadLoading,
    loadingOlder,
    requestOlderMessages,
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
      pendingInitialScrollRef.current = true;
      prevMessageCountRef.current = messageCount;
      return;
    }

    if (isPrependingRef.current) {
      prevMessageCountRef.current = messageCount;
      return;
    }

    if (messageCount > prevMessageCountRef.current && stickToBottomRef.current) {
      scheduleScrollToBottom();
    }

    prevMessageCountRef.current = messageCount;
  }, [
    activeRoomId,
    isChatOpen,
    messageCount,
    scheduleScrollToBottom,
  ]);

  useLayoutEffect(() => {
    if (!isChatOpen || isThreadLoading) {
      return;
    }

    if (pendingInitialScrollRef.current) {
      scrollToBottom();
    }
  }, [
    activeRoomId,
    isChatOpen,
    isThreadLoading,
    messageCount,
    scrollToBottom,
  ]);

  useEffect(() => {
    if (!isChatOpen || isThreadLoading) {
      return;
    }

    if (pendingInitialScrollRef.current) {
      scheduleScrollToBottom();
    }
  }, [
    activeRoomId,
    isChatOpen,
    isThreadLoading,
    messageCount,
    scheduleScrollToBottom,
  ]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = topSentinelRef.current;
    if (
      !root ||
      !sentinel ||
      !isChatOpen ||
      isThreadLoading ||
      !activeRoom?.threadHydrated ||
      activeRoom.threadHasMoreOlder === false
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (pendingInitialScrollRef.current) {
          return;
        }

        if (entries.some((entry) => entry.isIntersecting)) {
          requestOlderMessages();
        }
      },
      {
        root,
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    activeRoom?.threadHasMoreOlder,
    activeRoom?.threadHydrated,
    activeRoomId,
    isChatOpen,
    isThreadLoading,
    messageCount,
    requestOlderMessages,
    scrollRef,
  ]);

  const showAllHistoryLoaded =
    Boolean(activeRoom?.threadHydrated) &&
    activeRoom?.threadHasMoreOlder === false &&
    (activeRoom?.messages.length ?? 0) >= CHAT_THREAD_PAGE_SIZE;

  return {
    loadingOlder,
    handleScroll,
    showAllHistoryLoaded,
    topSentinelRef,
    bottomAnchorRef,
  };
}
