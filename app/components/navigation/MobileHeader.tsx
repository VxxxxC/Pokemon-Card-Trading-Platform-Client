"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { Megaphone } from "lucide-react";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import { useUIStore } from "@/app/store/useUIStore";
import { isChatRoomId } from "@/app/lib/chat/constants";
import { ChatUnreadDot } from "@/app/components/chat/ChatUnreadDot";
import { filterChatRoomsForViewerPersona } from "@/app/lib/chat/filter-rooms-for-viewer-persona";
import {
  MOCK_ANNOUNCEMENTS,
  getActiveAnnouncements,
} from "@/app/lib/mockAnnouncements";

export function MobileHeader() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // 🟢 從 Zustand 引流狀態
  const {
    chats,
    setIsChatOpen,
    setMobileView,
    activateRoomById,
    openChatWithPartner,
  } = useHkCardVaultStore();

  // 廣播接收監聽器 ➔ 自動同步至狀態大腦
  useEffect(() => {
    const handleGlobalOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        partnerId?: string;
        partnerName?: string;
        partnerPersona?: "member" | "merchant";
        roomId?: string;
      }>;
      const detail = customEvent.detail;
      if (detail?.partnerId) {
        openChatWithPartner(
          detail.partnerId,
          detail.partnerName || "\u672a\u77e5\u540d\u5546\u6236",
          detail.partnerPersona ?? "member",
        );
        setMobileView("CHAT");
        return;
      }
      if (detail?.roomId) {
        activateRoomById(
          detail.roomId,
          detail.partnerName || "\u672a\u77e5\u540d\u5546\u6236",
        );
        setMobileView("CHAT");
      }
    };

    window.addEventListener("open-global-chat", handleGlobalOpenChat);
    return () =>
      window.removeEventListener("open-global-chat", handleGlobalOpenChat);
  }, [activateRoomById, openChatWithPartner, setMobileView]);

  const userAuthRole = useUIStore((state) => state.userAuthRole);
  const activeListingPersona = useUIStore((state) => state.activeListingPersona);
  const isGuest = userAuthRole === "GUEST";

  const personaChats = filterChatRoomsForViewerPersona(
    chats,
    activeListingPersona,
  );

  const totalUnread = isGuest
    ? 0
    : personaChats
        .filter((room) => !isChatRoomId(room.id))
        .reduce((acc, curr) => acc + curr.unreadCount, 0);

  if (!isMounted) {
    return <div className="lg:hidden h-14 bg-[#1A1612]" />;
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 w-full h-14 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
        <div className="h-full px-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex flex-row items-center font-sans font-semibold text-lg text-brand"
          >
            <div className="max-w-20 mr-3">
              <Image
                src="/asset/logo.png"
                alt="logo"
                height={50}
                width={50}
                className="rounded-xl"
              />
            </div>
            <p>HKCardVault</p>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* 📢 官方公告按鈕 */}
            <Link
              href="/announcements"
              title="官方公告"
              className="relative p-2 text-[#d4c4b7] hover:text-brand transition-colors rounded-xl active:scale-[0.95]"
            >
              <Megaphone className="h-5 w-5" />
              {getActiveAnnouncements(MOCK_ANNOUNCEMENTS).length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                </span>
              )}
            </Link>

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
              {totalUnread > 0 && <ChatUnreadDot />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
