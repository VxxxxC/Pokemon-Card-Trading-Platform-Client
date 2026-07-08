"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addToCollection } from "@/app/actions/collection";

export type CollectionAddAfterListingPayload = {
  productId: string;
  gradingOptionId: string;
  productName: string;
};

type CollectionAddAfterListingDialogProps = {
  payload: CollectionAddAfterListingPayload | null;
  onClose: () => void;
};

export function CollectionAddAfterListingDialog({
  payload,
  onClose,
}: CollectionAddAfterListingDialogProps) {
  const [purchasePrice, setPurchasePrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!payload) {
    return null;
  }

  const handleConfirm = async () => {
    const parsed = Number(purchasePrice);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("請輸入有效的入手價");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addToCollection({
        productId: payload.productId,
        gradingOptionId: payload.gradingOptionId,
        purchasePrice: parsed,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("已加入收藏庫");
      window.dispatchEvent(new CustomEvent("collection-should-refresh"));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-add-after-listing-title"
    >
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#26211C] p-5 shadow-xl">
        <h2
          id="collection-add-after-listing-title"
          className="font-sans text-[16px] font-semibold text-[#eae1da]"
        >
          是否一併加入收藏庫？
        </h2>
        <p className="mt-2 font-sans text-[13px] text-[#d4c4b7]">
          「{payload.productName}」已成功上架。可選填入手價以追蹤身家估值。
        </p>
        <label className="mt-4 block">
          <span className="font-mono text-[11px] text-[#8A8680]">入手價 (HKD)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#17130f] px-3 py-2 font-mono text-[13px] text-[#eae1da]"
            placeholder="0"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-white/10 px-4 py-2 font-sans text-[13px] text-[#d4c4b7]"
          >
            略過
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="rounded-lg bg-[#d4a574] px-4 py-2 font-sans text-[13px] font-semibold text-[#1A1612]"
          >
            {isSubmitting ? "加入中…" : "加入收藏庫"}
          </button>
        </div>
      </div>
    </div>
  );
}
