"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "./ChatProvider";

// 複用你之前完美運行嘅 Mock 數據結構
const MOCK_CHATS = [
  {
    id: "ORD-20260527-001",
    partnerName: "渡邊道館",
    partnerTier: "道館主",
    lastMessage: "✨ 平台鑑定師已確認卡角完好，稍後會上傳官方鑑定報告。",
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
        text: "師兄，對呢張月亮伊布有冇興趣？",
        timestamp: "昨日",
      },
      {
        id: "2",
        sender: "system",
        text: "🚨 安全警告：偵測到敏感字眼。請勿進行線下交易。",
        timestamp: "昨日",
        isWarning: true,
      },
    ],
  },
];

export default function GlobalChatSlideOver() {
  const {
    isOpen,
    mode,
    activeRoomId,
    closeChat,
    setSlideMode,
    openDirectChat,
  } = useChat();
  const [rooms, setRooms] = useState(MOCK_CHATS);
  const [inputText, setInputText] = useState("");

  // 鎖定當前對話房，如果未指定則預設拿第一間
  const currentRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentRoom) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "me" as const,
      text: inputText,
      timestamp: "現在",
    };

    setRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoom.id
          ? { ...r, lastMessage: inputText, messages: [...r.messages, newMsg] }
          : r,
      ),
    );
    setInputText("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. 毛玻璃背景遮罩 (App Shell 最底層防禦) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 z-50 bg-[#1A1612]/60 backdrop-blur-sm"
          />

          {/* 2. 交易終端高密度側滑面板面板 (寬度在電腦版鎖定為 420px 精緻尺寸) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-[#17130f] border-l border-[rgba(237,232,224,0.08)] shadow-2xl flex flex-col text-[#eae1da]"
          >
            {/* 模式 A：對話列表模式 (Inbox List) */}
            {mode === "list" && (
              <div className="flex flex-col h-full bg-[#26211C]">
                <div className="p-4 border-b border-[rgba(237,232,224,0.06)] flex items-center justify-between">
                  <div>
                    <h3 className="font-sans font-bold text-[15px]">
                      全域交易收件匣
                    </h3>
                    <p className="font-mono text-[10px] text-[#d4c4b7]">
                      SECURE MULTI-TERMINAL INBOX
                    </p>
                  </div>
                  <button
                    onClick={closeChat}
                    className="text-[#8A8680] hover:text-[#eae1da] text-[20px] px-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => openDirectChat(room.id)}
                      className="w-full text-left p-3 rounded-xl border border-transparent hover:bg-[#2e2925] hover:border-[rgba(237,232,224,0.08)] transition-all flex items-start gap-3 active:scale-[0.99]"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#17130f] border border-[#d4a574]/20 flex items-center justify-center font-bold text-[#d4a574] shrink-0 text-[13px]">
                        {room.partnerName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-sans font-semibold text-[13px]">
                            {room.partnerName}
                          </span>
                          <span className="font-mono text-[9px] text-[#50453b]">
                            {room.timestamp}
                          </span>
                        </div>
                        <p className="font-sans text-[12px] text-[#d4c4b7] truncate mt-0.5">
                          {room.lastMessage}
                        </p>
                      </div>
                      {room.unreadCount > 0 && (
                        <span className="bg-[#10b981] text-[#17130f] font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-1">
                          {room.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 模式 B：特定商家即時聊天對講機 (Chat Window) */}
            {mode === "chat" && currentRoom && (
              <div className="flex flex-col h-full">
                {/* 聊天室頂部控制列 */}
                <div className="p-4 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setSlideMode("list")}
                      className="text-[#d4c4b7] hover:text-[#d4a574] text-[13px] font-sans pr-1"
                    >
                      ← 列表
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-sans font-bold text-[14px]">
                          {currentRoom.partnerName}
                        </h4>
                        <span className="text-[9px] bg-[#d4a574]/10 text-[#d4a574] px-1.5 py-0.5 rounded-full border border-[#d4a574]/20">
                          {currentRoom.partnerTier}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-[#50453b]">
                        ID: #{currentRoom.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeChat}
                    className="text-[#8A8680] hover:text-[#eae1da] text-[20px] px-2"
                  >
                    ✕
                  </button>
                </div>

                {/* 訊息滾動大廳 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none bg-[#17130f]">
                  {currentRoom.messages.map((msg) => {
                    if (msg.sender === "system") {
                      return (
                        <div
                          key={msg.id}
                          className="w-full my-1 flex justify-center"
                        >
                          <div
                            className={`max-w-[90%] rounded-xl p-2.5 text-[11px] border text-center font-sans ${
                              msg.isWarning
                                ? "bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444]"
                                : "bg-[rgba(140,115,85,0.06)] border-[#d4a574]/10 text-[#d4c4b7]"
                            }`}
                          >
                            {msg.text}
                          </div>
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
                          className={`max-w-[75%] ${isMe ? "text-right" : "text-left"} space-y-0.5`}
                        >
                          <div
                            className={`px-3.5 py-2 rounded-2xl font-sans text-[12.5px] inline-block shadow-md leading-relaxed ${
                              isMe
                                ? "bg-[#d4a574] text-[#1A1612] rounded-tr-none"
                                : "bg-[#2e2925] border border-[rgba(237,232,224,0.06)] text-[#eae1da] rounded-tl-none"
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="block font-mono text-[8px] text-[#50453b] px-1">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 底部發送表單 */}
                <form
                  onSubmit={handleSend}
                  className="p-3 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="輸入安全訊息...（嚴禁私下轉賬）"
                    className="flex-1 h-10 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-3 font-sans text-[12.5px] text-[#eae1da] focus:outline-none focus:border-[#d4a574]/40"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="h-10 px-4 bg-[#d4a574] hover:bg-[#e8b896] disabled:opacity-40 text-[#1A1612] font-sans font-bold text-[12.5px] rounded-xl flex items-center justify-center transition-transform active:scale-[0.96]"
                  >
                    發送 ⚡
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
