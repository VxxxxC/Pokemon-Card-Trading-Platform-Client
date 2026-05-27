"use client";

import { useState } from "react";
import { ChatWindow } from "@/app/components/chat/ChatWindow";

interface InteractiveChatProps {
  receiverName: string;
}

export function InteractiveChat({ receiverName }: InteractiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Gold Contact Button — Bottom Right hot zone */}
      <div className="fixed bottom-25 right-6 z-40 lg:bottom-8 lg:right-8">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 h-12 px-5 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans font-bold text-[14px] rounded-full shadow-[0_4px_20px_rgba(212,165,116,0.40)] active:scale-95 transition-all cursor-pointer min-h-[48px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>💬 聯絡對話</span>
        </button>
      </div>

      {/* Floating Secure Chat Popup Overlay */}
      {isOpen && (
        <div className="fixed bottom-36 right-6 z-50 lg:bottom-22 lg:right-8 animate-fadeIn">
          <ChatWindow
            receiverName={receiverName}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}
