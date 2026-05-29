"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";

// 複用核心全域 Mock 對話房數據
const NOTIFY_CHATS = [
  {
    id: "PKT-8839-44A",
    partnerName: "渡邊道館",
    lastMessage: "✨ 平台鑑定師已確認卡角完好，稍後會上傳官方鑑定報告。",
    unreadCount: 2,
    timestamp: "14:32",
  },
  {
    id: "ROOM-MOCK-002",
    partnerName: "大阪收藏家",
    partnerTier: "收藏家",
    lastMessage: "唔好意思啊師兄，不如我哋私下用 PayMe 轉賬？",
    unreadCount: 0,
    timestamp: "昨日",
  },
];

const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/marketplace", label: "市場" },
  { href: "/profile", label: "會員中心" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 點擊出面任何地方自動收起 Popover
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

  const handleChatClick = (merchantId: string) => {
    setIsInboxOpen(false);
    // 智能導流：點擊通知列表，直接跳轉去該商戶公開 Profile，觸發右下角 Chatbox
    router.push(`/profile/${merchantId}?chat=open`);
  };

  return (
    <header className="hidden lg:flex sticky top-0 z-50 w-full h-16 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
      <div className="max-w-[1200px] mx-auto w-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-sans font-bold text-[20px] text-text-primary tracking-tight shrink-0 hover:text-brand transition-colors"
        >
          PokéTrade <span className="text-brand">JP</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`font-sans text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[rgba(212,165,116,0.12)] text-brand"
                    : "text-text-secondary hover:text-brand hover:bg-[rgba(212,165,116,0.06)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 右側工具欄 */}
        <div className="flex items-center gap-3 shrink-0">
          <div aria-label="PWA 應用狀態">
            <PWANavbarStatus />
          </div>

          {/* 📥 全域通知中心門戶 (包裝在相對定位容器內以定位 Popover) */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsInboxOpen((prev) => !prev)}
              className="relative p-2 text-text-secondary hover:text-brand transition-colors rounded-xl hover:bg-[#26211C] active:scale-[0.95]"
              aria-label="打開通訊收件匣"
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
              {/* 未讀計數小綠點 (成功綠) */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10b981] rounded-full shadow-[0_0_8px_#10b981]" />
            </button>

            {/* 🎭 下拉式暗金全息通知中心 Popover */}
            <AnimatePresence>
              {isInboxOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-12 w-[320px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col z-50 text-[#eae1da]"
                >
                  <div className="p-3 bg-[#2e2925] border-b border-[rgba(237,232,224,0.06)] flex justify-between items-center">
                    <span className="font-sans font-bold text-[12px] uppercase tracking-wider text-text-secondary">
                      即時交易通知
                    </span>
                    <span className="font-mono text-[9px] text-[#10b981] bg-[rgba(16,185,129,0.12)] px-1.5 py-0.5 rounded-full border border-[#10b981]/20">
                      2 條未讀
                    </span>
                  </div>

                  <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5 scrollbar-none bg-[#17130f]">
                    {NOTIFY_CHATS.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleChatClick(room.id)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-[#26211C] transition-all flex items-start gap-2.5 group border border-transparent hover:border-[rgba(237,232,224,0.04)]"
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
                          <p className="font-sans text-[11.5px] text-text-secondary truncate mt-0.5 leading-tight">
                            {room.lastMessage}
                          </p>
                        </div>
                        {room.unreadCount > 0 && (
                          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full shrink-0 mt-2" />
                        )}
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/profile/user/orders"
                    onClick={() => setIsInboxOpen(false)}
                    className="p-2.5 bg-[#26211C] border-t border-[rgba(237,232,224,0.06)] font-sans text-[11px] text-center text-text-secondary hover:text-brand block transition-colors"
                  >
                    查看所有交易訂單 →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/auth"
            className="h-9 px-4 font-sans text-sm font-medium text-[#17130f] bg-brand rounded-lg hover:bg-brand-hover active:scale-[0.98] active:translate-y-px transition-transform inline-flex items-center justify-center"
          >
            登入 / 註冊
          </Link>
        </div>
      </div>
    </header>
  );
}
