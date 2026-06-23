"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { GlobalChatConsole } from "@/app/components/chat/GlobalChatConsole";
// 🟢 接入 Zustand 全域控制中樞
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";

export function MobileHeader() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 🟢 從 Zustand 引流狀態
  const { chats, isChatOpen, setIsChatOpen, setMobileView, activateRoomById } =
    useHkCardVaultStore();

  // 廣播接收監聽器 ➔ 自動同步至狀態大腦
  useEffect(() => {
    const handleGlobalOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        roomId: string;
        partnerName?: string;
      }>;
      if (customEvent.detail?.roomId) {
        activateRoomById(
          customEvent.detail.roomId,
          customEvent.detail.partnerName || "\u672a\u77e5\u540d\u5546\u6236",
        );
        setMobileView("CHAT");
      }
    };

    window.addEventListener("open-global-chat", handleGlobalOpenChat);
    return () =>
      window.removeEventListener("open-global-chat", handleGlobalOpenChat);
  }, [activateRoomById, setMobileView]);

  const totalUnread = chats.reduce((acc, curr) => acc + curr.unreadCount, 0);

  if (!isMounted) {
    return <div className="lg:hidden h-14 bg-[#1A1612]" />;
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 w-full h-14 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
        <div className="h-full px-4 flex items-center justify-between">
          <Link href="/" className="font-sans font-semibold text-lg text-brand">
            HKCardVault
          </Link>

          <div className="flex items-center gap-2">
            {/* 右側：Inbox 入口 */}
            <button
              type="button"
              onClick={() => {
                setMobileView("LIST");
                setIsChatOpen(true);
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
        <AnimatePresence>{isChatOpen && <GlobalChatConsole />}</AnimatePresence>
      </header>
    </>
  );
}
