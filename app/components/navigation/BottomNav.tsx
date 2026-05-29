"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首頁", icon: HomeIcon },
  { href: "/marketplace", label: "市場", icon: SearchIcon },
  { href: "/message", label: "訊息", icon: InboxIcon, hasUnread: true }, // TODO: hardcode to true for demo
  { href: "/profile", label: "會員", icon: ProfileIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-2 left-1/2 -translate-x-1/2 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-1 px-2 py-2 bg-[rgba(26,22,18,0.85)] backdrop-blur-xl border border-[rgba(237,232,224,0.10)] rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.50)]">
        {navItems.map(({ href, label, icon: Icon, hasUnread }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 min-h-[52px] rounded-[20px] active:scale-[0.93] transition-transform ${
                isActive
                  ? "bg-[rgba(212,165,116,0.12)] text-[#d4a574]" // 確保品牌色對齊暗金
                  : "text-[#d4c4b7]"
              }`}
            >
              <Icon active={isActive} hasUnread={hasUnread} />
              <span className="font-sans text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
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
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#d4a574" : "#d4c4b7"}
      strokeWidth="2"
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
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#d4a574" : "#d4c4b7"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function InboxIcon({
  active,
  hasUnread,
}: {
  active: boolean;
  hasUnread?: boolean;
}) {
  return (
    <div className="relative">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "#d4a574" : "none"}
        stroke={active ? "#d4a574" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
      {hasUnread && (
        <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-[#10b981] rounded-full border border-[rgba(26,22,18,0.85)] shadow-[0_0_6px_#10b981]" />
      )}
    </div>
  );
}
