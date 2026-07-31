"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { IoChevronBack } from "react-icons/io5";
import {
  submitMerchantLogistics,
  type MerchantOrderDetail,
} from "@/app/actions/orders";
import { OrderStatus, STATUS_STEP_INDEX } from "@/app/lib/types/trading";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import { mapMerchantOrderDetailToSaleOrder } from "@/app/lib/merchant-order/map-sale-order";
import { toast } from "sonner";
import { ImageViewer } from "@/app/components/shared/ImageViewer";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

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

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [inboundTrackingInput, setInboundTrackingInput] = useState("");

  useEffect(() => {
    if (!api) return;

    const updateCarouselState = () => {
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    };

    queueMicrotask(updateCarouselState);

    api.on("select", updateCarouselState);
    api.on("reInit", updateCarouselState);

    return () => {
      api.off("select", updateCarouselState);
      api.off("reInit", updateCarouselState);
    };
  }, [api]);

  const merchantImages = useMemo(() => {
    if (merchantOrder.listingImageUrls.length > 0) {
      return merchantOrder.listingImageUrls;
    }
    if (merchantOrder.product.imageUrl) {
      return [merchantOrder.product.imageUrl];
    }
    return [`https://picsum.photos/seed/${merchantOrder.id}/400/500`];
  }, [merchantOrder]);

  const currentStepIdx =
    order.status === "cancelled"
      ? -1
      : STATUS_STEP_INDEX[order.status as Exclude<OrderStatus, "cancelled">];

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
        <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
          <h4 className="font-sans font-bold text-[12.5px] text-text-primary flex items-center gap-1.5">
            交易狀態
          </h4>
          <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
            <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
              {ESCROW_STEPS.map((step, idx) => {
                const isCompleted = currentStepIdx >= 0 && idx < currentStepIdx;
                const isActive = idx === currentStepIdx;

                return (
                  <div
                    key={step.id}
                    className="relative text-[12.5px] leading-relaxed"
                  >
                    <div
                      className={cn(
                        "absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center",
                        isCompleted
                          ? "bg-success border-success text-white"
                          : isActive
                            ? "bg-brand border-brand animate-pulse"
                            : "bg-[#1A1612] border-white/20",
                      )}
                    >
                      {isCompleted && (
                        <svg
                          width="6"
                          height="6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "font-sans font-bold",
                          isActive
                            ? "text-brand"
                            : isCompleted
                              ? "text-success"
                              : "text-text-secondary",
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="text-[11px] text-text-disabled">
                        {step.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

          {merchantOrder.escrowStatus === "payment_held" &&
            !merchantOrder.requiresAuthentication && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                買家已完成託管付款（HK${" "}
                <span className="text-[#10b981] font-mono font-bold">
                  {merchantOrder.totalAmount.toLocaleString("zh-TW")}
                </span>
                ），資金已由平台託管。請安排發貨，待買家確認收貨後將自動撥款至您的 Connect 帳戶。
              </p>
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
                {/* TODO: depends on admin settings for authentication charge */}
                <span>鑑定服務費</span>
                <span className="font-bold">HK$ 150</span>
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
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-text-secondary">Stripe 流水號</span>
                <span className="font-mono text-brand font-medium">
                  {`tr_3M8x${merchantOrder.id.replaceAll("-", "").slice(0, 16)}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11.5px]">
                <span className="text-text-secondary">平台費用</span>
                <span className="font-mono text-warning font-semibold">
                  {/* TODO: depends on admin settings for authentication charge */}
                  HK${" "}
                  {(order.hasAuthenticationToggle ? 150 : 0).toLocaleString(
                    "zh-TW",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center select-none group w-full overflow-hidden">
          <div className="relative w-full aspect-[3/4] max-h-[65dvh] rounded-2xl overflow-hidden bg-[#120f0c] border border-white/5 shrink-0 shadow-inner">
            <Carousel
              setApi={setApi}
              className="w-full h-full [&>div]:h-full"
              opts={{ loop: true }}
            >
              <CarouselContent className="-ml-0 h-full">
                {merchantImages.map((imageUrl, photoIdx) => {
                  const currentRemark =
                    current === photoIdx
                      ? (REMARKS_PRESETS[photoIdx] ?? "")
                      : "";
                  return (
                    <CarouselItem
                      key={photoIdx}
                      onClick={() => {
                        setViewerIndex(photoIdx);
                        setIsViewerOpen(true);
                      }}
                      className="pl-0 relative w-full h-full overflow-hidden rounded-2xl cursor-zoom-in"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${order.cardName} 實物照 ${photoIdx + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="scale-100 object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                        unoptimized
                      />
                      {currentRemark && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-md bg-[#17130f]/80 backdrop-blur-xs border border-white/10 text-center pointer-events-none select-none max-w-[85%] animate-fadeIn">
                          <p className="font-sans text-[11px] font-medium text-brand tracking-wide truncate">
                            {currentRemark}
                          </p>
                        </div>
                      )}
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 left-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
              <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 right-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
            </Carousel>
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-1.5 py-2.5">
              {Array.from({ length: count }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`前往第 ${index + 1} 張照片`}
                  onClick={() => api?.scrollTo(index)}
                  className={
                    index === current
                      ? "bg-brand w-3.5 h-1.5 opacity-100 rounded-full transition-all duration-300"
                      : "bg-text-disabled w-1.5 h-1.5 opacity-30 hover:opacity-50 rounded-full transition-all duration-300"
                  }
                />
              ))}
            </div>
          )}
        </div>
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
