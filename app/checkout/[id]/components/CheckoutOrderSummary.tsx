"use client";

import Image from "next/image";
import type { CheckoutSession } from "@/lib/checkout/types";

type CheckoutOrderSummaryProps = {
  session: CheckoutSession;
  shippingFee: number;
  inboundShippingFee?: number;
  outboundShippingFee?: number;
  authFee: number;
  totalAmount: number;
  shippingLabel?: string;
  showShippingRow?: boolean;
  showAuthEscrowShippingRows?: boolean;
  showAuthFeeRow?: boolean;
  platformSubsidyAmount?: number;
  extraShippingNote?: string | null;
  children?: React.ReactNode;
};

export function CheckoutOrderSummary({
  session,
  shippingFee,
  inboundShippingFee = 0,
  outboundShippingFee = 0,
  authFee,
  totalAmount,
  shippingLabel = "運費",
  showShippingRow = true,
  showAuthEscrowShippingRows = false,
  showAuthFeeRow = true,
  platformSubsidyAmount = 0,
  extraShippingNote,
  children,
}: CheckoutOrderSummaryProps) {
  const { product, counterparty } = session;
  const rarity = product.displayId ?? product.cardNumber ?? "—";

  return (
    <div className="bg-[#26211C] border border-brand/20 rounded-2xl p-5 space-y-4 shadow-lg">
      <h3 className="font-sans font-bold text-[14.5px] text-[#eae1da] border-b border-white/5 pb-2">
        🧾 訂單財務明細總結
      </h3>

      <div className="flex gap-4 items-center bg-[#17130f] p-3 rounded-xl border border-white/5">
        <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
          <Image
            src={product.imageUrl}
            alt={product.cardName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <span className="inline-flex font-mono text-[9px] text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded">
            {product.gradeLabel}
          </span>
          <h3 className="font-sans font-bold text-[13px] text-[#eae1da] truncate">
            {product.cardName}
          </h3>
          <p className="font-mono text-[10px] text-text-disabled">
            {product.setCode} · {rarity}
          </p>
          <p className="font-sans text-[11px] text-text-secondary truncate">
            賣方: {counterparty.name}
          </p>
        </div>
      </div>

      <div className="space-y-2 font-sans text-[13px] text-[#d4c4b7]">
        <div className="flex justify-between">
          <span>卡牌商品總額</span>
          <span className="font-mono text-[#eae1da]">
            HK$ {session.pricing.itemSubtotal.toLocaleString()}
          </span>
        </div>
        {showShippingRow ? (
          <div className="flex justify-between">
            <span>{shippingLabel}</span>
            <span className="font-mono text-[#eae1da]">HK$ {shippingFee}</span>
          </div>
        ) : null}
        {showAuthEscrowShippingRows ? (
          <>
            <div className="flex justify-between">
              <span>運費（賣家寄送平台）</span>
              <span className="font-mono text-[#eae1da]">
                HK$ {inboundShippingFee}
              </span>
            </div>
            <div className="flex justify-between">
              <span>運費（平台寄送買家）</span>
              <span className="font-mono text-[#eae1da]">
                HK$ {outboundShippingFee}
              </span>
            </div>
          </>
        ) : null}
        {extraShippingNote ? (
          <p className="font-mono text-[10.5px] text-text-disabled">
            {extraShippingNote}
          </p>
        ) : null}
        {showAuthFeeRow ? (
          <div className="flex justify-between">
            <span>官方第三方鑑定費</span>
            <span
              className={
                authFee > 0
                  ? "font-mono text-brand font-semibold"
                  : "font-mono text-[#eae1da]"
              }
            >
              HK$ {authFee}
            </span>
          </div>
        ) : null}
        {platformSubsidyAmount > 0 ? (
          <div className="flex justify-between text-brand">
            <span>平台優惠</span>
            <span className="font-mono font-semibold">
              - HK$ {platformSubsidyAmount.toLocaleString()}
            </span>
          </div>
        ) : null}
        <div className="border-t border-white/5 pt-3 flex justify-between items-baseline">
          <span className="font-bold text-[#eae1da]">託管安全支付總額</span>
          <span className="font-mono font-black text-[22px] text-brand">
            HK$ {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-[#17130f] rounded-xl p-3 border border-white/5 space-y-1">
        <p className="font-sans font-bold text-[11px] text-brand">
          🔒 Platform Escrow 託管安全防護中
        </p>
        <p className="font-sans text-[10.5px] text-text-disabled leading-relaxed">
          本筆資金將由 Stripe
          託管鎖定。在您確認收貨、複驗品相前，賣家無法提現。
        </p>
      </div>

      {children}
    </div>
  );
}
