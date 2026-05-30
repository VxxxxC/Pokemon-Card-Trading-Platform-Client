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

  // 新增狀態：用來受控控制 GlobalChatConsole 的初始視圖
  const [mobileView, setMobileView] = useState<"LIST" | "CHAT">("LIST");

  useEffect(() => {
    // 完美防止 React 19 嘅 Linter 報錯
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 廣播接收監聽器
  useEffect(() => {
    const handleGlobalOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        roomId: string;
        partnerName?: string;
      }>;
      if (customEvent.detail?.roomId) {
        const targetRoomId = customEvent.detail.roomId;
        const targetName = customEvent.detail.partnerName || "未知名商戶";

        setChats((prev) => {
          // 1. 檢查這個商戶 Session 是否已經存在於清單中
          const exists = prev.some((c) => c.id === targetRoomId);
          if (exists) {
            return prev.map((c) =>
              c.id === targetRoomId ? { ...c, unreadCount: 0 } : c,
            );
          } else {
            // 2. 🚀 核心優化：如果不存在，立刻現場動態 Create 一個全新 Session 塞到清單最頂端！
            const newSession = {
              id: targetRoomId,
              partnerName: targetName,
              partnerTier: "認證賣家",
              lastMessage: "已開啟即時議價對話",
              unreadCount: 0,
              timestamp: "剛剛",
              messages: [
                {
                  id: "sys-" + Date.now(),
                  sender: "system" as const,
                  text: `🔒 平台已成功為您建立與 ${targetName} 的安全中介託管議價通道。`,
                  timestamp: "剛剛",
                },
              ],
            };
            return [newSession, ...prev];
          }
        });

        // 3. 全自動鎖定目標房間
        setActiveRoomId(targetRoomId);
        // 4. 核心優化：直接跳過清單層，直穿進入聊天視窗！
        setMobileView("CHAT");
        // 5. 拉開面板
        setIsConsoleOpen(true);
      }
    };

    window.addEventListener("open-global-chat", handleGlobalOpenChat);
    return () =>
      window.removeEventListener("open-global-chat", handleGlobalOpenChat);
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
              onClick={() => {
                setMobileView("LIST");
                setIsConsoleOpen(true);
              }}
              className="relative p-2 text-[#d4c4b7]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              {totalUnread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10b981] rounded-full" />
              )}
            </button>
          </div>
        </div>

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
              initialMobileView={mobileView} // 🟢 傳入狀態控制
            />
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
