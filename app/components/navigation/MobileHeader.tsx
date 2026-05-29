"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";
import { AnimatePresence } from "framer-motion";
import {
  GlobalChatConsole,
  ChatRoom,
} from "@/app/components/chat/GlobalChatConsole";

const INITIAL_CHATS: ChatRoom[] = [
  {
    id: "PKT-8839-44A",
    partnerName: "渡邊道館",
    partnerTier: "道館主",
    lastMessage: "✨ 平台鑑定師已確認卡角完好，稍後會上傳官方報告。",
    unreadCount: 2,
    timestamp: "14:32",
    messages: [
      {
        id: "1",
        sender: "me",
        text: "你好，請問呢張噴火龍幾時可以送到平台鑑定？",
        timestamp: "10:15",
      },
      {
        id: "2",
        sender: "system",
        text: "✈ 交易提醒：賣家已發貨，實物已抵達中介中心。",
        timestamp: "11:30",
      },
      {
        id: "3",
        sender: "them",
        text: "師兄放心，卡牌已經交咗畀平台。剛才收到通知，鑑定進行中。",
        timestamp: "14:30",
      },
    ],
  },
  {
    id: "ROOM-MOCK-002",
    partnerName: "大阪收藏家",
    partnerTier: "收藏家",
    lastMessage: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬？",
    unreadCount: 0,
    timestamp: "昨日",
    messages: [
      {
        id: "1",
        sender: "them",
        text: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬？",
        timestamp: "昨日",
      },
    ],
  },
];

export function MobileHeader() {
  const [isMounted, setIsMounted] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeRoomId, setActiveRoomId] = useState(INITIAL_CHATS[0].id);

  useEffect(() => {
    // 運用我哋啱啱學識嘅異步 Tick，完美防止 React 19 嘅 Linter 報錯
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 計算總未讀數以顯示頂欄紅點
  const totalUnread = chats.reduce((acc, curr) => acc + curr.unreadCount, 0);

  if (!isMounted) {
    return <div className="lg:hidden h-14 bg-[#1A1612]" />;
  }
  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 w-full h-14 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Menu 觸發鈕 / Logo */}
          <Link
            href="/"
            className="font-sans font-bold text-[16px] text-[#eae1da] tracking-tight"
          >
            PokéTrade <span className="text-brand">JP</span>
          </Link>
          <div className="flex items-center gap-2">
            <PWANavbarStatus />
            {/* 右側：Inbox 全域原地彈出中樞入口 */}
            <button
              type="button"
              onClick={() => setIsConsoleOpen(true)}
              className="relative p-2 text-[#d4c4b7] active:scale-95 transition-transform"
              aria-label="打開通訊中樞"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              {totalUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_6px_#10b981] border border-[#1A1612]" />
              )}
            </button>
          </div>
        </div>
      </header>
      {/* 🎭 手機原生級別雙層全屏動態彈窗 */}
      <AnimatePresence>
        {isConsoleOpen && (
          <GlobalChatConsole
            isOpen={isConsoleOpen}
            onClose={() => setIsConsoleOpen(false)}
            chats={chats}
            setChats={setChats}
            activeRoomId={activeRoomId}
            setActiveRoomId={setActiveRoomId}
          />
        )}
      </AnimatePresence>
    </>
  );
}
