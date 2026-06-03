"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChatDrawerSkeleton } from "@/app/components/shared/StreamingSkeletons";

export interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  partnerName: string;
  partnerTier: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  messages: Message[];
}

export interface GlobalChatConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatRoom[];
  setChats: React.Dispatch<React.SetStateAction<ChatRoom[]>>;
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  initialMobileView?: "LIST" | "CHAT"; // 允許外部決定手機版初始視圖
  isLoading?: boolean;
}

export function GlobalChatConsole({
  isOpen,
  onClose,
  chats,
  setChats,
  activeRoomId,
  setActiveRoomId,
  initialMobileView = "LIST", //  預設為 LIST
  isLoading = false,
}: GlobalChatConsoleProps) {
  const [currentMobileView, setCurrentMobileView] = useState<"LIST" | "CHAT">(
    "LIST",
  );
  const [inputText, setInputText] = useState("");

  //  核心優化：建立 Desktop 視窗的專屬 Ref
  const desktopConsoleRef = useRef<HTMLDivElement>(null);

  // 當彈窗被打開時，即時對齊外部傳進來的視圖命令（完美直穿對話視窗）
  useEffect(() => {
    if (isOpen) {
      // 🟢 修正：利用 setTimeout 將狀態更新順延到下一個 Event Loop Tick
      // 繞過 React 19 對於「Synchronous setState within Effect」
      const timer = setTimeout(() => {
        setCurrentMobileView(initialMobileView);
      }, 0);

      return () => clearTimeout(timer); // 記得清理計時器，拒絕內存洩漏
    }
  }, [isOpen, initialMobileView]);

  // 🟢 核心優化：監聽 Mouse / Touch 點擊視窗外部事件
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      // 只有喺電腦版（螢幕寬度 >= 1024px）且點擊範圍喺懸浮窗外面時，才觸發關閉
      // 手機版因為係鋪滿全屏（Inset-0），所以不需要點擊外部關閉
      if (
        window.innerWidth >= 1024 &&
        desktopConsoleRef.current &&
        !desktopConsoleRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside); // 兼顧平板與手機觸控
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const activeRoom = chats.find((r) => r.id === activeRoomId) || chats[0];

  if (isLoading || chats.length === 0 || !activeRoom) {
    return (
      <>
        <motion.div
          ref={desktopConsoleRef}
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          className="hidden lg:flex fixed bottom-6 right-6 z-[200] w-[640px] h-[460px] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          <ChatDrawerSkeleton />
        </motion.div>

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="lg:hidden fixed inset-0 z-[150]"
        >
          <ChatDrawerSkeleton />
        </motion.div>
      </>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: inputText,
      timestamp: "14:50",
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

  const handleSelectRoomMobile = (roomId: string) => {
    setActiveRoomId(roomId);
    setChats((prev) =>
      prev.map((c) => (c.id === roomId ? { ...c, unreadCount: 0 } : c)),
    );
    setCurrentMobileView("CHAT");
  };

  return (
    <>
      {/* 💻 1. 電腦端布局 (Desktop View) — 右下角精緻雙欄懸浮窗 */}
      <motion.div
        ref={desktopConsoleRef} // 🟢 綁定 Ref 防線
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        className="hidden lg:flex fixed bottom-6 right-6 z-[200] w-[640px] h-[460px] bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* 左側：商戶清單 */}
        <div className="w-[200px] border-r border-[rgba(237,232,224,0.06)] bg-[#1A1612] flex flex-col">
          <div className="p-3 border-b border-[rgba(237,232,224,0.06)] shrink-0">
            <span className="font-mono text-[9px] text-brand tracking-widest uppercase font-bold">
              Trading Station
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-none">
            {chats.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(room.id);
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === room.id ? { ...c, unreadCount: 0 } : c,
                    ),
                  );
                }}
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-all ${
                  room.id === activeRoomId
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
                {room.unreadCount > 0 && (
                  <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 右側：核心聊天窗 */}
        <div className="flex-1 flex flex-col bg-[#17130f]">
          <div className="h-12 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="font-sans font-bold text-[13px] text-text-primary">
                {activeRoom.partnerName}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md bg-[#1A1612] hover:bg-[#39342f] text-text-secondary hover:text-[#eae1da] flex items-center justify-center font-sans text-[11px]"
            >
              ✕
            </button>
          </div>

          {/* 訊息滾動 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#17130f] scrollbar-none flex flex-col">
            {activeRoom.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[75%]">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-sans text-[12.5px] inline-block shadow-sm leading-snug ${msg.sender === "me" ? "bg-brand text-[#17130f] rounded-tr-none font-medium" : "bg-[#26211C] text-text-primary rounded-tl-none border border-[rgba(237,232,224,0.04)]"}`}
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

          {/* 輸入欄 */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`回覆給 ${activeRoom.partnerName}...`}
              className="flex-1 h-9 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-lg px-3 text-[12px] text-text-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="h-9 px-4 bg-brand text-[#17130f] disabled:opacity-40 font-sans font-bold text-[12px] rounded-lg"
            >
              發送 ⚡
            </button>
          </form>
        </div>
      </motion.div>

      {/* 📱 2. 手機端布局 (Mobile View) — 原生雙層鋪滿全域 Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="lg:hidden fixed inset-0 z-[150] bg-[#17130f] flex flex-col"
      >
        {currentMobileView === "LIST" ? (
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
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#17130f] scrollbar-none">
              {chats.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoomMobile(room.id)}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#26211C] border border-[rgba(237,232,224,0.04)] flex items-start gap-3.5 relative group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center font-bold text-brand text-[13px] shrink-0">
                    {room.partnerName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-semibold text-[13px] text-text-primary">
                        {room.partnerName}
                      </span>
                      <span className="font-mono text-[9px] text-text-disabled">
                        {room.timestamp}
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-text-secondary truncate mt-1">
                      {room.lastMessage}
                    </p>
                  </div>
                  {room.unreadCount > 0 && (
                    <span className="w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_6px_#10b981] shrink-0 mt-2.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMobileView("LIST")}
                  className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand"
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
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#17130f] scrollbar-none flex flex-col">
              {activeRoom.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`px-4 py-2 rounded-2xl font-sans text-[13px] inline-block shadow-md ${msg.sender === "me" ? "bg-brand text-[#17130f] rounded-tr-none font-medium" : "bg-[#26211C] text-text-primary rounded-tl-none border border-[rgba(237,232,224,0.04)]"}`}
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
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`回覆 ${activeRoom.partnerName}...`}
                className="flex-1 h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-text-primary"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-11 px-5 bg-brand text-[#17130f] font-sans font-bold text-[13px] rounded-xl"
              >
                發送
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </>
  );
}
