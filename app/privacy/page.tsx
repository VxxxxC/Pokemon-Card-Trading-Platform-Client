import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Footer } from "@/app/components/navigation/Footer";

export const metadata: Metadata = {
  title: "私隱政策",
  description: "HKCardVault 私隱政策。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page text-text-primary flex flex-col font-sans">
      <TopNav />
      <MobileHeader />
      <main className="flex-1 max-w-[800px] mx-auto px-4 lg:px-8 py-8 pb-24 lg:pb-12 w-full">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-6 font-sans text-[12px] text-amber-200">
          草案 — 待法務審閱。正式版本發佈前請勿視為最終法律文本。
        </div>

        <h1 className="font-sans font-bold text-[24px] text-text-primary mb-2">
          私隱政策
        </h1>
        <p className="font-sans text-[13px] text-text-secondary mb-8">
          最後更新：2026 年 8 月（草案）
        </p>

        <article className="space-y-8 font-sans text-[13px] text-text-secondary leading-relaxed">
          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              1. 我們收集的資料
            </h2>
            <p>
              帳戶註冊資料（電郵、用戶名稱）、交易與訂單紀錄、KYC／身份驗證資料（如適用）、裝置與日誌資料，以及您主動提交的客服或舉報內容。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              2. 資料用途
            </h2>
            <p>
              提供交易與託管服務、身份驗證、風控與爭議處理、改善產品體驗，以及履行法律義務。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              3. 第三方服務
            </h2>
            <p>
              付款由 Stripe 處理；我們不儲存完整信用卡號。其他基礎設施供應商僅在提供服務所需範圍內處理資料。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              4. 保留與安全
            </h2>
            <p>
              我們在達成收集目的所需期間內保留資料，並採取合理技術與組織措施保護個人資料。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              5. 您的權利與聯絡
            </h2>
            <p>
              您可要求查閱、更正或刪除個人資料（受法律及合約限制）。聯絡方式請見平台公告或客服渠道。另請參閱{" "}
              <Link href="/terms" className="text-brand hover:underline">
                服務條款
              </Link>
              。
            </p>
          </section>
        </article>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
