"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";
import { GlobalChatConsole } from "@/app/components/chat/GlobalChatConsole";
// 🟢 從全域中央大腦引入狀態
import { useTradeStore } from "@/app/store/useTradeStore";
import { useUIStore } from "@/app/store/useUIStore";

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/marketplace", label: "市場" },
  { href: "/profile", label: "會員中心" },
];

export function TopNav() {
  const pathname = usePathname();
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const openAddAssetModal = useUIStore((state) => state.openAddAssetModal);
  // 🟢 注入全域 mockRole 身份真理源
  const mockRole = useUIStore((state) => state.mockRole);

  const isGuest = mockRole === "GUEST";

  // 從 Zustand 接入受控雷達狀態
  const { chats, isChatOpen, setIsChatOpen, setActiveRoomId, openGlobalChat } =
    useTradeStore();

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

  // 網頁端廣播接收器同步升級 ➔ 轉化為 Zustand Action
  useEffect(() => {
    const handleGlobalOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        roomId: string;
        partnerName?: string;
      }>;
      if (customEvent.detail?.roomId) {
        openGlobalChat(
          customEvent.detail.roomId,
          customEvent.detail.partnerName || "未知名商戶",
        );
      }
    };

    window.addEventListener("open-global-chat", handleGlobalOpenChat);
    return () =>
      window.removeEventListener("open-global-chat", handleGlobalOpenChat);
  }, [openGlobalChat]);

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
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href ||
                    pathname.startsWith(link.href + "/");

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
                className={`relative p-2 text-text-secondary hover:text-brand transition-colors rounded-xl hover:bg-[#26211C] active:scale-[0.95] ${isInboxOpen ? "text-brand bg-[#26211C]" : ""}`}
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
                        onClick={() => setIsChatOpen(true)}
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
                            setIsChatOpen(true);
                            setIsInboxOpen(false);
                            setActiveRoomId(room.id);
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

            {/* 🟢 權限動態控制分流區 */}
            {!isGuest ? (
              /* 情況 A: 已登入 ➔ 顯示快捷新增商品上架 [+] 掣 */
              <button
                type="button"
                onClick={() => openAddAssetModal("merch")}
                className="flex-row h-9 w-28 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] rounded-xl flex items-center justify-center shadow-md active:scale-[0.95] transition-all cursor-pointer focus:outline-none group animate-fadeIn"
                title="新增商品"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="group-hover:rotate-90 transition-transform duration-200"
                >
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                </svg>
                <span className="text-sm font-medium text-[#17130f] p-2">
                  新增商品
                </span>
              </button>
            ) : (
              /* 情況 B: 未登入 ➔ 顯示高冷 [登入 / 註冊] 按鈕 */
              <Link
                href="/auth"
                className="h-9 px-4 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-lg hover:bg-brand-hover inline-flex items-center justify-center active:scale-[0.97] transition-all animate-fadeIn"
              >
                登入 / 註冊
              </Link>
            )}
          </div>
        </div>

        {/* 頂級改良：免傳遞參數，自動實時追隨 Zustand 雷達 */}
        <AnimatePresence>{isChatOpen && <GlobalChatConsole />}</AnimatePresence>
      </header>
    </>
  );
}
