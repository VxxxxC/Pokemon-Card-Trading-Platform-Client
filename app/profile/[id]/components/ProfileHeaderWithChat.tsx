"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Badge {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

interface ProfileHeaderProps {
  member: {
    id: string;
    username: string;
    handle: string;
    joinDate: string;
    avatarSeed: string;
    level: string;
    completedTrades: number;
    bio: string;
    badges: readonly Badge[];
  };
}

export function ProfileHeaderWithChat({ member }: ProfileHeaderProps) {
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");

  const [isChatOpen, setIsChatOpen] = useState(chatParam === "open"); // NOTE: 一偵測到網址有 ?chat=open，即刻全自動彈出對話盒
  const [inputText, setInputText] = useState("");

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  return (
    <>
      {/* 1. 商戶名片區塊 (包含 Toggle 按鈕) */}
      <section className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#2e2925] via-[rgba(140,115,85,0.15)] to-[#2e2925]" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative w-24 h-24 rounded-full border-4 border-[#26211C] shadow-xl overflow-hidden bg-[#17130f]">
              <Image
                src={`https://picsum.photos/seed/${member.avatarSeed}/100/100`}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-[#d4c4b7] uppercase">
                總完成交易
              </p>
              <p className="font-mono font-bold text-[20px] text-[#eae1da]">
                {member.completedTrades.toLocaleString()}+
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <h1 className="font-sans font-bold text-[24px] text-[#eae1da]">
                  {member.username}
                </h1>
                <span className="font-mono text-[10px] bg-gradient-to-r from-[#d4a574]/20 to-[#e8b896]/20 text-[#d4a574] border border-[#d4a574]/30 px-2.5 py-0.5 rounded-full font-medium">
                  🏅 {member.level}
                </span>
              </div>

              {/* 🎯 Toggle Button: 放喺頭像側邊/右側，一鍵展開右下角 Chat */}
              <button
                onClick={toggleChat}
                className="h-10 px-5 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.96] transition-all shadow-md"
              >
                💬 聯絡商戶議價
              </button>
            </div>

            <p className="font-mono text-[12px] text-[#50453b] mb-4">
              {member.handle} · {member.joinDate}
            </p>
            <p className="font-sans text-[14px] text-[#d4c4b7] leading-relaxed max-w-2xl">
              {member.bio}
            </p>

            {/* 徽章區 */}
            <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-none">
              {member.badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.desc}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#17130f] border border-[rgba(237,232,224,0.06)] rounded-lg"
                >
                  <span className="text-[14px]">{badge.emoji}</span>
                  <span className="font-mono text-[11px] text-[#d4c4b7]">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. LinkedIn 樣式：右下角懸浮對話盒 (Floating Chatbox) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-[80px] md:bottom-0 right-2 md:right-8 z-50 w-[calc(100%-16px)] md:w-full max-w-[340px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] border-b-0 rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
            style={{ height: "550px", maxHeight: "75vh" }}
          >
            {/* 對話盒 Header (可點擊收起) */}
            <div
              onClick={toggleChat}
              className="p-3 bg-[#2e2925] border-b border-[rgba(237,232,224,0.08)] flex items-center justify-between cursor-pointer hover:bg-[#39342f] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[rgba(237,232,224,0.1)]">
                  <Image
                    src={`https://picsum.photos/seed/${member.avatarSeed}/40/40`}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-[13px] text-[#eae1da]">
                    {member.username}
                  </h4>
                  <p className="font-mono text-[9px] text-[#10b981] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />{" "}
                    在線
                  </p>
                </div>
              </div>
              <button className="text-[#8A8680] hover:text-[#eae1da] px-2 text-[16px]">
                ↓
              </button>
            </div>

            {/* 訊息大廳 */}
            <div className="flex-1 bg-[#17130f] p-4 text-[12px] text-[#50453b] flex flex-col justify-end overflow-y-auto">
              <p className="text-center font-mono text-[10px] text-[#50453b] mb-4">
                -- SECURE CHAT CHANNEL OPENED --
              </p>
              {/* 模擬對方嘅自動回覆 */}
              <div className="flex justify-start w-full mb-3">
                <div className="bg-[#2e2925] border border-[rgba(237,232,224,0.08)] text-[#eae1da] px-3.5 py-2 rounded-2xl rounded-tl-none font-sans text-[12.5px] leading-relaxed shadow-sm max-w-[85%]">
                  你好！對我防潮箱邊張卡有興趣？可以直接帶價 PM。
                </div>
              </div>
            </div>

            {/* 輸入區 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setInputText("");
              }}
              className="p-3 bg-[#26211C] border-t border-[rgba(237,232,224,0.08)] flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="輸入訊息..."
                className="flex-1 h-9 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-3 text-[#eae1da] text-[12px] focus:outline-none focus:border-[#d4a574]/40"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-9 px-3 bg-[#d4a574] text-[#1A1612] disabled:opacity-40 font-bold text-[12px] rounded-xl transition-all"
              >
                發送
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
