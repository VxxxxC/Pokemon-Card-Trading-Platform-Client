"use client";

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
import { useChatRoomRealtime } from "@/app/lib/hooks/useChatRoomRealtime";
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { GlobalChatConsole } from "@/app/components/chat/GlobalChatConsole";

export function GlobalChatOverlay() {
  const isChatOpen = useHkCardVaultStore((state) => state.isChatOpen);
  const activeRoomId = useHkCardVaultStore((state) => state.activeRoomId);
  const setChats = useHkCardVaultStore((state) => state.setChats);
  const setActiveRoomId = useHkCardVaultStore((state) => state.setActiveRoomId);
  const currentUserId = useCurrentUserId();
  const inboxRequestIdRef = useRef(0);
  const threadRequestIdRef = useRef(0);
  const lastLobbySyncAtRef = useRef(0);
  const LOBBY_STALE_MS = 30_000;
  const [inboxLoading, setInboxLoading] = useState(false);
  const [threadLoadingRoomId, setThreadLoadingRoomId] = useState<string | null>(
    null,
  );

  useChatRoomRealtime({ enabled: isChatOpen });

  const applyLobbyMerge = useCallback(
    (dbRooms: Parameters<typeof mergeChatRoomsWithDb>[1]) => {
      const prevActiveId = useHkCardVaultStore.getState().activeRoomId;
      const prevChats = useHkCardVaultStore.getState().chats;
      const prevActive = prevChats.find((room) => room.id === prevActiveId);

      setChats((currentRooms) =>
        mergeChatRoomsWithDb(currentRooms, dbRooms, {
          stripMockRooms: Boolean(currentUserId),
        }),
      );

      if (prevActive) {
        const merged = useHkCardVaultStore.getState().chats;
        if (!merged.some((room) => room.id === prevActiveId)) {
          const replacement =
            findRoomByPartnerId(merged, prevActive.partnerId) ??
            findRoomByPartnerName(merged, prevActive.partnerName);
          if (replacement) {
            setActiveRoomId(replacement.id);
          }
        }
      }
    },
    [currentUserId, setActiveRoomId, setChats],
  );

  const syncInboxLobby = useCallback(
    async (options?: { showLoading?: boolean; force?: boolean }) => {
      const showLoading = options?.showLoading ?? isChatOpen;
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
        if (requestId === inboxRequestIdRef.current && showLoading) {
          setInboxLoading(false);
        }
      }
    },
    [applyLobbyMerge, isChatOpen],
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
      return;
    }

    void syncInboxLobby({ showLoading: true, force: true });
  }, [isChatOpen, syncInboxLobby]);

  useEffect(() => {
    if (!isChatOpen || !activeRoomId) {
      return;
    }

    void hydrateActiveThread(activeRoomId);
  }, [activeRoomId, hydrateActiveThread, isChatOpen]);

  return (
    <AnimatePresence mode="wait">
      {isChatOpen ? (
        <GlobalChatConsole
          key="global-chat-console"
          inboxLoading={inboxLoading}
          threadLoadingRoomId={threadLoadingRoomId}
        />
      ) : null}
    </AnimatePresence>
  );
}
