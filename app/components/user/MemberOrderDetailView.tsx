"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { toast } from "sonner";
import {
  cancelMemberOrder,
  completeMemberOrder,
  type MemberOrderDetail,
} from "@/app/actions/orders";
import { MemberAuthOrderInvoice } from "@/app/components/user/MemberAuthOrderInvoice";
import { MemberAuthOrderTimeline } from "@/app/components/user/MemberAuthOrderTimeline";
import { MemberP2pOrderInvoice } from "@/app/components/user/MemberP2pOrderInvoice";
import { MemberP2pOrderTimeline } from "@/app/components/user/MemberP2pOrderTimeline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  formatListingGrade,
  formatMemberOrderDateTime,
  isMeetupOnlyMemberOrder,
  isPendingMemberOrderStatus,
} from "@/app/lib/member-order/p2p";
import { cn } from "@/lib/utils";

type MemberOrderDetailViewProps = {
  order: MemberOrderDetail;
  onRefresh: () => void;
  onOpenReview?: (orderId: string, revieweeId: string) => void;
};

export function MemberOrderDetailView({
  order,
  onRefresh,
  onOpenReview,
}: MemberOrderDetailViewProps) {
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const isSeller = order.persona === "sell";
  const isBuyer = !isSeller;
  const counterpartLabel = isBuyer ? "賣家" : "買家";
  const counterpartName = order.counterparty.displayName;
  const gradeLabel = formatListingGrade(order.listing);
  const cardMeta =
    (order.product.cardNumber ?? order.product.displayId ?? "—") +
    " · 等級: " +
    gradeLabel;
  const displayOrderNumber = order.orderNumber ?? order.id;
  const createdAtLabel = formatMemberOrderDateTime(order.createdAt);
  const useMeetupUi = isMeetupOnlyMemberOrder(order.useAuthentication);

  const galleryImages =
    order.listingImageUrls.length > 0
      ? order.listingImageUrls
      : order.product.imageUrl
        ? [order.product.imageUrl]
        : [];

  const isPending = isPendingMemberOrderStatus(order.status);
  const showReviewCta =
    order.status === "completed" &&
    !order.hasReviewedByMe &&
    Boolean(onOpenReview);

  useEffect(() => {
    if (!api) {
      return;
    }

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

  const handleComplete = async () => {
    if (isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    const result = await completeMemberOrder(order.id);
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("交易已確認完成！");
    onRefresh();

    if (onOpenReview) {
      onOpenReview(order.id, order.counterparty.id);
    }
  };

  const handleCancel = async () => {
    if (isActionLoading) {
      return;
    }

    setIsActionLoading(true);
    const result = await cancelMemberOrder(order.id);
    setIsActionLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("交易已取消，商品已重新上架");
    onRefresh();
  };

  const handleOpenReview = () => {
    if (!onOpenReview || isActionLoading) {
      return;
    }

    onOpenReview(order.id, order.counterparty.id);
  };

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] font-sans p-6 space-y-5 animate-fadeIn lg:mx-[20%]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 w-10 px-2.5 rounded-lg bg-bg-elevated font-sans text-md font-medium text-brand focus:outline-none"
        >
          <IoChevronBack />
        </button>
      </div>

      <div className="flex flex-col gap-y-2">
        <div>
          <span
            className={cn(
              "font-sans text-sm font-black tracking-wide uppercase px-2 py-0.5 rounded border",
              isSeller
                ? "text-warning bg-warning/10 border-warning/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]",
            )}
          >
            {isSeller ? "賣出交易" : "買入交易"}
          </span>
        </div>

        <div className="justify-items-start space-y-2">
          <div className="font-sans font-black text-[22px] text-text-primary leading-tight">
            {order.product.cardName}
          </div>
          <div className="w-full flex flex-col p-6 border border-brand/20 rounded-lg items-start space-y-3">
            <div className="font-mono text-[11px] text-text-secondary">
              {cardMeta}
            </div>
            <div className="font-mono text-[12.5px] text-brand mt-1 space-y-1">
              <p>商品上架序號: {order.listingId}</p>
              <p>訂單號碼: {displayOrderNumber}</p>
              {createdAtLabel ? (
                <p className="font-mono text-[11px] text-text-disabled mt-1">
                  {"建立時間: " + createdAtLabel}
                </p>
              ) : null}
            </div>
            <div className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-[#17130f] shrink-0 shadow-xs mb-1">
              <Image
                src={
                  order.product.imageUrl ||
                  "https://picsum.photos/seed/" + order.id + "/40/40"
                }
                alt={counterpartName + " 的頭像"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="font-mono font-black text-md text-brand mt-1 text-nowrap">
              {counterpartLabel}：{counterpartName}
            </p>
          </div>
        </div>
      </div>

      {useMeetupUi ? (
        <div className="space-y-4">
          <MemberP2pOrderTimeline status={order.status} />

          {isPending && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                {isSeller
                  ? "請與買家約定面交時間地點，現場點清錢貨後由任一方點擊確認完成。"
                  : "請與賣家約定面交時間地點，現場點清錢貨後由任一方點擊確認完成。"}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => void handleComplete()}
                  className="w-full h-10 bg-success text-white font-sans font-semibold text-[13px] rounded-xl hover:bg-success-hover active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionLoading ? "處理中…" : "確認完成交易"}
                </button>
                {order.canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      disabled={isActionLoading}
                      className="w-full h-10 font-sans font-semibold text-[13px] rounded-xl bg-[rgba(239,68,68,0.10)] text-warning border border-warning/20 hover:bg-[rgba(239,68,68,0.18)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isActionLoading ? "處理中…" : "取消交易"}
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-sm rounded-2xl border border-[#ef4444]/30 bg-[#26211C] p-6 text-[#eae1da]">
                      <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="text-[15px] font-black">
                          確認取消交易
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[11px] font-mono uppercase tracking-wider text-[#8A8680]">
                          Cancel Order
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <p className="py-3 text-[12.5px] leading-relaxed text-[#d4c4b7]">
                        您即將取消與{" "}
                        <span className="font-bold text-brand">
                          {counterpartName}
                        </span>{" "}
                        的待處理訂單（
                        <span className="font-mono text-warning">
                          {"HK$ " + order.finalPrice.toLocaleString("zh-TW")}
                        </span>
                        ）。確認後商品將重新上架至市集。
                      </p>
                      <div className="flex flex-col gap-2">
                        <AlertDialogAction
                          onClick={() => void handleCancel()}
                          disabled={isActionLoading}
                          className="h-11 rounded-xl bg-[#ef4444] font-black text-white hover:bg-[#dc2626] disabled:opacity-50"
                        >
                          {isActionLoading ? "處理中…" : "確認取消"}
                        </AlertDialogAction>
                        <AlertDialogCancel className="h-10 rounded-xl border border-white/10 bg-[#120F0C]">
                          返回
                        </AlertDialogCancel>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          )}

          {showReviewCta && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={handleOpenReview}
              className="w-full h-10 font-sans font-semibold text-[13px] rounded-xl border border-brand/30 text-brand bg-brand/5 hover:bg-brand/12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✍️ 給予對手評價
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <MemberAuthOrderTimeline status={order.status} />

          {showReviewCta && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={handleOpenReview}
              className="w-full h-10 font-sans font-semibold text-[13px] rounded-xl border border-brand/30 text-brand bg-brand/5 hover:bg-brand/12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✍️ 給予對手評價
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 items-start">
        {useMeetupUi ? (
          <MemberP2pOrderInvoice
            finalPrice={order.finalPrice}
            isSeller={isSeller}
          />
        ) : (
          <MemberAuthOrderInvoice
            finalPrice={order.finalPrice}
            isSeller={isSeller}
          />
        )}

        {galleryImages.length > 0 && (
          <div className="flex flex-col items-center select-none group w-full overflow-hidden">
            <div className="relative w-full aspect-[3/4] max-h-[65dvh] rounded-2xl overflow-hidden bg-[#120f0c] border border-white/5 shrink-0 shadow-inner">
              <Carousel
                setApi={setApi}
                className="w-full h-full [&>div]:h-full"
                opts={{ loop: galleryImages.length > 1 }}
              >
                <CarouselContent className="-ml-0 h-full">
                  {galleryImages.map((imageUrl, photoIdx) => (
                    <CarouselItem
                      key={imageUrl + "-" + photoIdx}
                      className="pl-0 relative w-full h-full overflow-hidden rounded-2xl"
                    >
                      <Image
                        src={imageUrl}
                        alt={order.product.cardName + " 實物照 " + (photoIdx + 1)}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="scale-100 object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                        unoptimized
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {galleryImages.length > 1 && (
                  <>
                    <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 left-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
                    <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 right-2 bg-black/60 hover:bg-black/80 border-0 hidden md:flex" />
                  </>
                )}
              </Carousel>
            </div>

            {count > 1 && (
              <div className="flex justify-center gap-1.5 py-2.5">
                {Array.from({ length: count }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={"前往第 " + (index + 1) + " 張照片"}
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
        )}
      </div>

      <div className="pt-2">
        <Link
          href="/profile/user/trading"
          className="font-sans text-[13px] font-bold text-brand hover:underline"
        >
          返回交易管理
        </Link>
      </div>
    </div>
  );
}
