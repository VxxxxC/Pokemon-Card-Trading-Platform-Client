"use client";

import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import type {
  MerchantDirectCheckoutSession,
  MerchantDirectFormState,
} from "@/lib/checkout/types";

type MerchantDirectReviewProps = {
  session: MerchantDirectCheckoutSession;
  form: MerchantDirectFormState;
  onFormChange: (patch: Partial<MerchantDirectFormState>) => void;
  paymentLocked: boolean;
};

export function MerchantDirectReview({
  session,
  form,
  onFormChange,
  paymentLocked,
}: MerchantDirectReviewProps) {
  const { product, counterparty } = session;
  const rarity = product.displayId ?? product.cardNumber ?? "—";
  const showDirectDeliverySection = !form.authServiceEnabled;

  return (
    <div className="space-y-6">
      <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
        <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
          🃏 1. 核對現貨資產品相
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

      {showDirectDeliverySection ? (
        <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-4">
          <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
            📦 2. 選擇交收方式
          </h2>
          <p className="font-sans text-[11px] text-text-disabled leading-relaxed">
            快遞公司由商戶出貨時安排；面交／自取地點可於訂單內與商戶協調。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onFormChange({ shippingType: "sf" })}
              className={`h-11 rounded-xl border font-sans text-[13px] font-bold transition-all ${form.shippingType === "sf" ? "bg-brand/10 border-brand text-brand" : "bg-[#17130f] border-white/10 text-[#d4c4b7]"}`}
            >
              🚚 快遞寄貨
            </button>
            <button
              type="button"
              onClick={() => onFormChange({ shippingType: "meetup" })}
              className={`h-11 rounded-xl border font-sans text-[13px] font-bold transition-all ${form.shippingType === "meetup" ? "bg-brand/10 border-brand text-brand" : "bg-[#17130f] border-white/10 text-[#d4c4b7]"}`}
            >
              🤝 面交／自取
            </button>
          </div>

          {form.shippingType === "sf" ? (
            <div className="space-y-3 pt-2 font-sans text-[13px]">
              <div>
                <label
                  htmlFor="p-tel"
                  className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                >
                  聯絡電話 *
                </label>
                <input
                  id="p-tel"
                  type="tel"
                  maxLength={8}
                  value={form.buyerPhone}
                  onChange={(event) =>
                    onFormChange({ buyerPhone: event.target.value })
                  }
                  placeholder="91234567"
                  className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da] font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="p-addr"
                  className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                >
                  收件地址／自提點 *
                </label>
                <textarea
                  id="p-addr"
                  rows={2}
                  value={form.courierDeliveryAddress}
                  onChange={(event) =>
                    onFormChange({ courierDeliveryAddress: event.target.value })
                  }
                  placeholder="例：九龍塘站順豐智能櫃、或完整收件地址"
                  className="w-full bg-[#17130f] border border-white/10 rounded-xl p-3 text-[#eae1da] resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2 font-sans text-[13px]">
              <div>
                <label
                  htmlFor="p-tel-meet"
                  className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                >
                  聯絡電話 *
                </label>
                <input
                  id="p-tel-meet"
                  type="tel"
                  maxLength={8}
                  value={form.buyerPhone}
                  onChange={(event) =>
                    onFormChange({ buyerPhone: event.target.value })
                  }
                  placeholder="91234567"
                  className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da] font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="p-meet"
                  className="font-mono text-[11px] text-[#d4c4b7] block mb-1"
                >
                  面交備註（選填）
                </label>
                <input
                  id="p-meet"
                  type="text"
                  value={form.meetupNote}
                  onChange={(event) =>
                    onFormChange({ meetupNote: event.target.value })
                  }
                  placeholder="可於訂單內與商戶約定時間地點"
                  className="w-full h-10 bg-[#17130f] border border-white/10 rounded-xl px-3 text-[#eae1da]"
                />
              </div>
            </div>
          )}
        </section>
      ) : null}

      <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h2 className="font-sans font-bold text-[15px] text-[#eae1da]">
              🔍 3. 啟用鑑定服務
            </h2>
            <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
              專業第三方官方認證、複驗品相及真偽防偽包裝
            </p>
          </div>
          <Switch
            checked={form.authServiceEnabled}
            onCheckedChange={(checked) =>
              onFormChange({ authServiceEnabled: checked })
            }
            disabled={!session.listingAcceptsAuthentication || paymentLocked}
            className="data-checked:bg-brand data-unchecked:bg-[#39342f]"
          />
        </div>
        {!session.listingAcceptsAuthentication ? (
          <p className="mt-2 font-sans text-[11px] text-text-disabled">
            此賣家未開放平台鑑定加購服務。
          </p>
        ) : null}
        {form.authServiceEnabled ? (
          <div className="mt-3 bg-[#17130f] rounded-xl p-3 border border-brand/20">
            <p className="font-sans text-[11px] text-brand leading-relaxed">
              ✓
              鑑定服務已啟用：將由專業第三方鑑定機構對卡牌進行全面品相檢測，並提供官方認證報告。鑑定費用
              HK$150 將計入訂單總額。
            </p>
          </div>
        ) : null}
      </section>

      <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 space-y-3">
        <label
          htmlFor="p-rem"
          className="font-sans font-bold text-[15px] text-[#eae1da] block"
        >
          ✍️ 4. 給賣家的特殊交割備註 (Remark)
        </label>
        <textarea
          id="p-rem"
          rows={3}
          value={form.buyerRemark}
          onChange={(event) =>
            onFormChange({ buyerRemark: event.target.value })
          }
          placeholder="例：請賣家發貨時加固氣泡紙，避免壓傷卡盒。謝謝！"
          className="w-full bg-[#17130f] border border-white/10 rounded-xl p-3 font-sans text-[13px] text-[#eae1da] resize-none"
        />
      </section>
    </div>
  );
}
