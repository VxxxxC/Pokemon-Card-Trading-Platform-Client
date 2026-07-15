"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getUserChatInboxLobby } from "@/app/actions/chat";
import { hydrateChatRoomThread } from "@/app/lib/chat/hydrateChatRoomThread";
import { isDbChatRoomId } from "@/app/lib/chat/constants";
import {
  findRoomByPartnerId,
  findRoomByPartnerName,
  mergeChatRoomsWithDb,
} from "@/app/lib/chat/mergeChatRooms";
import { roomNeedsThreadHydration } from "@/app/lib/chat/roomHydration";
import { persistMarkRoomReadAsync } from "@/app/lib/chat/persistMarkRoomRead";
import { useChatRoomRealtime } from "@/app/lib/hooks/useChatRoomRealtime";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";
import { useIsDesktopChat } from "@/app/lib/hooks/useIsDesktopChat";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { ChatOverlaySkeleton } from "@/app/components/chat/ChatOverlaySkeleton";

const GlobalChatConsole = dynamic(
  () =>
    import("@/app/components/chat/GlobalChatConsole").then(
      (module) => module.GlobalChatConsole,
    ),
  {
    ssr: false,
    loading: () => <ChatOverlaySkeleton />,
  },
);

export function GlobalChatOverlay() {
  const isChatOpen = useHkCardVaultStore((state) => state.isChatOpen);
  const activeRoomId = useHkCardVaultStore((state) => state.activeRoomId);
  const mobileView = useHkCardVaultStore((state) => state.mobileView);
  const setChats = useHkCardVaultStore((state) => state.setChats);
  const setActiveRoomId = useHkCardVaultStore((state) => state.setActiveRoomId);
  const currentUserId = useCurrentUserId();
  const isDesktopChat = useIsDesktopChat();
  const inboxRequestIdRef = useRef(0);
  const threadRequestIdRef = useRef(0);
  const lastLobbySyncAtRef = useRef(0);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LOBBY_STALE_MS = 30_000;
  const [inboxLoading, setInboxLoading] = useState(false);
  const [isLobbyRefreshing, setIsLobbyRefreshing] = useState(false);
  const [threadLoadingRoomId, setThreadLoadingRoomId] = useState<string | null>(
    null,
  );

  useChatRoomRealtime({ enabled: Boolean(currentUserId) });

  const applyLobbyMerge = useCallback(
    (dbRooms: Parameters<typeof mergeChatRoomsWithDb>[1]) => {
      const prevActiveId = useHkCardVaultStore.getState().activeRoomId;
      const prevChats = useHkCardVaultStore.getState().chats;
      const prevActive = prevChats.find((room) => room.id === prevActiveId);

      setChats((currentRooms) =>
        mergeChatRoomsWithDb(currentRooms, dbRooms, {
          stripeRooms: Boolean(currentUserId),
          preferServerUnread: true,
        }),
      );

      if (prevActive) {
        const merged = useHkCardVaultStore.getState().chats;
        if (!merged.some((room) => room.id === prevActiveId)) {
          const replacement =
            findRoomByPartnerId(merged, prevActive.partnerId) ??
            findRoomByPartnerName(merged, prevActive.partnerName);
          setActiveRoomId(replacement?.id ?? "");
        }
      } else if (
        prevActiveId &&
        !useHkCardVaultStore
          .getState()
          .chats.some((room) => room.id === prevActiveId)
      ) {
        setActiveRoomId("");
      }
    },
    [currentUserId, setActiveRoomId, setChats],
  );

  const syncInboxLobby = useCallback(
    async (options?: {
      showLoading?: boolean;
      force?: boolean;
      backgroundRefresh?: boolean;
    }) => {
      const showLoading = options?.showLoading ?? false;
      const backgroundRefresh = options?.backgroundRefresh ?? false;
      const now = Date.now();

      if (
        !options?.force &&
        now - lastLobbySyncAtRef.current < LOBBY_STALE_MS
      ) {
        return;
      }

      const requestId = ++inboxRequestIdRef.current;

      if (showLoading) {
        setInboxLoading(true);
      }
      if (backgroundRefresh) {
        setIsLobbyRefreshing(true);
      }

      try {
        const result = await getUserChatInboxLobby();

        if (requestId !== inboxRequestIdRef.current) {
          return;
        }

        if (!result.success) {
          if (showLoading) {
            toast.error(result.error);
          }
          return;
        }

        applyLobbyMerge(result.data);
        lastLobbySyncAtRef.current = Date.now();
      } finally {
        if (requestId === inboxRequestIdRef.current) {
          if (showLoading) {
            setInboxLoading(false);
          }
          if (backgroundRefresh) {
            setIsLobbyRefreshing(false);
          }
        }
      }
    },
    [applyLobbyMerge],
  );

  const hydrateActiveThread = useCallback(async (roomId: string) => {
    if (!isDbChatRoomId(roomId)) {
      return;
    }

    const activeRoom = useHkCardVaultStore
      .getState()
      .chats.find((room) => room.id === roomId);

    if (!roomNeedsThreadHydration(activeRoom)) {
      return;
    }

    const requestId = ++threadRequestIdRef.current;
    setThreadLoadingRoomId(roomId);

    try {
      const result = await hydrateChatRoomThread(roomId);

      if (requestId !== threadRequestIdRef.current) {
        return;
      }

      if (!result.success) {
        toast.error(result.error);
      }
    } finally {
      if (requestId === threadRequestIdRef.current) {
        setThreadLoadingRoomId((current) =>
          current === roomId ? null : current,
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUserId || isChatOpen) {
      return;
    }

    void syncInboxLobby({ showLoading: false });
  }, [currentUserId, isChatOpen, syncInboxLobby]);

  useEffect(() => {
    if (!isChatOpen) {
      setInboxLoading(false);
      setIsLobbyRefreshing(false);
      return;
    }

    const hasCachedRooms = useHkCardVaultStore.getState().chats.length > 0;

    void syncInboxLobby({
      showLoading: !hasCachedRooms,
      backgroundRefresh: hasCachedRooms,
    });
  }, [isChatOpen, syncInboxLobby]);

  useEffect(() => {
    if (!isChatOpen || !activeRoomId) {
      return;
    }

    void hydrateActiveThread(activeRoomId);
  }, [activeRoomId, hydrateActiveThread, isChatOpen]);

  useEffect(() => {
    if (!isChatOpen || !activeRoomId || !isDbChatRoomId(activeRoomId)) {
      return;
    }

    const isViewingThread = isDesktopChat || mobileView === "CHAT";
    if (!isViewingThread) {
      return;
    }

    if (markReadTimerRef.current) {
      clearTimeout(markReadTimerRef.current);
    }

    markReadTimerRef.current = setTimeout(() => {
      const activeRoom = useHkCardVaultStore
        .getState()
        .chats.find((room) => room.id === activeRoomId);
      const lastMessageTs =
        activeRoom?.messages.at(-1)?.timestamp ?? activeRoom?.timestamp;

      void persistMarkRoomReadAsync(activeRoomId, lastMessageTs).then(
        (persisted) => {
          if (persisted) {
            void syncInboxLobby({ force: true, backgroundRefresh: true });
          }
        },
      );
    }, 300);

    return () => {
      if (markReadTimerRef.current) {
        clearTimeout(markReadTimerRef.current);
        markReadTimerRef.current = null;
      }
    };
  }, [activeRoomId, isChatOpen, isDesktopChat, mobileView, syncInboxLobby]);

  return (
    <AnimatePresence mode="wait">
      {isChatOpen ? (
        <GlobalChatConsole
          key="global-chat-console"
          inboxLoading={inboxLoading}
          isLobbyRefreshing={isLobbyRefreshing}
          threadLoadingRoomId={threadLoadingRoomId}
        />
      ) : null}
    </AnimatePresence>
  );
}
