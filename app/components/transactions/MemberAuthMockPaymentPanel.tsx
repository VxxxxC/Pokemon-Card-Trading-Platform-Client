"use client";

import { toast } from "sonner";
import { mockPayMemberAuthOrder } from "@/app/actions/orders";
import { MemberAuthOrderInvoice } from "@/app/components/user/MemberAuthOrderInvoice";
import { useState } from "react";

type MemberAuthMockPaymentPanelProps = {
  orderId: string;
  finalPrice: number;
  paymentAmount: number;
  disabled?: boolean;
  onSuccess: () => void;
};

export function MemberAuthMockPaymentPanel({
  orderId,
  finalPrice,
  paymentAmount,
  disabled = false,
  onSuccess,
}: MemberAuthMockPaymentPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMockPay = async () => {
    if (isSubmitting || disabled) {
      return;
    }

    setIsSubmitting(true);
    const result = await mockPayMemberAuthOrder(orderId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("模擬付款成功，平台已託管款項");
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] leading-relaxed text-amber-200">
        開發模式 — Stripe 未配置時使用模擬付款。正式環境請設定
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 以啟用真實託管收款。
      </div>

      <MemberAuthOrderInvoice finalPrice={finalPrice} isSeller={false} />

      <button
        type="button"
        disabled={disabled || isSubmitting}
        onClick={() => void handleMockPay()}
        className="w-full h-11 bg-brand text-[#1A1612] font-sans font-black text-[13px] rounded-xl hover:bg-[#e8b896] active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {isSubmitting
          ? "處理中…"
          : `確認模擬付款（HK$ ${paymentAmount.toLocaleString("zh-TW")}）`}
      </button>
    </div>
  );
}
