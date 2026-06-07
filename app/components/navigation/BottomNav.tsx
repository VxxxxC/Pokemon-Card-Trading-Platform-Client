"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/app/store/useUIStore";

export function BottomNav() {
  const pathname = usePathname();

  const openAddAssetModal = useUIStore((state) => state.openAddAssetModal);

  return (
    <nav
      className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 🟢 5 欄位高冷黑金對稱大底座，100% 鎖死「＋」號於正中央 Index 2 */}
      <div className="grid grid-cols-5 items-center px-1 py-1.5 bg-[rgba(26,22,18,0.92)] backdrop-blur-xl border border-[rgba(237,232,224,0.08)] rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.7)]">
        {/* Slot 1: 首頁 (完美歸位) */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none ${
            pathname === "/" ? "text-[#d4a574]" : "text-[#d4c4b7]"
          }`}
        >
          <HomeIcon active={pathname === "https://gemini.google.com/"} />
          <span className="font-sans text-[9px] font-bold tracking-tight">
            首頁
          </span>
        </Link>

        {/* Slot 2: 大盤市場 (完美歸位校準) */}
        <Link
          href="/marketplace"
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none ${
            pathname.startsWith("/marketplace")
              ? "text-[#d4a574]"
              : "text-[#d4c4b7]"
          }`}
        >
          <SearchIcon active={pathname.startsWith("/marketplace")} />
          <span className="font-sans text-[9px] font-bold tracking-tight">
            大盤市場
          </span>
        </Link>

        {/* Slot 3 (Index 2): 正中央「＋」全域開倉掣（高對比實心黑金 Action 掣） */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => openAddAssetModal("merch")} //  點擊「新增商品」
            className="w-11 h-11 bg-[#d4a574] text-[#1A1612] rounded-[14px] flex items-center justify-center shadow-lg active:scale-[0.90] transition-all cursor-pointer focus:outline-none"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Slot 4: 交易管理 (直穿後台) */}
        <Link
          href="/profile/user/trading"
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none ${
            pathname.includes("/trading") ? "text-[#d4a574]" : "text-[#d4c4b7]"
          }`}
        >
          <TradingIcon active={pathname.includes("/trading")} />
          <span className="font-sans text-[9px] font-bold tracking-tight">
            交易管理
          </span>
        </Link>

        {/* Slot 5: 個人中心 */}
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center gap-1 min-h-[50px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none ${
            pathname.startsWith("/profile") && !pathname.includes("/trading")
              ? "text-[#d4a574]"
              : "text-[#d4c4b7]"
          }`}
        >
          <ProfileIcon
            active={
              pathname.startsWith("/profile") && !pathname.includes("/trading")
            }
          />
          <span className="font-sans text-[9px] font-bold tracking-tight">
            會員中心
          </span>
        </Link>
      </div>
    </nav>
  );
}

// ── 🛠️ 交易所幾何圖標庫 (100% 繼承原本極簡設計語意) ──

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "#d4a574" : "none"}
      stroke={active ? "#d4a574" : "#d4c4b7"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#d4a574" : "#d4c4b7"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TradingIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#d4a574" : "#d4c4b7"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M21 3L13 11" />
      <path d="M3 21l8-8" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#d4a574" : "#d4c4b7"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
