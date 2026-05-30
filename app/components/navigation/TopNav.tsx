"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";
import {
  GlobalChatConsole,
  ChatRoom,
  Message,
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

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/marketplace", label: "市場" },
  { href: "/profile", label: "會員中心" },
];

export function TopNav() {
  const pathname = usePathname();
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeRoomId, setActiveRoomId] = useState(INITIAL_CHATS[0].id);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 點擊外面收起下拉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsInboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 網頁端廣播接收器同步升級（支援現場動態 Create 房間）
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
          const exists = prev.some((c) => c.id === targetRoomId);
          if (exists) {
            return prev.map((c) =>
              c.id === targetRoomId ? { ...c, unreadCount: 0 } : c,
            );
          } else {
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

        setActiveRoomId(targetRoomId);
        setIsConsoleOpen(true);
      }
    };

    window.addEventListener("open-global-chat", handleGlobalOpenChat);
    return () =>
      window.removeEventListener("open-global-chat", handleGlobalOpenChat);
  }, []);

  const totalUnread = chats.reduce((acc, curr) => acc + curr.unreadCount, 0);

  return (
    <>
      <header className="hidden lg:flex sticky top-0 z-50 w-full h-16 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
        <div className="max-w-[1200px] mx-auto w-full px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-sans font-bold text-[18px] text-[#eae1da] tracking-tight shrink-0"
          >
            PokéTrade <span className="text-brand">JP</span>
          </Link>

          {/* 導航 */}
          <nav className="flex items-center gap-1 ml-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`h-9 px-4 inline-flex items-center rounded-xl font-sans text-[13.5px] font-medium transition-colors ${
                    isActive
                      ? "text-brand bg-[#26211C]"
                      : "text-[#d4c4b7] hover:text-[#eae1da] hover:bg-[#26211C]/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 右側：狀態、收件匣、登入 */}
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <PWANavbarStatus />

            {/* 📥 收件匣下拉選單入口 */}
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setIsInboxOpen(!isInboxOpen)}
                className={`relative p-2 text-text-secondary hover:text-brand transition-colors rounded-xl hover:bg-[#26211C] active:scale-[0.95] ${
                  isInboxOpen ? "text-brand bg-[#26211C]" : ""
                }`}
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
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]" />
                )}
              </button>

              <AnimatePresence>
                {isInboxOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-[320px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col z-50 text-[#eae1da]"
                  >
                    <div className="p-3 bg-[#2e2925] border-b border-[rgba(237,232,224,0.06)] flex justify-between items-center">
                      <span className="font-sans font-bold text-[12px] uppercase tracking-wider text-text-secondary">
                        即時交易通知
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsConsoleOpen(true)}
                        className="font-sans text-[11px] text-brand hover:underline"
                      >
                        展開面板
                      </button>
                    </div>

                    <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5 scrollbar-none bg-[#17130f]">
                      {chats.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => {
                            setIsConsoleOpen(true);
                            setIsInboxOpen(false);
                            setActiveRoomId(room.id);
                            setChats((prev) =>
                              prev.map((c) =>
                                c.id === room.id ? { ...c, unreadCount: 0 } : c,
                              ),
                            );
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-[#26211C] transition-all flex items-start gap-2.5 group border border-transparent"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#2e2925] border border-brand/20 flex items-center justify-center font-bold text-brand shrink-0 text-[12px]">
                            {room.partnerName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-sans font-semibold text-[12.5px] group-hover:text-brand transition-colors text-text-primary">
                                {room.partnerName}
                              </span>
                              <span className="font-mono text-[9px] text-text-disabled">
                                {room.timestamp}
                              </span>
                            </div>
                            <p className="font-sans text-[11.5px] text-text-secondary truncate mt-0.5">
                              {room.lastMessage}
                            </p>
                          </div>
                          {room.unreadCount > 0 && (
                            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full shrink-0 mt-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 登入 / 註冊按鈕 */}
            <Link
              href="/auth"
              className="h-9 px-4 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-lg hover:bg-brand-hover inline-flex items-center justify-center"
            >
              登入 / 註冊
            </Link>
          </div>
        </div>

        {/* 🔮 鋼鐵核心：Web View 右下角全域懸浮對話站 (Bloomberg Terminal Style Floating Console) */}
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
      </header>
    </>
  );
}
