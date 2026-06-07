import type { Metadata } from "next";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";

export const metadata: Metadata = {
  title: "市場 — PokéTrade JP",
  description:
    "瀏覽日版 Pokémon 卡牌交易市場，精選 SAR、UR、SR、AR 稀有度卡牌。",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      {/* 🟢 電腦端與手機端固化頂欄導航：頁面切換時絕對不觸發銷毀重新掛載 */}
      <TopNav />
      <MobileHeader />

      {/* 核心內容視窗投影 */}
      {children}

      {/* 常駐底導航與全域智能交割總線抽屜 */}
      <BottomNav />
      <ExecutionSlideOver />
    </div>
  );
}
