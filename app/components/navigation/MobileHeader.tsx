"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";
import { motion, AnimatePresence } from "framer-motion";

// 擴充 Mock 數據：同時模擬多個即時訊息通知
const MOCK_CHATS = [
  {
    id: "ORD-20260527-001",
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
    id: "ORD-20260529-042",
    partnerName: "大阪收藏家",
    partnerTier: "收藏家",
    lastMessage: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬？",
    unreadCount: 1,
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
  {
    id: "ORD-20260530-099",
    partnerName: "木戶卡牌旗艦店",
    partnerTier: "道館主",
    lastMessage: "買家已確認收貨，資金將於 24 小時內解凍至您的賬戶。",
    unreadCount: 0,
    timestamp: "2天前",
    messages: [
      {
        id: "1",
        sender: "system",
        text: "買家已確認收貨，資金將於 24 小時內解凍至您的賬戶。",
        timestamp: "2天前",
      },
    ],
  },
];

export function MobileHeader() {
  const [isMounted, setIsMounted] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false); // 🟢 控制手機 Pop-up 開關
  const [chats, setChats] = useState(MOCK_CHATS);
  // 🟢 雙層核心狀態控制：
  // currentView 可以係 'LIST' (通知清單) 或者 'CHAT' (對話視窗)
  const [currentView, setCurrentView] = useState<"LIST" | "CHAT">("LIST");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const activeRoom = chats.find((r) => r.id === activeRoomId) || chats[0];

  useEffect(() => {
    // 運用我哋啱啱學識嘅異步 Tick，完美防止 React 19 嘅 Linter 報錯
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "me" as const,
      text: inputText,
      timestamp: "14:36",
    };

    setChats((prev) =>
      prev.map((room) =>
        room.id === activeRoomId
          ? {
              ...room,
              lastMessage: inputText,
              messages: [...room.messages, newMsg],
            }
          : room,
      ),
    );
    setInputText("");
  };

  // 點擊清單項目：清除該房未讀數、設定目標房間、滑動切換去對話視窗
  const handleOpenChat = (roomId: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === roomId ? { ...c, unreadCount: 0 } : c)),
    );
    setActiveRoomId(roomId);
    setCurrentView("CHAT");
  };

  // 計算總未讀數以顯示頂欄紅點
  const totalUnread = chats.reduce((acc, curr) => acc + curr.unreadCount, 0);

  if (!isMounted) {
    return <div className="lg:hidden h-14 bg-[#1A1612]" />;
  }
  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 w-full h-14 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
        <div className="h-full px-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-sans font-bold text-[16px] text-[#eae1da] tracking-tight"
          >
            PokéTrade <span className="text-brand">JP</span>
          </Link>
          <div className="flex items-center gap-2">
            <PWANavbarStatus />
            {/* 點擊後預設進入通知列表層 */}
            <button
              type="button"
              onClick={() => {
                setCurrentView("LIST");
                setIsInboxOpen(true);
              }}
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
        {isInboxOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[150] lg:hidden bg-[#17130f] flex flex-col"
          >
            {/* ── 視圖 A：同時顯示多個訊息通知清單 (LIST VIEW) ── */}
            {currentView === "LIST" && (
              <div className="flex flex-col h-full">
                <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
                  <div>
                    <h3 className="font-sans font-bold text-[14px] text-text-primary">
                      即時交易通知中心
                    </h3>
                    <p className="font-mono text-[9px] text-brand mt-0.5">
                      REAL-TIME ESCROW CHATS
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInboxOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary"
                  >
                    ✕
                  </button>
                </div>

                {/* 🔔 通知並列清單區塊 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#17130f] scrollbar-none">
                  {chats.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleOpenChat(room.id)} // 🟢 點擊直穿對話視窗
                      className="w-full text-left p-3.5 rounded-2xl bg-[#26211C] border border-[rgba(237,232,224,0.04)] active:scale-[0.98] transition-all flex items-start gap-3.5 relative group"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center font-bold text-brand shrink-0 text-[13px]">
                        {room.partnerName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-sans font-semibold text-[13px] text-text-primary group-hover:text-brand transition-colors">
                            {room.partnerName}
                          </span>
                          <span className="font-mono text-[9px] text-text-disabled">
                            {room.timestamp}
                          </span>
                        </div>
                        <p className="font-sans text-[12px] text-text-secondary truncate mt-1 leading-tight">
                          {room.lastMessage}
                        </p>
                      </div>

                      {/* 單個房間未讀綠點 */}
                      {room.unreadCount > 0 && (
                        <span className="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_6px_#10b981] shrink-0 mt-2.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 視圖 B：點擊切入後嘅專屬對話視窗 (CHAT VIEW) ── */}
            {currentView === "CHAT" && activeRoomId && (
              <div className="flex flex-col h-full animate-fadeIn">
                <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* 🟢 頂部返回按鈕：點擊返回上一層通知清單 */}
                    <button
                      type="button"
                      onClick={() => setCurrentView("LIST")}
                      className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand active:scale-90 transition-transform flex items-center"
                    >
                      ← 返回清單
                    </button>
                    <div className="h-4 w-px bg-[rgba(237,232,224,0.15)] mx-0.5" />
                    <h3 className="font-sans font-bold text-[13.5px] text-text-primary truncate max-w-[130px]">
                      {activeRoom.partnerName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInboxOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary"
                  >
                    ✕
                  </button>
                </div>

                {/* 訊息聊天歷史 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#17130f] scrollbar-none">
                  {activeRoom.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%] space-y-0.5">
                        <div
                          className={`px-4 py-2 rounded-2xl font-sans text-[13px] inline-block shadow-md ${
                            msg.sender === "me"
                              ? "bg-brand text-[#17130f] rounded-tr-none font-medium"
                              : "bg-[#26211C] text-text-primary rounded-tl-none border border-[rgba(237,232,224,0.04)]"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="block font-mono text-[9px] text-text-disabled text-right px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部輸入欄 */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`回覆 ${activeRoom.partnerName}...`}
                    className="flex-1 h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-text-primary focus:outline-none focus:border-brand/40"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="h-11 px-5 bg-brand text-[#17130f] disabled:opacity-40 font-sans font-bold text-[13px] rounded-xl shrink-0"
                  >
                    發送
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
