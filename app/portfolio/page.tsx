import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";

export const metadata: Metadata = {
  title: "我的收藏集",
};

export default function PortfolioPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] flex flex-col">
      <TopNav activePath="/portfolio" />
      <MobileHeader />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-sans font-bold text-[24px] text-[#202124]">
            我的收藏集
          </h1>
          <p className="font-sans text-[14px] text-[#5F6368] mt-1">
            資深收藏家
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "總資產估值", value: "¥—", note: "登入後顯示" },
            { label: "持有卡牌數", value: "—", note: "登入後顯示" },
            { label: "本月損益", value: "—", note: "登入後顯示" },
            { label: "交易紀錄", value: "—", note: "登入後顯示" },
          ].map(({ label, value, note }) => (
            <div
              key={label}
              className="bg-white rounded-[16px] border border-[rgba(226,232,240,0.6)] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4"
            >
              <p className="font-mono text-[11px] text-[#5F6368] mb-1">
                {label}
              </p>
              <p className="font-mono font-medium text-[20px] text-[#202124]">
                {value}
              </p>
              <p className="font-mono text-[11px] text-[#5F6368] mt-1">
                {note}
              </p>
            </div>
          ))}
        </div>

        {/* 7-day check-in bar */}
        <div className="bg-white rounded-[16px] border border-[rgba(226,232,240,0.6)] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-sans text-[14px] font-medium text-[#202124]">
              7天登入里程碑
            </p>
            <span className="font-mono text-[12px] text-[#5F6368]">
              0 / 7 天
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#F8F9FA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-sans text-[16px] text-[#5F6368] max-w-sm leading-relaxed">
            尚無收藏。立即將您的第一張卡牌加入願望清單吧。
          </p>
          <Link
            href="/search"
            className="mt-6 h-10 px-6 bg-[#2563EB] text-white font-sans font-medium text-sm rounded-[8px] inline-flex items-center active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-[#1d4ed8] min-h-[44px]"
          >
            搜尋卡牌
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
