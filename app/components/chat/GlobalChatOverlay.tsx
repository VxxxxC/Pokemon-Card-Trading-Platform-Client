"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getUserChatInbox } from "@/app/actions/chat";
import { mergeChatRoomsWithDb } from "@/app/lib/chat/mergeChatRooms";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { GlobalChatConsole } from "@/app/components/chat/GlobalChatConsole";

export function GlobalChatOverlay() {
  const isChatOpen = useHkCardVaultStore((state) => state.isChatOpen);
  const setChats = useHkCardVaultStore((state) => state.setChats);
  const inboxRequestIdRef = useRef(0);

  const syncInboxFromDb = useCallback(async () => {
    const requestId = ++inboxRequestIdRef.current;
    const result = await getUserChatInbox();

    if (requestId !== inboxRequestIdRef.current) {
      return;
    }

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setChats((currentRooms) => mergeChatRoomsWithDb(currentRooms, result.data));
  }, [setChats]);

  useEffect(() => {
    if (!isChatOpen) {
      return;
    }

    void syncInboxFromDb();
  }, [isChatOpen, syncInboxFromDb]);

  return (
    <AnimatePresence mode="wait">
      {isChatOpen ? <GlobalChatConsole key="global-chat-console" /> : null}
    </AnimatePresence>
  );
}
