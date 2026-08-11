"use client";

import Image from "next/image";
import type {
  CheckoutSession,
  MerchantDirectFormState,
} from "@/lib/checkout/types";
import { AuthEscrowReview } from "@/app/checkout/[id]/components/steps/AuthEscrowReview";
import { MerchantDirectReview } from "@/app/checkout/[id]/components/steps/MerchantDirectReview";

type CheckoutReviewStepProps = {
  session: CheckoutSession;
  merchantDirectForm: MerchantDirectFormState;
  onMerchantDirectFormChange: (patch: Partial<MerchantDirectFormState>) => void;
  paymentLocked: boolean;
  selectedCouponId: string | null;
  onCouponChange: (couponId: string | null) => void;
  authFee: number;
};

function ProductSummaryCard({ session }: { session: CheckoutSession }) {
  const { product, counterparty } = session;
  const rarity = product.displayId ?? product.cardNumber ?? "—";

  return (
    <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
      <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
        🃏 核對現貨資產品相
      </h2>
      <div className="flex gap-4 items-center bg-[#17130f] p-3 rounded-xl border border-white/5">
        <div className="relative w-16 h-22 rounded-lg overflow-hidden shrink-0 border border-white/10">
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
          <h3 className="font-sans font-bold text-[14px] text-[#eae1da] truncate">
            {product.cardName}
          </h3>
          <p className="font-mono text-[11px] text-text-disabled">
            {product.setCode} · {rarity}
          </p>
          <p className="font-sans text-[11px] text-text-secondary truncate">
            賣方: {counterparty.name}
          </p>
        </div>
      </div>
    </section>
  );
}

export function CheckoutReviewStep({
  session,
  merchantDirectForm,
  onMerchantDirectFormChange,
  paymentLocked,
  selectedCouponId,
  onCouponChange,
  authFee,
}: CheckoutReviewStepProps) {
  if (session.variant === "merchant_direct") {
    return (
      <MerchantDirectReview
        session={session}
        form={merchantDirectForm}
        onFormChange={onMerchantDirectFormChange}
        paymentLocked={paymentLocked}
        selectedCouponId={selectedCouponId}
        onCouponChange={onCouponChange}
        authFee={authFee}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProductSummaryCard session={session} />
      <AuthEscrowReview
        session={session}
        selectedCouponId={selectedCouponId}
        onCouponChange={onCouponChange}
        paymentLocked={paymentLocked}
      />
    </div>
  );
}
