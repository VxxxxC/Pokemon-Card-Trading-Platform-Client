"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChatDrawerSkeleton } from "@/app/components/shared/StreamingSkeletons";
import { SpecialTransactionMessage } from "./SpecialTransactionMessage";
import { useTradeStore } from "@/store/useTradeStore";

export interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
  type?: "text" | "special_transaction";
  specialData?: {
    cardName: string;
    cardId: string;
    offerPrice: number;
    buyerName: string;
    sellerId: string;
  };
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

export function GlobalChatConsole() {
  const {
    isChatOpen,
    setIsChatOpen,
    chats,
    setChats,
    activeRoomId,
    setActiveRoomId,
    mobileView,
    setMobileView,
  } = useTradeStore();

  const onClose = () => setIsChatOpen(false);
  const [inputText, setInputText] = useState("");
  const desktopConsoleRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement;
      if (!target || !document.body.contains(target)) return;
      if (target.closest('[data-chat-console="true"]')) return;

      if (
        window.innerWidth >= 1024 &&
        desktopConsoleRef.current &&
        !desktopConsoleRef.current.contains(target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, activeRoomId, isChatOpen]);

  if (!isChatOpen) return null;
  const activeRoom = chats.find((r) => r.id === activeRoomId) || chats[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: inputText,
      timestamp: "14:50",
      type: "text",
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

  return (
    <>
      {/* 💻 1. 電腦端布局 (Desktop View) */}
      <motion.div
        ref={desktopConsoleRef}
        data-chat-console="true"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        className="hidden lg:flex fixed bottom-6 right-6 z-[200] w-[640px] h-[460px] bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* 左欄：列表 */}
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
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-all ${room.id === activeRoomId ? "bg-[#26211C] border border-[rgba(237,232,224,0.08)] shadow-md" : "hover:bg-[#26211C]/40 border border-transparent"}`}
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
            ))}
          </div>
        </div>

        {/* 右欄：對話區 */}
        <div className="flex-1 flex flex-col bg-[#17130f]">
          <div className="h-12 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              {/* 🟢 核心修復 3: 點擊名稱直通 User/Merchant Profile 頁面面 */}
              <button
                type="button"
                onClick={() =>
                  (window.location.href = `/profile/${activeRoom.id}`)
                }
                className="font-sans font-bold text-[13px] text-text-primary hover:text-brand transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
              >
                {activeRoom.partnerName}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md bg-[#1A1612] hover:bg-[#39342f] text-text-secondary hover:text-[#eae1da] flex items-center justify-center font-sans text-[11px]"
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#17130f] scrollbar-none flex flex-col"
          >
            {activeRoom.messages.map((msg) => {
              if (msg.type === "special_transaction" && msg.specialData) {
                return (
                  <div
                    key={msg.id}
                    className="w-full flex justify-start max-w-[90%] animate-fadeIn"
                  >
                    <SpecialTransactionMessage
                      msgId={msg.id}
                      buyerName={msg.specialData.buyerName}
                      sellerId={msg.specialData.sellerId} // 🟢 傳入資料鏈
                      cardName={msg.specialData.cardName}
                      cardId={msg.specialData.cardId}
                      offerPrice={msg.specialData.offerPrice}
                      initialStatus="pending"
                      isMe={msg.sender === "me"}
                    />
                  </div>
                );
              }
              const isMe = msg.sender === "me";
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={`px-3 py-1.5 rounded-xl font-sans text-[12.5px] inline-block shadow-sm leading-snug ${isMe ? "bg-brand text-[#17130f] font-medium" : "bg-[#26211C] text-text-primary border border-[rgba(237,232,224,0.04)]"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              className="h-9 px-4 bg-brand text-[#17130f] font-sans font-bold text-[12px] rounded-lg"
            >
              發送 ⚡
            </button>
          </form>
        </div>
      </motion.div>

      {/* 📱 2. 手機端布局 (Mobile View) */}
      <motion.div
        data-chat-console="true"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="lg:hidden fixed inset-0 z-[150] bg-[#17130f] flex flex-col"
      >
        {mobileView === "LIST" ? (
          <div className="flex flex-col h-full">
            <div className="h-14 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between px-4 shrink-0">
              <div>
                <h3 className="font-sans font-bold text-[14px] text-text-primary">
                  即時交易通知中心
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
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#17130f] scrollbar-none">
              {chats.map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveRoomId(room.id);
                    setMobileView("CHAT");
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#26211C] border border-[rgba(237,232,224,0.04)] flex items-start gap-3.5 relative"
                >
                  <div className="w-9 h-9 rounded-full bg-[#17130f] border border-brand/20 flex items-center justify-center font-bold text-brand text-[13px] shrink-0">
                    {room.partnerName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-sans font-semibold text-[13px] text-text-primary">
                      {room.partnerName}
                    </span>
                    <p className="font-sans text-[12px] text-text-secondary truncate mt-1">
                      {room.lastMessage}
                    </p>
                  </div>
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
                  onClick={() => setMobileView("LIST")}
                  className="h-8 px-2.5 rounded-lg bg-[#1A1612] font-sans text-[12px] font-medium text-brand"
                >
                  ← 返回
                </button>
                {/* 🟢 核心修復 3: 手機版點擊名稱直通 Profile 頁面面 */}
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href = `/profile/${activeRoom.id}`)
                  }
                  className="font-sans font-bold text-[13.5px] text-text-primary truncate max-w-[130px] cursor-pointer bg-transparent border-none p-0 text-left"
                >
                  {activeRoom.partnerName}
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#1A1612] flex items-center justify-center font-sans text-sm text-text-secondary"
              >
                ✕
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#17130f] scrollbar-none flex flex-col"
            >
              {activeRoom.messages.map((msg) => {
                if (msg.type === "special_transaction" && msg.specialData) {
                  return (
                    <div
                      key={msg.id}
                      className="w-full flex justify-start max-w-[95%] animate-fadeIn"
                    >
                      <SpecialTransactionMessage
                        msgId={msg.id}
                        buyerName={msg.specialData.buyerName}
                        sellerId={msg.specialData.sellerId} // 🟢 傳入資料鏈
                        cardName={msg.specialData.cardName}
                        cardId={msg.specialData.cardId}
                        offerPrice={msg.specialData.offerPrice}
                        initialStatus="pending"
                        isMe={msg.sender === "me"}
                      />
                    </div>
                  );
                }
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl font-sans text-[13px] ${isMe ? "bg-brand text-[#17130f]" : "bg-[#26211C] text-text-primary"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
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
