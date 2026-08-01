"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IoChevronBack } from "react-icons/io5";
import {
  submitMerchantDirectFulfillment,
  submitMerchantLogistics,
  type MerchantOrderDetail,
} from "@/app/actions/orders";
import { mapMerchantOrderDetailToSaleOrder } from "@/app/lib/merchant-order/map-sale-order";
import { MerchantAuthSellerTimeline } from "@/app/components/merchant/MerchantAuthSellerTimeline";
import { MerchantB2cDirectTimeline } from "@/app/components/merchant/MerchantB2cDirectTimeline";
import { toast } from "sonner";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import { OrderListingPhotoGrid } from "@/app/components/shared/OrderListingPhotoGrid";

const REMARKS_PRESETS = [
  "正面全貌：印刷居中度完美，閃膜無微劃傷",
  "背面全貌：微距顯示四角完好，無任何白邊",
  "正面右上角：金邊切割銳利，無邊緣磨損",
  "背面左下角：四維防偽雷射標籤對位極致",
  "鑑定認證封殼：防塵防紫外，全密閉存證封裝",
  "條碼微距特寫：認證編號完美可讀，防偽一致",
];

type MerchantOrderDetailViewProps = {
  order: MerchantOrderDetail;
  onRefresh: () => void;
  onOpenReview?: (orderId: string, revieweeId: string) => void;
};

async function runSubmitInboundTracking(
  orderId: string,
  trackingNo: string,
  onSuccess?: () => void,
): Promise<void> {
  const result = await submitMerchantLogistics(orderId, trackingNo);
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  toast.success("物流單號已提交");
  onSuccess?.();
}

async function runSubmitDirectFulfillment(
  orderId: string,
  trackingNo: string | undefined,
  onSuccess?: () => void,
): Promise<void> {
  const result = await submitMerchantDirectFulfillment(orderId, trackingNo);
  if (!result.success) {
    toast.error(result.error);
    return;
  }
  toast.success(trackingNo ? "物流單號已提交" : "已確認面交完成");
  onSuccess?.();
}

export function MerchantOrderDetailView({
  order: merchantOrder,
  onOpenReview,
  onRefresh,
}: MerchantOrderDetailViewProps) {
  const router = useRouter();
  const order = mapMerchantOrderDetailToSaleOrder(merchantOrder);

  const refreshAfterLogistics = () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    router.refresh();
  };

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [inboundTrackingInput, setInboundTrackingInput] = useState("");
  const [outboundTrackingInput, setOutboundTrackingInput] = useState("");
  const isAuthOrder = Boolean(merchantOrder.requiresAuthentication);
  const isSfShipping = merchantOrder.shippingMethod !== "meetup";

  const merchantImages = useMemo(() => {
    if (merchantOrder.listingImageUrls.length > 0) {
      return merchantOrder.listingImageUrls;
    }
    if (merchantOrder.product.imageUrl) {
      return [merchantOrder.product.imageUrl];
    }
    return [`https://picsum.photos/seed/${merchantOrder.id}/400/500`];
  }, [merchantOrder]);

  const stripeDisplay = useMemo(() => {
    const commissionRate = merchantOrder.commissionRateApplied ?? 0.08;
    const estimatedCommission = Math.round(
      merchantOrder.itemSubtotal * commissionRate * 100,
    ) / 100;
    const platformFee =
      merchantOrder.commissionAmount ?? estimatedCommission;
    const platformFeeIsEstimate = merchantOrder.commissionAmount == null;
    const payoutAmount =
      merchantOrder.merchantPayoutAmount ??
      Math.max(
        0,
        merchantOrder.itemSubtotal - platformFee,
      );

    return {
      paymentIntentId: merchantOrder.stripePaymentIntentId,
      transferId: merchantOrder.stripeTransferId,
      platformFee,
      platformFeeIsEstimate,
      payoutAmount,
      payoutStatus: merchantOrder.payoutStatus,
      authFee: merchantOrder.authFee,
    };
  }, [merchantOrder]);

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] font-sans p-6 space-y-5 animate-fadeIn lg:mx-[20%]">
      <div className="flex items-center justify-between ">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 w-10 px-2.5 rounded-lg bg-bg-elevated font-sans text-md font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>
      </div>

      <div className="justify-items-start space-y-2">
        <div className="font-sans font-black text-[22px] text-text-primary leading-tight">
          {order.cardName}
        </div>
        <div className="w-full flex flex-col p-6 border border-brand/20 rounded-lg items-start space-y-3">
          <div className="font-mono text-[11px] text-text-secondary">
            序號: {order.cardNo} · 等級: {order.grade}
          </div>
          <div className="font-mono text-[12.5px] text-brand mt-1 space-y-1">
            <p>商品上架序號: {order.productListingId || "—"}</p>
            <p>訂單號碼: {order.orderNumber ?? order.id}</p>
            <p className="font-mono text-[11px] text-text-disabled mt-1">
              出價日期: {order.createdAt || "—"}
            </p>
          </div>
          <div className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#17130f] shrink-0 shadow-xs mb-1">
            <Image
              src={merchantOrder.buyer.avatarUrl}
              alt={`${order.buyerName} 的頭像`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="font-mono font-black text-md text-brand mt-1 text-nowrap">
            {order.buyerName}
          </p>
        </div>
      </div>

      <div>
        <div className="space-y-4">
          {isAuthOrder ? (
            <MerchantAuthSellerTimeline escrowStatus={merchantOrder.escrowStatus} />
          ) : (
            <MerchantB2cDirectTimeline
              escrowStatus={merchantOrder.escrowStatus}
              perspective="seller"
            />
          )}

          {order.status === "cancelled" && (
            <div className="p-3.5 bg-[rgba(239,68,68,0.06)] border border-warning/20 rounded-xl flex items-start gap-3 animate-fadeIn">
              <p className="font-sans font-bold text-[13.5px] text-warning">
                訂單已退款 / 已取消
              </p>
            </div>
          )}

          {merchantOrder.escrowStatus === "pending_payment" && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                訂單已成立，正在等待買家完成託管付款{" "}
                <span className="text-brand font-mono font-bold">
                  HK$ {order.amount.toLocaleString("zh-TW")}
                </span>
                。 收款確認後方可安排出貨。
              </p>
            </div>
          )}

          {merchantOrder.canSubmitLogistics &&
            !merchantOrder.inboundTrackingNo && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                買家已完成付款，資金已託管。請將卡牌寄往平台倉庫，並填寫順豐物流單號以供入庫鑑定。
              </p>
              <input
                type="text"
                value={inboundTrackingInput}
                onChange={(event) => setInboundTrackingInput(event.target.value)}
                placeholder="寄往平台的順豐單號"
                className="w-full h-10 rounded-lg border border-white/10 bg-[#120f0c] px-3 text-[12px] text-brand"
              />
              <button
                type="button"
                disabled={!inboundTrackingInput.trim()}
                onClick={() => {
                  void runSubmitInboundTracking(
                    order.id,
                    inboundTrackingInput.trim(),
                    refreshAfterLogistics,
                  );
                }}
                className="w-full h-10 rounded-xl bg-brand text-[#17130f] font-sans font-semibold text-[13px] disabled:opacity-50"
              >
                提交入庫物流單號
              </button>
            </div>
          )}

          {merchantOrder.requiresAuthentication &&
            merchantOrder.escrowStatus === "payment_held" &&
            merchantOrder.inboundTrackingNo && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                已提交入庫物流單號，等待平台確認入庫後開始鑑定。
              </p>
              <p className="font-mono text-[12px] text-brand">
                已提交單號：{merchantOrder.inboundTrackingNo}
              </p>
            </div>
          )}

          {merchantOrder.canSubmitDirectFulfillment && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                {isSfShipping
                  ? "買家已完成託管付款，請安排順豐發貨並填寫物流單號。"
                  : "買家已完成託管付款，請與買家面交後確認完成。"}
              </p>
              {isSfShipping ? (
                <>
                  <input
                    type="text"
                    value={outboundTrackingInput}
                    onChange={(event) =>
                      setOutboundTrackingInput(event.target.value)
                    }
                    placeholder="順豐物流單號"
                    className="w-full h-10 rounded-lg border border-white/10 bg-[#120f0c] px-3 text-[12px] text-brand"
                  />
                  <button
                    type="button"
                    disabled={!outboundTrackingInput.trim()}
                    onClick={() => {
                      void runSubmitDirectFulfillment(
                        order.id,
                        outboundTrackingInput.trim(),
                        refreshAfterLogistics,
                      );
                    }}
                    className="w-full h-10 rounded-xl bg-brand text-[#17130f] font-sans font-semibold text-[13px] disabled:opacity-50"
                  >
                    提交物流單號
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void runSubmitDirectFulfillment(
                      order.id,
                      undefined,
                      refreshAfterLogistics,
                    );
                  }}
                  className="w-full h-10 rounded-xl bg-brand text-[#17130f] font-sans font-semibold text-[13px]"
                >
                  確認已面交
                </button>
              )}
            </div>
          )}

          {merchantOrder.escrowStatus === "shipped" &&
            !merchantOrder.requiresAuthentication && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                {merchantOrder.outboundTrackingNo
                  ? "已提交物流單號，等待買家確認收貨後將自動撥款。"
                  : "已確認面交完成，等待買家確認收貨後將自動撥款。"}
              </p>
              {merchantOrder.outboundTrackingNo ? (
                <p className="font-mono text-[12px] text-brand">
                  物流單號：{merchantOrder.outboundTrackingNo}
                </p>
              ) : null}
            </div>
          )}

          {merchantOrder.escrowStatus === "authenticating" &&
            merchantOrder.requiresAuthentication && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                平台已確認入庫，卡牌正在鑑定中。此階段無需商戶操作。
              </p>
              {merchantOrder.inboundTrackingNo ? (
                <p className="font-mono text-[12px] text-brand">
                  入庫單號：{merchantOrder.inboundTrackingNo}
                </p>
              ) : null}
            </div>
          )}

          {merchantOrder.escrowStatus === "authenticated" &&
            merchantOrder.requiresAuthentication && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                鑑定已通過，平台將安排寄出給買家。待買家確認收貨後撥款。
              </p>
              {merchantOrder.outboundTrackingNo ? (
                <p className="font-mono text-[12px] text-brand">
                  平台代發物流：{merchantOrder.outboundTrackingNo}
                </p>
              ) : (
                <p className="text-[12px] text-text-disabled">
                  待平台上載寄出物流單號。
                </p>
              )}
            </div>
          )}

          {order.status === "released" && (
            <div className="space-y-3">
              <div className="p-3.5 bg-[rgba(16,185,129,0.06)] border border-success/20 rounded-xl flex items-start gap-3 animate-fadeIn">
                <svg
                  className="mt-0.5 shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <div className="space-y-1">
                  <p className="font-sans font-bold text-[13.5px] text-success">
                    款項釋放成功，交易全流程關閉
                  </p>
                  <p className="text-[11.5px] text-text-secondary">
                    此合約已完成全量閉環。款項{" "}
                    <span className="font-mono text-brand font-bold">
                      HK$ {order.amount.toLocaleString("zh-TW")}
                    </span>{" "}
                    已存入您的 Stripe / Supabase 託管錢包中。
                  </p>
                </div>
              </div>
              {merchantOrder.canReviewBuyer && onOpenReview && (
                <button
                  type="button"
                  onClick={() => onOpenReview(order.id, merchantOrder.buyerId)}
                  className="w-full h-10 bg-brand/10 text-brand font-sans font-semibold text-[13px] rounded-xl border border-brand/20 hover:bg-brand/15 transition-all cursor-pointer"
                >
                  評價買家
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start">
        {order.hasAuthenticationToggle && (
          <div className="p-4 bg-[#17130f] rounded-xl border border-white/5 space-y-3 animate-fadeIn">
            <h4 className="font-sans font-bold text-[12.5px] text-[#eae1da] border-b border-white/5 pb-2">
              📋 鑑定服務報告與商品描述
            </h4>
            <div className="text-[12px] space-y-2 text-text-secondary font-mono">
              <div className="flex justify-between">
                <span>鑑定方</span>
                <span className="text-brand font-bold">
                  B2C 平台中介鑑定託管
                </span>
              </div>
              <div className="flex justify-between">
                <span>買方帳號</span>
                <span className="text-text-primary">{order.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span>鑑定標準</span>
                <span className="text-text-primary">{order.grade}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span>鑑定服務費用</span>
                <span className="text-brand font-bold">HK$ 150</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl space-y-4 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-sans font-extrabold text-[14.5px] text-[#eae1da]">
              🧾 交易資產最終交收電子收據
            </h3>
            <span className="font-sans text-[10px] font-black tracking-wide uppercase px-2 py-0.5 rounded border text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              賣出交易
            </span>
          </div>

          <div className="border-t border-[rgba(237,232,224,0.06)] font-mono text-[12px] space-y-2 text-text-secondary">
            <div className="flex justify-between">
              <span>商品最終成交價</span>
              <span className="text-text-primary">
                HK$ {merchantOrder.itemSubtotal.toLocaleString("zh-TW")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>速遞本港運費</span>
              <span className="text-text-primary">
                HK$ {merchantOrder.shippingFee.toLocaleString("zh-TW")}
              </span>
            </div>

            {order.hasAuthenticationToggle && (
              <div className="flex justify-between text-brand">
                <span>鑑定服務費</span>
                <span className="font-bold">
                  HK$ {stripeDisplay.authFee.toLocaleString("zh-TW")}
                </span>
              </div>
            )}

            <div className="border-t border-[rgba(237,232,224,0.08)] pt-3 flex justify-between items-center text-[#eae1da] font-black text-[14px] md:text-[16px]">
              <span>最終實收總額</span>
              <span className="text-brand font-mono text-[18px] md:text-[24px]">
                HK$ {merchantOrder.totalAmount.toLocaleString("zh-TW")}
              </span>
            </div>

            {/* Stripe Escrow Section */}
            <div className="mt-4 pt-3 border-t border-[rgba(237,232,224,0.08)] bg-[#17130f]/60 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <span className="font-sans font-bold text-[12px] text-text-primary">
                  💳 Stripe交易明細
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px] gap-3">
                <span className="text-text-secondary shrink-0">Payment Intent</span>
                <span className="font-mono text-brand font-medium text-right break-all">
                  {stripeDisplay.paymentIntentId ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px] gap-3">
                <span className="text-text-secondary shrink-0">Transfer ID</span>
                <span className="font-mono text-brand font-medium text-right break-all">
                  {stripeDisplay.transferId ??
                    (merchantOrder.escrowStatus === "completed_and_transferred"
                      ? "—"
                      : "待買家確認後撥款")}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-text-secondary">
                  平台費用
                  {stripeDisplay.platformFeeIsEstimate ? "（預估）" : ""}
                </span>
                <span className="font-mono text-warning font-semibold">
                  HK$ {stripeDisplay.platformFee.toLocaleString("zh-TW")}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-text-secondary">預計撥款淨額</span>
                <span className="font-mono text-text-primary font-semibold">
                  HK$ {stripeDisplay.payoutAmount.toLocaleString("zh-TW")}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-text-secondary">撥款狀態</span>
                <span className="font-mono text-text-primary">
                  {stripeDisplay.payoutStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        <OrderListingPhotoGrid
          images={merchantImages}
          altPrefix={`${order.cardName} 實物照`}
          remarks={merchantImages.map((_, idx) => REMARKS_PRESETS[idx] ?? "")}
          onImageClick={(photoIdx) => {
            setViewerIndex(photoIdx);
            setIsViewerOpen(true);
          }}
        />
      </div>

      <ImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={merchantImages}
        initialIndex={viewerIndex}
      />
    </div>
  );
}
