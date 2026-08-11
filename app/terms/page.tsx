import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { Footer } from "@/app/components/navigation/Footer";

export const metadata: Metadata = {
  title: "服務條款",
  description: "HKCardVault 服務條款與退款政策摘要。",
};

export default function TermsPage() {
  return (
    <div className="min-h-[100dvh] bg-bg-page text-text-primary flex flex-col font-sans">
      <TopNav />
      <MobileHeader />
      <main className="flex-1 max-w-[800px] mx-auto px-4 lg:px-8 py-8 pb-24 lg:pb-12 w-full">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 mb-6 font-sans text-[12px] text-amber-200">
          草案 — 待法務／產品審閱。詳情以平台最新公告為準。
        </div>

        <h1 className="font-sans font-bold text-[24px] text-text-primary mb-2">
          服務條款與退款政策摘要
        </h1>
        <p className="font-sans text-[13px] text-text-secondary mb-8">
          最後更新：2026 年 8 月
        </p>

        <article className="space-y-8 font-sans text-[13px] text-text-secondary leading-relaxed">
          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              1. 訂單類型
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Member P2P 面交／線下交易：平台不提供退款，僅提供舉報與制裁機制。</li>
              <li>Member／Merchant 鑑定託管：經 Stripe 入款，適用下文退款規則。</li>
              <li>Merchant 非鑑定直購：經 Stripe 入款，適用售後窗口規則。</li>
            </ul>
          </section>

          <section id="escrow">
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              2. 鑑定託管流程
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>買家完成託管付款。</li>
              <li>賣方將卡牌寄送至平台倉庫。</li>
              <li>平台安排第三方鑑定。</li>
              <li>鑑定通過後，平台代發予買家。</li>
            </ol>
            <p className="mt-3">
              款項於鑑定通過前由平台託管，賣方不可提現。售後爭議一般發生於
              <strong className="text-text-primary">買家確認收貨之後</strong>
              （例如物流損毀、實物與描述不符），並非重新裁定鑑定 fail。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              3. 鑑定費
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                平台確認收到卡牌後，鑑定服務視為已開始；鑑定費按
                <strong className="text-text-primary">平台當時公布費率</strong>
                計入訂單。
              </li>
              <li>
                鑑定未通過且屬賣方責任（如假卡、嚴重不符）：買家可收回含鑑定費在內之全額（以訂單快照為準）。
              </li>
              <li>
                鑑定已通過後之售後退款：鑑定費一般不予退還（平台責任且經審核之個案除外）。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              4. 售後窗口
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Member 鑑定訂單：買家確認收貨後 3 個曆日內可申請售後。</li>
              <li>Merchant 訂單：買家確認收貨後 7 個曆日內可申請售後。</li>
              <li>逾時、已出款或不符合資格之訂單，平台不提供自動退款。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              5. 平台佣金與支付手續費
            </h2>
            <p>
              Merchant 交易佣金按
              <strong className="text-text-primary">平台當時公布費率</strong>
              於結算時扣除。若款項已經 Stripe 扣款後再退款，支付處理費可能無法由 Stripe
              退回，將按責任方分攤（詳見裁定結果）。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-[16px] text-text-primary mb-2">
              6. 其他
            </h2>
            <p>
              使用本平台即表示您已閱讀並同意本條款及{" "}
              <Link href="/privacy" className="text-brand hover:underline">
                私隱政策
              </Link>
              。如有疑問請透過平台客服聯絡我們。
            </p>
          </section>
        </article>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
