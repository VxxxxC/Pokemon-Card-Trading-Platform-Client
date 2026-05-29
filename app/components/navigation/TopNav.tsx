"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";

// 擴充 Mock 數據：對齊手機端，完美並列多個交易通知
const NOTIFY_CHATS = [
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
  const [isInboxOpen, setIsInboxOpen] = useState(false); // 控制頂部下拉清單
  const popoverRef = useRef<HTMLDivElement>(null);

  // 🟢 Web View 原地對話站狀態控制 (拒絕跳轉)
  const [isConsoleOpen, setIsConsoleOpen] = useState(false); // 右下角懸浮視窗開關
  const [chats, setChats] = useState(NOTIFY_CHATS);
  const [activeRoomId, setActiveRoomId] = useState<string>(NOTIFY_CHATS[0].id);
  const [inputText, setInputText] = useState("");

  const activeRoom = chats.find((r) => r.id === activeRoomId) || chats[0];

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

  // 點擊下拉通知，直接打開右下角對講機，不轉頁！
  const handleSelectChatFromInbox = (roomId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === roomId ? { ...c, unreadCount: 0 } : c)),
    );
    setActiveRoomId(roomId);
    setIsInboxOpen(false); // 收起下拉
    setIsConsoleOpen(true); // 撐開右下角對話站
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "me" as const,
      text: inputText,
      timestamp: "14:45",
    };

    setChats((prev) =>
      prev.map((r) =>
        r.id === activeRoomId
          ? { ...r, lastMessage: inputText, messages: [...r.messages, newMsg] }
          : r,
      ),
    );
    setInputText("");
  };

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
                className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  isInboxOpen
                    ? "bg-[#26211C] border-brand text-brand"
                    : "bg-[#1A1612] border-[rgba(237,232,224,0.12)] text-[#d4c4b7] hover:border-brand/40"
                }`}
                aria-label="通訊匣"
              >
                <svg
                  width="18"
                  height="18"
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_6px_#10b981]" />
                )}
              </button>

              {/* 下拉浮窗 */}
              <AnimatePresence>
                {isInboxOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden z-50"
                  >
                    <div className="p-3.5 bg-[#2e2925] border-b border-[rgba(237,232,224,0.06)] flex justify-between items-center">
                      <span className="font-sans font-bold text-[12.5px] text-text-primary">
                        即時通訊通知
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsConsoleOpen(true)}
                        className="font-sans text-[11px] text-brand hover:underline"
                      >
                        展開面板
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(237,232,224,0.04)] scrollbar-none">
                      {chats.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => handleSelectChatFromInbox(room.id)} // 🟢 撳佢直接原地切換，絕不轉頁！
                          className="w-full p-3 text-left hover:bg-[#2e2925]/50 flex items-start gap-3 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center font-bold text-brand text-[12px] shrink-0">
                            {room.partnerName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-sans font-medium text-[12px] text-text-primary group-hover:text-brand transition-colors">
                                {room.partnerName}
                              </span>
                              <span className="font-mono text-[9px] text-text-disabled">
                                {room.timestamp}
                              </span>
                            </div>
                            <p className="font-sans text-[11px] text-text-secondary truncate mt-0.5">
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

            <Link
              href="/auth"
              className="h-9 px-4 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-lg hover:bg-brand-hover inline-flex items-center justify-center"
            >
              登入 / 註冊
            </Link>
          </div>
        </div>
      </header>
      {/* 🔮 鋼鐵核心：Web View 右下角全域懸浮對話站 (Bloomberg Terminal Style Floating Console) */}
      <AnimatePresence>
        {isConsoleOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            className="hidden lg:flex fixed bottom-6 right-6 z-[200] w-[640px] h-[460px] bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* 左半：商戶選擇清單欄 (200px) */}
            <div className="w-[200px] border-r border-[rgba(237,232,224,0.06)] bg-[#1A1612] flex flex-col">
              <div className="p-3 border-b border-[rgba(237,232,224,0.06)] shrink-0">
                <span className="font-mono text-[9px] text-brand tracking-widest uppercase font-bold">
                  Trading Station
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-none">
                {chats.map((room) => {
                  const isActive = room.id === activeRoomId;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setActiveRoomId(room.id)}
                      className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-all ${
                        isActive
                          ? "bg-[#26211C] border border-[rgba(237,232,224,0.08)] shadow-md"
                          : "hover:bg-[#26211C]/40 border border-transparent"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center text-[11px] font-bold text-brand shrink-0">
                        {room.partnerName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-sans font-medium text-[12px] text-text-primary truncate">
                          {room.partnerName}
                        </div>
                        <div className="font-mono text-[9px] text-text-disabled truncate">
                          {room.id.slice(0, 8)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 右半：核心對話視窗 (440px) */}
            <div className="flex-1 flex flex-col bg-[#17130f]">
              {/* 對講機頂欄 */}
              <div className="h-12 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="font-sans font-bold text-[13px] text-text-primary">
                    {activeRoom.partnerName}
                  </span>
                </div>
                {/* 關閉按鈕 */}
                <button
                  type="button"
                  onClick={() => setIsConsoleOpen(false)}
                  className="w-6 h-6 rounded-md bg-[#1A1612] hover:bg-[#39342f] text-text-secondary hover:text-[#eae1da] flex items-center justify-center font-sans text-[11px] transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 訊息氣泡滾動區 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#17130f] scrollbar-none flex flex-col">
                {activeRoom.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[75%]">
                      <div
                        className={`px-3 py-1.5 rounded-xl font-sans text-[12.5px] inline-block shadow-sm leading-snug ${
                          msg.sender === "me"
                            ? "bg-brand text-[#17130f] rounded-tr-none font-medium"
                            : "bg-[#26211C] text-text-primary rounded-tl-none border border-[rgba(237,232,224,0.04)]"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="block font-mono text-[8px] text-text-disabled text-right px-1 mt-0.5">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 底部發送輸入框 */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`回覆給 ${activeRoom.partnerName}...`}
                  className="flex-1 h-9 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-lg px-3 text-[12px] text-text-primary focus:outline-none focus:border-brand/40"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="h-9 px-4 bg-brand text-[#17130f] disabled:opacity-40 font-sans font-bold text-[12px] rounded-lg transition-colors shrink-0"
                >
                  發送 ⚡
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
