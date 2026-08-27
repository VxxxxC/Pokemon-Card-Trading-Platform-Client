"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useUIStore } from "@/app/store/useUIStore";
import { getProfileHomePath, getTradingHomePath } from "@/lib/auth/roles";
import { shouldShowBottomNav } from "@/lib/navigation/bottom-nav-visibility";

export function BottomNav() {
  const pathname = usePathname();
  const openAddAssetModal = useUIStore((state) => state.openAddAssetModal);

  if (!shouldShowBottomNav(pathname)) {
    return null;
  }

  // 🟢 訂閱沙盒身份
  const userAuthRole = useUIStore((state) => state.userAuthRole);
  const activeListingPersona = useUIStore((state) => state.activeListingPersona);
  const isGuest = useSyncExternalStore(
    () => () => {}, // 訂閱監聽清理回調
    () => userAuthRole === "GUEST", // 客戶端快照（讀取真實狀態）
    () => true, // 伺服器端快照（強制對齊預設為 Guest，防止 HTML 結構錯位）
  );

  // 🟢 根據當前沙盒身份動態配置路由與高亮態，防止進入錯誤端點
  const getTradingPath = () =>
    getTradingHomePath(userAuthRole, activeListingPersona);

  const getProfilePath = () =>
    getProfileHomePath(userAuthRole, activeListingPersona);

  const isTradingActive = pathname.includes("/trading") || pathname.includes("/approvals");
  const isProfileActive =
    (pathname.startsWith("/profile") || pathname.startsWith("/admin")) &&
    !pathname.includes("/trading") &&
    !pathname.includes("/approvals");
  return (
    <nav
      className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 🟢 頂級權限型態咬合：未登入為 3 欄，已登入為 5 欄 */}
      <div
        className="flex justify-evenly items-center px-1 py-1.5 bg-[rgba(26,22,18,0.92)] backdrop-blur-xl border border-[rgba(237,232,224,0.08)] rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.7)] transition-all duration-300"
      >
        {/* Slot 1: 首頁 */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none ${
            pathname === "/" ? "text-[#d4a574]" : "text-[#d4c4b7]"
          }`}
        >
          {/* 🟢 Bug 修正：對齊正確的首頁路由判定 */}
          <HomeIcon active={pathname === "/"} />
          <span className="font-sans text-[10px] font-semibold tracking-tight">
            首頁
          </span>
        </Link>

        {/* Slot 2: 大盤市場 */}
        <Link
          href="/marketplace"
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none ${
            pathname.startsWith("/marketplace")
              ? "text-[#d4a574]"
              : "text-[#d4c4b7]"
          }`}
        >
          <SearchIcon active={pathname.startsWith("/marketplace")} />
          <span className="font-sans text-[10px] font-semibold tracking-tight">
            大盤市場
          </span>
        </Link>

        {/* ── 🟢 雙向斷線分流槽 ── */}
        {isGuest ? (
          /* 【未登入模式】Slot 3 ➔ 渲染特製、高對比實心黑金的 [登入 / 註冊] 導流按鈕 */
          <Link
            href="/auth"
            className="flex flex-col items-center justify-center min-w-[96px] min-h-[46px] bg-[#d4a574] text-[#1A1612] rounded-[16px] font-sans text-[11px] font-black shadow-md active:scale-[0.95] transition-all text-center focus:outline-none animate-fadeIn"
          >
            登入 / 註冊
          </Link>
        ) : (
          /* 【已登入模式】解鎖正中央「＋」開倉掣及後續雙子星槽位 */
          <>
            {/* Slot 3: 正中央「＋」按鈕 */}
            <div className="flex flex-col items-center justify-center gap-0.5 animate-fadeIn">
              <button
                type="button"
                onClick={() => openAddAssetModal({ mode: "merch" })}
                className="w-8 h-8 bg-[#d4a574] text-[#1A1612] rounded-lg flex items-center justify-center shadow-lg active:scale-[0.90] transition-all cursor-pointer focus:outline-none"
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
              <span className="font-sans text-[10px] font-semibold text-brand tracking-tight">
                新增商品
              </span>
            </div>

            {/* Slot 4: 交易管理 */}
            <Link
              href={getTradingPath()}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none animate-fadeIn ${
                isTradingActive ? "text-[#d4a574]" : "text-[#d4c4b7]"
              }`}
            >
              <ClipboardList
                className="h-5 w-5 shrink-0"
                strokeWidth={2.5}
                aria-hidden
              />
              <span className="font-sans text-[10px] font-semibold tracking-tight">
                交易管理
              </span>
            </Link>

            {/* Slot 5: 会员中心 */}
            <Link
              href={getProfilePath()}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-[18px] active:scale-[0.93] transition-transform focus:outline-none animate-fadeIn ${
                isProfileActive ? "text-[#d4a574]" : "text-[#d4c4b7]"
              }`}
            >
              <ProfileIcon active={isProfileActive} />
              <span className="font-sans text-[10px] font-semibold tracking-tight">
                會員中心
              </span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ── 🛠️ 圖標庫不變 ──
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
