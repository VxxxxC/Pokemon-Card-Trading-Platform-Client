"use client";

import { MemberAuthOrderTimeline } from "@/app/components/user/MemberAuthOrderTimeline";
import type { CheckoutSession } from "@/lib/checkout/types";

type AuthEscrowReviewProps = {
  session: CheckoutSession;
};

export function AuthEscrowReview({ session }: AuthEscrowReviewProps) {
  const isMember = session.variant === "member_auth";

  return (
    <div className="space-y-6">
      <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
        <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
          🔍 鑑定託管流程說明
        </h2>
        <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
          {isMember
            ? "此筆 C2C 交易已啟用平台第三方鑑定服務。完成託管付款後，賣家需將卡牌寄往平台倉庫進行鑑定，通過後平台代發給買家。"
            : "此筆商戶訂單已啟用平台鑑定服務。完成託管付款後，商戶將卡牌寄往平台倉庫鑑定，通過後安排交付。"}
        </p>
        <ul className="font-sans text-[11.5px] text-text-secondary space-y-2 list-disc pl-4">
          <li>無需選擇交收方式 — 平台統一安排物流與鑑定流程</li>
          <li>款項全額託管於平台，鑑定通過前賣方無法提現</li>
          <li>鑑定費用已計入訂單總額</li>
        </ul>
      </section>

      {isMember ? (
        <MemberAuthOrderTimeline
          status="pending"
          escrowStatus="payment"
          paymentConfirmedAt={null}
        />
      ) : (
        <section className="bg-[#17130f] border border-white/5 rounded-xl p-4 space-y-3">
          <h4 className="font-sans font-bold text-[12.5px] text-text-primary">
            預計流程
          </h4>
          <ol className="font-sans text-[11.5px] text-text-secondary space-y-2 list-decimal pl-4">
            <li>完成託管付款</li>
            <li>商戶寄送卡牌至平台倉庫</li>
            <li>第三方鑑定機構複驗品相</li>
            <li>鑑定通過後安排交付買家</li>
          </ol>
        </section>
      )}
    </div>
  );
}
