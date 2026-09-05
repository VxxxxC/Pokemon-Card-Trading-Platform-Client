"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ensureChatRoom, getUserChatInboxLobby } from "@/app/actions/chat";
import { readChatLocalCache } from "@/app/lib/chat/chatLocalCache";
import { hydrateChatRoomThread } from "@/app/lib/chat/hydrateChatRoomThread";
import {
  isDbChatRoomId,
  isEphemeralChatRoomId,
} from "@/app/lib/chat/constants";
import { isProfileUuid } from "@/app/lib/chat/partnerRoomKey";
import {
  findRoomByPartnerId,
  findRoomByPartnerName,
  mergeChatRoomsWithDb,
} from "@/app/lib/chat/mergeChatRooms";
import { persistMarkRoomReadAsync } from "@/app/lib/chat/persistMarkRoomRead";
import { roomMatchesViewerPersona } from "@/app/lib/chat/filter-rooms-for-viewer-persona";
import { roomHasPersistedThreadTail } from "@/app/lib/chat/roomHydration";
import { useChatLocalCachePersistence } from "@/app/lib/hooks/useChatLocalCachePersistence";
import { useChatRoomRealtime } from "@/app/lib/hooks/useChatRoomRealtime";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";
import { useIsDesktopChat } from "@/app/lib/hooks/useIsDesktopChat";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { useUIStore } from "@/app/store/useUIStore";
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
  const setMobileView = useHkCardVaultStore((state) => state.setMobileView);
  const promotePendingChatRoom = useHkCardVaultStore(
    (state) => state.promotePendingChatRoom,
  );
  const chats = useHkCardVaultStore((state) => state.chats);
  const activeListingPersona = useUIStore((state) => state.activeListingPersona);
  const currentUserId = useCurrentUserId();
  const isDesktopChat = useIsDesktopChat();
  const inboxRequestIdRef = useRef(0);
  const threadRequestIdRef = useRef(0);
  const lastLobbySyncAtRef = useRef(0);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRestoreKeyRef = useRef<string | null>(null);
  const LOBBY_STALE_MS = 30_000;
  const [inboxLoading, setInboxLoading] = useState(false);
  const [isLobbyRefreshing, setIsLobbyRefreshing] = useState(false);
  const [threadLoadingRoomId, setThreadLoadingRoomId] = useState<string | null>(
    null,
  );
  const [provisioningRoomId, setProvisioningRoomId] = useState<string | null>(
    null,
  );
  const provisionAttemptedRef = useRef<Set<string>>(new Set());

  useChatRoomRealtime({ enabled: Boolean(currentUserId) });
  useChatLocalCachePersistence(currentUserId, activeListingPersona);

  useEffect(() => {
    if (!currentUserId) {
      cacheRestoreKeyRef.current = null;
      return;
    }

    const restoreKey = `${currentUserId}:${activeListingPersona}`;
    if (cacheRestoreKeyRef.current === restoreKey) {
      return;
    }
    cacheRestoreKeyRef.current = restoreKey;

    const cached = readChatLocalCache(currentUserId, activeListingPersona);
    if (cached && cached.length > 0) {
      setChats(cached);
    }
  }, [activeListingPersona, currentUserId, setChats]);

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
            findRoomByPartnerId(
              merged,
              prevActive.partnerId,
              prevActive.partnerPersona,
            ) ??
            findRoomByPartnerName(
              merged,
              prevActive.partnerName,
              prevActive.partnerPersona,
            );
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

    const hasCachedThread = roomHasPersistedThreadTail(activeRoom);
    const requestId = ++threadRequestIdRef.current;

    if (!hasCachedThread) {
      setThreadLoadingRoomId(roomId);
    }

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
    const { activeRoomId, chats, isChatOpen: chatOpen } =
      useHkCardVaultStore.getState();
    if (!activeRoomId) {
      return;
    }

    const activeRoom = chats.find((room) => room.id === activeRoomId);
    if (
      activeRoom &&
      !roomMatchesViewerPersona(activeRoom, activeListingPersona)
    ) {
      setActiveRoomId("");
      setMobileView("LIST");
      return;
    }

    if (chatOpen) {
      void syncInboxLobby({ force: true, backgroundRefresh: true });
    }
  }, [
    activeListingPersona,
    setActiveRoomId,
    setMobileView,
    syncInboxLobby,
  ]);

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
    if (!isChatOpen || !activeRoomId || isDbChatRoomId(activeRoomId)) {
      if (!isChatOpen) {
        setProvisioningRoomId(null);
      }
      return;
    }

    if (!currentUserId) {
      if (!provisionAttemptedRef.current.has(activeRoomId)) {
        provisionAttemptedRef.current.add(activeRoomId);
        toast.error("請先登入後再開啟對話");
      }
      return;
    }

    const activeRoom = chats.find((room) => room.id === activeRoomId);
    if (!activeRoom || !isEphemeralChatRoomId(activeRoomId)) {
      return;
    }

    if (!isProfileUuid(activeRoom.partnerId)) {
      if (!provisionAttemptedRef.current.has(activeRoomId)) {
        provisionAttemptedRef.current.add(activeRoomId);
        toast.error("請輸入有效用戶 ID 開啟對話");
      }
      return;
    }

    if (provisionAttemptedRef.current.has(activeRoomId)) {
      return;
    }

    provisionAttemptedRef.current.add(activeRoomId);
    setProvisioningRoomId(activeRoomId);

    void ensureChatRoom({
      partnerId: activeRoom.partnerId,
      partnerPersona: activeRoom.partnerPersona,
      viewerPersona: activeListingPersona,
    })
      .then((result) => {
        if (!result.success) {
          toast.error(result.error);
          provisionAttemptedRef.current.delete(activeRoomId);
          return;
        }

        promotePendingChatRoom(activeRoomId, result.data);
        void hydrateActiveThread(result.data.id);
      })
      .finally(() => {
        setProvisioningRoomId((current) =>
          current === activeRoomId ? null : current,
        );
      });
  }, [
    activeListingPersona,
    activeRoomId,
    chats,
    currentUserId,
    hydrateActiveThread,
    isChatOpen,
    promotePendingChatRoom,
  ]);

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
          isProvisioningRoom={provisioningRoomId === activeRoomId}
        />
      ) : null}
    </AnimatePresence>
  );
}
