"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  time: string;
}

interface ChatWindowProps {
  onClose?: () => void;
  receiverName?: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: "1", sender: "system", text: "安全防禦提示：平台交易全程受 Stripe Connect 託管保護，切勿進行線下私下轉賬。", time: "[SERVER_TIME_RESOLVED]" },
  { id: "2", sender: "them", text: "你好！我已經把那張「噴火龍 ex SAR」妥善裝入磁力卡磚保護盒了。", time: "10:15" },
  { id: "3", sender: "me", text: "太好了！卡況是否有白邊或微小刮痕呢？", time: "10:18" },
  { id: "4", sender: "them", text: "沒有，這張是我親自開盒後立刻雙層套卡膜進保護殼的，屬於【美品 S】級別。", time: "10:20" },
  { id: "5", sender: "system", text: "系統提示：賣家已通過實名 KYC 及專業道館主身份授權，本次交易支援 10% 訂金託管。", time: "[SERVER_TIME_RESOLVED]" },
];

export function ChatWindow({ onClose, receiverName = "渡邊道館" }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [securityWarning, setSecurityWarning] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat body
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Frontend Live text scanning interceptor
  const handleInputChange = (val: string) => {
    setInputText(val);

    const bypassRegex = /私下交易|私下轉賬|線下|轉數快|fps|payme|電話|whatsapp|wechat|聯絡方式/i;
    if (bypassRegex.test(val)) {
      setSecurityWarning("⚠️ 安全提示：偵測到敏感通訊，請使用平台 Stripe Connect 託管以保障資金安全。私下交易將喪失 Escrow 物流理賠保障。");
    } else {
      setSecurityWarning("");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: inputText,
      time: "現在",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setSecurityWarning("");

    // Mock seller answers back after a short time
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "them",
        text: "好的，我這就上傳多視角的實物 Corners 邊角特寫相片，請您在商品詳情頁刷新查閱！",
        time: "現在",
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md h-[480px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] rounded-2xl flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.70)] overflow-hidden">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-[#2e2925] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
          <div>
            <p className="font-sans font-bold text-[14px] text-[#eae1da]">{receiverName}</p>
            <p className="font-mono text-[9px] text-[#8c7355] uppercase tracking-wider">🔒 SECURE ENCRYPTED CHAT</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#17130f] hover:bg-[#39342f] flex items-center justify-center text-[#d4c4b7]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Security alert banner */}
      <div className="bg-[#1A1612] px-4 py-2 border-b border-[rgba(237,232,224,0.04)] text-center">
        <span className="font-mono text-[9.5px] text-[#d4c4b7] tracking-wider uppercase">
          ⚡ 平台已啟動端對端 RLS 保護防禦牆 · 嚴防金融詐騙
        </span>
      </div>

      {/* Messages body list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#17130f]">
        {messages.map((msg) => {
          if (msg.sender === "system") {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="font-sans text-[11px] text-[#8A8680] italic leading-normal px-6 block">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.sender === "me";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%] space-y-1">
                <div
                  className={`px-3.5 py-2.5 rounded-[12px] text-[13px] leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-[rgba(140,115,85,0.15)] text-[#eae1da] rounded-tr-none border border-[#8c7355]/30"
                      : "bg-[#2e2925] text-[#eae1da] rounded-tl-none border border-[rgba(237,232,224,0.08)]"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <p className={`font-mono text-[9px] text-[#50453b] ${isMe ? "text-right" : "text-left"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing Form Footer */}
      <div className="p-3 bg-[#2e2925] border-t border-[rgba(237,232,224,0.08)] space-y-2">
        {/* Security Warning box */}
        {securityWarning && (
          <div className="p-2.5 bg-[rgba(239,68,68,0.10)] border border-[#ef4444]/30 rounded-lg animate-fadeIn">
            <p className="font-sans text-[11px] text-[#ef4444] leading-relaxed">{securityWarning}</p>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="輸入對話訊息..."
            className="flex-1 h-10 px-4 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-lg font-sans text-[13px] text-[#eae1da] focus:outline-none focus:border-[#d4a574]/40"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-10 px-4 bg-[#d4a574] hover:bg-[#e8b896] disabled:opacity-40 text-[#1A1612] font-sans font-semibold text-[13px] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            發送
          </button>
        </form>
      </div>
    </div>
  );
}
