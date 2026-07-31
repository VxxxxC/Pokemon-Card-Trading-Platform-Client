"use client";

import { cn } from "@/lib/utils";

type MemberMerchantB2cOrderInvoiceProps = {
  itemSubtotal: number;
  shippingFee: number;
  shippingMethod: string | null;
  totalAmount: number;
  isSeller: boolean;
};

function formatShippingMethodLabel(method: string | null): string {
  if (method === "sf") {
    return "順豐速運";
  }
  if (method === "meetup") {
    return "面交自取";
  }
  return "—";
}

export function MemberMerchantB2cOrderInvoice({
  itemSubtotal,
  shippingFee,
  shippingMethod,
  totalAmount,
  isSeller,
}: MemberMerchantB2cOrderInvoiceProps) {
  return (
    <div className="p-5 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl space-y-4 shadow-md animate-fadeIn">
      <div className="flex items-center justify-between pb-2">
        <h3 className="font-sans font-extrabold text-[14.5px] text-[#eae1da]">
          🧾 商戶託管交易收據
        </h3>
        <span
          className={cn(
            "font-sans text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded border",
            isSeller
              ? "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30"
              : "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30",
          )}
        >
          {isSeller ? "賣出交易" : "買入交易"}
        </span>
      </div>

      <div className="border-t border-[rgba(237,232,224,0.06)] font-mono text-[12px] space-y-2 text-text-secondary">
        <div className="flex justify-between">
          <span>商品成交價</span>
          <span className="text-text-primary">
            {"HK$ " + itemSubtotal.toLocaleString("zh-TW")}
          </span>
        </div>
        <div className="flex justify-between">
          <span>運費（{formatShippingMethodLabel(shippingMethod)}）</span>
          <span className="text-text-primary">
            {"HK$ " + shippingFee.toLocaleString("zh-TW")}
          </span>
        </div>

        <div className="border-t border-[rgba(237,232,224,0.08)] pt-3 flex justify-between items-center text-[#eae1da] font-black text-[14px] md:text-[16px]">
          <span>{isSeller ? "買家託管總額" : "託管付款總額"}</span>
          <span className="text-brand font-mono text-[18px] md:text-[24px]">
            {"HK$ " + totalAmount.toLocaleString("zh-TW")}
          </span>
        </div>
      </div>
    </div>
  );
}
