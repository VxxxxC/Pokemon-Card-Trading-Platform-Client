import type { Metadata } from "next";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

export const metadata: Metadata = {
  title: "卡牌搜尋",
};

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5F6368"
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

export default function SearchPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] flex flex-col">
      <TopNav activePath="/search" />
      <MobileHeader />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <h1 className="font-sans font-bold text-[24px] text-[#202124] mb-6">
          卡牌搜尋
        </h1>

        {/* Search Input */}
        <div className="relative mb-8 max-w-2xl">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="search"
            placeholder="以卡牌名稱或序號搜尋（例：sv2a-182 / Charizard ex）"
            className="w-full h-12 pl-11 pr-4 bg-white border border-[rgba(226,232,240,0.6)] rounded-[8px] font-sans text-[16px] text-[#202124] placeholder:text-[#5F6368] focus:outline-none focus:ring-1 focus:ring-[rgba(37,99,235,0.4)] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["全部", "SAR", "UR", "SR", "AR", "已評級"].map(
            (filter) => (
              <button
                key={filter}
                className={`h-8 px-3 font-mono text-[12px] font-medium rounded-[4px] border transition-colors active:scale-[0.98] transition-transform ${
                  filter === "全部"
                    ? "bg-[#2563EB] text-white border-[#2563EB]"
                    : "bg-white text-[#5F6368] border-[rgba(226,232,240,0.6)] hover:border-[#2563EB] hover:text-[#2563EB]"
                }`}
              >
                {filter}
              </button>
            )
          )}
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-sans text-[16px] text-[#5F6368] max-w-sm leading-relaxed">
            請輸入卡牌名稱或序號進行搜尋。
          </p>
          <p className="font-mono text-[12px] text-[#5F6368] mt-2">
            例: Charizard ex · sv2a-182 · SAR
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
