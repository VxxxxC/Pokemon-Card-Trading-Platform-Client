"use client";

import React, { createContext, useContext, useState } from "react";

type SlideMode = "list" | "chat";

interface ChatContextType {
  isOpen: boolean;
  mode: SlideMode;
  activeRoomId: string | null;
  openInbox: () => void;
  openDirectChat: (roomId: string) => void;
  closeChat: () => void;
  setSlideMode: (mode: SlideMode) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SlideMode>("list");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // 點擊導航列訊息圖標：直接開全域 Inbox 列表
  const openInbox = () => {
    setMode("list");
    setIsOpen(true);
  };

  // 點擊「聯絡賣家」：直接開特定商家嘅對話視窗
  const openDirectChat = (roomId: string) => {
    setActiveRoomId(roomId);
    setMode("chat");
    setIsOpen(true);
  };

  const closeChat = () => setIsOpen(false);
  const setSlideMode = (newMode: SlideMode) => setMode(newMode);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        mode,
        activeRoomId,
        openInbox,
        openDirectChat,
        closeChat,
        setSlideMode,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// 供全平台任何組件（TopNav, ProductCard, OrderDetail）一鍵呼叫嘅 Hook
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
