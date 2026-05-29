"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/app/components/navigation/BottomNav";

interface ChatMessage {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
  isWarning?: boolean;
}

interface ChatRoom {
  id: string;
  partnerName: string;
  partnerTier: "道館主" | "收藏家";
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  cardContext?: {
    name: string;
    price: number;
    statusLabel: string;
  };
  messages: ChatMessage[];
}

// 模擬全域收件匣數據，內置交易進度與安全警告
const INITIAL_CHATS: ChatRoom[] = [
  {
    id: "ORD-20260527-001",
    partnerName: "渡邊道館",
    partnerTier: "道館主",
    lastMessage: "✨ 平台鑑定師已確認卡角完好，稍後會上傳官方鑑定報告。",
    unreadCount: 2,
    timestamp: "14:32",
    cardContext: {
      name: "Charizard ex SAR (噴火龍)",
      price: 2250,
      statusLabel: "官方鑑定中",
    },
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
        text: "✈ 交易提醒：賣家已發貨，實物已安全抵達香港中介保管中心。",
        timestamp: "11:30",
      },
      {
        id: "3",
        sender: "them",
        text: "師兄放心，卡牌已經交咗畀平台。剛才收到通知，鑑定進行中。",
        timestamp: "14:30",
      },
      {
        id: "4",
        sender: "system",
        text: "✨ 交易提醒：平台鑑定師已確認卡角完好，稍後會上傳官方鑑定報告。",
        timestamp: "14:32",
      },
    ],
  },
  {
    id: "ROOM-MOCK-002",
    partnerName: "大阪收藏家",
    partnerTier: "收藏家",
    lastMessage:
      "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬，免咗平台 5% 佣金？",
    unreadCount: 0,
    timestamp: "昨日",
    cardContext: {
      name: "Umbreon ex SAR (月亮伊布)",
      price: 1900,
      statusLabel: "已對接",
    },
    messages: [
      {
        id: "1",
        sender: "them",
        text: "師兄，對呢張月亮伊布有冇興趣？可以即時出價。",
        timestamp: "昨日 18:00",
      },
      {
        id: "2",
        sender: "me",
        text: "有興趣，價錢可以再少少議？",
        timestamp: "昨日 18:15",
      },
      {
        id: "3",
        sender: "them",
        text: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬，免咗平台 5% 佣金？",
        timestamp: "昨日 18:20",
      },
      {
        id: "4",
        sender: "system",
        text: "🚨 系統安全警告：偵測到敏感字眼（私下轉賬/PayMe）。為了保障您的資金安全，請勿進行線下交易。一切透過私下交易導致的假卡或調包損失，平台概不負責。",
        timestamp: "昨日 18:21",
        isWarning: true,
      },
    ],
  },
];

const SPRING_CONFIG = { stiffness: 300, damping: 25 };

export default function GlobalInboxPage() {
  const searchParams = useSearchParams();
  const router = useRouter(); // 🏎️ 啟用 Next.js 路由管理器
  const chatOrderId = searchParams.get("chat");

  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(INITIAL_CHATS);

  // ✨ 【核心改動 1】直接從 URL 衍生事實來源，不再使用 useState 儲存 activeRoomId
  // 如果 URL 有 ?chat=xxx 淨抓 xxx，否則預設拿第一間房嘅 ID
  const activeRoomId =
    chatOrderId && chatRooms.some((r) => r.id === chatOrderId)
      ? chatOrderId
      : chatRooms[0].id;

  // 確保主房間數據隨時精準對齊
  const activeRoom =
    chatRooms.find((r) => r.id === activeRoomId) || chatRooms[0];

  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: inputText,
      timestamp: "14:35",
    };

    // 更新當前對話房嘅訊息
    setChatRooms((prev) =>
      prev.map((room) => {
        if (room.id === activeRoomId) {
          return {
            ...room,
            lastMessage: inputText,
            messages: [...room.messages, newMsg],
          };
        }
        return room;
      }),
    );

    setInputText("");
  };

  return (
    <div className="min-h-[100dvh] bg-[#17130f] text-[#eae1da] font-sans flex flex-col lg:grid lg:grid-cols-12 max-w-[1200px] mx-auto border border-[rgba(237,232,224,0.08)] rounded-2xl overflow-hidden my-4 shadow-2xl pb-24 lg:pb-0">
      <div className="lg:col-span-4 border-r border-[rgba(237,232,224,0.08)] bg-[#26211C] flex flex-col h-[40vh] lg:h-[80vh]">
        <div className="p-4 border-b border-[rgba(237,232,224,0.06)] shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-sans font-bold text-[16px]">交易通訊收件匣</h2>
            <p className="font-mono text-[11px] text-[#d4c4b7] mt-0.5">
              SECURE END-TO-END ENCRYPTED
            </p>
          </div>

          {/* 手機端專屬安全出口，一鍵返回首頁 */}
          <Link
            href="/"
            className="lg:hidden text-[12px] text-[#d4a574] hover:underline font-medium"
          >
            ← 返回首頁
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-none">
          {chatRooms.map((room) => {
            const isActive = room.id === activeRoomId;
            return (
              <button
                key={room.id}
                // 點擊房間時，改為直接靜默替換 URL 參數
                onClick={() =>
                  router.replace(`/message?chat=${room.id}`, { scroll: false })
                }
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 active:scale-[0.99] ${
                  isActive
                    ? "bg-[#2e2925] border border-[rgba(237,232,224,0.12)]"
                    : "hover:bg-[#2e2925]/40 border border-transparent"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#17130f] border border-[#d4a574]/20 flex items-center justify-center font-bold text-[#d4a574] shrink-0">
                  {room.partnerName[0]}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-semibold text-[13px] text-[#eae1da]">
                        {room.partnerName}
                      </span>
                      <span className="text-[9px] bg-[#d4a574]/10 text-[#d4a574] px-1.5 py-0.5 rounded-full border border-[#d4a574]/20 font-medium">
                        {room.partnerTier}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#50453b]">
                      {room.timestamp}
                    </span>
                  </div>

                  <p className="font-sans text-[12px] text-[#d4c4b7] truncate mt-1">
                    {room.lastMessage}
                  </p>

                  {room.cardContext && (
                    <div className="mt-1.5 text-[10px] font-mono text-[#50453b] flex items-center justify-between bg-[#17130f]/60 px-2 py-0.5 rounded">
                      <span className="truncate max-w-[70%]">
                        {room.cardContext.name}
                      </span>
                      <span className="text-[#d4a574] font-semibold shrink-0">
                        HK$ {room.cardContext.price}
                      </span>
                    </div>
                  )}
                </div>

                {/* 未讀計數氣泡 (採用成功綠標信號) */}
                {room.unreadCount > 0 && (
                  <span className="bg-[#10b981] text-[#17130f] font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-1">
                    {room.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 右側核心對話對講機 (8/12 寬度) */}
      <div className="lg:col-span-8 bg-[#17130f] flex flex-col h-[60vh] lg:h-[80vh]">
        {/* 右側頂部：當前對話商家詳情 */}
        <div className="p-4 bg-[#26211C] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-[14px] text-[#eae1da]">
                {activeRoom.partnerName}
              </h3>
              <span className="text-[10px] bg-gradient-to-r from-[#d4a574]/15 to-[#e8b896]/15 text-[#d4a574] border border-[#d4a574]/20 px-2 py-0.5 rounded-full font-medium">
                🏅 專業{activeRoom.partnerTier}
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#d4c4b7] mt-0.5">
              關聯卡牌交易 ID: #{activeRoom.id}
            </p>
          </div>

          {activeRoom.cardContext && (
            <Link
              href={`/profile/user/orders/${activeRoom.id}`}
              className="text-[11px] font-sans border border-[rgba(237,232,224,0.15)] hover:border-[#d4a574] px-3 py-1.5 rounded-xl transition-colors text-[#d4c4b7] hover:text-[#d4a574]"
            >
              🔍 查看此單託管進度
            </Link>
          )}
        </div>

        {/* 訊息氣泡主戰場滾動區 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none flex flex-col">
          <AnimatePresence initial={false}>
            {activeRoom.messages.map((msg) => {
              // 1. 系統通知/交易狀態流/敏感詞警告 (居中、特殊邊框)
              if (msg.sender === "system") {
                return (
                  <div
                    key={msg.id}
                    className="w-full my-2 flex justify-center px-4"
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3 text-[12px] leading-relaxed border font-sans text-center ${
                        msg.isWarning
                          ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
                          : "bg-[rgba(140,115,85,0.08)] border-[#d4a574]/20 text-[#d4c4b7]"
                      }`}
                    >
                      {msg.text}
                      <span className="block font-mono text-[9px] text-[#50453b] mt-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              }

              // 2. 買家自己發出嘅對話 (右側、金棕色環境光背景、深色字高對比)
              if (msg.sender === "me") {
                return (
                  <div key={msg.id} className="flex justify-end w-full">
                    <div className="max-w-[70%] text-right space-y-1">
                      <div className="bg-[#d4a574] text-[#1A1612] px-4 py-2.5 rounded-2xl rounded-tr-none font-sans text-[13px] leading-relaxed inline-block shadow-lg text-left">
                        {msg.text}
                      </div>
                      <span className="block font-mono text-[9px] text-[#50453b] pr-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              }

              // 3. 賣家發出嘅對話 (左側、暗色表面、淺米色字)
              return (
                <div key={msg.id} className="flex justify-start w-full">
                  <div className="max-w-[70%] space-y-1">
                    <div className="bg-[#2e2925] border border-[rgba(237,232,224,0.08)] text-[#eae1da] px-4 py-2.5 rounded-2xl rounded-tl-none font-sans text-[13px] leading-relaxed inline-block shadow-md">
                      {msg.text}
                    </div>
                    <span className="block font-mono text-[9px] text-[#50453b] pl-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 底部輸入框表單控制區 (觸覺反饋按鈕) */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] shrink-0 flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="請輸入訊息詢問品相或追蹤進度...（請勿進行線下交易）"
            className="flex-1 h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] focus:outline-none focus:border-[#d4a574]/40"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-11 px-5 bg-[#d4a574] hover:bg-[#e8b896] disabled:opacity-40 text-[#1A1612] font-sans font-bold text-[13px] rounded-xl flex items-center justify-center transition-transform active:scale-[0.96] shrink-0"
          >
            發送 ⚡
          </button>
        </form>
      </div>

      {/* 手機底部導航欄 */}
      <BottomNav />
    </div>
  );
}
