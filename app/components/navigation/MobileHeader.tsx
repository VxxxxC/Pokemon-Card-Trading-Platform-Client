import { PWANavbarStatus } from "@/app/components/pwa/PWANavbarStatus";

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-50 w-full h-14 bg-[#1A1612] border-b border-[rgba(237,232,224,0.08)]">
      <div className="h-full px-4 flex items-center justify-between">
        <span className="font-sans font-bold text-[18px] text-text-primary tracking-tight">
          PokéTrade <span className="text-brand">JP</span>
        </span>
        <div className="flex items-center gap-2">
          <PWANavbarStatus />
          <button
            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-elevated active:scale-[0.98] transition-transform"
            aria-label="查看通知"
          >
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] bg-[#DC2626] rounded-full font-mono text-[10px] text-white flex items-center justify-center leading-none">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#eae1da"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
